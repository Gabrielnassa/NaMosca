/* Inteligência da milhar: frequências, atrasos, dígitos por posição, gerador com filtros e raio-x. */
(function () {
  const { $, $$ } = NM;
  const st = { premios: [], extracoes: 0, freqTipo: 4, atrTipo: 2, gerados: [] };

  const FONTES = () => [['todos', 'Rio + São Paulo'], ['rj', 'Só Rio'], ['sp', 'Só São Paulo'],
    ...NM.BANCAS.filter((b) => b.id !== 'fed').flatMap((b) => b.extracoes.filter((e) => e.status !== 'novo').map((e) => [`${b.id}:${e.id}`, `Só ${e.id}`]))];

  /** Lista cronológica de prêmios { m, data, idx } conforme filtros. */
  function carregar() {
    const fonte = $('#f-fonte').value, ate = Number($('#f-ate').value), dias = Number($('#f-dias').value);
    const [banca, sorteio] = fonte.includes(':') ? fonte.split(':') : [fonte, null];
    const bancas = banca === 'todos' ? ['rj', 'sp'] : [banca];
    const ext = bancas.flatMap((b) => NM.loadResults(b, dias)).filter((e) => !sorteio || e.extracao === sorteio)
      .sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora));
    st.extracoes = ext.length;
    st.premios = [];
    ext.forEach((e, idx) => e.premios.slice(0, ate).forEach((p) => { if (p.milhar.length === 4) st.premios.push({ m: p.milhar, data: e.data, ext: e.extracao, idx }); }));
  }

  function contar(len) {
    const c = new Map();
    for (const p of st.premios) {
      const k = p.m.slice(-len);
      const o = c.get(k) || { k, n: 0, ultima: null, idx: -1 };
      o.n++; o.ultima = p.data + ' · ' + p.ext; o.idx = Math.max(o.idx, p.idx);
      c.set(k, o);
    }
    return c;
  }

  function kpis() {
    const mil = contar(4);
    const rep = [...mil.values()].filter((x) => x.n > 1).length;
    $('#kpis').innerHTML = [
      ['Extrações', NM.num(st.extracoes)], ['Prêmios', NM.num(st.premios.length)], ['Milhares distintas', NM.num(mil.size)], ['Repetidas', NM.num(rep)],
    ].map(([l, v]) => `<div class="kpi"><div class="label">${l}</div><div class="value">${v}</div></div>`).join('');
  }

  const bichoDe = (s) => NM.bicho(NM.grupoDaDezena(Number(s.slice(-2))));

  function freq() {
    const len = st.freqTipo;
    const lista = [...contar(len).values()].sort((a, b) => b.n - a.n || b.idx - a.idx).slice(0, 40);
    const esperado = st.premios.length / Math.pow(10, len);
    $('#freq').innerHTML = lista.length ? `<table class="data-table dense"><thead><tr><th>${['', '', 'Dezena', 'Centena', 'Milhar'][len]}</th><th>Bicho</th><th class="n">Vezes</th><th class="n">vs média</th><th>Última</th></tr></thead><tbody>${lista.map((x) =>
      `<tr><td><b class="mono" style="font-size:1.05rem">${x.k}</b></td><td>${NM.chip(bichoDe(x.k).grupo)}</td><td class="n"><b>${x.n}</b></td><td class="n">${esperado ? NM.num(x.n / esperado, 1) + '×' : '—'}</td><td class="small muted">${fmtUlt(x.ultima)}</td></tr>`).join('')}</tbody></table>`
      : '<p class="empty">Sem dados no período</p>';
  }
  const fmtUlt = (u) => { if (!u) return '—'; const [d, e] = u.split(' · '); return `${NM.fmtDateCurta(d)} · ${e}`; };

  function atrasos() {
    const tipo = st.atrTipo, total = st.extracoes;
    let lista;
    if (tipo === 'g') {
      const ult = new Array(26).fill(-1);
      st.premios.forEach((p) => { const g = NM.grupoDaDezena(Number(p.m.slice(-2))); ult[g] = Math.max(ult[g], p.idx); });
      lista = NM.BICHOS.map((b) => ({ k: NM.pad(b.grupo, 2), nome: b.nome, atraso: ult[b.grupo] < 0 ? total : total - 1 - ult[b.grupo], nunca: ult[b.grupo] < 0 }));
    } else {
      const c = contar(tipo);
      const universo = tipo === 2 ? NM.DEZENAS_BICHO.map((d) => NM.pad(d, 2)) : [...Array(1000).keys()].map((i) => NM.pad(i, 3));
      lista = universo.map((k) => { const x = c.get(k); return { k, atraso: x ? total - 1 - x.idx : total, nunca: !x }; });
    }
    lista.sort((a, b) => b.atraso - a.atraso);
    $('#atr').innerHTML = `<table class="data-table dense"><thead><tr><th>${tipo === 'g' ? 'Grupo' : tipo === 2 ? 'Dezena' : 'Centena'}</th><th>Bicho</th><th class="n">Extrações sem sair</th></tr></thead><tbody>${lista.slice(0, 40).map((x) =>
      `<tr><td><b class="mono" style="font-size:1.05rem">${x.k}</b></td><td>${NM.chip(tipo === 'g' ? Number(x.k) : bichoDe(x.k).grupo)}</td><td class="n"><b class="${x.nunca ? 'down' : ''}">${x.nunca ? `${x.atraso}+` : x.atraso}</b></td></tr>`).join('')}</tbody></table>
      ${tipo === 3 ? '<p class="note" style="margin:8px 0 0">"+" = não saiu nenhuma vez no período.</p>' : ''}`;
  }

  function digitos() {
    const D = Array.from({ length: 4 }, () => new Array(10).fill(0));
    const U = Array.from({ length: 4 }, () => new Array(10).fill(-1));
    st.premios.forEach((p) => [...p.m].forEach((c, i) => { D[i][c]++; U[i][c] = Math.max(U[i][c], p.idx); }));
    st.D = D; st.U = U;
    const nomes = ['Milhar', 'Centena', 'Dezena', 'Unidade'];
    $('#digitos').innerHTML = `<table class="data-table"><thead><tr><th>Casa</th>${[...Array(10).keys()].map((d) => `<th class="n">${d}</th>`).join('')}</tr></thead><tbody>${D.map((row, i) => {
      const mx = Math.max(...row), mn = Math.min(...row);
      return `<tr><td><b>${nomes[i]}</b></td>${row.map((c) => { const t = (c - mn) / (mx - mn || 1);
        return `<td class="n" style="background:color-mix(in srgb, var(--primary) ${Math.round(t * 45)}%, transparent);${c === mx ? 'font-weight:800' : ''}">${c}</td>`; }).join('')}</tr>`;
    }).join('')}</tbody></table><p class="note" style="margin:8px 0 0">Quanto mais verde, mais vezes o dígito saiu naquela casa.</p>`;
  }

  /* ---------- Gerador ---------- */
  function gerar() {
    const K = Number($('#g-k').value), base = $('#g-base').value, total = st.extracoes;
    const escolhe = (i) => {
      const quentes = [...Array(10).keys()].sort((a, b) => st.D[i][b] - st.D[i][a]);
      const frios = [...Array(10).keys()].sort((a, b) => (total - st.U[i][b]) - (total - st.U[i][a]));
      if (base === 'quentes') return quentes.slice(0, K);
      if (base === 'frios') return frios.slice(0, K);
      return [...new Set([...quentes.slice(0, Math.ceil(K / 2)), ...frios])].slice(0, K);
    };
    const pos = [0, 1, 2, 3].map(escolhe);
    const smin = Number($('#g-smin').value) || 0, smax = Number($('#g-smax').value) || 36;
    const par = $('#g-par').value, grupo = $('#g-grupo').value, norep = $('#g-norep').checked, nova = $('#g-nova').checked;
    const ja = new Set(st.premios.map((p) => p.m));
    const out = [];
    for (const a of pos[0]) for (const b of pos[1]) for (const c of pos[2]) for (const d of pos[3]) {
      const ds = [a, b, c, d], m = ds.join('');
      const soma = a + b + c + d;
      if (soma < smin || soma > smax) continue;
      if (par !== '' && ds.filter((x) => x % 2 === 0).length !== Number(par)) continue;
      if (norep && new Set(ds).size < 4) continue;
      if (grupo && NM.grupoDaDezena(c * 10 + d) !== Number(grupo)) continue;
      if (nova && ja.has(m)) continue;
      const score = ds.reduce((s, x, i) => s + st.D[i][x], 0);
      out.push({ m, score });
    }
    out.sort((x, y) => y.score - x.score);
    st.gerados = out.slice(0, Math.max(1, Math.min(500, Number($('#g-qtd').value) || 30)));
    $('#g-out').innerHTML = st.gerados.length ? `<p class="note" style="margin:0 0 10px">Dígitos usados — milhar: <b>${pos[0].join(' ')}</b> · centena: <b>${pos[1].join(' ')}</b> · dezena: <b>${pos[2].join(' ')}</b> · unidade: <b>${pos[3].join(' ')}</b> · ${out.length} combinações passaram nos filtros.</p>
      <div class="jogos">${st.gerados.map((x, i) => `<div class="jogo"><span class="idx">${NM.pad(i + 1, 2)}</span><div><div class="nums">${x.m}</div><div class="small">${bichoDe(x.m).nome} · grupo ${NM.pad(bichoDe(x.m).grupo, 2)}</div></div></div>`).join('')}</div>`
      : '<p class="empty">Nenhuma milhar passou nos filtros — afrouxe algum deles</p>';
    try { sessionStorage.setItem('nm-milhares', st.gerados.map((x) => x.m).join('\n')); } catch (e) {}
  }

  /* ---------- Raio-x ---------- */
  function raiox() {
    const v = $('#a-mil').value.replace(/\D/g, '');
    if (v.length !== 4) { $('#a-out').innerHTML = '<p class="note" style="margin:0">Digite os 4 números da milhar.</p>'; return; }
    const total = st.extracoes;
    const linhas = [[4, 'Milhar', v], [3, 'Centena', v.slice(-3)], [2, 'Dezena', v.slice(-2)]].map(([len, nome, k]) => {
      const x = contar(len).get(k);
      const esp = st.premios.length / Math.pow(10, len);
      return `<tr><td><b>${nome}</b></td><td class="mono"><b>${k}</b></td><td class="n">${x ? x.n : 0}</td><td class="n">${NM.num(esp, 2)}</td><td class="n">${x ? total - 1 - x.idx : `${total}+`}</td><td class="small muted">${x ? fmtUlt(x.ultima) : 'não saiu'}</td></tr>`;
    });
    const g = bichoDe(v);
    let gN = 0, gIdx = -1;
    st.premios.forEach((p) => { if (NM.grupoDaDezena(Number(p.m.slice(-2))) === g.grupo) { gN++; gIdx = Math.max(gIdx, p.idx); } });
    linhas.push(`<tr><td><b>Grupo</b></td><td>${NM.chip(g.grupo)}</td><td class="n">${gN}</td><td class="n">${NM.num(st.premios.length / 25, 1)}</td><td class="n">${gIdx < 0 ? `${total}+` : total - 1 - gIdx}</td><td></td></tr>`);
    const forca = [...v].map((c, i) => { const r = [...Array(10).keys()].sort((a, b) => st.D[i][b] - st.D[i][a]).indexOf(Number(c)) + 1; return `${['Milhar', 'Centena', 'Dezena', 'Unidade'][i]}: <b>${c}</b> é o ${r}º mais frequente`; }).join(' · ');
    $('#a-out').innerHTML = `<div class="table-wrap"><table class="data-table"><thead><tr><th></th><th></th><th class="n">Vezes</th><th class="n">Média esperada</th><th class="n">Extrações sem sair</th><th>Última</th></tr></thead><tbody>${linhas.join('')}</tbody></table></div>
      <p class="note" style="margin:10px 0 0">${forca}.</p>`;
  }

  function tudo() { carregar(); kpis(); freq(); atrasos(); digitos(); raiox(); }

  NM.onReady(() => {
    $('#f-fonte').innerHTML = FONTES().map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
    $('#g-grupo').innerHTML += NM.BICHOS.map((b) => `<option value="${b.grupo}">${NM.pad(b.grupo, 2)} · ${b.nome}</option>`).join('');
    ['#f-fonte', '#f-ate', '#f-dias'].forEach((s) => $(s).addEventListener('change', tudo));
    $$('#freq-tipo button').forEach((b) => b.addEventListener('click', () => { st.freqTipo = Number(b.dataset.v); $$('#freq-tipo button').forEach((x) => x.classList.toggle('on', x === b)); freq(); }));
    $$('#atr-tipo button').forEach((b) => b.addEventListener('click', () => { st.atrTipo = b.dataset.v === 'g' ? 'g' : Number(b.dataset.v); $$('#atr-tipo button').forEach((x) => x.classList.toggle('on', x === b)); atrasos(); }));
    $('#g-gerar').addEventListener('click', gerar);
    $('#g-copiar').addEventListener('click', (e) => st.gerados.length && navigator.clipboard.writeText(st.gerados.map((x) => x.m).join('\n')).then(() => { e.target.textContent = 'Copiado'; setTimeout(() => (e.target.textContent = 'Copiar'), 1200); }));
    $('#a-mil').addEventListener('input', raiox);
    tudo();
  });
})();
