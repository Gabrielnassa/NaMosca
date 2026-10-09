/* Diário de apostas, limites de gasto, relatório mensal e backup dos dados locais. */
(function () {
  const { $ } = NM;
  const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const D = NM.diario;

  function render() {
    const l = D.listar(), lim = D.limites();
    const hoje = NM.isoDate(new Date()), mes = hoje.slice(0, 7), ano = hoje.slice(0, 4);
    const soma = (f) => l.filter(f).reduce((a, x) => ({ g: a.g + x.valor, r: a.r + x.premio }), { g: 0, r: 0 });
    const m = soma((x) => x.data.startsWith(mes)), a = soma((x) => x.data.startsWith(ano)), d = soma((x) => x.data === hoje);
    const sal = (x) => x.r - x.g;
    $('#kpis').innerHTML = [
      ['Hoje', NM.brl(d.g), lim.dia ? `de ${NM.brl(lim.dia)} de limite` : 'apostado'],
      ['Este mês · apostado', NM.brl(m.g), lim.mes ? `${NM.pct(m.g / lim.mes, 0)} do limite de ${NM.brl(lim.mes)}` : `prêmios ${NM.brl(m.r)}`],
      ['Saldo do mês', `${sal(m) >= 0 ? '+' : '−'}${NM.brl(Math.abs(sal(m)))}`, `prêmios ${NM.brl(m.r)}`],
      [`Saldo de ${ano}`, `${sal(a) >= 0 ? '+' : '−'}${NM.brl(Math.abs(sal(a)))}`, `${NM.brl(a.g)} apostados`],
    ].map(([lb, v, s], i) => `<div class="kpi"><div class="label">${lb}</div><div class="value ${i >= 2 ? (v.startsWith('+') ? 'up' : 'down') : ''}">${v}</div><div class="sub">${s}</div></div>`).join('');
    $('#alerta').innerHTML = NM.avisoLimite() || '';

    // por mês (últimos 12)
    const porMes = {}; l.forEach((x) => { const k = x.data.slice(0, 7); porMes[k] = porMes[k] || { g: 0, r: 0 }; porMes[k].g += x.valor; porMes[k].r += x.premio; });
    const ks = Object.keys(porMes).sort().slice(-12);
    $('#meses').innerHTML = ks.length ? `<table class="data-table dense"><thead><tr><th>Mês</th><th class="n">Apostado</th><th class="n">Prêmios</th><th class="n">Saldo</th><th class="n">Retorno</th></tr></thead><tbody>${ks.reverse().map((k) => {
      const x = porMes[k], s = x.r - x.g; const [y, mm] = k.split('-');
      return `<tr><td>${MESES[Number(mm) - 1]}/${y}</td><td class="n">${NM.brl(x.g)}</td><td class="n">${NM.brl(x.r)}</td><td class="n ${s >= 0 ? 'up' : 'down'}"><b>${s >= 0 ? '+' : '−'}${NM.brl(Math.abs(s))}</b></td><td class="n">${x.g ? NM.brl((x.r / x.g) * 100) + ' / R$ 100' : '—'}</td></tr>`;
    }).join('')}</tbody></table>` : '<p class="empty">Sem anotações ainda</p>';

    $('#n-anot').textContent = `${l.length} anotações`;
    $('#lista').innerHTML = l.length ? `<table class="data-table dense"><thead><tr><th>Data</th><th>Jogo</th><th>Modalidade</th><th class="n">Apostado</th><th class="n">Prêmio</th><th></th></tr></thead><tbody>${l.map((x) =>
      `<tr><td>${NM.fmtDateCurta(x.data)}</td><td>${NM.esc(x.sorteio || '')}${x.obs ? `<div class="note">${NM.esc(x.obs)}</div>` : ''}</td><td class="small">${NM.esc(x.mod || '')}</td><td class="n">${NM.brl(x.valor)}</td><td class="n ${x.premio ? 'up' : ''}">${NM.brl(x.premio)}</td><td><button class="btn btn-soft" data-del="${x.id}" style="padding:4px 9px" aria-label="Excluir">×</button></td></tr>`).join('')}</tbody></table>` : '<p class="empty">Nenhuma anotação</p>';
  }

  NM.onReady(() => {
    $('#d-data').value = NM.isoDate(new Date());
    $('#d-mod').innerHTML = NM.MODALIDADES.map((m) => `<option>${m.nome}</option>`).join('') + '<option>Quininha</option><option>Seninha</option><option>Fechamento</option><option>Outro</option>';
    $('#sorteios-list').innerHTML = NM.SORTEIOS.map((s) => `<option value="${s.id}">`).join('');
    const lim = D.limites(); $('#l-dia').value = lim.dia || ''; $('#l-mes').value = lim.mes || '';
    ['#l-dia', '#l-mes'].forEach((s) => $(s).addEventListener('change', () => { D.setLimites({ dia: Number($('#l-dia').value) || 0, mes: Number($('#l-mes').value) || 0 }); render(); }));
    $('#d-add').addEventListener('click', () => {
      const valor = Number($('#d-valor').value) || 0; if (!valor && !Number($('#d-premio').value)) { $('#d-valor').focus(); return; }
      D.adicionar({ data: $('#d-data').value || NM.isoDate(new Date()), sorteio: $('#d-sort').value.trim(), mod: $('#d-mod').value, valor, premio: Number($('#d-premio').value) || 0, obs: $('#d-obs').value.trim() });
      $('#d-valor').value = ''; $('#d-premio').value = 0; $('#d-obs').value = '';
      render();
    });
    $('#lista').addEventListener('click', (e) => { const b = e.target.closest('[data-del]'); if (b && confirm('Excluir esta anotação?')) { D.remover(b.dataset.del); render(); } });
    $('#exportar').addEventListener('click', () => NM.backupExportar());
    $('#importar').addEventListener('change', async (e) => { const f = e.target.files[0]; if (!f) return; const ok = NM.backupImportar(await f.text()); alert(ok ? 'Backup restaurado.' : 'Arquivo inválido.'); render(); });
    render();
  });
})();
