(function () {
  const { $, $$ } = NM;
  let filtro = 'hoje';

  const TOOLS = [
    ['fechamento.html', 'grid', 'Fechamento do bicho', 'Terno, dupla, dezenas, quina de grupo, passe e lotinho com custo e chance.'],
    ['quininha.html', 'ticket', 'Quininha', '13 a 45 dezenas na Quina, com fechamento e conferência.'],
    ['seninha.html', 'ticket', 'Seninha', '14 a 40 dezenas na Mega-Sena, com fechamento e conferência.'],
    ['conferidor.html', 'check', 'Conferidor', 'Confira seu jogo em qualquer extração.'],
    ['gerador.html', 'dice', 'Gerador de palpites', 'Palpites por frequência, atraso e puxada.'],
    ['tabela.html', 'book', 'Cotações', 'Quanto paga cada modalidade e a chance real.'],
  ];

  function resultados(bancaId) {
    const res = NM.loadResults(bancaId, 4);
    const ds = [...new Set(res.map((e) => e.data))];
    const dia = filtro === 'hoje' ? ds[ds.length - 1] : ds[ds.length - 2];
    const list = res.filter((e) => e.data === dia).reverse().slice(0, 4);
    $('#res-title').textContent = filtro === 'hoje' ? (dia === NM.isoDate(new Date()) ? 'Resultados de hoje' : `Últimos resultados · ${NM.fmtDate(dia)}`) : `Resultados de ${NM.fmtDate(dia || '')}`;
    $('#ultimos').innerHTML = list.length ? list.map((e) => NM.extracaoCard(e)).join('') : '<div class="card empty">Sem resultados.</div>';
  }

  function destaques(bancaId) {
    const res = NM.loadResults(bancaId, 180);
    if (!res.length) return;
    const last = res[res.length - 1];
    const stAll = NM.stats(res, { ate: 1 });
    const r60 = res.filter((e) => e.data >= NM.isoDate(new Date(Date.now() - 60 * 864e5)));
    const st60 = NM.stats(r60, { ate: 1 });
    const quente = [...st60.grupos].sort((a, c) => c.freq - a.freq)[0];
    const atras = [...stAll.grupos].sort((a, c) => c.atraso - a.atraso)[0];
    const pux = NM.puxada(stAll, last.premios[0].grupo, 1)[0];
    $('#kpis').innerHTML = [
      ['Mais frequente (60 dias)', quente.nome, `${quente.freq} vezes na cabeça`],
      ['Mais atrasado', atras.nome, `${atras.atraso} extrações sem sair`],
      [`Depois de ${NM.bicho(last.premios[0].grupo).nome}`, pux ? NM.bicho(pux.g).nome : '—', pux ? `veio em ${NM.pct(pux.pct)} das vezes` : ''],
      ['Base analisada', NM.num(res.length), `extrações desde ${NM.fmtDate(res[0].data)}`],
    ].map(([l, v, sub]) => `<div class="kpi"><div class="label">${l}</div><div class="value">${v}</div><div class="sub">${sub}</div></div>`).join('');

    NM.barChart($('#freq-chart'), st60.grupos.map((g) => ({
      label: NM.pad(g.grupo, 2), value: g.freq, highlight: g.freq > g.esperado,
      tip: `<b>${NM.pad(g.grupo, 2)} ${g.nome}</b><br>${g.freq} vezes · média ${NM.num(g.esperado, 1)}`,
    })), { ref: st60.grupos[0].esperado, refLabel: 'média' });
    NM.hbars($('#atrasos'), [...stAll.grupos].sort((a, c) => c.atraso - a.atraso).slice(0, 8).map((g) => ({
      label: `${NM.pad(g.grupo, 2)} ${g.nome}`, value: g.atraso, highlight: g.atraso > 2 * g.mediaAtraso,
      tip: `Atraso ${g.atraso} · média ${NM.num(g.mediaAtraso, 1)} · recorde ${g.maxAtraso}`,
    })));
  }

  function render(id) { resultados(id); destaques(id); }

  NM.onReady(() => {
    NM.bancaSelect($('#banca-bar'), render);
    $$('#pills button[data-f]').forEach((b) => b.addEventListener('click', () => {
      filtro = b.dataset.f;
      $$('#pills button[data-f]').forEach((x) => x.classList.toggle('on', x === b));
      resultados(NM.getBanca());
    }));
    render(NM.getBanca());
    $('#tools').innerHTML = TOOLS.map(([href, ic, t, d]) => `<a class="card shortcut" href="${href}"><span class="ic">${NM.icon(ic)}</span><div><h3>${t}</h3><p class="muted small" style="margin:0">${d}</p></div></a>`).join('');
    $('#news').innerHTML = NM.ARTIGOS.slice(0, 4).map((a) => `<li><time>${NM.fmtDateCurta(a.data)}</time><div><a href="analises.html?id=${a.id}">${a.titulo}</a><p>${a.resumo}</p></div></li>`).join('');
  });
})();
