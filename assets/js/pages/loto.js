/* Quininha e Seninha: volante, calculadora, fechamento com garantia e conferência. */
(function () {
  const { $, $$ } = NM;
  const L = document.querySelector('main').dataset.loto === 'seninha' ? NM.SENINHA : NM.QUININHA;
  const S = L.sorteadas, TOT = L.total, CTOT = NM.comb(TOT, S);
  const KS = Object.keys(L.cotacoes).map(Number);
  const POOL_MAX = S === 6 ? 32 : 40;
  const st = { sel: new Set(), modo: 'unica', valor: 1, jogos: [], cobertura: null, conc: null, dados: null, freq: null };

  const p = (k) => NM.comb(k, S) / CTOT;
  const fmt = (n) => NM.pad(n, 2);

  function volante() {
    const hits = st.conc ? new Set(st.conc.dezenas) : new Set();
    $('#vol').innerHTML = Array.from({ length: TOT }, (_, i) => i + 1).map((n) =>
      `<button data-v="${n}" class="${st.sel.has(n) ? 'on' : ''}${hits.has(n) ? ' hit' : ''}">${fmt(n)}</button>`).join('');
    $('#cnt').textContent = `${st.sel.size} marcada${st.sel.size === 1 ? '' : 's'}`;
  }

  function opcoesK() {
    const N = st.sel.size;
    const ks = KS.filter((k) => k < N);
    const cur = Number($('#k').value);
    $('#k').innerHTML = ks.length ? ks.map((k) => `<option value="${k}"${k === cur ? ' selected' : ''}>${k} dezenas · ${NM.num(L.cotacoes[k])}×</option>`).join('') : '<option value="">marque mais dezenas</option>';
  }

  function analise() {
    const N = st.sel.size, v = st.valor;
    const linhas = [];
    let aviso = '';
    if (st.modo === 'unica') {
      const cot = L.cotacoes[N];
      if (!N) aviso = `Marque ${KS[0]} a ${KS[KS.length - 1]} dezenas.`;
      else if (!cot) aviso = `Não há cotação para ${N} dezenas. Quantidades aceitas: ${KS.join(', ')}. Ou use o modo Fechamento.`;
      else if (v > L.limites[N]) aviso = `Acima do limite de ${NM.brl(L.limites[N])} para ${N} dezenas.`;
      const pr = cot ? p(N) : 0;
      kpis([
        ['Dezenas', N || '—', cot ? `cotação ${NM.num(cot)}×` : 'sem cotação'],
        ['Custo', NM.brl(v), '1 jogo'],
        ['Prêmio', cot ? NM.brl(cot * v) : '—', cot ? `limite ${NM.brl(L.limites[N])}` : ''],
        ['Chance', cot ? NM.umEm(pr) : '—', cot ? NM.pct(pr, 4) : ''],
        ['Retorno esperado', cot ? NM.brl(pr * cot * v) : '—', cot ? NM.signed((pr * cot - 1) * 100, 1, '%') : ''],
      ]);
      // comparação com as quantidades vizinhas
      const viz = KS.filter((k) => Math.abs(k - (N || KS[0])) <= 5 || k === N);
      linhas.push(...viz.map((k) => [`${k} dezenas${k === N ? ' (sua aposta)' : ''}`, `${NM.num(L.cotacoes[k])}×`, NM.umEm(p(k)), NM.brl(p(k) * L.cotacoes[k] * 100), k === N]));
      $('#analise').innerHTML = tabela(['Aposta', 'Paga', 'Chance', 'Retorno / R$ 100'], linhas);
      $('#an-meta').textContent = 'comparativo por quantidade';
      if (cot && !st.jogos.length) setJogos([[...st.sel].sort((a, b) => a - b)], 1);
    } else {
      const k = Number($('#k').value);
      if (N > POOL_MAX) aviso = `Fechamento aceita até ${POOL_MAX} dezenas no conjunto.`;
      else if (!k) aviso = `Marque mais de ${KS[0]} dezenas para fechar em jogos de ${KS[0]}.`;
      const n = st.jogos.length, cot = L.cotacoes[k] || 0;
      const pPool = N >= S ? NM.comb(N, S) / CTOT : 0;
      const pFech = st.cobertura != null ? pPool * st.cobertura : 0;
      kpis([
        ['Conjunto', `${N} dez.`, k ? `jogos de ${k}` : ''],
        ['Jogos', n || '—', st.cobertura != null ? `cobertura ${NM.pct(st.cobertura, 1)}` : 'clique em Calcular'],
        ['Custo total', n ? NM.brl(n * st.valor) : '—', `${NM.brl(st.valor)} por jogo`],
        ['Chance de prêmio', n ? NM.umEm(pFech) : '—', n ? `${st.cobertura === 1 ? 'garantido se as ' + S + ' estiverem no conjunto' : 'garantia parcial'}` : ''],
        ['Retorno esperado', n && k ? NM.brl(n * st.valor * p(k) * cot) : '—', n && k ? NM.signed((p(k) * cot - 1) * 100, 1, '%') : ''],
      ]);
      if (k) {
        linhas.push([`Fechamento: ${n || '?'} jogos de ${k}`, `${NM.num(cot)}× por jogo`, n ? NM.umEm(pFech) : '—', n ? NM.brl(n * st.valor) : '—', true]);
        if (L.cotacoes[N]) linhas.push([`Aposta única com as ${N}`, `${NM.num(L.cotacoes[N])}×`, NM.umEm(p(N)), NM.brl(st.valor), false]);
        linhas.push([`1 jogo de ${k}`, `${NM.num(cot)}×`, NM.umEm(p(k)), NM.brl(st.valor), false]);
      }
      $('#analise').innerHTML = tabela(['Estratégia', 'Paga', 'Chance', 'Custo'], linhas);
      $('#an-meta').textContent = 'fechamento × aposta única';
    }
    $('#aviso').innerHTML = aviso ? `<span class="down">${aviso}</span>` : '';
  }

  function tabela(head, rows) {
    return `<table class="data-table"><thead><tr>${head.map((h, i) => `<th class="${i ? 'n' : ''}">${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r) =>
      `<tr${r[r.length - 1] === true ? ' class="hl"' : ''}>${r.slice(0, head.length).map((c, i) => `<td class="${i ? 'n' : ''}">${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  }
  function kpis(list) {
    $('#kpis').innerHTML = list.map(([l, v, s]) => `<div class="kpi"><div class="label">${l}</div><div class="value">${v}</div><div class="sub">${s || ''}</div></div>`).join('');
  }

  function setJogos(jogos, cobertura) {
    st.jogos = jogos;
    st.cobertura = cobertura;
    renderJogos();
  }
  function renderJogos() {
    if (!st.jogos.length) { $('#jogos').innerHTML = '<p class="empty">Marque as dezenas no volante</p>'; return; }
    const hits = st.conc ? new Set(st.conc.dezenas) : null;
    let premiados = 0;
    const MAX = 400;
    const html = st.jogos.map((j, i) => {
      const h = hits ? j.filter((n) => hits.has(n)).length : 0;
      if (hits && h === S) premiados++;
      if (i >= MAX) return '';
      return `<div class="jogo" style="align-items:flex-start"><span class="idx">${NM.pad(i + 1, 3)}</span><div style="flex:1"><div class="balls">${j.map((n) => `<span class="ball${hits && hits.has(n) ? ' hit' : ''}">${fmt(n)}</span>`).join('')}</div>
        ${hits ? `<div class="note" style="margin-top:4px">${h} acerto${h === 1 ? '' : 's'}${h === S ? ' · <b class="up">PREMIADO</b>' : ''}</div>` : ''}</div></div>`;
    }).join('');
    $('#jogos').innerHTML = (hits ? `<p class="mono small" style="margin:0 0 8px">Concurso ${st.conc.numero}: <b class="${premiados ? 'up' : 'muted'}">${premiados} jogo(s) premiado(s)</b></p>` : '')
      + `<div class="jogos" style="grid-template-columns:1fr">${html}</div>` + (st.jogos.length > MAX ? `<p class="note">Mostrando ${MAX} de ${st.jogos.length}.</p>` : '');
  }

  async function calcular() {
    const N = st.sel.size, k = Number($('#k').value);
    if (!k || N <= k || N > POOL_MAX) { analise(); return; }
    const pool = [...st.sel].sort((a, b) => a - b);
    $('#prog').hidden = false; $('#calc').disabled = true;
    const bar = $('#prog').firstChild;
    const r = await NM.cobrir({ pool, k, t: S, maxJogos: Math.max(1, Math.min(3000, Number($('#maxj').value) || 500)), onProgress: (x) => (bar.style.width = (x.cobertura * 100).toFixed(1) + '%') });
    $('#prog').hidden = true; $('#calc').disabled = false; bar.style.width = 0;
    setJogos(r.jogos.map((j) => j.slice().sort((a, b) => a - b)), r.cobertura);
    analise();
  }

  function changed() {
    st.jogos = []; st.cobertura = null;
    volante(); opcoesK(); analise(); renderJogos();
  }

  function concursos() {
    const d = st.dados;
    if (!d) {
      $('#concursos').innerHTML = `<p class="empty">Sem resultados da ${L.base} disponíveis (o coletor ainda não rodou)</p>`;
      $('#conc').innerHTML = '<option value="">—</option>';
      $('#ult').innerHTML = '';
      $('#freq').innerHTML = '<p class="empty">Disponível quando houver concursos carregados</p>';
      return;
    }
    const c0 = d.concursos[0];
    $('#ult').innerHTML = `<div class="muted">ÚLTIMO CONCURSO · ${L.base.toUpperCase()}</div><div style="font-size:1.05rem;margin:4px 0">${c0.numero} · ${NM.fmtDate(c0.data)}</div><div class="balls">${c0.dezenas.map((n) => `<span class="ball">${fmt(n)}</span>`).join('')}</div>`;
    $('#conc').innerHTML = '<option value="">Nenhum</option>' + d.concursos.slice(0, 60).map((c) => `<option value="${c.numero}">${c.numero} · ${NM.fmtDate(c.data)}</option>`).join('');
    $('#concursos').innerHTML = `<table class="data-table dense"><thead><tr><th>Concurso</th><th>Data</th><th>Dezenas</th></tr></thead><tbody>${d.concursos.slice(0, 60).map((c) =>
      `<tr><td class="mono">${c.numero}</td><td class="mono">${NM.fmtDate(c.data)}</td><td class="mono">${c.dezenas.map(fmt).join(' ')}</td></tr>`).join('')}</tbody></table>`;

    // frequência
    const f = new Array(TOT + 1).fill(0);
    d.concursos.forEach((c) => c.dezenas.forEach((n) => f[n]++));
    st.freq = f;
    analise(d.concursos);
    const mx = Math.max(...f), mn = Math.min(...f.slice(1));
    $('#freq-meta').textContent = `${d.concursos.length} concurso(s) · ${d.fonte}`;
    $('#freq').innerHTML = `<div class="numgrid" style="gap:1px">${f.slice(1).map((c, i) => {
      const t = (c - mn) / (mx - mn || 1);
      return `<div class="dz" style="background:color-mix(in srgb, var(--primary) ${Math.round(8 + t * 85)}%, var(--panel));color:${t > 0.55 ? '#fff' : 'var(--text)'}" data-tip="Dezena ${fmt(i + 1)} · ${c}×">${fmt(i + 1)}</div>`;
    }).join('')}</div>`;
    NM.tooltip($('#freq'));
  }

  /* Análise estilo MegaCover: atrasadas, pares/ímpares, soma, repetidas do anterior, quentes recentes */
  function analise(cs) {
    if (!cs || cs.length < 2) { $('#an2').innerHTML = '<p class="empty">Poucos concursos para analisar</p>'; return; }
    const atraso = new Array(TOT + 1).fill(cs.length);
    cs.forEach((c, i) => c.dezenas.forEach((n) => { if (atraso[n] === cs.length) atraso[n] = i; }));
    const atrasadas = [...Array(TOT).keys()].map((i) => i + 1).sort((a, b) => atraso[b] - atraso[a]).slice(0, 12);
    const pares = {}; const somas = []; let rep = 0;
    cs.forEach((c, i) => {
      const p = c.dezenas.filter((n) => n % 2 === 0).length; pares[p] = (pares[p] || 0) + 1;
      somas.push(c.dezenas.reduce((a, b) => a + b, 0));
      if (i < cs.length - 1) { const prev = new Set(cs[i + 1].dezenas); rep += c.dezenas.filter((n) => prev.has(n)).length; }
    });
    somas.sort((a, b) => a - b);
    const q = (x) => somas[Math.floor(x * (somas.length - 1))];
    const rec = new Array(TOT + 1).fill(0); cs.slice(0, 10).forEach((c) => c.dezenas.forEach((n) => rec[n]++));
    const quentes = [...Array(TOT).keys()].map((i) => i + 1).sort((a, b) => rec[b] - rec[a]).slice(0, 10);
    const ult = cs[0];
    $('#an2-meta').textContent = `${cs.length} concursos`;
    $('#an2').innerHTML = `<div class="grid g2">
      <div><div class="field"><span>Mais atrasadas (concursos sem sair)</span></div><div class="balls" style="margin-top:6px">${atrasadas.map((n) => `<span class="ball" title="${atraso[n]} concursos">${fmt(n)}</span>`).join('')}</div>
        <p class="note" style="margin:6px 0 0">${atrasadas.slice(0, 5).map((n) => `${fmt(n)}: ${atraso[n]}`).join(' · ')}</p></div>
      <div><div class="field"><span>Mais sorteadas nos últimos 10</span></div><div class="balls" style="margin-top:6px">${quentes.map((n) => `<span class="ball hit">${fmt(n)}</span>`).join('')}</div></div>
    </div>
    <div class="table-wrap" style="margin-top:14px"><table class="data-table dense"><thead><tr><th>Pares no sorteio</th>${[...Array(S + 1).keys()].map((k) => `<th class="n">${k}</th>`).join('')}</tr></thead><tbody>
      <tr><td>Concursos</td>${[...Array(S + 1).keys()].map((k) => `<td class="n">${NM.pct((pares[k] || 0) / cs.length, 0)}</td>`).join('')}</tr></tbody></table></div>
    <p class="note" style="margin:10px 0 0">Soma das dezenas: metade dos concursos fica entre <b>${q(0.25)}</b> e <b>${q(0.75)}</b> (mín. ${somas[0]}, máx. ${somas[somas.length - 1]}). Em média <b>${NM.num(rep / (cs.length - 1), 2)}</b> dezenas repetem do concurso anterior. Último (${ult.numero}): soma ${ult.dezenas.reduce((a, b) => a + b, 0)}, ${ult.dezenas.filter((n) => n % 2 === 0).length} pares.</p>`;
  }

  NM.onReady(async () => {
    $('#regra').textContent = `Escolha de ${KS[0]} a ${KS[KS.length - 1]} dezenas entre 01 e ${TOT}. Ganha quem tiver as ${S} dezenas sorteadas na ${L.base} (segunda a sábado) entre as escolhidas. Quanto mais dezenas, maior a chance e menor a cotação.`;
    volante(); opcoesK(); analise();
    $('#tabela').innerHTML = tabela(['Dezenas', 'Paga (×)', 'Aposta máx.', 'Chance', 'Retorno / R$ 100'],
      KS.map((k) => [k, NM.num(L.cotacoes[k]), NM.brl(L.limites[k]), NM.umEm(p(k)), NM.brl(p(k) * L.cotacoes[k] * 100)]));

    $('#vol').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-v]'); if (!b) return;
      const n = Number(b.dataset.v);
      if (st.sel.has(n)) st.sel.delete(n); else if (st.sel.size < 60) st.sel.add(n);
      changed();
    });
    $('#limpar').onclick = () => { st.sel.clear(); changed(); };
    $('#surpresa').onclick = () => {
      const k = st.modo === 'unica' ? (L.cotacoes[st.sel.size] ? st.sel.size : KS[0]) : Math.min(POOL_MAX, Math.max(st.sel.size, KS[0] + 4));
      st.sel = new Set();
      while (st.sel.size < k) st.sel.add(1 + Math.floor(Math.random() * TOT));
      changed();
    };
    $('#quentes').onclick = () => {
      if (!st.freq) return;
      const k = st.modo === 'unica' ? (L.cotacoes[st.sel.size] ? st.sel.size : KS[0]) : Math.min(POOL_MAX, Math.max(st.sel.size, KS[0] + 4));
      st.sel = new Set(st.freq.map((c, n) => [c, n]).slice(1).sort((a, b) => b[0] - a[0]).slice(0, k).map((x) => x[1]));
      changed();
    };
    $$('#modo button').forEach((b) => b.addEventListener('click', () => {
      $$('#modo button').forEach((x) => x.classList.toggle('on', x === b));
      st.modo = b.dataset.v;
      $('#fech-opts').hidden = st.modo !== 'fech';
      changed();
    }));
    $('#valor').addEventListener('input', (e) => { st.valor = Math.max(0, Number(e.target.value) || 0); analise(); });
    $('#k').addEventListener('change', () => { st.jogos = []; st.cobertura = null; analise(); renderJogos(); });
    $('#calc').addEventListener('click', calcular);
    $('#conc').addEventListener('change', (e) => {
      st.conc = st.dados && st.dados.concursos.find((c) => c.numero === Number(e.target.value)) || null;
      volante(); renderJogos();
    });
    const texto = () => `Na Mosca · ${L.nome}\n` + st.jogos.map((j) => j.map(fmt).join(' ')).join('\n');
    $('#copiar').onclick = (e) => st.jogos.length && NM.copiar(e.target, texto());
    $('#txt').onclick = () => st.jogos.length && NM.baixarTxt(`${L.nome.toLowerCase()}.txt`, texto() + '\n');

    st.dados = await NM.loadLoteria(L.jogo);
    concursos();
  });
})();
