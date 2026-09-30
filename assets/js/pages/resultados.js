(function () {
  const { $ } = NM;
  let banca = NM.getBanca();
  let res = [];

  function datas() { return [...new Set(res.map((e) => e.data))]; }

  function render() {
    const d = $('#data').value;
    const list = res.filter((e) => e.data === d);
    $('#lista').innerHTML = list.length
      ? list.map((e) => NM.extracaoCard(e)).join('')
      : `<p class="empty">Sem extrações para ${NM.fmtDate(d)} nesta banca.</p>`;
    const ds = datas();
    $('#prev').disabled = d <= ds[0];
    $('#next').disabled = d >= ds[ds.length - 1];
  }

  function load() {
    res = NM.loadResults(banca, 180);
    const ds = datas();
    $('#data').min = ds[0];
    $('#data').max = ds[ds.length - 1];
    if (!$('#data').value || $('#data').value > ds[ds.length - 1]) $('#data').value = ds[ds.length - 1];
    render();
    busca();
  }

  function shift(n) {
    const ds = datas();
    const i = ds.indexOf($('#data').value);
    const j = Math.min(ds.length - 1, Math.max(0, (i < 0 ? ds.length - 1 : i) + n));
    $('#data').value = ds[j];
    render();
  }

  function busca() {
    const q = $('#busca').value.replace(/\D/g, '');
    if (q.length < 2) { $('#busca-res').innerHTML = ''; return; }
    const hits = [];
    for (let i = res.length - 1; i >= 0 && hits.length < 30; i--) {
      res[i].premios.slice(0, 5).forEach((p) => { if (p.milhar.endsWith(q)) hits.push({ e: res[i], p }); });
    }
    const g = NM.bicho(NM.grupoDaDezena(Number(q.slice(-2))));
    $('#busca-res').innerHTML = `<div class="card" style="margin-bottom:16px">
      <header><h3>Ocorrências de “${q}” (1º ao 5º)</h3><span>${NM.chip(g.grupo)}</span></header>
      ${hits.length ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>Data</th><th>Extração</th><th>Prêmio</th><th>Milhar</th></tr></thead><tbody>
      ${hits.map(({ e, p }) => `<tr><td>${NM.fmtDate(e.data)}</td><td>${e.extracaoNome}</td><td>${p.posicao}º</td><td class="mono"><b>${p.milhar}</b></td></tr>`).join('')}
      </tbody></table></div>` : '<p class="empty">Nenhuma ocorrência nos últimos 180 dias.</p>'}</div>`;
  }

  document.addEventListener('DOMContentLoaded', () => {
    NM.bancaSelect($('#banca-bar'), (id) => { banca = id; load(); });
    $('#data').addEventListener('change', render);
    $('#prev').addEventListener('click', () => shift(-1));
    $('#next').addEventListener('click', () => shift(1));
    $('#busca').addEventListener('input', busca);
    load();
  });
})();
