(function () {
  const { $ } = NM;
  document.addEventListener('DOMContentLoaded', () => {
    $('#bichos').innerHTML = NM.BICHOS.map((b) => `<div class="card bicho-card" id="g${b.grupo}">
      <span class="g">${NM.pad(b.grupo, 2)}</span><div class="emoji">${b.emoji}</div>
      <div class="nome">${b.nome}</div><div class="dzs">${b.dezenas.map((d) => `<span>${d}</span>`).join('')}</div></div>`).join('');

    $('#modalidades').innerHTML = `<table class="data-table"><thead><tr><th>Modalidade</th><th>Como ganha</th><th class="n">Paga (por R$ 1)</th><th class="n">Chance</th></tr></thead><tbody>
      ${NM.MODALIDADES.map((m) => `<tr><td><b>${m.nome}</b></td><td>${m.desc}</td><td class="n">R$ ${NM.num(m.cotacao, 2)}</td>
      <td class="n">1 em ${NM.num(1 / NM.PROB[m.id])}</td></tr>`).join('')}</tbody></table>`;

    let hl;
    $('#num').addEventListener('input', (e) => {
      const v = e.target.value.replace(/\D/g, '');
      if (hl) hl.style.outline = '';
      if (!v) { $('#num-res').innerHTML = ''; return; }
      const g = NM.grupoDaDezena(Number(v.slice(-2)));
      $('#num-res').innerHTML = `Termina em <b class="mono">${v.slice(-2).padStart(2, '0')}</b> → ${NM.chip(g)}`;
      hl = $('#g' + g);
      hl.style.outline = '2px solid var(--accent)';
      hl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  });
})();
