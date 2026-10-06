(function () {
  const { $, $$ } = NM;
  let res = [];
  let ate = 1;
  const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

  function extracoes() {
    res = NM.loadResults(NM.getBanca(), 180);
    const recentes = res.slice(-60).reverse();
    $('#extracao').innerHTML = recentes.map((e, i) =>
      `<option value="${res.length - 1 - i}">${NM.fmtDate(e.data)} · ${e.extracaoNome} (${e.hora})</option>`).join('');
    mostraExt();
  }
  function mostraExt() {
    const e = res[Number($('#extracao').value)];
    $('#ext').innerHTML = e ? NM.extracaoCard(e) : '';
  }

  function parseGrupo(tok) {
    if (/^\d+$/.test(tok)) { const n = Number(tok); return n >= 1 && n <= 25 ? n : null; }
    const b = NM.BICHOS.find((x) => norm(x.nome) === norm(tok));
    return b ? b.grupo : null;
  }

  function conferir() {
    const mod = $('#modalidade').value;
    const e = res[Number($('#extracao').value)];
    const linhas = $('#apostas').value.split('\n').map((l) => l.trim()).filter(Boolean);
    if (!linhas.length) { $('#saida').innerHTML = '<p class="empty">Digite ao menos uma aposta.</p>'; return; }
    const efAte = mod.startsWith('duque') || mod.startsWith('terno') ? 5 : ate;
    const len = { dezena: 2, centena: 3, milhar: 4, 'duque-dz': 2, 'terno-dz': 2 }[mod];
    const tam = { 'duque-gp': 2, 'terno-gp': 3, 'duque-dz': 2, 'terno-dz': 3 }[mod] || 1;
    let ganhos = 0;

    const rows = linhas.map((l) => {
      const toks = l.split(/[\s,;\-]+/).filter(Boolean);
      let aposta, erro;
      if (mod === 'grupo' || mod.endsWith('-gp')) {
        aposta = toks.map(parseGrupo);
        if (aposta.some((x) => x == null)) erro = 'grupo inválido';
      } else {
        aposta = toks.map((t) => t.replace(/\D/g, ''));
        if (aposta.some((t) => t.length !== len)) erro = `use ${len} dígitos`;
      }
      if (!erro && mod !== 'grupo' && aposta.length !== tam) erro = `informe ${tam} ${len ? 'números' : 'grupos'}`;
      if (erro) return `<tr><td class="mono">${NM.esc(l)}</td><td colspan="2"><span class="tag neutral">${erro}</span></td></tr>`;
      const r = NM.conferir(aposta, mod, e, efAte);
      if (r.ganhou) ganhos++;
      const desc = mod === 'grupo' || mod.endsWith('-gp') ? aposta.map((g) => NM.pad(g, 2) + ' ' + NM.bicho(g).nome).join(', ') : aposta.join(' - ');
      return `<tr><td>${desc}</td><td>${r.ganhou ? '<span class="tag ok">Acertou</span>' : '<span class="tag neutral">Não foi</span>'}</td>
        <td class="small">${r.acertos.map((p) => `${p.posicao}º <b class="mono">${p.milhar}</b>`).join(', ') || '—'}</td></tr>`;
    }).join('');
    $('#saida').innerHTML = `<p><b>${ganhos}</b> de ${linhas.length} aposta(s) premiada(s) — ${efAte === 1 ? 'na cabeça' : 'do 1º ao 5º'}.</p>
      <div class="table-wrap"><table class="data-table"><thead><tr><th>Aposta</th><th>Status</th><th>Prêmios</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  NM.onReady(() => {
    NM.bancaSelect($('#banca-bar'), extracoes);
    $('#extracao').addEventListener('change', mostraExt);
    $$('#ate button').forEach((b) => b.addEventListener('click', () => {
      $$('#ate button').forEach((x) => x.classList.toggle('on', x === b));
      ate = Number(b.dataset.v);
    }));
    $('#btn').addEventListener('click', conferir);
    // Importa jogos vindos do gerador
    try {
      const j = JSON.parse(sessionStorage.getItem('nm-jogos') || 'null');
      if (j && [...$('#modalidade').options].some((o) => o.value === j.modalidade)) {
        $('#modalidade').value = j.modalidade;
        $('#apostas').value = j.linhas.join('\n');
      }
    } catch (e) {}
    extracoes();
  });
})();
