(function () {
  const { $, $$ } = NM;
  const sel = {}; // grupo -> 'fix' | 'exc'
  let jogos = [];

  const DESC = {
    equilibrado: 'Combina frequência recente e atraso: favorece bichos que aparecem bem e os que estão sumidos.',
    quentes: 'Dá mais peso aos bichos que mais saíram do 1º ao 5º prêmio no histórico.',
    frios: 'Dá mais peso aos bichos com maior atraso atual.',
    vencidos: 'Prioriza bichos cujo atraso atual está acima do atraso médio histórico.',
    puxada: 'Usa os bichos que mais vieram na cabeça logo depois do último resultado.',
    aleatorio: 'Todos os bichos com a mesma chance — o equivalente a um “surpresinha”.',
  };

  function picker() {
    $('#picker').innerHTML = NM.BICHOS.map((b) => `<button type="button" data-g="${b.grupo}" class="${sel[b.grupo] || ''}"
      title="${b.nome}: ${b.dezenas.join(', ')}"><b>${NM.pad(b.grupo, 2)}</b>${b.nome}</button>`).join('');
  }

  function fmtJogo(j) {
    if (j.tipo === 'grupos') {
      return `<div class="nums">${j.grupos.map((g) => NM.pad(g, 2)).join(' - ')}</div><div class="small">${j.grupos.map((g) => NM.pad(g, 2) + ' ' + NM.bicho(g).nome).join(', ')}</div>`;
    }
    return `<div class="nums">${j.numeros.join(' - ')}</div><div class="small">${[...new Set(j.grupos)].map((g) => NM.pad(g, 2) + ' ' + NM.bicho(g).nome).join(', ')}</div>`;
  }
  const texto = (j) => (j.tipo === 'grupos' ? j.grupos.map((g) => NM.pad(g, 2)).join(' ') : j.numeros.join(' '));

  function gerar() {
    const modalidade = $('#modalidade').value;
    const qtd = Math.max(1, Math.min(50, Number($('#qtd').value) || 10));
    const results = NM.loadResults(NM.getBanca(), 180);
    jogos = NM.gerar({
      results, modalidade, qtd,
      estrategia: $('#estrategia').value,
      fixar: Object.keys(sel).filter((g) => sel[g] === 'fix').map(Number),
      excluir: Object.keys(sel).filter((g) => sel[g] === 'exc').map(Number),
    });
    $('#jogos').innerHTML = jogos.length
      ? `<div class="jogos">${jogos.map((j, i) => `<div class="jogo"><span class="idx">${NM.pad(i + 1, 2)}</span><div>${fmtJogo(j)}</div></div>`).join('')}</div>`
      : '<p class="empty">Não foi possível gerar jogos com esses filtros.</p>';

    const m = NM.MODALIDADES.find((x) => x.id === modalidade);
    const p = NM.PROB[modalidade];
    const alguma = 1 - Math.pow(1 - p, jogos.length);
    $('#resumo').innerHTML = `<div class="callout small" style="margin:0">
      <b>${m.nome}</b> paga <b>${NM.num(NM.cot(modalidade), NM.cot(modalidade) % 1 ? 1 : 0)}×</b>. Chance de cada jogo: ${NM.pct(p, p < 0.001 ? 3 : 2)}${jogos.length > 1 ? ` · chance de acertar ao menos um dos ${jogos.length}: <b>${NM.pct(alguma, 2)}</b>` : ''}.
      Estratégias organizam suas escolhas, mas não alteram a probabilidade do sorteio.</div>`;

    try { sessionStorage.setItem('nm-jogos', JSON.stringify({ modalidade, linhas: jogos.map(texto) })); } catch (e) {}
  }

  NM.onReady(() => {
    NM.bancaSelect($('#banca-bar'), () => {});
    picker();
    $('#estrategia-desc').textContent = DESC[$('#estrategia').value];
    $('#estrategia').addEventListener('change', (e) => ($('#estrategia-desc').textContent = DESC[e.target.value]));
    $('#picker').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-g]');
      if (!b) return;
      const g = b.dataset.g;
      sel[g] = !sel[g] ? 'fix' : sel[g] === 'fix' ? 'exc' : undefined;
      if (!sel[g]) delete sel[g];
      picker();
    });
    $('#limpar').addEventListener('click', () => { Object.keys(sel).forEach((k) => delete sel[k]); picker(); });
    $('#gerar').addEventListener('click', gerar);
    $('#copiar').addEventListener('click', async () => {
      if (!jogos.length) return;
      const txt = `Na Mosca — ${$('#modalidade').selectedOptions[0].text}\n` + jogos.map(texto).join('\n');
      try { await navigator.clipboard.writeText(txt); $('#copiar').textContent = 'Copiado!'; }
      catch (e) { $('#copiar').textContent = 'Erro ao copiar'; }
      setTimeout(() => ($('#copiar').textContent = 'Copiar'), 1500);
    });
  });
})();
