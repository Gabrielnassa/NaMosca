(function () {
  const { $, $$ } = NM;

  function modalidades() {
    $('#modalidades').innerHTML = `<table class="data-table"><thead><tr><th>Cód.</th><th>Modalidade</th><th>Colocações</th><th class="n">Paga (×)</th><th class="n">Chance</th><th class="n">Retorno / R$ 100</th><th>Regra</th></tr></thead><tbody>
      ${NM.MODALIDADES.map((m) => {
        const c = NM.cot(m.id), ev = NM.ev(m.id), custom = NM.cotacoesCustom[m.id] != null;
        return `<tr><td class="mono muted">${NM.pad(m.cod, 2)}</td><td><span class="gtag">${m.sig}</span> ${m.nome}</td><td class="small">${m.col}</td>
        <td class="n">${c == null ? '<span class="muted">—</span>' : `<input type="number" step="0.5" min="0" data-id="${m.id}" value="${c}" style="width:96px;text-align:right${custom ? ';border-color:var(--accent)' : ''}">`}</td>
        <td class="n">${m.prob ? NM.umEm(m.id === 'mc' ? 1e-4 : m.prob) : '<span class="muted">varia</span>'}</td>
        <td class="n">${ev == null ? '<span class="muted">—</span>' : `<span class="${ev < 0.4 ? 'down' : ''}">${NM.brl(ev * 100)}</span>`}</td>
        <td class="small muted">${m.desc}</td></tr>`;
      }).join('')}</tbody></table>`;
    $$('#modalidades input').forEach((i) => i.addEventListener('change', () => { NM.setCot(i.dataset.id, i.value); modalidades(); }));
  }

  function horarios() {
    const rows = [];
    NM.BANCAS.forEach((b) => b.extracoes.forEach((e) => { if (e.limite) rows.push([b.sigla, e.nome, e.hora, e.limite, e.dias]); }));
    const dias = (d) => d.length === 7 ? 'Todos' : d.length === 6 && !d.includes(0) ? 'Seg–Sáb' : d.map((x) => NM.DIAS[x].slice(0, 3)).join(', ');
    $('#horarios').innerHTML = `<thead><tr><th>Banca</th><th>Extração</th><th class="n">Sorteio</th><th class="n">Limite</th><th>Dias</th></tr></thead><tbody>${rows.map((r) =>
      `<tr><td class="mono">${r[0]}</td><td>${r[1]}</td><td class="n">${r[2]}</td><td class="n acc">${r[3]}</td><td class="small">${dias(r[4])}</td></tr>`).join('')}</tbody>`;
  }

  function bichos() {
    const half = Math.ceil(NM.BICHOS.length / 2);
    const cell = (b) => b ? `<td class="mono acc">${NM.pad(b.grupo, 2)}</td><td>${b.nome}</td><td class="mono">${b.dezenas.join(' · ')}</td>` : '<td></td><td></td><td></td>';
    let html = '<thead><tr><th>G</th><th>Bicho</th><th>Dezenas</th><th>G</th><th>Bicho</th><th>Dezenas</th></tr></thead><tbody>';
    for (let i = 0; i < half; i++) html += `<tr id="g${i + 1}">${cell(NM.BICHOS[i])}${cell(NM.BICHOS[i + half])}</tr>`;
    $('#bichos').innerHTML = html + '</tbody>';
  }

  function loto(el, L) {
    const tot = NM.comb(L.total, L.sorteadas);
    el.innerHTML = `<thead><tr><th class="n">Dezenas</th><th class="n">Paga (×)</th><th class="n">Aposta máx.</th><th class="n">Chance</th><th class="n">Retorno / R$ 100</th></tr></thead><tbody>${Object.keys(L.cotacoes).map((k) => {
      const p = NM.comb(Number(k), L.sorteadas) / tot, ev = p * L.cotacoes[k];
      return `<tr><td class="n">${k}</td><td class="n">${NM.num(L.cotacoes[k])}</td><td class="n">${NM.brl(L.limites[k])}</td><td class="n">${NM.umEm(p)}</td><td class="n${ev < 0.4 ? ' down' : ''}">${NM.brl(ev * 100)}</td></tr>`;
    }).join('')}</tbody>`;
  }

  NM.onReady(() => {
    modalidades(); horarios(); bichos();
    loto($('#qnh'), NM.QUININHA); loto($('#snh'), NM.SENINHA);
    $('#reset').addEventListener('click', () => { NM.MODALIDADES.forEach((m) => NM.setCot(m.id, null)); modalidades(); });
    let hl;
    $('#num').addEventListener('input', (e) => {
      const v = e.target.value.replace(/\D/g, '');
      if (hl) hl.classList.remove('hl');
      if (!v) { $('#num-res').innerHTML = ''; return; }
      const g = NM.grupoDaDezena(Number(v.slice(-2)));
      $('#num-res').innerHTML = `Final <b class="acc">${v.slice(-2).padStart(2, '0')}</b> → ${NM.chip(g)}`;
      hl = $('#g' + (g > 13 ? g - 13 : g));
      hl.classList.add('hl');
    });
  });
})();
