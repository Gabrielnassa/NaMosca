/* Simulador de longo prazo (Monte Carlo) e comparador de modalidades. */
(function () {
  const { $ } = NM;
  const MODS = () => NM.MODALIDADES.filter((m) => m.prob && NM.cot(m.id) && m.id !== 'mc');

  function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  /** P(ganhos > gasto) após n apostas: precisa de mais de n/cot vitórias. Normal com correção, ou Poisson para eventos raros. */
  function probLucro(n, p, cot) {
    const k = Math.floor(n / cot) + 1; // vitórias necessárias
    const lam = n * p;
    if (lam < 30) { let s = 0, t = Math.exp(-lam); for (let i = 0; i < k; i++) { s += t; t *= lam / (i + 1); } return Math.max(0, 1 - s); }
    const sd = Math.sqrt(n * p * (1 - p)); const z = (k - 0.5 - lam) / sd;
    return 0.5 * erfc(z / Math.SQRT2);
  }
  function erfc(x) { const t = 1 / (1 + 0.5 * Math.abs(x)); const y = t * Math.exp(-x * x - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277))))))))); return x >= 0 ? y : 2 - y; }

  function simular() {
    const m = NM.mod($('#mod').value), cot = NM.cot(m.id), p = m.prob;
    const v = Math.max(0.1, Number($('#valor').value) || 1), pd = Math.max(1, Math.min(50, Number($('#pdia').value) || 1)), dias = Number($('#dias').value);
    const R = 5000, r = rng(42), finais = new Float64Array(R);
    const marcos = Math.min(dias, 60), passo = dias / marcos;
    const traj = Array.from({ length: marcos + 1 }, () => new Float64Array(R));
    for (let i = 0; i < R; i++) {
      let s = 0, mk = 1;
      for (let d = 1; d <= dias; d++) {
        for (let a = 0; a < pd; a++) { s -= v; if (r() < p) s += cot * v; }
        while (mk <= marcos && d >= Math.round(mk * passo)) traj[mk++][i] = s;
      }
      finais[i] = s;
    }
    const ord = Float64Array.from(finais).sort();
    const q = (x) => ord[Math.min(R - 1, Math.floor(x * R))];
    const lucro = finais.filter((x) => x > 0).length / R;
    const gasto = v * pd * dias, ev = gasto * (cot * p - 1);
    $('#kpis').innerHTML = [
      ['Total apostado', NM.brl(gasto), `${NM.num(pd * dias)} apostas`],
      ['Resultado esperado', `${ev >= 0 ? '+' : '−'}${NM.brl(Math.abs(ev))}`, `${NM.pct(cot * p - 1, 1)} do apostado`],
      ['Terminam no lucro', NM.pct(lucro, 1), `${NM.num(lucro * R)} de ${NM.num(R)} cenários`],
      ['Cenário típico (mediana)', `${q(0.5) >= 0 ? '+' : '−'}${NM.brl(Math.abs(q(0.5)))}`, `90% entre ${NM.brl(q(0.05))} e ${NM.brl(q(0.95))}`],
    ].map(([l, val, s], i) => `<div class="kpi"><div class="label">${l}</div><div class="value ${i === 1 || i === 3 ? (val.startsWith('+') ? 'up' : 'down') : ''}">${val}</div><div class="sub">${s}</div></div>`).join('');

    // gráfico: mediana e faixa 5–95%
    const med = [], lo = [], hi = [];
    traj.forEach((arr) => { const o = Float64Array.from(arr).sort(); med.push(o[R >> 1]); lo.push(o[Math.floor(R * 0.05)]); hi.push(o[Math.floor(R * 0.95)]); });
    const W = 640, H = 220, mn = Math.min(0, ...lo), mx = Math.max(0, ...hi), rg = mx - mn || 1;
    const X = (i) => (i / marcos) * W, Y = (y) => H - 8 - ((y - mn) / rg) * (H - 16);
    const banda = hi.map((y, i) => `${X(i)},${Y(y)}`).join(' ') + ' ' + lo.map((y, i) => `${X(marcos - i)},${Y(lo[marcos - i])}`).join(' ');
    $('#graf').innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="width:100%;height:220px;display:block" role="img" aria-label="Saldo simulado">
      <polygon points="${banda}" fill="rgba(16,185,129,.14)"/>
      <line x1="0" x2="${W}" y1="${Y(0)}" y2="${Y(0)}" stroke="var(--line-2)" stroke-dasharray="4 4"/>
      <polyline points="${med.map((y, i) => `${X(i)},${Y(y)}`).join(' ')}" fill="none" stroke="var(--${med[marcos] >= 0 ? 'up' : 'down'})" stroke-width="2.5" vector-effect="non-scaling-stroke"/></svg>
      <div class="note" style="display:flex;justify-content:space-between"><span>início</span><span>linha = cenário mediano · faixa = 90% dos cenários · tracejado = zero</span><span>${dias} dias</span></div>`;

    // distribuição final
    const faixas = [[-Infinity, -gasto * 0.75, 'Perdeu mais de 75%'], [-gasto * 0.75, -gasto * 0.5, 'Perdeu 50–75%'], [-gasto * 0.5, -gasto * 0.25, 'Perdeu 25–50%'], [-gasto * 0.25, 0, 'Perdeu até 25%'], [0, gasto * 0.25, 'Lucro até 25%'], [gasto * 0.25, Infinity, 'Lucro acima de 25%']];
    NM.hbars($('#dist'), faixas.map(([a, b, l]) => { const c = finais.filter((x) => x > a && x <= b).length; return { label: l, value: c / R, highlight: a >= 0, tip: `${NM.num(c)} cenários` }; }), { fmt: (x) => NM.pct(x, 1) });
    $('#info').innerHTML = `<b>${m.nome}</b>: paga ${NM.num(cot, cot % 1 ? 1 : 0)}× com chance de ${NM.umEm(p)} por aposta.`;
    comparar(v, pd * dias);
  }

  function comparar(v, n) {
    $('#cmp-meta').textContent = `${NM.num(n)} apostas de ${NM.brl(v)} (${NM.brl(n * v)} no total)`;
    const linhas = MODS().map((m) => {
      const cot = NM.cot(m.id), ev = cot * m.prob - 1, pl = probLucro(n, m.prob, cot);
      return { m, cot, ev, pl, chance: m.prob, sd: Math.sqrt(m.prob * (1 - m.prob)) * cot };
    }).sort((a, b) => b.ev - a.ev);
    $('#cmp').innerHTML = `<table class="data-table"><thead><tr><th>Modalidade</th><th class="n">Paga</th><th class="n">Chance por aposta</th><th class="n">Retorno médio</th><th class="n">Resultado esperado</th><th class="n">Chance de terminar no lucro</th><th class="n">Volatilidade</th></tr></thead><tbody>${linhas.map((x) =>
      `<tr><td><span class="gtag">${x.m.sig}</span> ${x.m.nome}</td><td class="n">${NM.num(x.cot, x.cot % 1 ? 1 : 0)}×</td><td class="n">${NM.umEm(x.chance)}</td>
        <td class="n ${x.ev < -0.4 ? 'down' : ''}">${NM.brl((1 + x.ev) * 100)} / R$ 100</td><td class="n down">−${NM.brl(Math.abs(x.ev) * n * v)}</td>
        <td class="n"><b>${NM.pct(x.pl, x.pl < 0.01 ? 2 : 1)}</b></td><td class="n">${x.sd > 20 ? 'muito alta' : x.sd > 5 ? 'alta' : x.sd > 2 ? 'média' : 'baixa'}</td></tr>`).join('')}</tbody></table>
      <p class="note" style="margin:10px 0 0">Ordenado da modalidade que menos perde em média para a que mais perde. Modalidades raras (milhar, terno de dezena) têm mais chance de “terminar no lucro” por sorte, mas perdem mais no conjunto. Cotações em vigor na página Cotações.</p>`;
  }

  NM.onReady(() => {
    $('#mod').innerHTML = MODS().map((m) => `<option value="${m.id}"${m.id === 'grupo' ? ' selected' : ''}>${m.sig} · ${m.nome}</option>`).join('');
    $('#rodar').addEventListener('click', simular);
    simular();
  });
})();
