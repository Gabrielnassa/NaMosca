(function () {
  const { $, $$ } = NM;
  let banca = NM.getBanca();
  let res = [];
  let filtro = 'hoje';

  const datas = () => [...new Set(res.map((e) => e.data))];

  function render() {
    const ds = datas();
    const ultimo = ds[ds.length - 1];
    let list, titulo = '';
    if (filtro === 'hoje') list = res.filter((e) => e.data === ultimo);
    else if (filtro === 'ontem') list = res.filter((e) => e.data === ds[ds.length - 2]);
    else if (filtro === '7') list = res.filter((e) => ds.slice(-7).includes(e.data));
    else list = res.filter((e) => e.data === filtro);
    list = list.slice().reverse();
    if (filtro === 'hoje' && ultimo !== NM.isoDate(new Date())) titulo = `<p class="note">Ainda não há resultados hoje. Mostrando ${NM.fmtDate(ultimo)}.</p>`;
    let html = titulo, dia = '';
    list.forEach((e) => {
      if (filtro === '7' && e.data !== dia) { dia = e.data; html += `<h2 style="margin:8px 0 0">${NM.DIAS[new Date(e.data + 'T12:00').getDay()]}, ${NM.fmtDate(e.data)}</h2>`; }
      html += NM.extracaoCard(e);
    });
    $('#lista').innerHTML = list.length ? html : '<div class="card empty">Sem extrações nesta data para esta banca.</div>';
  }

  function setFiltro(f) {
    filtro = f;
    $$('#pills > *').forEach((b) => b.classList.toggle('on', b.dataset.f === f || (b.id === 'cal-lbl' && !['hoje', 'ontem', '7'].includes(f))));
    render();
  }

  function load() {
    res = NM.loadResults(banca, 180);
    const ds = datas();
    $('#data').min = ds[0];
    $('#data').max = ds[ds.length - 1];
    render();
    busca();
  }

  function busca() {
    const q = $('#busca').value.replace(/\D/g, '');
    if (q.length < 2) { $('#busca-res').innerHTML = ''; return; }
    const hits = [];
    for (let i = res.length - 1; i >= 0 && hits.length < 30; i--) {
      res[i].premios.slice(0, 5).forEach((p) => { if (p.milhar.endsWith(q)) hits.push({ e: res[i], p }); });
    }
    const g = NM.grupoDaDezena(Number(q.slice(-2)));
    $('#busca-res').innerHTML = `<div class="card" style="margin-bottom:16px">
      <header><h3>Onde saiu “${q}” (1º ao 5º)</h3><span>${NM.chip(g)}</span></header>
      ${hits.length ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>Data</th><th>Extração</th><th>Prêmio</th><th class="n">Milhar</th></tr></thead><tbody>
      ${hits.map(({ e, p }) => `<tr><td>${NM.fmtDate(e.data)}</td><td>${NM.esc(e.extracaoNome)}</td><td>${p.posicao}º</td><td class="n"><b>${p.milhar}</b></td></tr>`).join('')}
      </tbody></table></div>` : '<p class="empty">Nenhuma ocorrência nos últimos 180 dias.</p>'}</div>`;
  }

  NM.onReady(() => {
    NM.bancaSelect($('#banca-bar'), (id) => { banca = id; load(); });
    $$('#pills button').forEach((b) => b.addEventListener('click', () => setFiltro(b.dataset.f)));
    $('#data').addEventListener('change', (e) => e.target.value && setFiltro(e.target.value));
    $('#busca').addEventListener('input', busca);
    load();
  });
})();
