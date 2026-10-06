/* Na Mosca — motor de fechamentos.
 *  - combinações completas (terno/dupla de grupo, dezenas, quinas de grupo)
 *  - permutações (milhar/centena combinada)
 *  - distribuições de probabilidade dos cenários de acerto
 *  - fechamento com garantia (covering design guloso) em Web Worker, para Quininha, Seninha e Lotinho
 */
(function () {
  const NM = window.NM;

  /** Todas as combinações de `k` elementos de `arr` (em ordem). Para de gerar após `cap`. */
  NM.combos = function (arr, k, cap = 20000) {
    const out = [], idx = [...Array(k).keys()], n = arr.length;
    if (k > n || k <= 0) return out;
    while (out.length < cap) {
      out.push(idx.map((i) => arr[i]));
      let i = k - 1;
      while (i >= 0 && idx[i] === n - k + i) i--;
      if (i < 0) break;
      idx[i]++;
      for (let j = i + 1; j < k; j++) idx[j] = idx[j - 1] + 1;
    }
    return out;
  };

  /** Permutações distintas dos caracteres de `s`. */
  NM.perms = function (s) {
    const res = new Set();
    const go = (pre, rest) => {
      if (!rest.length) { res.add(pre); return; }
      for (let i = 0; i < rest.length; i++) go(pre + rest[i], rest.slice(0, i) + rest.slice(i + 1));
    };
    go('', String(s));
    return [...res].sort();
  };

  /**
   * Distribuição do número de elementos DISTINTOS do conjunto do apostador (tamanho `n`) que aparecem
   * em `draws` sorteios independentes de um universo de `univ` itens (com reposição).
   * Retorna P[j] para j = 0..min(n, draws).
   */
  NM.distDistintos = function (n, univ, draws) {
    let P = [1];
    for (let d = 0; d < draws; d++) {
      const Q = new Array(P.length + 1).fill(0);
      P.forEach((p, j) => {
        if (!p) return;
        const novo = Math.max(0, n - j) / univ;
        Q[j] += p * (1 - novo);
        Q[j + 1] += p * novo;
      });
      P = Q;
    }
    return P.slice(0, Math.min(n, draws) + 1);
  };

  /** Probabilidade de os `draws` sorteios serem todos distintos e todos dentro do conjunto (n de univ). */
  NM.probTodosDistintosDentro = (n, univ, draws) => {
    let p = 1;
    for (let i = 0; i < draws; i++) p *= Math.max(0, n - i) / univ;
    return p;
  };

  /* ---------------- Fechamento com garantia (Web Worker) ---------------- */
  const WORKER_SRC = `
  let B;
  function binoms(n, t) {
    B = [];
    for (let i = 0; i <= n; i++) { B[i] = []; for (let j = 0; j <= t; j++) B[i][j] = j === 0 ? 1 : i === 0 ? 0 : B[i-1][j-1] + (B[i-1][j] || 0); }
  }
  function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function unrank(r, t, n) {
    const out = new Array(t);
    let c = n - 1;
    for (let i = t; i >= 1; i--) { while (B[c][i] > r) c--; out[i-1] = c; r -= B[c][i]; c--; }
    return out;
  }
  // percorre os t-subconjuntos do bloco (ordenado) e chama fn(rank)
  function eachSub(block, t, fn) {
    const k = block.length;
    (function rec(start, depth, acc) {
      if (depth === t) { fn(acc); return; }
      for (let i = start; i <= k - (t - depth); i++) rec(i + 1, depth + 1, acc + B[block[i]][depth + 1]);
    })(0, 0, 0);
  }
  onmessage = (ev) => {
    const { n, k, t, maxJogos, seed } = ev.data;
    binoms(n, t);
    const total = B[n][t];
    const cov = new Uint8Array(total);
    let restante = total, ptr = 0;
    const r = rng(seed || 1);
    const jogos = [];
    const novos = (blk) => { let c = 0; eachSub(blk, t, (x) => { if (!cov[x]) c++; }); return c; };
    const ordenar = (a) => a.sort((x, y) => x - y);
    function candidato(base) {
      const s = new Set(base);
      while (s.size < k) s.add(Math.floor(r() * n));
      return ordenar([...s]);
    }
    let passo = 0;
    while (restante > 0 && jogos.length < maxJogos) {
      while (cov[ptr]) ptr++;
      let melhor = null, mv = -1;
      const tent = 24;
      for (let c = 0; c < tent; c++) {
        let semente = ptr;
        if (c > 0) { for (let p = 0; p < 40; p++) { const x = Math.floor(r() * total); if (!cov[x]) { semente = x; break; } } }
        const blk = candidato(unrank(semente, t, n));
        const v = novos(blk);
        if (v > mv) { mv = v; melhor = blk; }
      }
      // busca local: trocas aleatórias que aumentam a cobertura
      for (let s = 0; s < 3 * k && k < n; s++) {
        const fora = []; const dentro = new Set(melhor);
        for (let i = 0; i < n; i++) if (!dentro.has(i)) fora.push(i);
        const cand = melhor.slice(); cand[Math.floor(r() * k)] = fora[Math.floor(r() * fora.length)];
        ordenar(cand);
        const v = novos(cand);
        if (v > mv) { mv = v; melhor = cand; }
      }
      eachSub(melhor, t, (x) => { if (!cov[x]) { cov[x] = 1; restante--; } });
      jogos.push(melhor);
      if (++passo % 5 === 0) postMessage({ tipo: 'progresso', cobertura: 1 - restante / total, jogos: jogos.length });
    }
    postMessage({ tipo: 'fim', jogos, cobertura: 1 - restante / total, total, cobertos: total - restante });
  };`;

  let workerURL;
  /**
   * Gera jogos de tamanho `k` a partir de `pool` (números), cobrindo todos os t-subconjuntos do pool
   * (garantia "t se t") ou até `maxJogos`. Retorna { jogos, cobertura, total, cobertos }.
   */
  NM.cobrir = function ({ pool, k, t, maxJogos = 2000, seed = 7, onProgress }) {
    return new Promise((resolve, reject) => {
      if (!workerURL) workerURL = URL.createObjectURL(new Blob([WORKER_SRC], { type: 'text/javascript' }));
      const w = new Worker(workerURL);
      w.onmessage = (e) => {
        if (e.data.tipo === 'progresso') { onProgress && onProgress(e.data); return; }
        w.terminate();
        resolve({ ...e.data, jogos: e.data.jogos.map((j) => j.map((i) => pool[i])) });
      };
      w.onerror = (e) => { w.terminate(); reject(e); };
      w.postMessage({ n: pool.length, k, t, maxJogos, seed });
      NM._cobrirWorker = w;
    });
  };
  NM.cancelarCobertura = () => { if (NM._cobrirWorker) NM._cobrirWorker.terminate(); };

  /** Baixa um texto como arquivo .txt */
  NM.baixarTxt = (nome, texto) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([texto], { type: 'text/plain;charset=utf-8' }));
    a.download = nome;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  NM.copiar = async (btn, texto) => {
    const old = btn.textContent;
    try { await navigator.clipboard.writeText(texto); btn.textContent = 'Copiado'; } catch (e) { btn.textContent = 'Falhou'; }
    setTimeout(() => (btn.textContent = old), 1400);
  };
})();
