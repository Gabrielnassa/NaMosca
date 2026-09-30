(function () {
  const { $ } = NM;

  function analiseDoDia(bancaId) {
    const res = NM.loadResults(bancaId, 180);
    const st = NM.stats(res, { ate: 1 });
    const st5 = NM.stats(res.slice(-60), { ate: 5 });
    const last = res[res.length - 1];
    const hoje = res.filter((e) => e.data === last.data);
    const cab = hoje.map((e) => e.premios[0].grupo);
    const repetidos = cab.filter((g, i) => cab.indexOf(g) !== i);
    const atras = [...st.grupos].sort((a, b) => b.atraso - a.atraso).slice(0, 3);
    const quentes = [...st5.grupos].sort((a, b) => b.freq - a.freq).slice(0, 3);
    const pux = NM.puxada(st, last.premios[0].grupo, 3);
    const recorde = st.grupos.filter((g) => g.atraso > 0 && g.atraso === g.maxAtraso);

    return `<article class="card" style="margin-bottom:24px">
      <div class="meta muted small"><span class="tag hot">Análise do dia</span> · ${NM.fmtDate(last.data)} · ${NM.esc(NM.banca(bancaId).nome)} · gerada automaticamente</div>
      <h2 style="margin-top:8px">O dia em ${hoje.length} extrações: ${hoje.map((e) => NM.bicho(e.premios[0].grupo).emoji).join(' ')}</h2>
      <p>A cabeça de hoje trouxe ${hoje.map((e) => `<b>${NM.bicho(e.premios[0].grupo).nome}</b> no ${e.extracaoNome}`).join(', ')}.
      ${repetidos.length ? `Destaque para a repetição de <b>${[...new Set(repetidos)].map((g) => NM.bicho(g).nome).join(' e ')}</b> no mesmo dia.` : 'Nenhum bicho se repetiu na cabeça.'}</p>
      <div class="grid g3">
        <div><h3>🔥 Quentes (1º ao 5º, últimas 60)</h3><div class="chips">${quentes.map((g) => NM.chip(g.grupo, 'hot')).join('')}</div>
          <p class="muted small">${quentes.map((g) => `${g.nome}: ${g.freq}×`).join(' · ')} — esperado ${st5.grupos[0].esperado.toFixed(0)}×.</p></div>
        <div><h3>🧊 Atrasados na cabeça</h3><div class="chips">${atras.map((g) => NM.chip(g.grupo, 'cold')).join('')}</div>
          <p class="muted small">${atras.map((g) => `${g.nome}: ${g.atraso}`).join(' · ')} extrações.
          ${recorde.length ? `${recorde.map((g) => g.nome).join(', ')} ${recorde.length > 1 ? 'estão' : 'está'} no maior atraso do período.` : ''}</p></div>
        <div><h3>🔗 Depois de ${NM.bicho(last.premios[0].grupo).nome}</h3><div class="chips">${pux.map((p) => NM.chip(p.g)).join('')}</div>
          <p class="muted small">Grupos que mais vieram na cabeça após ${NM.bicho(last.premios[0].grupo).nome} (${pux.map((p) => p.c + '×').join(', ')}).</p></div>
      </div>
      <p class="muted small" style="margin:12px 0 0">Lembre-se: resultados passados não influenciam sorteios futuros. <a href="analises.html?id=falacia-atraso">Entenda por quê.</a></p>
    </article>`;
  }

  function lista() {
    const banca = NM.getBanca();
    $('#conteudo').innerHTML = `<div class="page-head"><h1>Análises</h1>
      <p>Leituras dos dados, guias e matemática do jogo — escritas para quem gosta de entender antes de jogar.</p></div>
      <div id="dia">${analiseDoDia(banca)}</div>
      <div class="grid g3">${NM.artigoCards(NM.ARTIGOS)}</div>`;
  }

  function artigo(a) {
    document.title = `${a.titulo} — Na Mosca`;
    const outros = NM.ARTIGOS.filter((x) => x.id !== a.id).slice(0, 3);
    $('#conteudo').innerHTML = `<div class="page-head"><a href="analises.html">← Análises</a></div>
      <article class="article">
        <div class="meta muted small"><span class="tag neutral">${a.tag}</span> · ${NM.fmtDate(a.data)} · ${a.leitura} min de leitura</div>
        <h1 style="margin-top:8px">${a.titulo}</h1>
        <p style="font-size:1.08rem;color:var(--text-2)">${a.resumo}</p>
        ${a.body()}
      </article>
      <section class="section"><h2>Continue lendo</h2><div class="grid g3">${NM.artigoCards(outros)}</div></section>`;
  }

  document.addEventListener('DOMContentLoaded', () => {
    const id = new URLSearchParams(location.search).get('id');
    const a = NM.ARTIGOS.find((x) => x.id === id);
    a ? artigo(a) : lista();
  });
})();
