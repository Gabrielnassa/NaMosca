(function () {
  const { $, $$ } = NM;

  const MODOS = [
    { id: 'tg', sig: 'TG', nome: 'Terno de Grupo', tipo: 'grupo', r: 3, cot: 'terno-gp', janelas: [['1º ao 5º', 5]] },
    { id: 'tgc', sig: 'TGC', nome: 'Terno Colocado', tipo: 'grupo', r: 3, cot: 'terno-gp-col', janelas: [['1º ao 3º', 3], ['2º ao 4º', 3], ['3º ao 5º', 3]] },
    { id: 'dg', sig: 'DG', nome: 'Dupla de Grupo', tipo: 'grupo', r: 2, cot: 'duque-gp', janelas: [['1º ao 5º', 5]] },
    { id: 'dgc', sig: 'DGC', nome: 'Dupla Colocada', tipo: 'grupo', r: 2, cot: 'duque-gp-col', janelas: [['1º-2º', 2], ['2º-3º', 2], ['3º-4º', 2], ['4º-5º', 2]] },
    { id: 'tdz', sig: 'TDZ', nome: 'Terno de Dezena', tipo: 'dezena', r: 3, cot: 'terno-dz', janelas: [['1º ao 5º', 5]] },
    { id: 'ddz', sig: 'DDZ', nome: 'Duque de Dezena', tipo: 'dezena', r: 2, cot: 'duque-dz', janelas: [['1º ao 5º', 5]] },
    { id: 'qg', sig: 'QG', nome: 'Quina de Grupo', tipo: 'grupo', quina: true, subs: [['QG5', 5, 'qg5'], ['QG10', 10, 'qg10'], ['QG15', 15, 'qg15']] },
    { id: 'pas', sig: 'PAS', nome: 'Passe', tipo: 'grupo', passe: true, subs: [['PAS', 0, 'passe'], ['PVV', 0, 'pvv']] },
    { id: 'lt', sig: 'LT', nome: 'Lotinho', tipo: 'dezena', lotinho: true, subs: [['LT3', 3, 'lt3'], ['LT4', 4, 'lt4'], ['LT5', 5, 'lt5']] },
    { id: 'mm', sig: 'MM', nome: 'Milhar/Centena Comb.', tipo: 'milhar', subs: [['MM', 4, 'milhar'], ['CC', 3, 'centena'], ['MCC', 4, 'mc']] },
  ];

  const REDUZ = ['tg', 'dg', 'tdz', 'ddz'];
  const st = { red: 'completo', mGar: 0, tempo: 10000, redJogos: null, redSig: '', redInfo: null, modo: MODOS[0], sel: new Set(), valor: 1, janela: 0, sub: 0, maxJogos: 300, jogos: [], texto: '' };

  function modoFromHash() {
    const h = location.hash.slice(1);
    return MODOS.find((m) => m.id === h) || MODOS[0];
  }

  function tabs() {
    $('#tabs').innerHTML = MODOS.map((m) => `<button data-id="${m.id}" class="${m === st.modo ? 'on' : ''}"><span class="code">${m.sig}</span>${m.nome}</button>`).join('');
    $$('#tabs button').forEach((b) => b.addEventListener('click', () => {
      st.modo = MODOS.find((m) => m.id === b.dataset.id);
      st.sel.clear(); st.janela = 0; st.sub = 0; st.jogos = [];
      history.replaceState(null, '', '#' + st.modo.id);
      tabs(); form(); calc();
    }));
  }

  const cotId = () => (st.modo.subs ? st.modo.subs[st.sub][2] : st.modo.cot);

  function form() {
    const m = st.modo;
    let html = '';
    if (m.subs) html += `<div class="field"><span>Variação</span><div class="seg" id="subs">${m.subs.map((s, i) => `<button data-i="${i}" class="${i === st.sub ? 'on' : ''}">${s[0]}</button>`).join('')}</div></div>`;
    if (m.janelas && m.janelas.length > 1) html += `<div class="field"><span>Colocação</span><div class="seg" id="jan">${m.janelas.map((j, i) => `<button data-i="${i}" class="${i === st.janela ? 'on' : ''}">${j[0]}</button>`).join('')}</div></div>`;

    if (m.tipo === 'milhar') {
      html += `<label class="field"><span>Milhares (uma por linha ou separadas por espaço)</span><textarea id="milhares" rows="4" placeholder="4532&#10;1180">${st.milhares || ''}</textarea></label>`;
    } else {
      const label = m.tipo === 'grupo' ? 'Bichos' : 'Dezenas';
      html += `<div><div style="display:flex;justify-content:space-between;align-items:baseline"><span class="field"><span>${label}</span></span><span class="sel-count" id="cnt"></span></div>
        <div class="${m.tipo === 'grupo' ? 'picker' : 'numgrid'}" id="pick" style="margin-top:6px"></div>
        <div class="btn-row" style="margin-top:8px"><button class="btn btn-soft" id="limpar">Limpar</button>${m.tipo === 'grupo' ? '<button class="btn btn-soft" id="quentes">Top frequência</button><button class="btn btn-soft" id="atrasados">Mais atrasados</button>' : '<button class="btn btn-soft" id="aleat">Aleatórias</button>'}</div></div>`;
    }
    html += `<div class="grid g2"><label class="field"><span>${m.tipo === 'milhar' ? 'Valor por milhar (R$)' : 'Valor por jogo (R$)'}</span><input type="number" id="valor" min="0.1" step="0.5" value="${st.valor}"></label>
      <label class="field"><span>Cotação (×)</span><input type="number" id="cot" step="0.5" value="${NM.cot(cotId()) ?? ''}"></label></div>`;
    if (REDUZ.includes(m.id)) {
      const ms = []; for (let x = m.r + 1; x <= 5; x++) ms.push(x);
      if (!ms.includes(st.mGar)) st.mGar = ms[0];
      const alvo = m.tipo === 'grupo' ? 'bichos' : 'dezenas';
      html += `<div class="field"><span>Fechamento</span><div class="seg" id="red">
          <button data-v="completo" class="${st.red === 'completo' ? 'on' : ''}">Completo</button>
          <button data-v="reduzido" class="${st.red === 'reduzido' ? 'on' : ''}">Reduzido</button>
          <button data-v="otim" class="${st.red === 'otim' ? 'on' : ''}">Otimizador PRO</button></div></div>`;
      if (st.red !== 'completo') html += `<div class="grid g2">
          <label class="field"><span>Garantia</span><select id="mgar">${ms.map((x) => `<option value="${x}"${x === st.mGar ? ' selected' : ''}>${m.r === 3 ? 'Terno' : 'Duque'} se ${x} saírem</option>`).join('')}</select></label>
          ${st.red === 'otim' ? `<label class="field"><span>Tempo</span><select id="tempo">${[[5000, '5 s'], [10000, '10 s'], [30000, '30 s'], [60000, '1 min']].map(([v, l]) => `<option value="${v}"${v === st.tempo ? ' selected' : ''}>${l}</option>`).join('')}</select></label>` : '<span></span>'}</div>
        <button class="btn btn-primary" id="gerar-red">${st.red === 'otim' ? 'Otimizar fechamento' : 'Gerar fechamento reduzido'}</button>
        <div class="progress" id="prog" hidden><div></div></div><p class="note" id="prog-txt" style="margin:0"></p>`;
    }
    if (m.lotinho) html += `<label class="field"><span>Máximo de jogos</span><input type="number" id="maxj" min="1" max="2000" value="${st.maxJogos}"></label>
      <button class="btn btn-primary" id="gerar-lt">Calcular fechamento</button><div class="progress" id="prog" hidden><div></div></div>`;
    html += `<p class="note" id="regra" style="margin:0"></p>`;
    $('#form').innerHTML = html;

    $$('#subs button').forEach((b) => b.addEventListener('click', () => { st.sub = Number(b.dataset.i); st.jogos = []; form(); calc(); }));
    $$('#jan button').forEach((b) => b.addEventListener('click', () => { st.janela = Number(b.dataset.i); form(); calc(); }));
    $('#valor').addEventListener('input', (e) => { st.valor = Math.max(0, Number(e.target.value) || 0); calc(); });
    $('#cot').addEventListener('change', (e) => { NM.setCot(cotId(), e.target.value); calc(); });
    if ($('#milhares')) $('#milhares').addEventListener('input', (e) => { st.milhares = e.target.value; calc(); });
    if ($('#maxj')) $('#maxj').addEventListener('input', (e) => (st.maxJogos = Math.max(1, Math.min(2000, Number(e.target.value) || 1))));
    if ($('#gerar-lt')) $('#gerar-lt').addEventListener('click', gerarLotinho);
    $$('#red button').forEach((b) => b.addEventListener('click', () => { st.red = b.dataset.v; st.redJogos = null; form(); calc(); }));
    if ($('#mgar')) $('#mgar').addEventListener('change', (e) => { st.mGar = Number(e.target.value); st.redJogos = null; calc(); });
    if ($('#tempo')) $('#tempo').addEventListener('change', (e) => (st.tempo = Number(e.target.value)));
    if ($('#gerar-red')) $('#gerar-red').addEventListener('click', gerarReduzido);
    if ($('#pick')) picker();
    const mm = NM.mod(cotId());
    $('#regra').innerHTML = mm ? `<b class="acc">${mm.sig}</b> ${mm.desc}` : '';
  }

  function picker() {
    const m = st.modo;
    const el = $('#pick');
    if (m.tipo === 'grupo') {
      el.innerHTML = NM.BICHOS.map((b) => `<button data-v="${b.grupo}" class="${st.sel.has(b.grupo) ? 'on' : ''}"><b>${NM.pad(b.grupo, 2)}</b>${b.nome}</button>`).join('');
    } else {
      el.innerHTML = NM.DEZENAS_BICHO.map((i) => `<button data-v="${i}" class="${st.sel.has(i) ? 'on' : ''}">${NM.pad(i, 2)}</button>`).join('');
    }
    el.onclick = (e) => {
      const b = e.target.closest('button[data-v]'); if (!b) return;
      const v = Number(b.dataset.v);
      st.sel.has(v) ? st.sel.delete(v) : st.sel.add(v);
      b.classList.toggle('on');
      st.jogos = [];
      calc();
    };
    $('#limpar').onclick = () => { st.sel.clear(); st.jogos = []; picker(); calc(); };
    const stats = () => NM.stats(NM.loadResults(NM.getBanca(), 90), { ate: 5 });
    const qtd = () => Math.max(st.sel.size, m.quina ? st.modo.subs[st.sub][1] + 1 : m.r ? m.r + 2 : 6);
    if ($('#quentes')) $('#quentes').onclick = () => { st.sel = new Set([...stats().grupos].sort((a, b) => b.freq - a.freq).slice(0, qtd()).map((g) => g.grupo)); picker(); calc(); };
    if ($('#atrasados')) $('#atrasados').onclick = () => { st.sel = new Set([...stats().grupos].sort((a, b) => b.atraso - a.atraso).slice(0, qtd()).map((g) => g.grupo)); picker(); calc(); };
    if ($('#aleat')) $('#aleat').onclick = () => {
      const n = Math.max(st.sel.size, m.lotinho ? 24 : (m.r || 2) + 3); const s = new Set();
      while (s.size < n) s.add(Math.floor(Math.random() * 100));
      st.sel = s; st.jogos = []; picker(); calc();
    };
    const minimo = m.lotinho ? 20 : m.quina ? st.modo.subs[st.sub][1] : m.passe ? 2 : m.r;
    $('#cnt').textContent = `${st.sel.size} selecionad${m.tipo === 'grupo' ? 'os' : 'as'} · mín. ${minimo}`;
  }

  /* ---------- cálculo ---------- */
  function kpis(list) {
    $('#kpis').innerHTML = list.map(([l, v, s, cls]) => `<div class="kpi"><div class="label">${l}</div><div class="value ${cls || ''}">${v}</div><div class="sub">${s || ''}</div></div>`).join('');
  }
  function cenarios(rows, head) {
    $('#cenarios').innerHTML = `<table class="data-table"><thead><tr>${head.map((h, i) => `<th class="${i ? 'n' : ''}">${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r) =>
      `<tr${r.hl ? ' class="hl"' : ''}>${r.cells.map((c, i) => `<td class="${i ? 'n' : ''}">${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  }
  const liq = (x) => `<span class="${x >= 0 ? 'up' : 'down'}">${x >= 0 ? '+' : '−'}${NM.brl(Math.abs(x)).replace('R$ ', 'R$ ')}</span>`;

  function render(jogos, fmt, sep = ' - ') {
    st.jogos = jogos;
    st.texto = jogos.map((j) => (Array.isArray(j) ? j.map(fmt).join(sep) : j)).join('\n');
    const MAX = 600;
    $('#jogos').innerHTML = jogos.length ? `<div class="jogos">${jogos.slice(0, MAX).map((j, i) => `<div class="jogo"><span class="idx">${NM.pad(i + 1, 3)}</span><div>
      <div class="nums">${Array.isArray(j) ? j.map(fmt).join(sep) : j}</div>${st.modo.tipo === 'grupo' ? `<div class="small">${j.map((g) => NM.bicho(g).nome).join(' · ')}</div>` : ''}</div></div>`).join('')}</div>
      ${jogos.length > MAX ? `<p class="note" style="margin-top:8px">Mostrando ${MAX} de ${NM.num(jogos.length)} jogos — use Copiar ou Baixar para a lista completa.</p>` : ''}`
      : '<p class="empty">Selecione os números para montar o fechamento</p>';
  }

  function calc() {
    const m = st.modo;
    if ($('#pick')) {
      const minimo = m.lotinho ? 20 : m.quina ? m.subs[st.sub][1] : m.passe ? 2 : m.r;
      $('#cnt').textContent = `${st.sel.size} selecionad${m.tipo === 'grupo' ? 'os' : 'as'} · mín. ${minimo}`;
    }
    const cot = NM.cot(cotId()) || 0;
    const v = st.valor;
    const sel = [...st.sel].sort(NM.ordDz);
    const fmtG = (g) => NM.pad(g, 2);

    if (m.tipo === 'milhar') return calcMilhar(cot, v);
    if (m.lotinho) return calcLotinho(cot, v, sel);

    let jogos = [], dist, ganhos, pAlgum, head, rows = [];
    const univ = m.tipo === 'grupo' ? 25 : 100;
    const N = sel.length;

    if (m.quina) {
      const r = m.subs[st.sub][1];
      jogos = N >= r ? NM.combos(sel, r, 10000) : [];
      const total = NM.comb(N, r);
      const p = NM.probTodosDistintosDentro(N, 25, 5);
      const win = N >= r ? NM.comb(N - 5, r - 5) : 0;
      pAlgum = N >= r ? p : 0;
      const custo = total * v, premio = win * cot * v;
      head = ['Cenário', 'Probabilidade', 'Jogos premiados', 'Prêmio', 'Líquido'];
      rows = [
        { cells: ['5 grupos distintos, todos no seu conjunto', NM.pct(p, 4), win, NM.brl(premio), liq(premio - custo)], hl: true },
        { cells: ['Qualquer outro resultado', NM.pct(1 - p, 4), 0, NM.brl(0), liq(-custo)] },
      ];
      kpis5(total, custo, cot * v, pAlgum, p * premio, custo);
      if (total > 10000) $('#jogos').innerHTML = `<p class="empty">${NM.num(total)} combinações — reduza o conjunto (limite 10.000)</p>`; else render(jogos, fmtG);
    } else if (m.passe) {
      const pvv = m.subs[st.sub][0] === 'PVV';
      if (N >= 2) {
        jogos = pvv ? NM.combos(sel, 2) : sel.flatMap((a) => sel.filter((b) => b !== a).map((b) => [a, b]));
      }
      const total = jogos.length, custo = total * v;
      const pIn = N / 25;
      const d2 = N >= 2 ? NM.distDistintos(N - 1, 25, 4) : [1];
      head = ['1º prêmio · outros seus no 2º–5º', 'Probabilidade', 'Jogos premiados', 'Prêmio', 'Líquido'];
      rows.push({ cells: ['1º fora do conjunto', NM.pct(1 - pIn, 2), 0, NM.brl(0), liq(-custo)] });
      let ev = 0; pAlgum = 0;
      d2.forEach((p, k) => {
        const pr = pIn * p, prem = k * cot * v; ev += pr * prem; if (k > 0) pAlgum += pr;
        rows.push({ cells: [`1º no conjunto · ${k} outro${k === 1 ? '' : 's'}`, NM.pct(pr, 3), k, NM.brl(prem), liq(prem - custo)], hl: k > 0 && prem > custo });
      });
      kpis5(total, custo, cot * v, pAlgum, ev, custo);
      render(jogos, fmtG, pvv ? ' × ' : ' → ');
    } else {
      const w = m.janelas[st.janela][1];
      if (REDUZ.includes(m.id) && st.red !== 'completo') return calcReduzido(sel, cot, v, univ, w);
      jogos = N >= m.r ? NM.combos(sel, m.r, 50000) : [];
      const total = NM.comb(N, m.r), custo = total * v;
      dist = NM.distDistintos(N, univ, w);
      let ev = 0; pAlgum = 0;
      head = [`Seus ${m.tipo === 'grupo' ? 'bichos' : 'números'} no ${m.janelas[st.janela][0]}`, 'Probabilidade', 'Jogos premiados', 'Prêmio', 'Líquido'];
      dist.forEach((p, x) => {
        ganhos = NM.comb(x, m.r);
        const prem = ganhos * cot * v; ev += p * prem; if (ganhos) pAlgum += p;
        rows.push({ cells: [`${x} de ${N}`, NM.pct(p, p < 0.001 ? 4 : 2), ganhos, NM.brl(prem), liq(prem - custo)], hl: ganhos > 0 && prem >= custo });
      });
      kpis5(total, custo, cot * v, pAlgum, ev, custo);
      render(jogos, m.tipo === 'grupo' ? fmtG : (d) => NM.pad(d, 2));
    }
    cenarios(rows, head);
    $('#cen-meta').textContent = `${m.sig} · cotação ${NM.num(cot, cot % 1 ? 1 : 0)}× · R$ ${NM.num(v, 2)} por jogo`;
  }

  /* ---------- Fechamento reduzido / Otimizador PRO ---------- */
  function calcReduzido(sel, cot, v, univ, w) {
    const m = st.modo, N = sel.length, r = m.r, M = st.mGar;
    const sig = `${m.id}|${sel.join(',')}|${M}`;
    if (sig !== st.redSig) { st.redJogos = null; st.redSig = sig; }
    const completo = NM.comb(N, r);
    const dist = NM.distDistintos(N, univ, w);
    const alvo = m.tipo === 'grupo' ? 'bichos' : 'dezenas';
    $('#cen-meta').textContent = `${m.sig} · ${r === 3 ? 'terno' : 'duque'} garantido se ${M} dos seus ${alvo} saírem`;
    if (!st.redJogos) {
      kpis([['Completo', NM.num(completo), 'jogos sem redução'], ['Garantia', `${r === 3 ? 'Terno' : 'Duque'} se ${M}`, `${alvo} entre o 1º e o 5º`]]);
      cenarios([], ['Clique em gerar']);
      $('#cenarios').innerHTML = `<p class="empty">${N <= r ? `Escolha mais de ${r} ${alvo}.` : `Clique em “${st.red === 'otim' ? 'Otimizar fechamento' : 'Gerar fechamento reduzido'}”.`}</p>`;
      $('#jogos').innerHTML = '<p class="empty">O fechamento reduzido aparece aqui</p>';
      st.texto = '';
      return;
    }
    const jogos = st.redJogos, n = jogos.length, custo = n * v;
    // para cada quantidade x de acertos no conjunto: média de jogos premiados (exata) e mínimo (por enumeração quando viável)
    const idx = new Map(sel.map((x, i) => [x, i]));
    const jIdx = jogos.map((j) => j.map((x) => idx.get(x)));
    let ev = 0, pAlgum = 0; const rows = [];
    dist.forEach((p, x) => {
      const media = x >= r ? n * NM.comb(N - r, x - r) / NM.comb(N, x) : 0;
      let minimo = x >= M ? '≥ 1' : '0';
      if (x >= r && NM.comb(N, x) * n <= 3e6) {
        let mn = Infinity;
        NM.combos([...Array(N).keys()], x, 1e6).forEach((sub) => {
          const S = new Set(sub); let c = 0;
          for (const j of jIdx) if (j.every((e) => S.has(e))) c++;
          if (c < mn) mn = c;
        });
        minimo = String(mn);
      }
      const prem = media * cot * v; ev += p * prem;
      if (x >= M) pAlgum += p; else if (x >= r) pAlgum += p * Math.min(1, media);
      rows.push({ cells: [`${x} de ${N}`, NM.pct(p, p < 0.001 ? 4 : 2), minimo, NM.num(media, 2), NM.brl(prem), liq(prem - custo)], hl: x >= M });
    });
    cenarios(rows, [`Seus ${alvo} no 1º–5º`, 'Chance', 'Mín. premiados', 'Média', 'Prêmio médio', 'Líquido']);
    const i = st.redInfo || {};
    kpis([
      ['Jogos', NM.num(n), i.tentativas ? `melhor de ${i.tentativas} tentativas` : `de ${NM.num(completo)} no completo`],
      ['Economia', NM.pct(1 - n / completo, 1), `${NM.num(completo - n)} jogos a menos`],
      ['Custo total', NM.brl(custo), `${NM.brl(v)} por jogo`],
      ['Garantia', `${r === 3 ? 'Terno' : 'Duque'} se ${M}`, `cobertura ${NM.pct(i.cobertura ?? 1, 1)}`],
      ['Retorno esperado', NM.brl(ev), NM.signed((ev / custo - 1) * 100, 1, '%') + ' sobre o custo'],
    ]);
    render(jogos, m.tipo === 'grupo' ? (g) => NM.pad(g, 2) : (d) => NM.pad(d, 2));
  }

  async function gerarReduzido() {
    const m = st.modo;
    const sel = [...st.sel].sort(NM.ordDz);
    if (sel.length <= m.r) { calc(); return; }
    const M = Math.min(st.mGar, sel.length);
    $('#prog').hidden = false; $('#gerar-red').disabled = true;
    const bar = $('#prog').firstChild;
    try {
      const r = await NM.pro({ cmd: st.red === 'otim' ? 'otimizar' : 'cobrir', v: sel.length, k: m.r, t: m.r, m: M, maxJogos: 50000, tempo: st.tempo, seed: Date.now() % 100000 },
        (p) => { bar.style.width = (p.f * 100).toFixed(1) + '%'; $('#prog-txt').textContent = `${p.jogos || 0} jogos${p.tentativas ? ` · ${p.tentativas} tentativas` : ''}`; });
      st.redJogos = r.jogos.map((j) => j.map((i) => sel[i]).sort(NM.ordDz));
      st.redInfo = { tentativas: r.tentativas, cobertura: r.cobertura };
      st.redSig = `${m.id}|${sel.join(',')}|${st.mGar}`;
    } catch (e) {
      $('#prog-txt').textContent = e.message === 'cancelado' ? 'Cancelado.' : `Não foi possível: ${e.message}`;
    }
    $('#prog').hidden = true; $('#gerar-red').disabled = false; bar.style.width = 0;
    calc();
  }

  function kpis5(total, custo, premioJogo, pAlgum, ev, custoTotal) {
    kpis([
      ['Jogos', NM.num(total), 'combinações geradas'],
      ['Custo total', NM.brl(custo), `${NM.brl(st.valor)} por jogo`],
      ['Prêmio por jogo', NM.brl(premioJogo), 'por combinação premiada'],
      ['Chance de prêmio', pAlgum ? NM.pct(pAlgum, pAlgum < 0.01 ? 3 : 2) : '—', pAlgum ? NM.umEm(pAlgum) : ''],
      ['Retorno esperado', custoTotal ? NM.brl(ev) : '—', custoTotal ? `${NM.signed((ev / custoTotal - 1) * 100, 1, '%')} sobre o custo` : '', ''],
    ]);
  }

  function calcMilhar(cot, v) {
    const [nomeSub, len, id] = st.modo.subs[st.sub];
    const entradas = (st.milhares || '').split(/[\s,;]+/).map((x) => x.replace(/\D/g, '')).filter((x) => x.length >= len).map((x) => x.slice(-4));
    const blocos = entradas.map((mil) => {
      const base = id === 'centena' ? mil.slice(-3) : mil;
      const ps = NM.perms(base);
      return { mil, ps };
    });
    const jogos = blocos.flatMap((b) => b.ps.map((p) => p));
    const custo = blocos.length * v;
    const rows = blocos.map((b) => {
      const vp = v / b.ps.length;
      const premio = id === 'mc' ? (NM.cot('milhar') * vp + NM.cot('centena') * vp) / 2 : cot * vp;
      const p = b.ps.length / (id === 'centena' ? 1000 : 10000);
      return { cells: [b.mil, b.ps.length, NM.brl(vp), NM.brl(premio), NM.pct(p, 3), NM.umEm(p)] };
    });
    cenarios(rows, ['Entrada', 'Permutações', 'Valor por perm.', 'Prêmio se acertar', 'Chance (cabeça)', '1 em']);
    $('#cen-meta').textContent = `${nomeSub} · valor dividido entre as permutações`;
    const ev = blocos.reduce((s, b) => s + (id === 'mc' ? NM.ev('mc') : cot * (id === 'centena' ? 1e-3 : 1e-4)) * v, 0);
    kpis([
      ['Entradas', blocos.length, nomeSub],
      ['Permutações', NM.num(jogos.length), 'jogos combinados'],
      ['Custo total', NM.brl(custo), `${NM.brl(v)} por entrada`],
      ['Retorno esperado', NM.brl(ev), 'na cabeça'],
    ]);
    render(jogos, (x) => x, '');
  }

  function calcLotinho(cot, v, sel) {
    const t = st.modo.subs[st.sub][1];
    const N = sel.length;
    const d = NM.distDistintos(N, 100, 5);
    const pGar = d.slice(t).reduce((a, b) => a + b, 0);
    const rows = d.map((p, x) => ({ cells: [`${x} de 5`, NM.pct(p, p < 0.001 ? 4 : 2), x >= t ? (N === 20 || st.cobertura === 1 ? 'Garantido' : 'Provável') : '—'], hl: x >= t }));
    cenarios(rows, ['Dezenas sorteadas (1º–5º) no seu conjunto', 'Probabilidade', `Prêmio de ${st.modo.subs[st.sub][0]}`]);
    $('#cen-meta').textContent = `${N} dezenas no conjunto · jogos de 20`;
    if (N === 20 && !st.jogos.length) { st.cobertura = 1; render([sel], (x) => NM.pad(x, 2), ' '); }
    const n = st.jogos.length || (N === 20 ? 1 : 0);
    const custo = n * v;
    kpis([
      ['Dezenas', N, N > 20 ? 'fechamento em jogos de 20' : 'jogo simples'],
      ['Jogos', n || '—', n ? `cobertura ${NM.pct(st.cobertura ?? 1, 1)}` : 'clique em Calcular'],
      ['Custo total', n ? NM.brl(custo) : '—', `${NM.brl(v)} por jogo`],
      ['Prêmio', NM.brl(cot * v), 'por jogo premiado'],
      ['Chance (≥' + t + ' no conjunto)', NM.pct(pGar, 2), NM.umEm(pGar)],
    ]);
    if (N < 20 && !st.jogos.length) $('#jogos').innerHTML = '<p class="empty">Selecione pelo menos 20 dezenas</p>';
    else if (N > 20 && !st.jogos.length) $('#jogos').innerHTML = `<p class="empty">Clique em “Calcular fechamento” para gerar os jogos de 20 dezenas com garantia de ${t} acertos</p>`;
  }

  async function gerarLotinho() {
    const t = st.modo.subs[st.sub][1];
    const sel = [...st.sel].sort(NM.ordDz);
    if (sel.length <= 20) { st.jogos = []; calc(); return; }
    if (sel.length > 50) { $('#jogos').innerHTML = '<p class="empty">Use no máximo 50 dezenas no fechamento</p>'; return; }
    const prog = $('#prog'); prog.hidden = false;
    $('#gerar-lt').disabled = true;
    const r = await NM.cobrir({ pool: sel, k: 20, t, maxJogos: st.maxJogos, onProgress: (p) => (prog.firstChild.style.width = (p.cobertura * 100).toFixed(1) + '%') });
    prog.hidden = true; $('#gerar-lt').disabled = false;
    st.cobertura = r.cobertura;
    calc();
    render(r.jogos.map((j) => j.slice().sort(NM.ordDz)), (x) => NM.pad(x, 2), ' ');
    calc();
  }

  NM.onReady(() => {
    st.modo = modoFromHash();
    try { const m = sessionStorage.getItem('nm-milhares'); if (m && st.modo.id === 'mm') { st.milhares = m; sessionStorage.removeItem('nm-milhares'); } } catch (e) {}
    tabs(); form(); calc();
    $('#copiar').addEventListener('click', (e) => st.texto && NM.copiar(e.target, `Na Mosca · ${st.modo.nome}\n${st.texto}`));
    $('#salvar').addEventListener('click', (e) => {
      const m = st.modo;
      if (!st.jogos.length || !m.r || m.passe || m.quina) { e.target.textContent = 'Indisponível aqui'; setTimeout(() => (e.target.textContent = 'Salvar'), 1500); return; }
      const nome = prompt('Nome para este fechamento:', `${m.nome} · ${st.jogos.length} jogos`); if (nome == null) return;
      NM.meusJogos.salvar({ nome, jogo: m.tipo === 'grupo' ? 'grupos' : 'bicho', tipo: m.id, k: m.r, t: m.r, tier: m.r, cot: NM.cot(cotId()), valor: st.valor, jogos: st.jogos });
      e.target.textContent = 'Salvo ✓'; setTimeout(() => (e.target.textContent = 'Salvar'), 1500);
    });
    $('#backtest').addEventListener('click', async () => {
      const m = st.modo;
      if (!st.jogos.length || !m.r || m.passe || m.quina || (m.janelas && m.janelas[st.janela][1] !== 5)) { $('#bt').innerHTML = '<p class="note">Backtest disponível para terno/dupla de grupo e terno/duque de dezena (1º ao 5º).</p>'; return; }
      $('#bt').innerHTML = '<p class="note">Testando…</p>';
      const s = (await NM.sorteiosReais(m.tipo === 'grupo' ? 'grupos' : 'bicho', 365)).sort((a, b) => a.data.localeCompare(b.data));
      $('#bt').innerHTML = NM.backtestHTML(NM.backtest(st.jogos, s, { tier: m.r, cot: NM.cot(cotId()), valor: st.valor }));
    });
    $('#txt').addEventListener('click', () => st.texto && NM.baixarTxt(`fechamento-${st.modo.id}.txt`, `Na Mosca · ${st.modo.nome}\n${st.texto}\n`));
  });
})();
