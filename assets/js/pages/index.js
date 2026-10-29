(function () {
  const { $, $$ } = NM;

  const TOOLS = [
    ['fechamento-pro.html', 'grid', 'Fechamento PRO', 'Desdobramento, fechamento com garantia e otimizador para bicho, Quininha e Seninha.'],
    ['fechamento.html', 'grid', 'Fechamento do bicho', 'Terno, dupla, dezenas, quina de grupo, passe e lotinho com custo e chance.'],
    ['quininha.html', 'ticket', 'Quininha', '13 a 45 dezenas na Quina, com fechamento e conferência.'],
    ['seninha.html', 'ticket', 'Seninha', '14 a 40 dezenas na Mega-Sena, com fechamento e conferência.'],
    ['conferidor.html', 'check', 'Conferidor', 'Confira seu jogo em qualquer extração.'],
    ['gerador.html', 'dice', 'Gerador de palpites', 'Palpites por frequência, atraso e puxada.'],
  ];

  function sorteios() {
    const todos = ['rj', 'sp', 'fed'].flatMap((b) => NM.loadResults(b, 4));
    const hoje = NM.isoDate(new Date());
    $('#hoje-txt').textContent = `Hoje · ${NM.DIAS[new Date().getDay()]}, ${NM.fmtDate(hoje)}`;
    const vivas = NM.BANCAS.filter((b) => NM.isLive(b.id));
    const atual = vivas.map((b) => NM.fonte(b.id) && NM.fonte(b.id).atualizado).filter(Boolean).sort().pop();
    $('#hero-meta').innerHTML = [
      `<span><b>${NM.SORTEIOS.length}</b> sorteios na grade</span>`,
      `<span><b>${NM.BANCAS.length}</b> bancas · ${NM.BANCAS.map((b) => b.sigla).join(' · ')}</span>`,
      `<span><b>2</b> fontes conferidas</span>`,
      atual ? `<span>Atualizado <b>${new Date(atual).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}</b></span>` : '<span>Modo <b>demonstração</b></span>',
    ].join('');
    NM.grade($('#grade'), hoje, { link: (id) => `resultados.html?s=${id}` });
    const ult = todos.sort((a, b) => (b.data + b.hora).localeCompare(a.data + a.hora)).slice(0, 4);
    $('#ultimos').innerHTML = ult.map((e) => NM.extracaoCard(e)).join('');
    proximos(ult);
  }

  // painel da abertura: os próximos sorteios do bicho e o último resultado que saiu
  function proximos(todos) {
    const agora = new Date(), mins = agora.getHours() * 60 + agora.getMinutes();
    const m = (s) => { const [h, mm] = s.hora.split(':').map(Number); return h * 60 + mm; };
    const doDia = (dow) => NM.SORTEIOS.filter((s) => s.tipo === 'bicho' && s.status !== 'novo' && s.dias.includes(dow));
    let lista = doDia(agora.getDay()).filter((s) => m(s) > mins), amanha = false;
    if (!lista.length) { lista = doDia((agora.getDay() + 1) % 7); amanha = true; }
    $('#next-dia').textContent = amanha ? 'amanhã' : 'hoje';
    $('#next-list').innerHTML = lista.slice(0, 5).map((s) => {
      const f = m(s) - mins;
      const em = amanha ? NM.banca(s.banca).sigla : f < 60 ? `em ${f} min` : `em ${Math.floor(f / 60)}h${NM.pad(f % 60, 2)}`;
      return `<li><a href="resultados.html?s=${s.id}"><span class="cod">${s.id}</span><span class="nm">${NM.esc(s.nome)}</span><span class="hr">${s.hora.replace(':', 'h')}</span><span class="em">${em}</span></a></li>`;
    }).join('');
    const u = todos[0];
    $('#next-last').innerHTML = u ? `Último resultado · <b>${u.extracao}</b> ${u.hora.replace(':', 'h')} · <b>${u.premios[0].milhar}</b> ${NM.bicho(u.premios[0].grupo).nome}` : '';
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

  function render(id) { destaques(id); }

  NM.onReady(() => {
    NM.bancaSelect($('#banca-bar'), render);
    $('#legenda').innerHTML = NM.gradeLegenda;
    sorteios();
    render(NM.getBanca());
    $('#tools').innerHTML = TOOLS.map(([href, ic, t, d]) => `<a class="card shortcut" href="${href}"><span class="ic">${NM.icon(ic)}</span><div><h3>${t}</h3><p class="muted small" style="margin:0">${d}</p></div></a>`).join('');
    $('#news').innerHTML = NM.ARTIGOS.slice(0, 4).map((a) => `<li><time>${NM.fmtDateCurta(a.data)}</time><div><a href="analises.html?id=${a.id}">${a.titulo}</a><p>${a.resumo}</p></div></li>`).join('');
  });
})();
