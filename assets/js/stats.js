/* Na Mosca — motor de estatísticas e gerador de palpites. */
(function () {
  const NM = window.NM;

  /** Lista de ocorrências por extração considerando os prêmios [de..ate]. */
  function premiosDe(ext, ate) {
    return ext.premios.slice(0, ate).filter((p) => p.milhar.length === 4);
  }

  NM.stats = function (results, { ate = 1 } = {}) {
    const n = results.length;
    const grupos = NM.BICHOS.map((b) => ({
      ...b, freq: 0, atraso: n, maxAtraso: 0, ultimo: null, gaps: [],
    }));
    const dezenas = Array.from({ length: 100 }, (_, i) => ({ dezena: NM.pad(i, 2), freq: 0, atraso: n }));
    const lastSeen = new Array(26).fill(-1);
    const porDia = Array.from({ length: 7 }, () => new Array(26).fill(0));
    const extPorDia = new Array(7).fill(0);
    const trans = Array.from({ length: 26 }, () => new Array(26).fill(0));
    let pares = 0, impares = 0, total = 0;
    const digitos = Array.from({ length: 4 }, () => new Array(10).fill(0));

    results.forEach((ext, idx) => {
      const dow = new Date(ext.data + 'T12:00:00').getDay();
      extPorDia[dow]++;
      const vistos = new Set();
      premiosDe(ext, ate).forEach((p) => {
        const g = p.grupo;
        const dz = Number(p.milhar.slice(2));
        grupos[g - 1].freq++;
        dezenas[dz].freq++;
        dezenas[dz].atraso = n - 1 - idx;
        porDia[dow][g]++;
        vistos.add(g);
        total++;
        Number(p.milhar) % 2 === 0 ? pares++ : impares++;
        [...p.milhar].forEach((c, i) => digitos[i][Number(c)]++);
      });
      vistos.forEach((g) => {
        const gap = idx - lastSeen[g] - 1;
        if (lastSeen[g] >= 0) grupos[g - 1].gaps.push(gap);
        grupos[g - 1].maxAtraso = Math.max(grupos[g - 1].maxAtraso, lastSeen[g] >= 0 ? gap : idx);
        lastSeen[g] = idx;
        grupos[g - 1].ultimo = ext;
      });
      if (idx > 0) trans[results[idx - 1].premios[0].grupo][ext.premios[0].grupo]++;
    });

    grupos.forEach((g) => {
      g.atraso = lastSeen[g.grupo] >= 0 ? n - 1 - lastSeen[g.grupo] : n;
      g.maxAtraso = Math.max(g.maxAtraso, g.atraso);
      g.mediaAtraso = g.gaps.length ? g.gaps.reduce((a, b) => a + b, 0) / g.gaps.length : n;
      g.esperado = total / 25;
      g.desvio = g.esperado ? (g.freq - g.esperado) / g.esperado : 0;
      // índice de "vencimento": atraso atual relativo à média histórica
      g.vencimento = g.mediaAtraso > 0 ? g.atraso / g.mediaAtraso : 0;
    });

    return { n, total, ate, grupos, dezenas, porDia, extPorDia, trans, pares, impares, digitos };
  };

  /** Frequência nas últimas `k` extrações (1º prêmio), para ver tendência. */
  NM.tendencia = function (results, k = 30, ate = 1) {
    const rec = NM.stats(results.slice(-k), { ate });
    const all = NM.stats(results, { ate });
    return NM.BICHOS.map((b, i) => ({
      ...b,
      recente: rec.grupos[i].freq / Math.max(1, rec.total),
      historico: all.grupos[i].freq / Math.max(1, all.total),
    })).map((x) => ({ ...x, delta: x.recente - x.historico }));
  };

  /** Bicho puxa bicho: os grupos que mais vieram depois de `grupo` na cabeça. */
  NM.puxada = function (st, grupo, top = 5) {
    const row = st.trans[grupo];
    const tot = row.reduce((a, b) => a + b, 0) || 1;
    return row
      .map((c, g) => ({ g, c, pct: c / tot }))
      .filter((x) => x.g > 0)
      .sort((a, b) => b.c - a.c)
      .slice(0, top);
  };

  /* ---------- Gerador de palpites ---------- */
  function pesos(st, estrategia, ultimoGrupo) {
    const g = st.grupos;
    switch (estrategia) {
      case 'quentes': return g.map((x) => Math.pow(x.freq + 1, 2));
      case 'frios': return g.map((x) => Math.pow(x.atraso + 1, 1.6));
      case 'vencidos': return g.map((x) => Math.pow(Math.max(0.05, x.vencimento), 2));
      case 'puxada': {
        const row = st.trans[ultimoGrupo] || [];
        return g.map((x) => (row[x.grupo] || 0) + 0.3);
      }
      case 'equilibrado': return g.map((x) => (x.freq + 1) * 0.5 + (x.atraso + 1) * 0.5);
      default: return g.map(() => 1);
    }
  }
  function sortear(r, ws, excl) {
    const tot = ws.reduce((a, w, i) => a + (excl.has(i + 1) ? 0 : w), 0);
    let x = r() * tot;
    for (let i = 0; i < ws.length; i++) {
      if (excl.has(i + 1)) continue;
      x -= ws[i];
      if (x <= 0) return i + 1;
    }
    for (let i = ws.length; i > 0; i--) if (!excl.has(i)) return i;
    return 1;
  }

  NM.gerar = function ({ results, modalidade, estrategia, qtd, excluir = [], fixar = [], seed }) {
    const st = NM.stats(results, { ate: 5 });
    const ultimo = results.length ? results[results.length - 1].premios[0].grupo : 1;
    const ws = pesos(st, estrategia, ultimo);
    const r = NM.rng(seed ?? Math.random());
    const excl = new Set(excluir);
    const jogos = [];
    const vistos = new Set();
    const tamanho = { 'duque-gp': 2, 'terno-gp': 3, 'quadra-gp': 4, 'duque-dz': 2, 'terno-dz': 3 }[modalidade] || 1;
    let guard = 0;

    while (jogos.length < qtd && guard++ < qtd * 200) {
      let jogo;
      if (modalidade === 'grupo') {
        // fixados entram primeiro; depois completa com sorteio ponderado sem repetir
        const usados = new Set([...excl, ...jogos.map((j) => j.grupos[0])]);
        const g = jogos.length < fixar.length ? fixar[jogos.length] : sortear(r, ws, usados);
        if (usados.size >= 25 && !fixar.includes(g)) break;
        jogo = { tipo: 'grupos', grupos: [g] };
      } else if (modalidade.endsWith('-gp')) {
        const set = new Set(fixar.slice(0, tamanho));
        const ex = new Set([...excl, ...set]);
        while (set.size < tamanho && ex.size < 25) {
          const g = sortear(r, ws, ex);
          set.add(g); ex.add(g);
        }
        jogo = { tipo: 'grupos', grupos: [...set].sort((a, b) => a - b) };
      } else {
        const g = fixar.length ? fixar[Math.floor(r() * fixar.length)] : sortear(r, ws, excl);
        const dz = NM.bicho(g).dezenas[Math.floor(r() * 4)];
        if (modalidade === 'dezena') jogo = { tipo: 'num', numeros: [dz], grupos: [g] };
        else if (modalidade === 'centena') jogo = { tipo: 'num', numeros: [Math.floor(r() * 10) + dz], grupos: [g] };
        else if (modalidade === 'milhar' || modalidade === 'mc') jogo = { tipo: 'num', numeros: [NM.pad(Math.floor(r() * 100), 2) + dz], grupos: [g] };
        else {
          // duque/terno de dezena
          const nums = new Set([dz]);
          const gs = [g];
          while (nums.size < tamanho) {
            const g2 = sortear(r, ws, excl);
            nums.add(NM.bicho(g2).dezenas[Math.floor(r() * 4)]);
            if (nums.size > gs.length) gs.push(g2);
          }
          jogo = { tipo: 'num', numeros: [...nums].sort(), grupos: gs };
        }
      }
      const key = JSON.stringify(jogo.numeros || jogo.grupos);
      if (vistos.has(key)) continue;
      vistos.add(key);
      jogos.push(jogo);
    }
    return jogos;
  };

  /* ---------- Conferidor ---------- */
  NM.conferir = function (aposta, modalidade, ext, ate) {
    const ps = premiosDe(ext, ate);
    const grupos = ps.map((p) => p.grupo);
    const acertos = [];
    if (modalidade === 'grupo') {
      ps.forEach((p) => aposta.includes(p.grupo) && acertos.push(p));
    } else if (modalidade === 'duque-gp' || modalidade === 'terno-gp') {
      const ok = aposta.every((g) => grupos.includes(g));
      if (ok) ps.forEach((p) => aposta.includes(p.grupo) && acertos.push(p));
      return { ganhou: ok, acertos };
    } else {
      const len = { dezena: 2, centena: 3, milhar: 4 }[modalidade] || 2;
      if (modalidade === 'duque-dz' || modalidade === 'terno-dz') {
        const dzs = ps.map((p) => p.milhar.slice(2));
        const ok = aposta.every((a) => dzs.includes(a));
        if (ok) ps.forEach((p) => aposta.includes(p.milhar.slice(2)) && acertos.push(p));
        return { ganhou: ok, acertos };
      }
      ps.forEach((p) => aposta.some((a) => p.milhar.slice(-len) === String(a).padStart(len, '0').slice(-len)) && acertos.push(p));
    }
    return { ganhou: acertos.length > 0, acertos };
  };

  /** Probabilidade de um grupo específico sair em pelo menos um dos k prêmios. */
  NM.probEmK = (p, k) => 1 - Math.pow(1 - p, k);
})();
