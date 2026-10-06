/* Fechamento PRO: desdobramento, fechamento com garantia e otimizador para bicho, Quininha e Seninha. */
(function () {
  const { $, $$ } = NM;
  const NOMES = { 2: 'duque', 3: 'terno', 4: 'quadra', 5: 'quina', 6: 'sena' };
  const nome = (t) => NOMES[t] || `${t} acertos`;

  const JOGOS = {
    bicho: {
      nome: 'Bicho', base: 0, universo: 100, sorteadas: 5, reposicao: true, fmt: (n) => NM.pad(n, 2),
      tipos: [
        { id: 'ddz', nome: 'Duque de dezena', ks: [2], garantias: [[2, 2]], tier: () => 2, cot: () => NM.cot('duque-dz') },
        { id: 'tdz', nome: 'Terno de dezena', ks: [3], garantias: [[3, 3]], tier: () => 3, cot: () => NM.cot('terno-dz') },
        { id: 'lt', nome: 'Lotinho', ks: [20], garantias: [[3, 3], [3, 4], [3, 5], [4, 4], [4, 5], [5, 5]], tier: (t) => t, cot: (k, t) => NM.cot('lt' + t) },
      ],
    },
    quininha: {
      nome: 'Quininha', base: 1, universo: 80, sorteadas: 5, fmt: (n) => NM.pad(n, 2), loto: 'quina',
      tipos: [{ id: 'qn', nome: 'Quininha', ks: Object.keys(NM.QUININHA.cotacoes).map(Number), garantias: [[5, 5]], tier: () => 5, cot: (k) => NM.QUININHA.cotacoes[k] }],
    },
    seninha: {
      nome: 'Seninha', base: 1, universo: 60, sorteadas: 6, fmt: (n) => NM.pad(n, 2), loto: 'megasena',
      tipos: [{ id: 'sn', nome: 'Seninha', ks: Object.keys(NM.SENINHA.cotacoes).map(Number), garantias: [[6, 6]], tier: () => 6, cot: (k) => NM.SENINHA.cotacoes[k] }],
    },
  };

  const st = { jogo: 'bicho', tipo: 0, modo: 'desd', marcar: 'm', sel: new Set(), fix: new Set(), jogos: [], info: null, resultados: [] };
  const J = () => JOGOS[st.jogo];
  const T = () => J().tipos[st.tipo];
  const k = () => Number($('#k').value);
  const gar = () => $('#gar').value.split('-').map(Number);
  const valor = () => Math.max(0, Number($('#valor').value) || 0);

  /* ---------- configuração ---------- */
  function setJogo(j) {
    st.jogo = j; st.tipo = j === 'bicho' ? 2 : 0; st.sel.clear(); st.fix.clear(); st.jogos = []; st.info = null;
    $$('#jogos-tabs button').forEach((b) => b.classList.toggle('on', b.dataset.j === j));
    $('#tipo-wrap').hidden = j !== 'bicho';
    $('#tipo').innerHTML = J().tipos.map((t, i) => `<button data-i="${i}" class="${i === st.tipo ? 'on' : ''}">${t.nome}</button>`).join('');
    $$('#tipo button').forEach((b) => b.addEventListener('click', () => { st.tipo = Number(b.dataset.i); $$('#tipo button').forEach((x) => x.classList.toggle('on', x === b)); $('#k').innerHTML = ''; opcoes(); }));
    $('#k').innerHTML = '';
    opcoes(); volante(); carregarResultados();
  }

  function opcoes() {
    const t = T();
    const cur = k();
    $('#k').innerHTML = t.ks.map((x) => `<option value="${x}"${x === cur ? ' selected' : ''}>${x} dezenas${st.jogo !== 'bicho' ? ` · paga ${NM.num(t.cot(x))}×` : ''}</option>`).join('');
    if (!t.ks.includes(cur)) $('#k').value = String(t.ks[0]);
    $('#gar').innerHTML = t.garantias.map(([a, b]) => `<option value="${a}-${b}">${a === b ? `${cap(nome(a))} garantida se as ${b} estiverem no grupo` : `${cap(nome(a))} se ${nome(b)}`}</option>`).join('');
    $('#k').disabled = t.ks.length === 1;
    modo();
  }
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  function modo() {
    $$('#modo button').forEach((b) => b.classList.toggle('on', b.dataset.v === st.modo));
    $('#gar-wrap').hidden = st.modo === 'desd';
    $('#tempo-wrap').hidden = st.modo !== 'otim';
    $('#max-wrap').hidden = st.modo === 'desd';
    explica();
  }

  function explica() {
    const S = J().sorteadas, [t, m] = gar();
    const txt = {
      desd: `Gera <b>todas as combinações</b> de ${k()} dezenas entre as marcadas. Se as ${st.jogo === 'bicho' ? 'dezenas premiadas' : S + ' sorteadas'} estiverem no seu grupo, você acerta com certeza — e é a opção mais cara.`,
      fech: `Gera o <b>menor número de jogos</b> que garante <b>${nome(t)}</b> sempre que ${m} das dezenas sorteadas estiverem entre as suas.`,
      otim: `O <b>Otimizador PRO</b> monta o fechamento várias vezes, com variações diferentes, remove jogos redundantes e fica com o menor resultado com a mesma garantia.`,
    }[st.modo];
    const fx = st.fix.size ? ` As <b>${st.fix.size} fixas</b> entram em todos os jogos; a garantia vale quando elas forem sorteadas.` : '';
    $('#explica').innerHTML = txt + fx;
  }

  /* ---------- volante ---------- */
  function volante() {
    const j = J();
    $('#vol').innerHTML = Array.from({ length: j.universo }, (_, i) => i + j.base).map((n) =>
      `<button data-v="${n}" class="${st.fix.has(n) ? 'fix' : st.sel.has(n) ? 'on' : ''}">${j.fmt(n)}</button>`).join('');
    const total = new Set([...st.sel, ...st.fix]).size;
    $('#cnt').textContent = `${total} marcada${total === 1 ? '' : 's'}${st.fix.size ? ` · ${st.fix.size} fixa${st.fix.size > 1 ? 's' : ''}` : ''}`;
    $('#bichos-mini').innerHTML = st.jogo === 'bicho' ? `<div class="field" style="margin-top:12px"><span>Marcar por bicho (4 dezenas)</span></div><div class="bichos-mini">${NM.BICHOS.map((b) => {
      const ds = b.dezenas.map(Number); const on = ds.every((d) => st.sel.has(d) || st.fix.has(d));
      return `<button data-g="${b.grupo}" class="${on ? 'on' : ''}"><b>${NM.pad(b.grupo, 2)}</b>${b.nome}</button>`;
    }).join('')}</div>` : '';
    explica();
  }
  function toggle(n) {
    if (st.marcar === 'f') { if (st.fix.has(n)) st.fix.delete(n); else { st.fix.add(n); st.sel.delete(n); } }
    else { if (st.fix.has(n)) st.fix.delete(n); else if (st.sel.has(n)) st.sel.delete(n); else st.sel.add(n); }
  }

  /* ---------- geração ---------- */
  function pool() { return [...new Set([...st.sel, ...st.fix])].sort((a, b) => a - b); }

  async function gerar() {
    const K = k(), [t, m] = gar(), fix = [...st.fix].sort((a, b) => a - b), F = fix.length;
    const livres = pool().filter((n) => !st.fix.has(n));
    const kL = K - F;
    const msg = (s) => { $('#jogos').innerHTML = `<p class="empty">${s}</p>`; st.jogos = []; kpis(); };
    if (F >= K) return msg('Use menos fixas do que dezenas por jogo.');
    if (livres.length < kL) return msg(`Marque pelo menos ${K} dezenas.`);
    const totalDesd = NM.comb(livres.length, kL);
    const modoReal = st.modo !== 'desd' && (kL <= t - F || livres.length === kL) ? 'desd' : st.modo;
    const t0 = Date.now();
    let jogos, info;
    if (modoReal === 'desd') {
      if (totalDesd > 250000) return msg(`São ${NM.num(totalDesd)} combinações — demais para gerar. Use “Com garantia” ou o Otimizador PRO.`);
      jogos = NM.combos(livres, kL, 250000);
      info = { garantia: 'total', cobertura: 1 };
    } else {
      const tL = t - F, mL = m - F;
      if (tL < 1) return msg('Com tantas fixas a garantia já está cumprida; reduza as fixas.');
      ocupado(true);
      try {
        const r = await NM.pro({ cmd: st.modo === 'otim' ? 'otimizar' : 'cobrir', v: livres.length, k: kL, t: tL, m: mL, maxJogos: Math.max(1, Number($('#maxj').value) || 2000), tempo: Number($('#tempo').value), seed: Date.now() % 100000 },
          (p) => { $('#prog').firstChild.style.width = (p.f * 100).toFixed(1) + '%'; $('#prog-txt').textContent = `${p.jogos || 0} jogos${p.tentativas ? ` · ${p.tentativas} tentativas` : ''}${p.cobertura != null ? ` · cobertura ${NM.pct(p.cobertura, 1)}` : ''}`; });
        jogos = r.jogos.map((j) => j.map((i) => livres[i]));
        info = { garantia: `${t}se${m}`, cobertura: r.cobertura, tentativas: r.tentativas };
      } catch (e) { ocupado(false); return msg(e.message === 'cancelado' ? 'Cálculo cancelado.' : `Não foi possível: ${e.message}`); }
      ocupado(false);
    }
    st.jogos = jogos.map((j) => [...fix, ...j].sort((a, b) => a - b));
    st.info = { ...info, ms: Date.now() - t0, totalDesd, K, t, m, F };
    $('#sim').innerHTML = '<p class="note" style="margin:0">Clique em “Simular” para medir a chance real deste fechamento.</p>';
    kpis(); render(); conferir();
  }

  function ocupado(on) {
    $('#gerar').disabled = on; $('#cancelar').hidden = !on; $('#prog').hidden = !on; $('#prog-txt').textContent = on ? 'calculando…' : '';
    if (!on) $('#prog').firstChild.style.width = 0;
  }

  /* ---------- saída ---------- */
  function kpis() {
    const i = st.info, n = st.jogos.length, t = T();
    if (!i || !n) { $('#kpis').innerHTML = ''; return; }
    const cot = t.cot(i.K, i.t);
    const red = 1 - n / Math.max(1, i.totalDesd);
    $('#kpis').innerHTML = [
      ['Jogos', NM.num(n), i.tentativas ? `melhor de ${i.tentativas} tentativas` : `${(i.ms / 1000).toFixed(1).replace('.', ',')} s`],
      ['Custo total', NM.brl(n * valor()), `${NM.brl(valor())} por jogo`],
      ['Garantia', i.garantia === 'total' ? 'Total' : `${cap(nome(i.t))} se ${nome(i.m)}`, i.garantia === 'total' ? 'todas as combinações' : `cobertura ${NM.pct(i.cobertura, 1)}`],
      ['Economia', i.garantia === 'total' ? '—' : NM.pct(Math.min(red, 0.9999), red > 0.99 ? 2 : 1), `vs ${NM.num(i.totalDesd)} do desdobramento`],
      ['Prêmio por jogo', cot ? NM.brl(cot * valor()) : '—', cot ? `cotação ${NM.num(cot)}×` : ''],
    ].map(([l, v, s]) => `<div class="kpi"><div class="label">${l}</div><div class="value">${v}</div><div class="sub">${s}</div></div>`).join('');
  }

  function render(hits) {
    const n = st.jogos.length, j = J(), MAX = 500, tier = T().tier(st.info ? st.info.t : 3);
    if (!n) return;
    const hs = hits ? new Set(hits) : null;
    $('#jogos').innerHTML = `<div class="jogos" style="grid-template-columns:1fr">${st.jogos.slice(0, MAX).map((g, i) => {
      const h = hs ? g.filter((x) => hs.has(x)).length : 0;
      return `<div class="jogo"><span class="idx">${NM.pad(i + 1, String(n).length)}</span><div class="balls">${g.map((x) => `<span class="ball${hs && hs.has(x) ? ' hit' : ''}${st.fix.has(x) ? '" style="border-color:#16a34a' : ''}">${j.fmt(x)}</span>`).join('')}</div>${hs ? `<span class="tag ${h >= tier ? 'ok' : 'neutral'}">${h} acerto${h === 1 ? '' : 's'}</span>` : ''}</div>`;
    }).join('')}</div>${n > MAX ? `<p class="note" style="margin-top:8px">Mostrando ${MAX} de ${NM.num(n)} jogos. Use .txt ou .csv para a lista completa.</p>` : ''}`;
  }

  const texto = (sep = ' ') => st.jogos.map((g) => g.map(J().fmt).join(sep)).join('\n');

  /* ---------- simulação ---------- */
  async function simular() {
    if (!st.jogos.length) return;
    const j = J(), S = j.sorteadas, tier = T().tier(st.info.t);
    $('#sim').innerHTML = '<div class="progress"><div></div></div>';
    const r = await NM.pro({ cmd: 'simular', jogos: st.jogos, pool: pool(), universo: j.universo, base: j.base, sorteadas: S, comReposicao: !!j.reposicao, n: 50000, seed: 7 },
      (p) => { const b = $('#sim .progress div'); if (b) b.style.width = (p.f * 100) + '%'; });
    let premiados = 0;
    const linhas = r.mat.map((row, x) => {
      const tot = row.reduce((a, b) => a + b, 0); const win = row.slice(tier).reduce((a, b) => a + b, 0); premiados += win;
      return tot ? `<tr><td>${x} de ${S}</td><td class="n">${NM.pct(tot / r.n, 2)}</td><td class="n">${NM.pct(win / tot, 1)}</td><td><div class="sim-bar"><div style="width:${(win / tot) * 100}%"></div></div></td></tr>` : '';
    }).join('');
    const p = premiados / r.n;
    $('#sim').innerHTML = `<p style="margin:0 0 10px">Em <b>${NM.num(r.n)}</b> sorteios simulados o fechamento foi premiado (${nome(tier)} ou mais) em <b class="up">${NM.num(premiados)}</b> — chance de <b>${NM.pct(p, p < 0.01 ? 3 : 2)}</b>${p ? ` (1 em ${NM.num(1 / p)})` : ''}.</p>
      <div class="table-wrap"><table class="data-table dense"><thead><tr><th>Sorteadas no seu grupo</th><th class="n">Frequência</th><th class="n">Premiado</th><th></th></tr></thead><tbody>${linhas}</tbody></table></div>
      <p class="note" style="margin:8px 0 0">${j.reposicao ? 'Bicho: dezenas do 1º ao 5º prêmio sorteadas de forma independente. ' : ''}Simulação estatística; o valor real pode variar.</p>`;
  }

  /* ---------- conferência ---------- */
  async function carregarResultados() {
    st.resultados = [];
    const j = J();
    if (st.jogo === 'bicho') {
      ['rj', 'sp'].forEach((b) => NM.loadResults(b, 10).forEach((e) => st.resultados.push({ id: `${b}|${e.data}|${e.extracao}`, nome: `${NM.fmtDateCurta(e.data)} · ${e.extracao}`, ord: e.data + e.hora, dezenas: e.premios.slice(0, 5).map((p) => Number(p.milhar.slice(-2))) })));
      st.resultados.sort((a, b) => b.ord.localeCompare(a.ord));
    } else {
      const d = await NM.loadLoteria(j.loto);
      if (d) d.concursos.slice(0, 40).forEach((c) => st.resultados.push({ id: String(c.numero), nome: `${c.numero} · ${NM.fmtDate(c.data)}`, dezenas: c.dezenas }));
    }
    $('#res-sel').innerHTML = '<option value="">—</option>' + st.resultados.slice(0, 60).map((r) => `<option value="${r.id}">${r.nome}</option>`).join('');
  }

  function conferir() {
    if (!st.jogos.length) { $('#conf').innerHTML = ''; return; }
    const j = J();
    let dz = null;
    const sel = st.resultados.find((r) => r.id === $('#res-sel').value);
    if (sel) dz = sel.dezenas;
    else {
      const nums = ($('#res-txt').value.match(/\d+/g) || []).map(Number).filter((n) => n >= j.base && n < j.base + j.universo);
      if (nums.length >= 2) dz = nums;
    }
    if (!dz) { $('#conf').innerHTML = ''; render(); return; }
    const tier = T().tier(st.info.t), cot = T().cot(st.info.K, st.info.t) || 0;
    const set = new Set(dz);
    const premiados = st.jogos.filter((g) => g.filter((x) => set.has(x)).length >= tier).length;
    const dist = {}; st.jogos.forEach((g) => { const h = g.filter((x) => set.has(x)).length; dist[h] = (dist[h] || 0) + 1; });
    $('#conf').innerHTML = `<div class="balls" style="margin-bottom:8px">${[...set].sort((a, b) => a - b).map((x) => `<span class="ball hit">${j.fmt(x)}</span>`).join('')}</div>
      <p style="margin:0"><b class="${premiados ? 'up' : ''}">${premiados} jogo(s) premiado(s)</b>${premiados && cot ? ` · prêmio estimado ${NM.brl(premiados * cot * valor())} · custo ${NM.brl(st.jogos.length * valor())}` : ''}</p>
      <p class="note" style="margin:4px 0 0">${Object.keys(dist).sort((a, b) => b - a).map((h) => `${dist[h]} jogo(s) com ${h} acerto(s)`).join(' · ')}</p>`;
    render([...set]);
  }

  /* ---------- eventos ---------- */
  NM.onReady(() => {
    $$('#jogos-tabs button').forEach((b) => b.addEventListener('click', () => setJogo(b.dataset.j)));
    $$('#marcar button').forEach((b) => b.addEventListener('click', () => { st.marcar = b.dataset.v; $$('#marcar button').forEach((x) => x.classList.toggle('on', x === b)); }));
    $$('#modo button').forEach((b) => b.addEventListener('click', () => { st.modo = b.dataset.v; modo(); }));
    $('#vol').addEventListener('click', (e) => { const b = e.target.closest('button[data-v]'); if (!b) return; toggle(Number(b.dataset.v)); volante(); });
    $('#bichos-mini').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-g]'); if (!b) return;
      const ds = NM.bicho(Number(b.dataset.g)).dezenas.map(Number);
      const on = ds.every((d) => st.sel.has(d) || st.fix.has(d));
      ds.forEach((d) => { if (on) { st.sel.delete(d); st.fix.delete(d); } else if (!st.fix.has(d)) st.sel.add(d); });
      volante();
    });
    $('#todas').onclick = () => { const j = J(); for (let i = 0; i < j.universo; i++) if (!st.fix.has(i + j.base)) st.sel.add(i + j.base); volante(); };
    $('#limpar').onclick = () => { st.sel.clear(); st.fix.clear(); volante(); };
    $('#inverter').onclick = () => { const j = J(); const n = new Set(); for (let i = 0; i < j.universo; i++) { const x = i + j.base; if (!st.sel.has(x) && !st.fix.has(x)) n.add(x); } st.sel = n; volante(); };
    $('#surpresa').onclick = () => {
      const j = J(); const alvo = Math.max(k() + 4, st.sel.size || 0, st.jogo === 'bicho' && k() < 20 ? 10 : 0);
      st.sel = new Set(); while (st.sel.size + st.fix.size < Math.min(alvo, j.universo)) { const x = j.base + Math.floor(Math.random() * j.universo); if (!st.fix.has(x)) st.sel.add(x); }
      volante();
    };
    $('#quentes').onclick = async () => {
      const j = J(); const alvo = Math.max(k() + 4, st.sel.size, st.jogo === 'bicho' && k() < 20 ? 10 : 0);
      const f = new Array(j.universo + j.base).fill(0);
      if (st.jogo === 'bicho') ['rj', 'sp'].forEach((b) => NM.loadResults(b, 90).forEach((e) => e.premios.slice(0, 5).forEach((p) => f[Number(p.milhar.slice(-2))]++)));
      else { const d = await NM.loadLoteria(j.loto); if (d) d.concursos.forEach((c) => c.dezenas.forEach((n) => f[n]++)); }
      st.sel = new Set(f.map((c, n) => [c, n]).filter(([, n]) => n >= j.base && !st.fix.has(n)).sort((a, b) => b[0] - a[0]).slice(0, alvo - st.fix.size).map((x) => x[1]));
      volante();
    };
    $('#k').addEventListener('change', explica);
    $('#gar').addEventListener('change', explica);
    $('#valor').addEventListener('input', () => { kpis(); conferir(); });
    $('#gerar').addEventListener('click', gerar);
    $('#cancelar').addEventListener('click', () => NM.proCancelar());
    $('#simular').addEventListener('click', simular);
    $('#res-sel').addEventListener('change', () => { $('#res-txt').value = ''; conferir(); });
    $('#res-txt').addEventListener('input', () => { $('#res-sel').value = ''; conferir(); });
    $('#copiar').onclick = (e) => st.jogos.length && NM.copiar(e.target, texto());
    $('#txt').onclick = () => st.jogos.length && NM.baixarTxt(`fechamento-${st.jogo}.txt`, `Na Mosca · Fechamento PRO · ${J().nome}\n${texto()}\n`);
    $('#csv').onclick = () => {
      if (!st.jogos.length) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob(['jogo;dezenas\n' + st.jogos.map((g, i) => `${i + 1};${g.map(J().fmt).join(' ')}`).join('\n')], { type: 'text/csv' }));
      a.download = `fechamento-${st.jogo}.csv`; a.click();
    };
    const q = new URLSearchParams(location.search).get('jogo');
    setJogo(JOGOS[q] ? q : 'bicho');
  });
})();
