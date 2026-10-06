/* Na Mosca — base de dados: tabela dos bichos, bancas, modalidades/cotações e carregamento de resultados.
 *
 * Resultados reais: o coletor (scripts/atualizar-resultados.mjs, rodando no GitHub Actions) grava
 * data/bicho/<banca>.json e data/loterias/<jogo>.json. Quando um arquivo não existe (ou o site é aberto
 * direto do disco), a banca usa dados de demonstração gerados de forma determinística — e a interface
 * sinaliza isso com o selo DEMO.
 */
(function () {
  const NM = (window.NM = window.NM || {});

  function pad(n, len) { return String(n).padStart(len, '0'); }
  NM.pad = pad;

  NM.BICHOS = ['Avestruz', 'Águia', 'Burro', 'Borboleta', 'Cachorro', 'Cabra', 'Carneiro', 'Camelo', 'Cobra', 'Coelho',
    'Cavalo', 'Elefante', 'Galo', 'Gato', 'Jacaré', 'Leão', 'Macaco', 'Porco', 'Pavão', 'Peru',
    'Touro', 'Tigre', 'Urso', 'Veado', 'Vaca'].map((nome, i) => {
    const grupo = i + 1;
    const dezenas = [0, 1, 2, 3].map((k) => pad(((grupo - 1) * 4 + 1 + k) % 100, 2));
    return { grupo, nome, dezenas };
  });

  /** Grupo (1–25) a partir de uma dezena (0–99). 00 pertence à Vaca (25). */
  NM.grupoDaDezena = (dz) => { dz = Number(dz) % 100; return dz === 0 ? 25 : Math.ceil(dz / 4); };
  NM.bicho = (grupo) => NM.BICHOS[grupo - 1];
  NM.bichoDaMilhar = (m) => NM.bicho(NM.grupoDaDezena(Number(m) % 100));

  /* ---------- Sorteios (a grade da banca) ----------
   * Cada sorteio tem um código curto (o mesmo da máquina da banca), horário, dias e a fonte dos dados.
   * status 'novo' = sorteio recém-criado, ainda sem resultados automáticos.
   */
  const T = [0, 1, 2, 3, 4, 5, 6], SEG_SAB = [1, 2, 3, 4, 5, 6], DOM = [0], SAB = [6];
  const ext = (id, nome, hora, dias = SEG_SAB, limite, extra = {}) => ({ id, nome, hora, dias, limite, ...extra });
  const SP = [8, 9, 10, 11, 12, 13, 14, 16, 17, 18, 19, 20].map((h) => ext(`SP${NM.pad(h, 2)}`, `SP ${NM.pad(h, 2)}h`, `${NM.pad(h, 2)}:20`, SEG_SAB));
  NM.BANCAS = [
    { id: 'rj', sigla: 'RJ', nome: 'Rio de Janeiro', extracoes: [
      ext('RJ09', 'Rio 09h', '09:20'),
      ext('CTG', 'CTG', '11:20', T, '11:15'),
      ext('PT', 'PT', '14:20', T, '14:15'),
      ext('BAN', 'BAN', '16:20', SEG_SAB, '16:15'),
      ext('PTV', 'PTV', '16:20', T, '16:15'),
      ext('PTN', 'PTN', '18:20', SEG_SAB, '18:15'),
      ext('PTN-SB', 'PTN Sábado', '18:20', SAB, '18:15', { status: 'novo' }),
      ext('COR', 'Corujinha', '21:20', SEG_SAB, '21:15')] },
    { id: 'sp', sigla: 'SP', nome: 'São Paulo', extracoes: SP },
    { id: 'fed', sigla: 'FED', nome: 'Federal', extracoes: [
      ext('FED', 'Federal', '19:00', [3, 6], '18:50'),
      ext('FED-DM', 'Federal Domingo', '19:00', DOM, '18:50', { status: 'novo' })] },
  ];

  /** Grade completa, na ordem de horário (inclui Quininha e Seninha). */
  NM.SORTEIOS = [
    ...NM.BANCAS.flatMap((b) => b.extracoes.map((e) => ({ ...e, banca: b.id, tipo: 'bicho' }))),
    { id: 'QN', nome: 'Quininha', hora: '20:00', dias: SEG_SAB, banca: null, tipo: 'quininha', link: 'quininha.html' },
    { id: 'SN', nome: 'Seninha', hora: '20:00', dias: SEG_SAB, banca: null, tipo: 'seninha', link: 'seninha.html' },
  ].sort((a, b) => a.hora.localeCompare(b.hora) || a.id.localeCompare(b.id));
  NM.sorteio = (id) => NM.SORTEIOS.find((s) => s.id === id);

  NM.banca = (id) => NM.BANCAS.find((b) => b.id === id) || NM.BANCAS[0];

  /* ---------- Modalidades e cotações (valores pagos por R$ 1,00) ---------- */
  const q = (x) => Math.pow(x, 5);
  const P5 = Math.pow(25, 5);
  const binomGE = (k) => { let s = 0; for (let j = k; j <= 5; j++) s += comb(5, j) * Math.pow(0.2, j) * Math.pow(0.8, 5 - j); return s; };
  function comb(n, k) { if (k < 0 || k > n) return 0; let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return Math.round(r); }
  NM.comb = comb;
  const passe = (1 / 25) * (1 - Math.pow(24 / 25, 4));

  NM.MODALIDADES = [
    { cod: 1, sig: 'M', id: 'milhar', nome: 'Milhar', cotacao: 3000, prob: 1e-4, col: '1º ao 6º', desc: 'Acertar os 4 números do prêmio.' },
    { cod: 2, sig: 'MC', id: 'mc', nome: 'Milhar e Centena', cotacao: 1750, prob: 1e-4, col: '1º ao 6º', desc: 'Metade do valor na milhar e metade na centena. Cotação efetiva na milhar = (milhar + centena) ÷ 2.' },
    { cod: 3, sig: 'MM', id: 'mm', nome: 'Milhar Combinada', cotacao: 3000, prob: null, col: '1º ao 6º', desc: 'A milhar em todas as ordens possíveis; o valor é dividido entre as permutações.' },
    { cod: 4, sig: 'MCC', id: 'mcc', nome: 'Milhar e Centena Combinada', cotacao: 1750, prob: null, col: '1º ao 6º', desc: 'Milhar e centena combinadas (invertidas).' },
    { cod: 5, sig: 'C', id: 'centena', nome: 'Centena', cotacao: 500, prob: 1e-3, col: '1º ao 7º', desc: 'Acertar os 3 últimos números.' },
    { cod: 6, sig: 'CC', id: 'cc', nome: 'Centena Combinada', cotacao: 500, prob: null, col: '1º ao 7º', desc: 'A centena em todas as ordens; valor dividido entre as permutações.' },
    { cod: 7, sig: 'DZ', id: 'dezena', nome: 'Dezena', cotacao: 50, prob: 1e-2, col: '1º ao 7º', desc: 'Acertar os 2 últimos números.' },
    { cod: 8, sig: 'U', id: 'unidade', nome: 'Unidade', cotacao: 5, prob: 0.1, col: '1º ao 7º', desc: 'Acertar o último número.' },
    { cod: 9, sig: 'TDZ', id: 'terno-dz', nome: 'Terno de Dezena', cotacao: 3000, prob: 1 - 3 * q(0.99) + 3 * q(0.98) - q(0.97), col: 'Somente 1º ao 5º', desc: '3 dezenas entre o 1º e o 5º prêmio.' },
    { cod: 10, sig: 'DDZ', id: 'duque-dz', nome: 'Duque de Dezena', cotacao: 200, prob: 1 - 2 * q(0.99) + q(0.98), col: 'Somente 1º ao 5º', desc: '2 dezenas entre o 1º e o 5º prêmio.' },
    { cod: 11, sig: 'TG', id: 'terno-gp', nome: 'Terno de Grupo', cotacao: 100, prob: 1 - 3 * q(24 / 25) + 3 * q(23 / 25) - q(22 / 25), col: '1º ao 5º', desc: '3 grupos entre o 1º e o 5º prêmio.' },
    { cod: 12, sig: 'TGC', id: 'terno-gp-col', nome: 'Terno de Grupo Colocado', cotacao: 1000, prob: 6 / 15625, col: '1º ao 3º, 2º ao 4º, 3º ao 5º', desc: '3 grupos dentro de uma faixa de 3 prêmios.' },
    { cod: 13, sig: 'DG', id: 'duque-gp', nome: 'Dupla de Grupo', cotacao: 16, prob: 1 - 2 * q(24 / 25) + q(23 / 25), col: '1º ao 5º', desc: '2 grupos entre o 1º e o 5º prêmio.' },
    { cod: 14, sig: 'DGC', id: 'duque-gp-col', nome: 'Dupla de Grupo Colocada', cotacao: 160, prob: 2 / 625, col: '1º-2º, 2º-3º, 3º-4º, 4º-5º', desc: '2 grupos dentro de uma faixa de 2 prêmios.' },
    { cod: 15, sig: 'G', id: 'grupo', nome: 'Grupo', cotacao: 15, prob: 1 / 25, col: '1º ao 7º', desc: 'Acertar o bicho (grupo) do prêmio.' },
    { cod: 16, sig: 'PAS', id: 'passe', nome: 'Passe', cotacao: 75, prob: passe, col: 'Somente 1º ao 5º', desc: '1º grupo na cabeça e o 2º grupo do 2º ao 5º prêmio.' },
    { cod: 17, sig: 'PVV', id: 'pvv', nome: 'Passe Vai e Vem', cotacao: 37.5, prob: 2 * passe, col: 'Somente 1º ao 5º', desc: 'Passe nas duas ordens. Cotação padrão = metade do passe; confira com sua banca.' },
    { cod: 18, sig: 'QG5', id: 'qg5', nome: 'Quina de Grupo (5 grupos)', cotacao: 500, prob: 120 / P5, col: 'Somente 1º ao 5º', desc: 'Os 5 grupos do 1º ao 5º são exatamente os 5 escolhidos.' },
    { cod: 19, sig: 'QG10', id: 'qg10', nome: 'Quina de Grupo (10 grupos)', cotacao: 100, prob: 30240 / P5, col: 'Somente 1º ao 5º', desc: 'Os 5 grupos sorteados (distintos) estão entre os 10 escolhidos.' },
    { cod: 20, sig: 'QG15', id: 'qg15', nome: 'Quina de Grupo (15 grupos)', cotacao: 10, prob: 360360 / P5, col: 'Somente 1º ao 5º', desc: 'Os 5 grupos sorteados (distintos) estão entre os 15 escolhidos.' },
    { cod: 21, sig: 'LT3', id: 'lt3', nome: 'Lotinho 20 dezenas (Terno)', cotacao: 10, prob: binomGE(3), col: 'Somente 1º ao 5º', desc: '20 dezenas; ganha se 3 ou mais das dezenas do 1º ao 5º estiverem entre elas.' },
    { cod: 22, sig: 'LT4', id: 'lt4', nome: 'Lotinho 20 dezenas (Quadra)', cotacao: 100, prob: binomGE(4), col: 'Somente 1º ao 5º', desc: '20 dezenas; ganha com 4 ou mais acertos.' },
    { cod: 23, sig: 'LT5', id: 'lt5', nome: 'Lotinho 20 dezenas (Quina)', cotacao: 1000, prob: binomGE(5), col: 'Somente 1º ao 5º', desc: '20 dezenas; ganha com os 5 acertos.' },
    { cod: 24, sig: 'SM', id: 'sm', nome: 'Super Milhar', cotacao: null, prob: null, col: '—', desc: 'Regras e cotação definidas pela banca.' },
  ];

  /* Cotações da Quininha (5 de 80, Quina) e Seninha (6 de 60, Mega-Sena) por quantidade de dezenas */
  NM.QUININHA = { total: 80, sorteadas: 5, jogo: 'quina', nome: 'Quininha', base: 'Quina',
    cotacoes: { 13: 6000, 14: 4000, 15: 3000, 16: 2300, 17: 1700, 18: 1250, 19: 960, 20: 750, 25: 230, 30: 90, 35: 40, 40: 22, 45: 12 },
    limites: { 13: 10, 14: 15, 15: 20, 16: 25, 17: 30, 18: 45, 19: 60, 20: 75, 25: 250, 30: 600, 35: 1400, 40: 2500, 45: 4500 } };
  NM.SENINHA = { total: 60, sorteadas: 6, jogo: 'megasena', nome: 'Seninha', base: 'Mega-Sena',
    cotacoes: { 14: 6000, 15: 4000, 16: 2600, 17: 1800, 18: 1300, 19: 900, 20: 650, 25: 150, 30: 48, 35: 18, 40: 8 },
    limites: { 14: 30, 15: 40, 16: 60, 17: 85, 18: 120, 19: 170, 20: 235, 25: 1050, 30: 3200, 35: 8400, 40: 19000 } };

  /* Cotações personalizadas pelo visitante (configuradas na página Tabela) */
  function loadCot() { try { return JSON.parse(localStorage.getItem('nm-cotacoes') || '{}'); } catch (e) { return {}; } }
  NM.cotacoesCustom = loadCot();
  NM.cot = (id) => { const c = NM.cotacoesCustom[id]; const m = NM.MODALIDADES.find((x) => x.id === id); return c != null ? c : m ? m.cotacao : null; };
  NM.setCot = (id, v) => {
    if (v == null || v === '' || isNaN(v)) delete NM.cotacoesCustom[id]; else NM.cotacoesCustom[id] = Number(v);
    try { localStorage.setItem('nm-cotacoes', JSON.stringify(NM.cotacoesCustom)); } catch (e) {}
  };
  NM.mod = (id) => NM.MODALIDADES.find((x) => x.id === id);
  NM.PROB = Object.fromEntries(NM.MODALIDADES.map((m) => [m.id, m.prob]));
  NM.PROB.mc = 1e-3; // pelo menos a centena
  /** Retorno esperado por R$ 1,00 apostado (usa as cotações em vigor). */
  NM.ev = (id) => {
    if (id === 'mc') return (NM.cot('milhar') * 1e-4 + NM.cot('centena') * 1e-3) / 2;
    const c = NM.cot(id), p = NM.PROB[id];
    return c != null && p != null ? c * p : null;
  };

  /* ---------- Datas ---------- */
  NM.isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1, 2)}-${pad(d.getDate(), 2)}`;
  NM.fmtDate = (iso) => { const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}`; };
  NM.fmtDateCurta = (iso) => { const [, m, d] = iso.split('-'); return `${d}/${m}`; };
  NM.DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  /* ---------- PRNG determinístico (dados de demonstração) ---------- */
  function hash(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  NM.rng = (seed) => mulberry32(hash(String(seed)));

  function montar(banca, e, iso, milhares) {
    return {
      banca: banca.id, bancaNome: banca.nome, extracao: e.id, extracaoNome: e.nome || e.id, hora: e.hora || '', data: iso,
      premios: milhares.filter(Boolean).map((m, i) => ({ posicao: i + 1, milhar: m, grupo: NM.grupoDaDezena(Number(m) % 100) })),
    };
  }
  function demoExtracao(banca, e, iso) {
    const r = NM.rng(`${banca.id}|${e.id}|${iso}`);
    const p = [];
    for (let i = 0; i < 5; i++) p.push(Math.floor(r() * 10000));
    p.push(p.reduce((a, b) => a + b, 0) % 10000);
    p.push(Math.floor((p[0] * p[1]) / 1000) % 1000);
    return montar(banca, e, iso, p.map((m, i) => pad(m, i === 6 ? 3 : 4)));
  }

  /* ---------- Carregamento ---------- */
  const live = {};      // bancaId -> { fonte, atualizado, extracoes: [...] }
  const cache = {};

  async function fetchJSON(url) {
    const r = await fetch(url, { cache: 'no-cache' });
    if (!r.ok) throw new Error(r.status);
    return r.json();
  }

  NM.ready = (async () => {
    if (location.protocol === 'file:') return;
    await Promise.allSettled(NM.BANCAS.map(async (b) => {
      const j = await fetchJSON(`data/bicho/${b.id}.json`);
      if (!j.extracoes || !j.extracoes.length) return;
      live[b.id] = {
        fonte: j.fonte, atualizado: j.atualizado,
        extracoes: j.extracoes.map((e) => ({ e, c: codigo(b, e) }))
          .filter(({ c }) => b.extracoes.some((s) => s.id === c.id))  // só sorteios da grade
          .map(({ e, c }) => montar(b, { ...e, ...c }, e.data, e.premios)),
      };
    }));
  })();

  /* Converte o rótulo/horário vindo da fonte para o código do sorteio na grade. */
  const ALIAS = { PPT: 'RJ09', PTM: 'CTG', CORUJA: 'COR', FEDERAL: 'FED' };
  function codigo(b, e) {
    const lbl = ALIAS[e.id] || e.id;
    let x = b.extracoes.find((s) => s.id === lbl);
    if (!x && e.hora) {
      const mesmoHorario = b.extracoes.filter((s) => s.hora === e.hora && s.status !== 'novo');
      x = mesmoHorario.length === 1 ? mesmoHorario[0] : null;
      if (!x && b.id === 'sp') x = b.extracoes.find((s) => s.id === 'SP' + e.hora.slice(0, 2));
    }
    return x ? { id: x.id, nome: x.nome, hora: x.hora } : { id: e.id, nome: e.nome || e.id, hora: e.hora };
  }

  NM.isLive = (bancaId) => !!live[bancaId];
  NM.fonte = (bancaId) => live[bancaId] || null;

  /** Extrações da banca nos últimos `dias` dias, da mais antiga para a mais recente. */
  NM.loadResults = function (bancaId = 'rj', dias = 180) {
    const key = bancaId + '|' + dias;
    if (cache[key]) return cache[key];
    const banca = NM.banca(bancaId);
    const now = new Date();
    const limite = NM.isoDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - dias + 1));
    let out;
    if (live[bancaId]) {
      out = live[bancaId].extracoes.filter((e) => e.data >= limite);
    } else {
      out = [];
      for (let d = dias - 1; d >= 0; d--) {
        const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - d);
        const iso = NM.isoDate(day);
        for (const e of banca.extracoes) {
          if (!e.dias.includes(day.getDay()) || e.status === 'novo') continue;
          if (d === 0) {
            const [h, m] = e.hora.split(':').map(Number);
            if (now.getHours() * 60 + now.getMinutes() < h * 60 + m + 10) continue;
          }
          out.push(demoExtracao(banca, e, iso));
        }
      }
    }
    cache[key] = out;
    return out;
  };

  /** Concursos da Quina / Mega-Sena (mais recente primeiro). Tenta o arquivo do coletor e depois a API pública. */
  NM.loadLoteria = async function (jogo) {
    if (location.protocol !== 'file:') {
      try {
        const j = await fetchJSON(`data/loterias/${jogo}.json`);
        if (j.concursos && j.concursos.length) return { fonte: 'Caixa (coletor)', atualizado: j.atualizado, concursos: j.concursos.map(normConc) };
      } catch (e) {}
    }
    try {
      const j = await fetchJSON(`https://loteriascaixa-api.herokuapp.com/api/${jogo}/latest`);
      return { fonte: 'API pública Loterias Caixa', atualizado: new Date().toISOString(), concursos: [normConc({ numero: j.concurso, data: j.data, dezenas: j.dezenas })] };
    } catch (e) {}
    return null;
  };
  function normConc(c) {
    let data = String(c.data);
    if (data.includes('/')) { const [d, m, y] = data.split('/'); data = `${y}-${m}-${d}`; }
    return { numero: Number(c.numero), data, dezenas: c.dezenas.map(Number).sort((a, b) => a - b) };
  }
})();
