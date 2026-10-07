(function () {
  const { $ } = NM;
  const NOMES = { bicho: 'Bicho (dezenas)', grupos: 'Bicho (grupos)', quininha: 'Quininha', seninha: 'Seninha' };
  const fmt = (j) => (x) => (j === 'grupos' ? NM.pad(x, 2) : NM.pad(x, 2));
  const tierDe = (it) => (it.jogo === 'quininha' ? 5 : it.jogo === 'seninha' ? 6 : it.tier || it.t || it.k);
  const cotDe = (it) => it.cot || (it.jogo === 'quininha' ? NM.QUININHA.cotacoes[it.k] : it.jogo === 'seninha' ? NM.SENINHA.cotacoes[it.k]
    : it.tipo === 'ddz' ? NM.cot('duque-dz') : it.tipo === 'tdz' ? NM.cot('terno-dz') : it.tipo === 'lt' ? NM.cot('lt' + it.t) : 0);

  async function render() {
    const l = NM.meusJogos.listar();
    if (!l.length) { $('#lista').innerHTML = '<div class="card empty">Nenhum jogo salvo ainda. Gere um fechamento no <a href="fechamento-pro.html">Fechamento PRO</a> ou no <a href="fechamento.html">Fechamento do bicho</a> e clique em “Salvar”.</div>'; return; }
    $('#lista').innerHTML = l.map((it) => `<div class="card" data-id="${it.id}"><header><h3>${NM.esc(it.nome)}</h3>
        <div class="btn-row" style="margin:0"><button class="btn btn-soft" data-a="bt">Testar no histórico</button><button class="btn btn-soft" data-a="txt">.txt</button><button class="btn btn-soft" data-a="del">Excluir</button></div></header>
      <p class="note" style="margin:0 0 10px">${NOMES[it.jogo] || it.jogo} · ${it.jogos.length} jogo(s) · ${NM.brl(it.valor || 1)} por jogo · salvo em ${new Date(it.criado).toLocaleDateString('pt-BR')}</p>
      <div class="conf"></div><div class="bt"></div>
      <details><summary class="note" style="cursor:pointer">Ver jogos</summary><div class="jogos" style="grid-template-columns:1fr;margin-top:8px">${it.jogos.slice(0, 300).map((j, i) => `<div class="jogo"><span class="idx">${i + 1}</span><div class="balls">${j.map((x) => `<span class="ball">${fmt(it.jogo)(x)}</span>`).join('')}</div></div>`).join('')}</div></details></div>`).join('');
    // conferência automática com o último resultado
    for (const it of l) {
      const s = (await NM.sorteiosReais(it.jogo, 7)).sort((a, b) => b.data.localeCompare(a.data))[0];
      const el = document.querySelector(`[data-id="${it.id}"] .conf`);
      if (!s) { el.innerHTML = '<p class="note">Sem resultado recente para conferir.</p>'; continue; }
      const r = NM.backtest(it.jogos, [s], { tier: tierDe(it), cot: cotDe(it), valor: it.valor || 1 });
      el.innerHTML = `<p style="margin:0 0 10px">Último resultado (<b>${s.nome}</b>): <b class="${r.comPremio ? 'up' : ''}">${r.porSorteio[0].prem} jogo(s) premiado(s)</b>${r.ganho ? ` · ${NM.brl(r.ganho)}` : ''}</p>`;
    }
  }

  NM.onReady(() => {
    render();
    $('#lista').addEventListener('click', async (e) => {
      const b = e.target.closest('button[data-a]'); if (!b) return;
      const card = b.closest('[data-id]'); const it = NM.meusJogos.listar().find((x) => x.id === card.dataset.id); if (!it) return;
      if (b.dataset.a === 'del') { if (confirm('Excluir este fechamento?')) { NM.meusJogos.remover(it.id); render(); } }
      if (b.dataset.a === 'txt') NM.baixarTxt(`${it.nome}.txt`, it.jogos.map((j) => j.map(fmt(it.jogo)).join(' ')).join('\n') + '\n');
      if (b.dataset.a === 'bt') {
        card.querySelector('.bt').innerHTML = '<p class="note">Testando…</p>';
        const s = await NM.sorteiosReais(it.jogo, 365);
        card.querySelector('.bt').innerHTML = NM.backtestHTML(NM.backtest(it.jogos, s.sort((a, b) => a.data.localeCompare(b.data)), { tier: tierDe(it), cot: cotDe(it), valor: it.valor || 1 }));
      }
    });
  });
})();
