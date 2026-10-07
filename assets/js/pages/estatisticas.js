(function () {
  const { $, $$ } = NM;
  const state = { sorteio: '', banca: NM.getBanca(), dias: 90, ate: 1, sort: 'grupo', dir: 1 };
  let st, res;

  // Rampa sequencial (um único tom, claro → escuro) em rgba da cor da marca
  function heatColor(t) {
    const a = 0.08 + 0.85 * Math.max(0, Math.min(1, t));
    return `color-mix(in srgb, var(--primary) ${Math.round(a * 100)}%, var(--panel))`;
  }
  function inkFor(t) { return t > 0.55 ? '#fff' : 'var(--text)'; }

  function compute() {
    const all = NM.loadResults(state.banca, 365);
    const lim = NM.isoDate(new Date(Date.now() - state.dias * 864e5));
    res = all.filter((e) => e.data > lim && (!state.sorteio || e.extracao === state.sorteio));
    st = NM.stats(res, { ate: state.ate });
  }

  function tiles() {
    const g = st.grupos;
    const quente = [...g].sort((a, b) => b.freq - a.freq)[0];
    const frio = [...g].sort((a, b) => a.freq - b.freq)[0];
    const atras = [...g].sort((a, b) => b.atraso - a.atraso)[0];
    const venc = [...g].sort((a, b) => b.vencimento - a.vencimento)[0];
    $('#tiles').innerHTML = [
      ['Mais frequente', quente, `${quente.freq} vezes (${NM.pct(quente.freq / st.total)})`],
      ['Menos frequente', frio, `${frio.freq} vezes (${NM.pct(frio.freq / st.total)})`],
      ['Maior atraso', atras, `${atras.atraso} extrações · recorde ${atras.maxAtraso}`],
      ['Mais “vencido”', venc, `atraso ${venc.vencimento.toFixed(1).replace('.', ',')}× a média`],
    ].map(([l, b, s]) => `<div class="card tile"><div class="label">${l}</div><div class="value">${NM.pad(b.grupo, 2)} ${b.nome}</div><div class="sub">${s}</div></div>`).join('');
  }

  function freq() {
    $('#freq-sub').textContent = `${NM.num(st.n)} extrações · ${NM.num(st.total)} prêmios`;
    NM.barChart($('#freq'), st.grupos.map((g) => ({
      label: `<span title="${g.nome}">${NM.pad(g.grupo, 2)}</span>`, value: g.freq, highlight: g.freq > g.esperado,
      tip: `<b>${NM.pad(g.grupo, 2)} ${g.nome}</b><br>${g.freq} vezes (${NM.pct(g.freq / st.total)})<br>Esperado: ${g.esperado.toFixed(1)}`,
    })), { ref: st.grupos[0].esperado, refLabel: 'esperado' });
  }

  function tabela() {
    const cols = [
      ['grupo', 'Grupo', (g) => NM.chip(g.grupo)],
      ['freq', 'Freq.', (g) => g.freq, true],
      ['pct', '%', (g) => NM.pct(g.freq / st.total), true],
      ['desvio', 'vs. esperado', (g) => `<span style="color:${g.desvio >= 0 ? 'var(--up)' : 'var(--down)'}">${g.desvio >= 0 ? '▲' : '▼'} ${NM.pct(Math.abs(g.desvio), 0)}</span>`, true],
      ['atraso', 'Atraso', (g) => g.atraso, true],
      ['mediaAtraso', 'Atraso médio', (g) => g.mediaAtraso.toFixed(1).replace('.', ','), true],
      ['maxAtraso', 'Recorde', (g) => g.maxAtraso, true],
      ['vencimento', 'Status', (g) => g.vencimento >= 2 ? '<span class="tag cold">Muito atrasado</span>'
        : g.vencimento >= 1.2 ? '<span class="tag neutral">Atrasado</span>'
        : g.desvio > 0.2 ? '<span class="tag hot">Quente</span>' : '<span class="tag ok">Normal</span>', true],
    ];
    const rows = [...st.grupos].sort((a, b) => {
      const k = state.sort === 'pct' ? 'freq' : state.sort;
      return (a[k] - b[k]) * state.dir;
    });
    $('#tabela').innerHTML = `<table class="data-table"><thead><tr>${cols.map(([k, l, , n]) =>
      `<th data-k="${k}" class="${n ? 'n' : ''}">${l}${state.sort === k ? (state.dir > 0 ? ' ↑' : ' ↓') : ''}</th>`).join('')}</tr></thead>
      <tbody>${rows.map((g) => `<tr>${cols.map(([, , f, n]) => `<td class="${n ? 'n' : ''}">${f(g)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    $$('#tabela th').forEach((th) => th.addEventListener('click', () => {
      const k = th.dataset.k;
      state.dir = state.sort === k ? -state.dir : (k === 'grupo' ? 1 : -1);
      state.sort = k;
      tabela();
    }));
  }

  function tendencia() {
    const t = NM.tendencia(res, 30, state.ate).sort((a, b) => b.delta - a.delta);
    const sel = [...t.slice(0, 5), ...t.slice(-5)];
    $('#tendencia').innerHTML = `<div class="table-wrap"><table class="data-table"><thead><tr><th>Bicho</th><th class="n">Últ. 30</th><th class="n">Período</th><th class="n">Variação</th></tr></thead><tbody>
      ${sel.map((x, i) => `${i === 5 ? '<tr><td colspan="4" class="muted small" style="text-align:center">esfriando ↓</td></tr>' : ''}
      <tr><td>${NM.pad(x.grupo, 2)} ${x.nome}</td><td class="n">${NM.pct(x.recente)}</td><td class="n">${NM.pct(x.historico)}</td>
      <td class="n" style="color:${x.delta >= 0 ? 'var(--up)' : 'var(--down)'}">${x.delta >= 0 ? '+' : '−'}${(Math.abs(x.delta) * 100).toFixed(1).replace('.', ',')} p.p.</td></tr>`).join('')}
      </tbody></table></div><p class="muted small" style="margin:8px 0 0">Esquentando no topo; esfriando embaixo.</p>`;
  }

  function puxada() {
    const g = Number($('#pux-sel').value);
    const stCab = NM.stats(res, { ate: 1 });
    const p = NM.puxada(stCab, g, 8);
    NM.hbars($('#puxada'), p.map((x) => ({
      label: `${NM.pad(x.g, 2)} ${NM.bicho(x.g).nome}`, value: x.c,
      tip: `${NM.pct(x.pct)} das vezes após ${NM.bicho(g).nome}`,
    })), { fmt: (v) => `${v}×` });
  }

  function heat() {
    const cols = [0, 1, 2, 3, 4, 5, 6];
    let max = 0;
    const pct = st.porDia.map((row) => { const t = row.reduce((a, b) => a + b, 0) || 1; return row.map((c) => c / t); });
    pct.forEach((r) => r.forEach((v) => (max = Math.max(max, v))));
    let html = `<div class="heat" style="grid-template-columns:130px repeat(7, minmax(44px,1fr));min-width:520px"><div></div>${cols.map((d) => `<div class="hh">${NM.DIAS[d].slice(0, 3)}</div>`).join('')}`;
    NM.BICHOS.forEach((b) => {
      html += `<div class="hh" style="justify-content:flex-start">${NM.pad(b.grupo, 2)} ${b.nome}</div>`;
      cols.forEach((d) => {
        const v = pct[d][b.grupo], t = max ? v / max : 0;
        html += `<div class="hc" style="background:${heatColor(t)};color:${inkFor(t)}" data-tip="<b>${b.nome}</b> · ${NM.DIAS[d]}<br>${st.porDia[d][b.grupo]} vezes (${NM.pct(v)})">${st.porDia[d][b.grupo] || ''}</div>`;
      });
    });
    html += `</div><div class="legend-scale">menos <span class="ramp" style="background:linear-gradient(90deg, ${heatColor(0)}, ${heatColor(1)})"></span> mais</div>`;
    $('#heat').innerHTML = html;
    NM.tooltip($('#heat'));
  }

  function dezenas() {
    const max = Math.max(...st.dezenas.map((d) => d.freq)) || 1;
    const min = Math.min(...st.dezenas.map((d) => d.freq));
    $('#dezenas').innerHTML = `<div class="dz-grid">${[...st.dezenas.slice(1), st.dezenas[0]].map((d) => {
      const t = (d.freq - min) / (max - min || 1);
      const b = NM.bicho(NM.grupoDaDezena(Number(d.dezena)));
      return `<div class="dz" style="background:${heatColor(t)};color:${inkFor(t)}" data-tip="<b>Dezena ${d.dezena}</b> · ${NM.pad(b.grupo, 2)} ${b.nome}<br>${d.freq} vezes · atraso ${d.atraso}">${d.dezena}</div>`;
    }).join('')}</div><div class="legend-scale">${min}× <span class="ramp" style="background:linear-gradient(90deg, ${heatColor(0)}, ${heatColor(1)})"></span> ${max}×</div>`;
    NM.tooltip($('#dezenas'));
  }

  function digitos() {
    const nomes = ['Milhar', 'Centena', 'Dezena', 'Unidade'];
    $('#digitos').innerHTML = `<div class="table-wrap"><table class="data-table"><thead><tr><th>Posição</th>${[...Array(10).keys()].map((d) => `<th class="n">${d}</th>`).join('')}</tr></thead><tbody>
      ${st.digitos.map((row, i) => {
        const mx = Math.max(...row), mn = Math.min(...row);
        return `<tr><td>${nomes[i]}</td>${row.map((c) => `<td class="n" style="${c === mx ? 'color:var(--up);font-weight:700' : c === mn ? 'color:var(--down)' : ''}">${c}</td>`).join('')}</tr>`;
      }).join('')}</tbody></table></div><p class="muted small" style="margin:6px 0 0">Verde = dígito mais sorteado na posição; vermelho = menos sorteado.</p>`;
    const t = st.pares + st.impares || 1;
    NM.hbars($('#parimpar'), [
      { label: 'Milhares pares', value: st.pares, tip: NM.pct(st.pares / t) },
      { label: 'Milhares ímpares', value: st.impares, tip: NM.pct(st.impares / t) },
    ], { fmt: (v) => NM.pct(v / t, 0) });
  }

  function ciclo() {
    const seq = res.map((e) => e.premios[0].grupo);
    const tamanhos = []; let vistos = new Set(), ini = 0;
    seq.forEach((g, i) => { vistos.add(g); if (vistos.size === 25) { tamanhos.push(i - ini + 1); vistos = new Set(); ini = i + 1; } });
    const faltam = NM.BICHOS.filter((b) => !vistos.has(b.grupo));
    const media = tamanhos.length ? tamanhos.reduce((a, b) => a + b, 0) / tamanhos.length : null;
    $('#ciclo-meta').textContent = `${tamanhos.length} ciclo(s) completo(s)${media ? ` · média ${NM.num(media, 0)} extrações` : ''}`;
    $('#ciclo').innerHTML = `<p style="margin:0 0 10px">Ciclo atual: <b>${seq.length - ini}</b> extrações, <b>${vistos.size}</b> de 25 bichos já saíram na cabeça.</p>
      <div class="progress" style="margin-bottom:12px"><div style="width:${(vistos.size / 25) * 100}%"></div></div>
      ${faltam.length ? `<div class="field" style="margin-bottom:6px"><span>Faltam sair neste ciclo</span></div><div class="chips">${faltam.map((b) => NM.chip(b.grupo, 'cold')).join('')}</div>` : '<p class="note">Ciclo acabou de fechar.</p>'}
      ${tamanhos.length ? `<p class="note" style="margin:10px 0 0">Ciclos anteriores: ${tamanhos.slice(-8).join(', ')} extrações (menor ${Math.min(...tamanhos)}, maior ${Math.max(...tamanhos)}).</p>` : ''}`;
  }

  function repeticoes() {
    let mesmo = 0, nos5 = 0, mesmoSorteio = 0, nSorteio = 0;
    const ultimoPorSorteio = {};
    res.forEach((e, i) => {
      const g = e.premios[0].grupo;
      if (i > 0) {
        if (res[i - 1].premios[0].grupo === g) mesmo++;
        if (res[i - 1].premios.slice(0, 5).some((p) => p.grupo === g)) nos5++;
      }
      const ant = ultimoPorSorteio[e.extracao];
      if (ant != null) { nSorteio++; if (ant === g) mesmoSorteio++; }
      ultimoPorSorteio[e.extracao] = g;
    });
    const n = Math.max(1, res.length - 1), esp5 = 1 - Math.pow(24 / 25, 5);
    const linha = (t, v, tot, esp) => `<tr><td>${t}</td><td class="n"><b>${NM.pct(v / Math.max(1, tot), 1)}</b></td><td class="n muted">${NM.pct(esp, 1)}</td><td class="n">${v}/${tot}</td></tr>`;
    $('#repet').innerHTML = `<table class="data-table dense"><thead><tr><th>Situação</th><th class="n">Aconteceu</th><th class="n">Esperado</th><th class="n">Vezes</th></tr></thead><tbody>
      ${linha('Cabeça repete o bicho da cabeça anterior', mesmo, n, 1 / 25)}
      ${linha('Cabeça sai entre o 1º–5º da extração anterior', nos5, n, esp5)}
      ${linha('Cabeça repete a do mesmo sorteio no dia anterior', mesmoSorteio, nSorteio, 1 / 25)}
      </tbody></table><p class="note" style="margin:8px 0 0">Esperado = o que aconteceria por puro acaso.</p>`;
  }

  function horario() {
    const exts = NM.banca(state.banca).extracoes.filter((e) => e.status !== 'novo').map((e) => e.id);
    const c = {}; res.forEach((e) => { const k = e.extracao + '|' + e.premios[0].grupo; c[k] = (c[k] || 0) + 1; });
    const max = Math.max(1, ...Object.values(c));
    let html = `<div class="heat" style="grid-template-columns:130px repeat(${exts.length}, minmax(44px,1fr));min-width:${130 + exts.length * 48}px"><div></div>${exts.map((x) => `<div class="hh">${x}</div>`).join('')}`;
    NM.BICHOS.forEach((b) => {
      html += `<div class="hh" style="justify-content:flex-start">${NM.pad(b.grupo, 2)} ${b.nome}</div>`;
      exts.forEach((x) => { const v = c[x + '|' + b.grupo] || 0, t = v / max; html += `<div class="hc" style="background:${heatColor(t)};color:${inkFor(t)}" data-tip="<b>${b.nome}</b> no ${x}: ${v}×">${v || ''}</div>`; });
    });
    $('#horario').innerHTML = html + '</div>';
    NM.tooltip($('#horario'));
  }

  function opcoesSorteio() {
    const b = NM.banca(state.banca);
    $('#sorteio').innerHTML = '<option value="">Todos</option>' + b.extracoes.filter((e) => e.status !== 'novo').map((e) => `<option value="${e.id}"${e.id === state.sorteio ? ' selected' : ''}>${e.id} · ${e.hora}</option>`).join('');
    if (!b.extracoes.some((e) => e.id === state.sorteio)) state.sorteio = '';
  }

  function renderAll() {
    opcoesSorteio();
    compute(); tiles(); freq(); tabela(); tendencia(); puxada(); heat(); dezenas(); digitos(); ciclo(); repeticoes(); horario();
  }

  NM.onReady(() => {
    NM.bancaSelect($('#banca-bar'), (id) => { state.banca = id; renderAll(); });
    $('#sorteio').addEventListener('change', (e) => { state.sorteio = e.target.value; renderAll(); });
    $('#periodo').addEventListener('change', (e) => { state.dias = Number(e.target.value); renderAll(); });
    $$('#ate button').forEach((b) => b.addEventListener('click', () => {
      $$('#ate button').forEach((x) => x.classList.toggle('on', x === b));
      state.ate = Number(b.dataset.v);
      renderAll();
    }));
    $('#pux-sel').innerHTML = NM.BICHOS.map((b) => `<option value="${b.grupo}">${NM.pad(b.grupo, 2)} ${b.nome}</option>`).join('');
    const all = NM.loadResults(state.banca, 180);
    $('#pux-sel').value = all[all.length - 1].premios[0].grupo;
    $('#pux-sel').addEventListener('change', puxada);
    renderAll();
  });
})();
