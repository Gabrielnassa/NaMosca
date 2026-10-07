(function () {
  const { $, $$ } = NM;
  const st = { dia: null, sel: null };

  const todos = () => ['rj', 'sp', 'fed'].flatMap((b) => NM.loadResults(b, 180));
  const ultimoDia = () => todos().reduce((m, e) => (e.data > m ? e.data : m), '');
  const doDia = (d) => todos().filter((e) => e.data === d).sort((a, b) => b.hora.localeCompare(a.hora));

  function render() {
    const d = st.dia;
    $('#dia-txt').textContent = `${NM.DIAS[new Date(d + 'T12:00').getDay()]}, ${NM.fmtDate(d)} · toque em um sorteio para ver o resultado`;
    const lista = doDia(d);
    if (!st.sel || !NM.sorteio(st.sel)) st.sel = lista[0] ? lista[0].extracao : 'PT';
    NM.grade($('#grade'), d, { sel: st.sel, onSelect: (id) => { st.sel = id; history.replaceState(null, '', `?s=${id}`); render(); } });
    detalhe(lista);
    $('#lista').innerHTML = lista.length ? lista.map((e) => NM.extracaoCard(e)).join('') : '<div class="card empty">Nenhum resultado neste dia.</div>';
  }

  function detalhe(lista) {
    const s = NM.sorteio(st.sel);
    const e = lista.find((x) => x.extracao === st.sel);
    let html;
    if (e) html = NM.extracaoCard(e);
    else {
      const msg = s.status === 'novo' ? 'Sorteio novo: os resultados aparecem aqui assim que começarem a ser publicados.'
        : !s.dias.includes(new Date(st.dia + 'T12:00').getDay()) ? 'Este sorteio não corre neste dia da semana.'
        : 'Resultado ainda não publicado.';
      html = `<article class="card"><header><h3>${s.hora.replace(':', 'h')} · ${NM.esc(s.nome)}</h3><span class="muted small">${NM.fmtDate(st.dia)}</span></header><p class="empty" style="margin:0">${msg}</p></article>`;
    }
    $('#detalhe').innerHTML = html;
    const hist = s.banca ? NM.loadResults(s.banca, 180).filter((x) => x.extracao === s.id).slice(-15).reverse() : [];
    $('#hist-title').textContent = `Últimos resultados · ${s.id}`;
    $('#hist').innerHTML = hist.length ? `<table class="data-table dense"><thead><tr><th>Data</th><th class="n">1º</th><th>Bicho</th><th class="n">2º</th><th class="n">3º</th></tr></thead><tbody>${hist.map((x) =>
      `<tr${x.data === st.dia ? ' class="hl"' : ''}><td>${NM.fmtDateCurta(x.data)}</td><td class="n"><b>${x.premios[0].milhar}</b></td><td>${NM.chip(x.premios[0].grupo)}</td><td class="n">${x.premios[1].milhar}</td><td class="n">${x.premios[2].milhar}</td></tr>`).join('')}</tbody></table>`
      : '<p class="empty">Sem histórico para este sorteio.</p>';
  }

  function setDia(f) {
    const ud = ultimoDia();
    if (f === 'hoje') st.dia = ud;
    else if (f === 'ontem') { const ds = [...new Set(todos().map((e) => e.data))].sort(); st.dia = ds[ds.indexOf(ud) - 1] || ud; }
    else st.dia = f;
    $$('#pills > *').forEach((b) => b.classList.toggle('on', b.dataset.f === f || (b.id === 'cal-lbl' && !['hoje', 'ontem'].includes(f))));
    render();
  }

  function busca() {
    const bruto = $('#busca').value.trim();
    const norm = (x) => x.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const bicho = /\D/.test(bruto) && bruto.length >= 3 ? NM.BICHOS.find((b) => norm(b.nome).startsWith(norm(bruto))) : null;
    if (bicho) return buscaBicho(bicho);
    const q = bruto.replace(/\D/g, '');
    if (q.length < 2) { $('#busca-res').innerHTML = ''; return; }
    const res = todos().sort((a, b) => (b.data + b.hora).localeCompare(a.data + a.hora));
    const hits = [];
    for (const e of res) { if (hits.length >= 30) break; e.premios.slice(0, 5).forEach((p) => { if (p.milhar.endsWith(q)) hits.push({ e, p }); }); }
    $('#busca-res').innerHTML = `<div class="card" style="margin-bottom:14px"><header><h3>Onde saiu “${q}” (1º ao 5º)</h3><span>${NM.chip(NM.grupoDaDezena(Number(q.slice(-2))))}</span></header>
      ${hits.length ? `<div class="table-wrap"><table class="data-table dense"><thead><tr><th>Data</th><th>Sorteio</th><th>Prêmio</th><th class="n">Milhar</th></tr></thead><tbody>${hits.map(({ e, p }) =>
        `<tr><td>${NM.fmtDate(e.data)}</td><td><b>${e.extracao}</b></td><td>${p.posicao}º</td><td class="n"><b>${p.milhar}</b></td></tr>`).join('')}</tbody></table></div>` : '<p class="empty">Nenhuma ocorrência nos últimos 180 dias.</p>'}</div>`;
  }

  function buscaBicho(b) {
    const res = todos().sort((a, c) => (c.data + c.hora).localeCompare(a.data + a.hora));
    const hits = [];
    for (const e of res) { if (hits.length >= 40) break; e.premios.slice(0, 5).forEach((p) => { if (p.grupo === b.grupo) hits.push({ e, p }); }); }
    $('#busca-res').innerHTML = `<div class="card" style="margin-bottom:14px"><header><h3>Onde saiu ${NM.chip(b.grupo)} (1º ao 5º)</h3><span class="muted small">dezenas ${b.dezenas.join(' · ')}</span></header>
      ${hits.length ? `<div class="table-wrap"><table class="data-table dense"><thead><tr><th>Data</th><th>Sorteio</th><th>Prêmio</th><th class="n">Milhar</th></tr></thead><tbody>${hits.map(({ e, p }) =>
        `<tr><td>${NM.fmtDate(e.data)}</td><td><b>${e.extracao}</b></td><td>${p.posicao}º</td><td class="n"><b>${p.milhar}</b></td></tr>`).join('')}</tbody></table></div>` : '<p class="empty">Não saiu no período.</p>'}</div>`;
  }

  NM.onReady(() => {
    st.sel = new URLSearchParams(location.search).get('s');
    $('#legenda').innerHTML = NM.gradeLegenda;
    $$('#pills button').forEach((b) => b.addEventListener('click', () => setDia(b.dataset.f)));
    $('#data').max = NM.isoDate(new Date());
    $('#data').addEventListener('change', (e) => e.target.value && setDia(e.target.value));
    $('#busca').addEventListener('input', busca);
    setDia('hoje');
    const q = new URLSearchParams(location.search).get('q');
    if (q) { $('#busca').value = q; busca(); $('#busca-res').scrollIntoView({ block: 'start' }); }
  });
})();
