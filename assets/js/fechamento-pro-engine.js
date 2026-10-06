/* Na Mosca — motor do Fechamento PRO (roda em Web Worker).
 *
 *  cobrir   : fechamento com garantia "t se m" (todo grupo de m números do conjunto tem t acertos em algum jogo)
 *             - t = m: motor por índices combinatórios (rápido e exato)
 *             - t < m: motor por máscaras de bits (popcount) com amostragem e busca local
 *  otimizar : repete o fechamento com sementes diferentes dentro de um tempo limite, poda jogos redundantes
 *             e devolve o menor fechamento encontrado com a mesma garantia
 *  simular  : sorteia N resultados e mede quantos acertos o melhor jogo teria
 */
(function () {
  const NM = window.NM;

  const WORKER = function () {
    /* ---------- utilidades ---------- */
    function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
    function pop(x) { x -= (x >>> 1) & 0x55555555; x = (x & 0x33333333) + ((x >>> 2) & 0x33333333); return (((x + (x >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24; }
    function binoms(n, t) { const B = []; for (let i = 0; i <= n; i++) { B[i] = []; for (let j = 0; j <= t; j++) B[i][j] = j === 0 ? 1 : i === 0 ? 0 : B[i - 1][j - 1] + (B[i - 1][j] || 0); } return B; }
    const sortN = (a) => a.sort((x, y) => x - y);
    let progressoBase = 0, progressoPeso = 1;
    const progresso = (f, jogos, extra) => postMessage({ tipo: 'progresso', f: progressoBase + f * progressoPeso, jogos, ...extra });

    /* ---------- t = m: índices combinatórios ---------- */
    function cobrirIgual(v, k, t, maxJogos, seed) {
      const B = binoms(v, t), total = B[v][t];
      const cnt = new Uint16Array(total);
      let restante = total, ptr = 0;
      const r = rng(seed);
      const unrank = (x) => { const o = new Array(t); let c = v - 1; for (let i = t; i >= 1; i--) { while (B[c][i] > x) c--; o[i - 1] = c; x -= B[c][i]; c--; } return o; };
      const each = (blk, fn) => { (function rec(s, d, acc) { if (d === t) { fn(acc); return; } for (let i = s; i <= k - (t - d); i++) rec(i + 1, d + 1, acc + B[blk[i]][d + 1]); })(0, 0, 0); };
      const novos = (blk) => { let c = 0; each(blk, (x) => { if (!cnt[x]) c++; }); return c; };
      const cand = (base) => { const s = new Set(base); while (s.size < k) s.add(Math.floor(r() * v)); return sortN([...s]); };
      const jogos = [];
      while (restante > 0 && jogos.length < maxJogos) {
        while (cnt[ptr]) ptr++;
        let best = null, bv = -1;
        for (let c = 0; c < 20; c++) {
          let sem = ptr;
          if (c) for (let p = 0; p < 40; p++) { const x = Math.floor(r() * total); if (!cnt[x]) { sem = x; break; } }
          const b = cand(unrank(sem)); const val = novos(b);
          if (val > bv) { bv = val; best = b; }
        }
        for (let s = 0; s < 3 * k && k < v; s++) {
          const dentro = new Set(best); const fora = []; for (let i = 0; i < v; i++) if (!dentro.has(i)) fora.push(i);
          const c = best.slice(); c[Math.floor(r() * k)] = fora[Math.floor(r() * fora.length)]; sortN(c);
          const val = novos(c); if (val > bv) { bv = val; best = c; }
        }
        each(best, (x) => { if (!cnt[x]++) restante--; });
        jogos.push(best);
        if (jogos.length % 5 === 0) progresso(1 - restante / total, jogos.length);
      }
      // poda: remove jogos cujos t-subconjuntos já estão todos cobertos por outros
      if (restante === 0) {
        for (let i = jogos.length - 1; i >= 0; i--) {
          let red = true; each(jogos[i], (x) => { if (cnt[x] < 2) red = false; });
          if (red) { each(jogos[i], (x) => cnt[x]--); jogos.splice(i, 1); }
        }
      }
      return { jogos, cobertura: 1 - restante / total, total, cobertos: total - restante };
    }

    /* ---------- t < m: máscaras de bits ---------- */
    function cobrirMenor(v, k, t, m, maxJogos, seed) {
      const W = Math.ceil(v / 32);
      const B = binoms(v, m); const N = B[v][m];
      if (N > 2500000) throw new Error(`conjunto grande demais (${N} grupos de ${m})`);
      const S = new Uint32Array(N * W);
      // enumera m-subconjuntos
      const idx = [...Array(m).keys()]; let n = 0;
      for (;;) {
        for (const e of idx) S[n * W + (e >>> 5)] |= 1 << (e & 31);
        n++;
        let i = m - 1; while (i >= 0 && idx[i] === v - m + i) i--; if (i < 0) break;
        idx[i]++; for (let j = i + 1; j < m; j++) idx[j] = idx[j - 1] + 1;
      }
      const r = rng(seed);
      let alive = new Int32Array(N); for (let i = 0; i < N; i++) alive[i] = i; let nA = N;
      const toMask = (blk) => { const M = new Uint32Array(W); for (const e of blk) M[e >>> 5] |= 1 << (e & 31); return M; };
      const hits = (s, M) => { let c = 0; for (let w = 0; w < W; w++) c += pop(S[s * W + w] & M[w]); return c; };
      const elems = (s) => { const o = []; for (let w = 0; w < W; w++) { let x = S[s * W + w]; while (x) { const b = x & -x; o.push(w * 32 + 31 - Math.clz32(b)); x ^= b; } } return o; };
      const jogos = [];
      while (nA > 0 && jogos.length < maxJogos) {
        const amostra = []; const AM = Math.min(nA, 3000);
        for (let i = 0; i < AM; i++) amostra.push(alive[nA <= 3000 ? i : Math.floor(r() * nA)]);
        const freq = new Float64Array(v); for (const s of amostra) for (const e of elems(s)) freq[e]++;
        const score = (M) => { let c = 0; for (const s of amostra) if (hits(s, M) >= t) c++; return c; };
        let best = null, bv = -1;
        for (let c = 0; c < 10; c++) {
          const set = new Set(elems(amostra[Math.floor(r() * amostra.length)]).slice(0, k));
          while (set.size < k) {
            // escolha ponderada pela frequência nos grupos ainda não cobertos
            let tot = 0; for (let e = 0; e < v; e++) if (!set.has(e)) tot += freq[e] + 0.5;
            let x = r() * tot; let pick = -1;
            for (let e = 0; e < v; e++) { if (set.has(e)) continue; x -= freq[e] + 0.5; if (x <= 0) { pick = e; break; } }
            if (pick < 0) for (let e = 0; e < v; e++) if (!set.has(e)) { pick = e; break; }
            set.add(pick);
          }
          const blk = sortN([...set]); const val = score(toMask(blk));
          if (val > bv) { bv = val; best = blk; }
        }
        for (let s = 0; s < 2 * k && k < v; s++) {
          const dentro = new Set(best); const fora = []; for (let i = 0; i < v; i++) if (!dentro.has(i)) fora.push(i);
          const c = best.slice(); c[Math.floor(r() * k)] = fora[Math.floor(r() * fora.length)]; sortN(c);
          const val = score(toMask(c)); if (val > bv) { bv = val; best = c; }
        }
        const M = toMask(best); let w = 0;
        for (let i = 0; i < nA; i++) { const s = alive[i]; if (hits(s, M) < t) alive[w++] = s; }
        nA = w;
        jogos.push(best);
        if (jogos.length % 2 === 0) progresso(1 - nA / N, jogos.length);
      }
      // poda de redundantes
      if (nA === 0 && jogos.length > 1) {
        const masks = jogos.map(toMask);
        const cnt = new Uint8Array(N);
        for (let s = 0; s < N; s++) { let c = 0; for (const M of masks) { if (hits(s, M) >= t) { c++; if (c >= 2) break; } } cnt[s] = c; }
        for (let j = jogos.length - 1; j >= 0; j--) {
          const M = masks[j]; let red = true;
          for (let s = 0; s < N && red; s++) if (cnt[s] < 2 && hits(s, M) >= t) red = false;
          if (red) {
            masks.splice(j, 1); jogos.splice(j, 1);
            for (let s = 0; s < N; s++) if (cnt[s] === 2) { let c = 0; for (const X of masks) { if (hits(s, X) >= t) { c++; if (c >= 2) break; } } cnt[s] = c; }
          }
        }
      }
      return { jogos, cobertura: 1 - nA / N, total: N, cobertos: N - nA };
    }

    const cobrir = (v, k, t, m, maxJogos, seed) => (t === m ? cobrirIgual(v, k, t, maxJogos, seed) : cobrirMenor(v, k, t, m, maxJogos, seed));

    /* ---------- simulação ---------- */
    function simular({ jogos, pool, universo, base, sorteadas, comReposicao, n, seed }) {
      const W = Math.ceil(universo / 32);
      const r = rng(seed);
      const masks = jogos.map((j) => { const M = new Uint32Array(W); for (const x of j) { const e = x - base; M[e >>> 5] |= 1 << (e & 31); } return M; });
      const poolSet = new Set(pool);
      const mat = Array.from({ length: sorteadas + 1 }, () => new Array(sorteadas + 1).fill(0));
      const D = new Uint32Array(W);
      for (let it = 0; it < n; it++) {
        D.fill(0); const sorteio = new Set();
        if (comReposicao) for (let p = 0; p < sorteadas; p++) sorteio.add(base + Math.floor(r() * universo));
        else while (sorteio.size < sorteadas) sorteio.add(base + Math.floor(r() * universo));
        let noPool = 0;
        for (const x of sorteio) { const e = x - base; D[e >>> 5] |= 1 << (e & 31); if (poolSet.has(x)) noPool++; }
        let best = 0;
        for (const M of masks) { let c = 0; for (let w = 0; w < W; w++) c += pop(M[w] & D[w]); if (c > best) best = c; }
        mat[noPool][best]++;
        if (it % 5000 === 0) progresso(it / n, 0);
      }
      return { mat, n };
    }

    onmessage = (ev) => {
      const d = ev.data;
      try {
        if (d.cmd === 'cobrir') {
          progressoBase = 0; progressoPeso = 1;
          postMessage({ tipo: 'fim', ...cobrir(d.v, d.k, d.t, d.m, d.maxJogos, d.seed || 1) });
        } else if (d.cmd === 'otimizar') {
          const ini = Date.now(); let best = null, tent = 0, seed = d.seed || 1;
          while (tent === 0 || Date.now() - ini < d.tempo) {
            progressoBase = Math.min(0.95, (Date.now() - ini) / d.tempo); progressoPeso = 0;
            const res = cobrir(d.v, d.k, d.t, d.m, d.maxJogos, seed++);
            tent++;
            const melhor = !best || res.cobertura > best.cobertura + 1e-12 || (res.cobertura >= best.cobertura - 1e-12 && res.jogos.length < best.jogos.length);
            if (melhor) best = res;
            postMessage({ tipo: 'progresso', f: Math.min(0.99, (Date.now() - ini) / d.tempo), jogos: best.jogos.length, tentativas: tent, cobertura: best.cobertura });
          }
          postMessage({ tipo: 'fim', ...best, tentativas: tent });
        } else if (d.cmd === 'simular') {
          progressoBase = 0; progressoPeso = 1;
          postMessage({ tipo: 'fim', ...simular(d) });
        }
      } catch (e) { postMessage({ tipo: 'erro', msg: e.message }); }
    };
  };

  let url, atual;
  /** Executa um comando no worker. onProgress recebe { f, jogos, tentativas }. */
  NM.pro = function (msg, onProgress) {
    if (!url) url = URL.createObjectURL(new Blob([`(${WORKER.toString()})()`], { type: 'text/javascript' }));
    NM.proCancelar();
    return new Promise((resolve, reject) => {
      const w = new Worker(url);
      atual = { w, reject };
      w.onmessage = (e) => {
        if (e.data.tipo === 'progresso') { onProgress && onProgress(e.data); return; }
        w.terminate(); atual = null;
        e.data.tipo === 'erro' ? reject(new Error(e.data.msg)) : resolve(e.data);
      };
      w.onerror = (e) => { w.terminate(); atual = null; reject(new Error(e.message || 'erro no cálculo')); };
      w.postMessage(msg);
    });
  };
  NM.proCancelar = () => { if (atual) { atual.w.terminate(); atual.reject(new Error('cancelado')); atual = null; } };
  NM._proWorkerSrc = WORKER;
})();
