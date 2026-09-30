/* Na Mosca — base de dados: tabela dos bichos, bancas e resultados.
 * Os resultados aqui são gerados de forma determinística (dados de demonstração).
 * Para usar dados reais, substitua NM.loadResults() por uma chamada à sua API
 * mantendo o mesmo formato de objeto de extração.
 */
(function () {
  const NM = (window.NM = window.NM || {});

  NM.BICHOS = [
    ['Avestruz', '🦤'], ['Águia', '🦅'], ['Burro', '🫏'], ['Borboleta', '🦋'], ['Cachorro', '🐕'],
    ['Cabra', '🐐'], ['Carneiro', '🐏'], ['Camelo', '🐫'], ['Cobra', '🐍'], ['Coelho', '🐇'],
    ['Cavalo', '🐎'], ['Elefante', '🐘'], ['Galo', '🐓'], ['Gato', '🐈'], ['Jacaré', '🐊'],
    ['Leão', '🦁'], ['Macaco', '🐒'], ['Porco', '🐖'], ['Pavão', '🦚'], ['Peru', '🦃'],
    ['Touro', '🐂'], ['Tigre', '🐅'], ['Urso', '🐻'], ['Veado', '🦌'], ['Vaca', '🐄'],
  ].map(([nome, emoji], i) => {
    const grupo = i + 1;
    const dezenas = [0, 1, 2, 3].map((k) => pad((grupo - 1) * 4 + 1 + k === 100 ? 0 : (grupo - 1) * 4 + 1 + k, 2));
    return { grupo, nome, emoji, dezenas };
  });

  /** Grupo (1–25) a partir de uma dezena (0–99). 00 pertence à Vaca (25). */
  NM.grupoDaDezena = function (dz) {
    dz = Number(dz) % 100;
    return dz === 0 ? 25 : Math.ceil(dz / 4);
  };
  NM.bicho = (grupo) => NM.BICHOS[grupo - 1];
  NM.bichoDaMilhar = (m) => NM.bicho(NM.grupoDaDezena(Number(m) % 100));

  function pad(n, len) {
    return String(n).padStart(len, '0');
  }
  NM.pad = pad;

  /* Bancas e extrações. dias: 0=dom … 6=sáb */
  NM.BANCAS = [
    {
      id: 'rj', nome: 'PT Rio (RJ)',
      extracoes: [
        { id: 'PPT', nome: 'PPT', hora: '09:20', dias: [1, 2, 3, 4, 5, 6] },
        { id: 'PTM', nome: 'PTM', hora: '11:20', dias: [0, 1, 2, 3, 4, 5, 6] },
        { id: 'PT', nome: 'PT', hora: '14:20', dias: [0, 1, 2, 3, 4, 5, 6] },
        { id: 'PTV', nome: 'PTV', hora: '16:20', dias: [0, 1, 2, 3, 4, 5, 6] },
        { id: 'PTN', nome: 'PTN', hora: '18:20', dias: [1, 2, 3, 4, 5, 6] },
        { id: 'COR', nome: 'Corujinha', hora: '21:20', dias: [1, 2, 3, 4, 5, 6] },
      ],
    },
    {
      id: 'look', nome: 'Look (GO)',
      extracoes: [
        { id: 'L09', nome: 'Look 09h', hora: '09:20', dias: [1, 2, 3, 4, 5, 6] },
        { id: 'L11', nome: 'Look 11h', hora: '11:20', dias: [0, 1, 2, 3, 4, 5, 6] },
        { id: 'L14', nome: 'Look 14h', hora: '14:20', dias: [0, 1, 2, 3, 4, 5, 6] },
        { id: 'L16', nome: 'Look 16h', hora: '16:20', dias: [1, 2, 3, 4, 5, 6] },
        { id: 'L18', nome: 'Look 18h', hora: '18:20', dias: [1, 2, 3, 4, 5, 6] },
      ],
    },
    {
      id: 'ba', nome: 'Bahia (BA)',
      extracoes: [
        { id: 'BA10', nome: 'Bahia 10h', hora: '10:00', dias: [1, 2, 3, 4, 5, 6] },
        { id: 'BA12', nome: 'Bahia 12h', hora: '12:00', dias: [0, 1, 2, 3, 4, 5, 6] },
        { id: 'BA15', nome: 'Bahia 15h', hora: '15:00', dias: [1, 2, 3, 4, 5, 6] },
        { id: 'BA19', nome: 'Bahia 19h', hora: '19:00', dias: [1, 2, 3, 4, 5, 6] },
      ],
    },
    {
      id: 'fed', nome: 'Federal',
      extracoes: [{ id: 'FED', nome: 'Federal', hora: '19:00', dias: [3, 6] }],
    },
  ];
  NM.banca = (id) => NM.BANCAS.find((b) => b.id === id) || NM.BANCAS[0];

  /* PRNG determinístico (mulberry32) semeado por hash de string. */
  function hash(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  }
  function mulberry32(a) {
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  NM.rng = (seed) => mulberry32(hash(String(seed)));

  NM.isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1, 2)}-${pad(d.getDate(), 2)}`;
  NM.fmtDate = (iso) => {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  };
  NM.DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  function buildExtracao(banca, ext, iso) {
    const r = NM.rng(`${banca.id}|${ext.id}|${iso}`);
    const premios = [];
    for (let p = 0; p < 5; p++) premios.push(Math.floor(r() * 10000));
    // 6º prêmio: soma dos cinco primeiros (últimos 4 dígitos)
    premios.push(premios.reduce((a, b) => a + b, 0) % 10000);
    // 7º prêmio: centena do produto do 1º pelo 2º
    premios.push(Math.floor((premios[0] * premios[1]) / 1000) % 1000);
    return {
      banca: banca.id,
      bancaNome: banca.nome,
      extracao: ext.id,
      extracaoNome: ext.nome,
      hora: ext.hora,
      data: iso,
      premios: premios.map((m, i) => ({
        posicao: i + 1,
        milhar: i === 6 ? pad(m, 3) : pad(m, 4),
        grupo: NM.grupoDaDezena(m % 100),
      })),
    };
  }

  const cache = {};
  /**
   * Retorna as extrações de uma banca, da mais antiga para a mais recente,
   * cobrindo os últimos `dias` dias (somente horários já passados hoje).
   */
  NM.loadResults = function (bancaId = 'rj', dias = 180) {
    const key = bancaId + dias;
    if (cache[key]) return cache[key];
    const banca = NM.banca(bancaId);
    const now = new Date();
    const out = [];
    for (let d = dias - 1; d >= 0; d--) {
      const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - d);
      const iso = NM.isoDate(day);
      for (const ext of banca.extracoes) {
        if (!ext.dias.includes(day.getDay())) continue;
        if (d === 0) {
          const [h, m] = ext.hora.split(':').map(Number);
          if (now.getHours() * 60 + now.getMinutes() < h * 60 + m + 10) continue;
        }
        out.push(buildExtracao(banca, ext, iso));
      }
    }
    cache[key] = out;
    return out;
  };

  /* Cotações de referência (quanto paga por R$ 1,00) e probabilidade de acerto
   * na cabeça (1º prêmio). Valores variam de banca para banca. */
  NM.MODALIDADES = [
    { id: 'grupo', nome: 'Grupo', cotacao: 18, prob: 1 / 25, desc: 'Acertar o bicho (grupo) do prêmio.' },
    { id: 'dezena', nome: 'Dezena', cotacao: 60, prob: 1 / 100, desc: 'Acertar os 2 últimos números.' },
    { id: 'centena', nome: 'Centena', cotacao: 600, prob: 1 / 1000, desc: 'Acertar os 3 últimos números.' },
    { id: 'milhar', nome: 'Milhar', cotacao: 4000, prob: 1 / 10000, desc: 'Acertar os 4 números.' },
    { id: 'mc', nome: 'Milhar e Centena', cotacao: 2300, prob: 1 / 10000, desc: 'Metade na milhar, metade na centena.' },
    { id: 'duque-gp', nome: 'Duque de Grupo', cotacao: 18.5, prob: null, desc: '2 grupos entre o 1º e o 5º prêmio.' },
    { id: 'terno-gp', nome: 'Terno de Grupo', cotacao: 150, prob: null, desc: '3 grupos entre o 1º e o 5º prêmio.' },
    { id: 'duque-dz', nome: 'Duque de Dezena', cotacao: 300, prob: null, desc: '2 dezenas entre o 1º e o 5º prêmio.' },
    { id: 'terno-dz', nome: 'Terno de Dezena', cotacao: 5000, prob: null, desc: '3 dezenas entre o 1º e o 5º prêmio.' },
    { id: 'passe', nome: 'Passe Vai', cotacao: 90, prob: null, desc: 'Grupo no 1º e outro grupo do 2º ao 5º.' },
  ];
})();
