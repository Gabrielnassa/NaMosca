(function () {
  const { $ } = NM;

  const TOOLS = [
    ['fechamento.html', 'FCH', 'Fechamento do bicho', 'Terno e dupla de grupo, terno/duque de dezena, quina de grupo, passe, lotinho e milhar combinada — com custo, cenários e retorno esperado.'],
    ['quininha.html', 'QNH', 'Quininha', '13 a 45 dezenas sobre a Quina. Calculadora, fechamento com garantia e conferência com o concurso.'],
    ['seninha.html', 'SNH', 'Seninha', '14 a 40 dezenas sobre a Mega-Sena. Calculadora, fechamento com garantia e conferência.'],
    ['gerador.html', 'GER', 'Gerador de palpites', 'Palpites por frequência, atraso, vencimento ou puxada, com bichos fixos e excluídos.'],
    ['conferidor.html', 'CNF', 'Conferidor', 'Confira grupo, dezena, centena, milhar, duque e terno contra qualquer extração.'],
    ['estatisticas.html', 'EST', 'Estatísticas', 'Frequência, atraso médio e recorde, mapa de calor por dia, dezenas e dígitos.'],
  ];

  function render(bancaId) {
    const banca = NM.banca(bancaId);
    const res = NM.loadResults(bancaId, 180);
    const last = res[res.length - 1];
    $('#ph-eyebrow').innerHTML = `Painel · ${NM.esc(banca.nome)} · ${NM.statusTag(bancaId)}`;
    if (!last) return;
    const cab = last.premios[0];
    const b = NM.bicho(cab.grupo);

    // KPIs
    const stAll = NM.stats(res, { ate: 1 });
    const r60 = res.filter((e) => e.data >= NM.isoDate(new Date(Date.now() - 60 * 864e5)));
    const st60 = NM.stats(r60, { ate: 1 });
    const quente = [...st60.grupos].sort((a, c) => c.freq - a.freq)[0];
    const atras = [...stAll.grupos].sort((a, c) => c.atraso - a.atraso)[0];
    const pux = NM.puxada(stAll, cab.grupo, 1)[0];
    const hoje = res.filter((e) => e.data === last.data);
    $('#kpis').innerHTML = [
      ['Último 1º prêmio', `<span class="acc">${cab.milhar}</span>`, `G${NM.pad(b.grupo, 2)} ${b.nome} · ${NM.esc(last.extracaoNome)}`],
      ['Mais frequente · 60d', `${NM.pad(quente.grupo, 2)} ${quente.nome}`, `${quente.freq}× · esperado ${NM.num(quente.esperado, 1)}`],
      ['Maior atraso', `${NM.pad(atras.grupo, 2)} ${atras.nome}`, `${atras.atraso} extr. · recorde ${atras.maxAtraso}`],
      [`Após ${b.nome}`, pux ? `${NM.pad(pux.g, 2)} ${NM.bicho(pux.g).nome}` : '—', pux ? `${NM.pct(pux.pct)} das vezes na seguinte` : ''],
      ['Base analisada', NM.num(res.length), `extrações · desde ${NM.fmtDate(res[0].data)}`],
    ].map(([l, v, s]) => `<div class="kpi"><div class="label">${l}</div><div class="value">${v}</div><div class="sub">${s}</div></div>`).join('');

    // Último resultado
    $('#last').innerHTML = `<header><h3>Último resultado</h3><span class="muted small">${NM.fmtDate(last.data)} ${last.hora}</span></header>
      <div style="display:flex;align-items:baseline;gap:14px;flex-wrap:wrap">
        <div class="mono acc" style="font-size:3rem;font-weight:700;letter-spacing:.06em;line-height:1">${cab.milhar}</div>
        <div><div class="mono" style="font-size:1.05rem">G${NM.pad(b.grupo, 2)} · ${b.nome.toUpperCase()}</div><div class="note">${NM.esc(last.extracaoNome)} · dezenas ${b.dezenas.join(' ')}</div></div>
      </div>
      <table class="res-table" style="margin-top:10px">${last.premios.slice(1, 7).map((p) => `<tr><td class="pos">${p.posicao}º</td><td class="milhar">${p.milhar}</td><td>${p.milhar.length === 4 ? `<span class="gnum">${NM.pad(p.grupo, 2)}</span><span class="gname">${NM.bicho(p.grupo).nome}</span>` : ''}</td></tr>`).join('')}</table>`;

    // Hoje (todas as extrações do último dia)
    $('#hoje-meta').textContent = NM.fmtDate(last.data);
    $('#hoje').innerHTML = `<thead><tr><th>Extração</th><th class="n">1º</th><th>Grupo</th></tr></thead><tbody>${hoje.slice().reverse().map((e) =>
      `<tr><td class="mono">${NM.esc(e.extracaoNome)}</td><td class="n acc">${e.premios[0].milhar}</td><td>${NM.chip(e.premios[0].grupo)}</td></tr>`).join('')}</tbody>`;

    // Movers
    const t = NM.tendencia(res, 30, 1).sort((a, c) => c.delta - a.delta);
    const mv = (list) => `<thead><tr><th>Grupo</th><th class="n">30 extr.</th><th class="n">180d</th><th class="n">Var. p.p.</th></tr></thead><tbody>${list.map((x) =>
      `<tr><td>${NM.chip(x.grupo)}</td><td class="n">${NM.pct(x.recente)}</td><td class="n">${NM.pct(x.historico)}</td><td class="n">${NM.signed(x.delta * 100, 1)}</td></tr>`).join('')}</tbody>`;
    $('#altas').innerHTML = mv(t.slice(0, 6));
    $('#baixas').innerHTML = mv(t.slice(-6).reverse());
    $('#atrasos').innerHTML = `<thead><tr><th>Grupo</th><th class="n">Atual</th><th class="n">Média</th><th class="n">Recorde</th></tr></thead><tbody>${[...stAll.grupos].sort((a, c) => c.atraso - a.atraso).slice(0, 6).map((g) =>
      `<tr><td>${NM.chip(g.grupo, g.atraso > 2 * g.mediaAtraso ? 'cold' : '')}</td><td class="n${g.atraso > 2 * g.mediaAtraso ? ' down' : ''}">${g.atraso}</td><td class="n">${NM.num(g.mediaAtraso, 1)}</td><td class="n">${g.maxAtraso}</td></tr>`).join('')}</tbody>`;

    NM.barChart($('#freq-chart'), st60.grupos.map((g) => ({
      label: NM.pad(g.grupo, 2), value: g.freq, highlight: g.freq > g.esperado,
      tip: `<b>G${NM.pad(g.grupo, 2)} ${g.nome}</b><br>${g.freq}× · esperado ${NM.num(g.esperado, 1)}`,
    })), { ref: st60.grupos[0]?.esperado, refLabel: 'esperado' });
  }

  function board() {
    $('#board').innerHTML = `<thead><tr><th>Banca</th><th>Extração</th><th class="n">1º</th><th>Grupo</th><th class="n">Δ dia</th><th></th></tr></thead><tbody>${NM.BANCAS.map((b) => {
      const r = NM.loadResults(b.id, 3);
      const e = r[r.length - 1];
      if (!e) return '';
      const nDia = r.filter((x) => x.data === e.data).length;
      return `<tr${b.id === NM.getBanca() ? ' class="hl"' : ''}><td class="mono"><b>${b.sigla}</b></td><td class="mono small">${NM.esc(e.extracaoNome)}<span class="muted"> ${NM.fmtDateCurta(e.data)}</span></td>
        <td class="n acc">${e.premios[0].milhar}</td><td>${NM.chip(e.premios[0].grupo)}</td><td class="n muted">${nDia}</td><td>${NM.statusTag(b.id)}</td></tr>`;
    }).join('')}</tbody>`;
  }

  function evTable() {
    const ids = ['grupo', 'dezena', 'centena', 'milhar', 'duque-gp', 'terno-gp', 'duque-dz', 'terno-dz', 'passe', 'lt3'];
    $('#ev').innerHTML = `<thead><tr><th>Mod.</th><th class="n">Paga</th><th class="n">Chance</th><th class="n">Retorno / R$100</th></tr></thead><tbody>${ids.map((id) => {
      const m = NM.mod(id), ev = NM.ev(id);
      return `<tr><td><span class="gtag">${m.sig}</span> ${m.nome}</td><td class="n">${NM.num(NM.cot(id), NM.cot(id) % 1 ? 1 : 0)}×</td><td class="n">${NM.umEm(m.prob)}</td>
        <td class="n ${ev >= 0.5 ? '' : 'down'}">${NM.brl(ev * 100)}</td></tr>`;
    }).join('')}</tbody>`;
  }

  NM.onReady(() => {
    NM.bancaSelect($('#banca-bar'), (id) => { render(id); board(); });
    render(NM.getBanca());
    board();
    evTable();
    $('#tools').innerHTML = TOOLS.map(([href, code, t, d]) => `<a class="card" href="${href}"><div class="eyebrow" style="margin:0 0 4px">${code}</div><h3 style="margin-bottom:4px">${t}</h3><p class="muted small" style="margin:0">${d}</p></a>`).join('');
    $('#news').innerHTML = NM.ARTIGOS.slice(0, 5).map((a) => `<li><time>${NM.fmtDateCurta(a.data)}</time><div><a href="analises.html?id=${a.id}">${a.titulo}</a><p>${a.resumo}</p></div></li>`).join('');
  });
})();
