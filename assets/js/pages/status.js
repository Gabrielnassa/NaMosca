(function () {
  const { $ } = NM;
  const fmtDT = (iso) => (iso ? new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—');

  NM.exportarCSV = function () {
    const linhas = [['data', 'banca', 'sorteio', 'hora', '1º', '2º', '3º', '4º', '5º', '6º', '7º', 'grupo 1º', 'bicho 1º', 'conferido']];
    ['rj', 'sp', 'fed'].filter(NM.isLive).forEach((b) => NM.loadResults(b, 400).forEach((e) => {
      const p = e.premios.map((x) => x.milhar);
      linhas.push([e.data, NM.banca(b).nome, e.extracao, e.hora, ...Array.from({ length: 7 }, (_, i) => p[i] || ''), e.premios[0].grupo, NM.bicho(e.premios[0].grupo).nome, e.fontes && e.fontes.length > 1 ? 'sim' : 'não']);
    }));
    const csv = '﻿' + linhas.map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `na-mosca-resultados-${NM.isoDate(new Date())}.csv`; a.click();
  };

  NM.onReady(async () => {
    let total = 0, conf = 0, div = 0, dias = new Set();
    const linhas = [];
    NM.BANCAS.forEach((b) => {
      const res = NM.isLive(b.id) ? NM.loadResults(b.id, 400) : [];
      res.forEach((e) => { total++; dias.add(e.data); if (e.fontes && e.fontes.length > 1) conf++; if (e.divergente) div++; });
      b.extracoes.forEach((x) => {
        const da = res.filter((e) => e.extracao === x.id);
        const u = da[da.length - 1];
        const c = da.filter((e) => e.fontes && e.fontes.length > 1).length;
        linhas.push(`<tr><td><b>${x.id}</b></td><td>${b.nome}</td><td class="n">${x.hora}</td>
          <td>${x.status === 'novo' ? '<span class="tag neutral">em breve</span>' : u ? `${NM.fmtDate(u.data)} <span class="mono">${u.premios[0].milhar}</span>` : '<span class="tag cold">sem fonte</span>'}</td>
          <td class="n">${da.length}</td><td class="n">${da.length ? NM.pct(c / da.length, 0) : '—'}</td>
          <td class="small muted">${u && u.fontes ? u.fontes.join(', ') : '—'}</td></tr>`);
      });
    });
    const f = NM.fonte('rj') || NM.fonte('sp');
    $('#kpis').innerHTML = [
      ['Resultados', NM.num(total), `${dias.size} dias com dados`],
      ['Conferidos em 2 fontes', NM.pct(conf / Math.max(1, total), 0), `${NM.num(conf)} resultados`],
      ['Divergências', NM.num(div), div ? 'ver selo ⚠ nos resultados' : 'nenhuma'],
      ['Última coleta', f ? fmtDT(f.atualizado) : '—', 'atualização automática'],
    ].map(([l, v, s]) => `<div class="kpi"><div class="label">${l}</div><div class="value">${v}</div><div class="sub">${s}</div></div>`).join('');
    $('#sorteios').innerHTML = `<table class="data-table dense"><thead><tr><th>Sorteio</th><th>Banca</th><th class="n">Hora</th><th>Último</th><th class="n">No histórico</th><th class="n">Conferidos</th><th>Fontes</th></tr></thead><tbody>${linhas.join('')}</tbody></table>`;
    const lot = [];
    for (const [j, n] of [['quina', 'Quina (Quininha)'], ['megasena', 'Mega-Sena (Seninha)'], ['federal', 'Federal']]) {
      const d = await NM.loadLoteria(j);
      lot.push(`<tr><td><b>${n}</b></td><td>${d ? `${d.concursos[0].numero} · ${NM.fmtDate(d.concursos[0].data)}` : '—'}</td><td class="n">${d ? d.concursos.length : 0}</td><td class="small muted">${d ? d.fonte : '—'}</td><td>${d ? fmtDT(d.atualizado) : '—'}</td></tr>`);
    }
    $('#loterias').innerHTML = `<table class="data-table dense"><thead><tr><th>Loteria</th><th>Último concurso</th><th class="n">No histórico</th><th>Fonte</th><th>Atualizado</th></tr></thead><tbody>${lot.join('')}</tbody></table>`;
    $('#csv').addEventListener('click', NM.exportarCSV);
  });
})();
