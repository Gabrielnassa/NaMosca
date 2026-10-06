/* Na Mosca — layout comum (barra de status, cabeçalho, ticker, rodapé, tema) e componentes visuais. */
(function () {
  const NM = window.NM;

  const NAV = [
    ['index.html', 'Painel'],
    ['resultados.html', 'Resultados'],
    ['estatisticas.html', 'Estatísticas'],
    ['fechamento.html', 'Fechamento'],
    ['quininha.html', 'Quininha'],
    ['seninha.html', 'Seninha'],
    ['gerador.html', 'Gerador'],
    ['conferidor.html', 'Conferidor'],
    ['analises.html', 'Análises'],
    ['tabela.html', 'Cotações'],
  ];

  const LOGO = `<svg class="logo-mark" viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="16" cy="16" r="14"/><circle cx="16" cy="16" r="8"/><path d="M16 0v7M16 25v7M0 16h7M25 16h7"/><circle cx="16" cy="16" r="2.5" fill="currentColor" stroke="none"/></svg>`;
  const BRAND = `<a class="brand" href="index.html" aria-label="Na Mosca — início">${LOGO}<span class="brand-word">Na<b>Mosca</b></span></a>`;

  /* Tema: escuro por padrão; o visitante pode trocar para "papel" */
  try { const t = localStorage.getItem('nm-theme'); if (t) document.documentElement.setAttribute('data-theme', t); } catch (e) {}
  function toggleTheme() {
    const t = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('nm-theme', t); } catch (e) {}
  }

  NM.getBanca = () => {
    const q = new URLSearchParams(location.search).get('banca');
    if (q && NM.BANCAS.some((b) => b.id === q)) return q;
    try { const s = localStorage.getItem('nm-banca'); if (s && NM.BANCAS.some((b) => b.id === s)) return s; } catch (e) {}
    return 'rj';
  };
  NM.setBanca = (id) => { try { localStorage.setItem('nm-banca', id); } catch (e) {} };

  /* ---------- helpers ---------- */
  NM.$ = (s, r = document) => r.querySelector(s);
  NM.$$ = (s, r = document) => [...r.querySelectorAll(s)];
  NM.esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  NM.pct = (x, d = 1) => (x * 100).toFixed(d).replace('.', ',') + '%';
  NM.num = (x, d = 0) => Number(x).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
  NM.brl = (x) => 'R$ ' + NM.num(x, 2);
  NM.umEm = (p) => (p > 0 ? '1 : ' + NM.num(1 / p) : '—');

  NM.chip = (g, extra = '') => {
    const b = NM.bicho(g);
    return `<span class="chip ${extra}" title="Grupo ${b.grupo} — ${b.nome} (${b.dezenas.join(', ')})"><span class="chip-g">${NM.pad(b.grupo, 2)}</span><span class="chip-n">${b.nome}</span></span>`;
  };
  NM.signed = (x, d = 1, suf = '') => `<span class="${x >= 0 ? 'up' : 'down'}">${x >= 0 ? '▲' : '▼'} ${NM.num(Math.abs(x), d)}${suf}</span>`;

  NM.statusTag = (bancaId) => {
    const f = NM.fonte(bancaId);
    return f
      ? `<span class="tag ok" title="Fonte: ${NM.esc(f.fonte || '')} · atualizado ${new Date(f.atualizado).toLocaleString('pt-BR')}">Ao vivo</span>`
      : '<span class="tag acc" title="Sem arquivo de resultados para esta banca: exibindo dados de demonstração">Demo</span>';
  };

  NM.bancaSelect = (container, onChange) => {
    const cur = NM.getBanca();
    container.innerHTML = `<label class="field"><span>Banca</span><select>${NM.BANCAS.map((b) =>
      `<option value="${b.id}"${b.id === cur ? ' selected' : ''}>${b.nome}${NM.isLive(b.id) ? '' : ' · demo'}</option>`).join('')}</select></label>`;
    container.querySelector('select').addEventListener('change', (e) => { NM.setBanca(e.target.value); onChange(e.target.value); });
  };

  NM.extracaoCard = (ext, { compact = false } = {}) => {
    const rows = ext.premios.slice(0, compact ? 5 : 7).map((p) => {
      const b = NM.bicho(p.grupo);
      const is7 = p.milhar.length < 4;
      return `<tr${p.posicao === 1 ? ' class="cabeca"' : ''}>
        <td class="pos">${p.posicao}º</td><td class="milhar">${p.milhar}</td>
        <td>${is7 ? '<span class="muted">—</span>' : `<span class="gnum">${NM.pad(b.grupo, 2)}</span><span class="gname">${b.nome}</span>`}</td></tr>`;
    }).join('');
    return `<article class="card ext-card">
      <header><h3>${NM.esc(ext.extracaoNome)}${ext.hora && !String(ext.extracaoNome).includes(ext.hora) ? ` · ${ext.hora}` : ''}</h3><span class="muted small">${NM.fmtDate(ext.data)}</span></header>
      <table class="res-table"><tbody>${rows}</tbody></table></article>`;
  };

  /* ---------- Tooltip ---------- */
  let tip;
  NM.tooltip = (root) => {
    if (!tip) { tip = document.createElement('div'); tip.className = 'tooltip'; tip.setAttribute('role', 'tooltip'); document.body.append(tip); }
    root.addEventListener('pointermove', (e) => {
      const t = e.target.closest('[data-tip]');
      if (!t || !root.contains(t) || !t.getAttribute('data-tip')) { tip.style.opacity = 0; return; }
      tip.innerHTML = t.getAttribute('data-tip');
      tip.style.opacity = 1;
      const w = tip.offsetWidth, h = tip.offsetHeight;
      let x = e.clientX + 14, y = e.clientY - h - 10;
      if (x + w > innerWidth - 8) x = e.clientX - w - 14;
      if (y < 8) y = e.clientY + 18;
      tip.style.transform = `translate(${x}px, ${y}px)`;
    });
    root.addEventListener('pointerleave', () => (tip.style.opacity = 0));
  };

  /** Barras verticais (série única). items: [{label, value, tip, highlight}] */
  NM.barChart = (el, items, { ref = null, refLabel = '', fmt = (v) => v } = {}) => {
    const max = Math.max(...items.map((i) => i.value), ref || 0) || 1;
    const refLine = ref != null ? `<div class="bc-ref" style="bottom:${(ref / max) * 100}%"><span>${refLabel}</span></div>` : '';
    el.innerHTML = `<div class="bar-chart" style="--n:${items.length}">
      <div class="bc-plot">${refLine}${items.map((i) => `
        <div class="bc-col" data-tip="${NM.esc(i.tip || `${i.label}: ${fmt(i.value)}`)}"><div class="bc-bar${i.highlight ? ' hl' : ''}" style="height:${(i.value / max) * 100}%"></div></div>`).join('')}
      </div><div class="bc-axis">${items.map((i) => `<span>${i.label}</span>`).join('')}</div></div>`;
    NM.tooltip(el);
  };
  /** Barras horizontais. */
  NM.hbars = (el, items, { fmt = (v) => v } = {}) => {
    const max = Math.max(...items.map((i) => i.value)) || 1;
    el.innerHTML = `<div class="hbars">${items.map((i) => `
      <div class="hb-row" data-tip="${NM.esc(i.tip || '')}"><div class="hb-label">${i.label}</div>
        <div class="hb-track"><div class="hb-bar${i.highlight ? ' hl' : ''}" style="width:${(i.value / max) * 100}%"></div></div>
        <div class="hb-val">${fmt(i.value)}</div></div>`).join('')}</div>`;
    NM.tooltip(el);
  };
  /** Sparkline SVG minúscula */
  NM.spark = (vals, w = 70, h = 18) => {
    if (vals.length < 2) return '';
    const mx = Math.max(...vals), mn = Math.min(...vals), r = mx - mn || 1;
    const pts = vals.map((v, i) => `${((i / (vals.length - 1)) * w).toFixed(1)},${(h - 2 - ((v - mn) / r) * (h - 4)).toFixed(1)}`).join(' ');
    const up = vals[vals.length - 1] >= vals[0];
    return `<svg class="spark" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><polyline points="${pts}" fill="none" stroke="var(--${up ? 'up' : 'down'})" stroke-width="1.5"/></svg>`;
  };

  /* ---------- Layout ---------- */
  function header() {
    const page = location.pathname.split('/').pop() || 'index.html';
    const top = document.createElement('div');
    top.className = 'topbar';
    top.innerHTML = `<div class="wrap"><span><b>NA MOSCA</b> TERMINAL</span><span id="clk"></span><span id="src-status"><span class="dot"></span>carregando dados…</span><span class="sp" id="next-ext"></span></div>`;
    const h = document.createElement('header');
    h.className = 'site-header';
    h.innerHTML = `<div class="wrap header-row">${BRAND}
        <nav class="nav" aria-label="Principal">${NAV.map(([href, label]) => `<a href="${href}"${href === page ? ' aria-current="page"' : ''}>${label}</a>`).join('')}</nav>
        <div class="header-tools"><button class="icon-btn theme-btn" title="Alternar tema escuro/papel">TEMA</button><button class="icon-btn menu-btn" aria-label="Abrir menu" aria-expanded="false">MENU</button></div>
      </div>`;
    const tk = document.createElement('div');
    tk.className = 'ticker';
    tk.setAttribute('aria-label', 'Últimos resultados');
    tk.innerHTML = '<div class="ticker-track" id="ticker"></div>';
    document.body.prepend(top, h, tk);
    const btn = h.querySelector('.menu-btn');
    btn.addEventListener('click', () => btn.setAttribute('aria-expanded', h.classList.toggle('open')));
    h.querySelector('.theme-btn').addEventListener('click', toggleTheme);
    clock();
    setInterval(clock, 1000);
  }

  function clock() {
    const el = document.getElementById('clk');
    if (!el) return;
    const d = new Date();
    el.innerHTML = `BRT <b>${d.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</b> · ${d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Sao_Paulo' }).toUpperCase()}`;
  }

  function status() {
    const vivas = NM.BANCAS.filter((b) => NM.isLive(b.id));
    document.getElementById('src-status').innerHTML = vivas.length
      ? `<span class="dot live"></span>AO VIVO <b>${vivas.map((b) => b.sigla).join(' · ')}</b>${vivas.length < NM.BANCAS.length ? ' · demais em demo' : ''}`
      : '<span class="dot demo"></span>MODO DEMONSTRAÇÃO · resultados simulados';

    // próxima extração da banca selecionada
    const b = NM.banca(NM.getBanca());
    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes();
    const prox = b.extracoes.filter((e) => e.dias.includes(now.getDay())).map((e) => {
      const [hh, mm] = e.hora.split(':').map(Number); return { e, m: hh * 60 + mm };
    }).find((x) => x.m > mins);
    document.getElementById('next-ext').innerHTML = prox
      ? `PRÓX. ${b.sigla} <b>${prox.e.nome} ${prox.e.hora}</b> · em ${Math.floor((prox.m - mins) / 60)}h${NM.pad((prox.m - mins) % 60, 2)}`
      : `${b.sigla} · extrações do dia encerradas`;
  }

  function ticker() {
    const items = [];
    NM.BANCAS.forEach((b) => {
      const r = NM.loadResults(b.id, 4);
      r.slice(-3).reverse().forEach((e) => {
        const c = e.premios[0];
        items.push(`<span class="tk-item">${b.sigla}·${NM.esc(e.extracaoNome)} <b>${c.milhar}</b> <span class="acc">G${NM.pad(c.grupo, 2)}</span> ${NM.bicho(c.grupo).nome.toUpperCase()}</span>`);
      });
    });
    const el = document.getElementById('ticker');
    el.innerHTML = items.join('') + items.join('');
    el.style.animationDuration = `${Math.max(60, items.length * 4)}s`;
  }

  function footer() {
    const f = document.createElement('footer');
    f.className = 'site-footer';
    f.innerHTML = `<div class="wrap">
        <div class="footer-grid">
          <div>${BRAND}<p class="muted" style="margin-top:10px">Resultados, estatística e fechamentos para o jogo do bicho, Quininha e Seninha.</p></div>
          <div><h4>Ferramentas</h4><a href="fechamento.html">Fechamento do bicho</a><a href="quininha.html">Quininha</a><a href="seninha.html">Seninha</a><a href="gerador.html">Gerador</a><a href="conferidor.html">Conferidor</a></div>
          <div><h4>Dados</h4><a href="resultados.html">Resultados</a><a href="estatisticas.html">Estatísticas</a><a href="analises.html">Análises</a></div>
          <div><h4>Referência</h4><a href="tabela.html">Cotações e modalidades</a><a href="sonhos.html">Dicionário dos sonhos</a></div>
        </div>
        <p class="disclaimer">Site informativo. Não vendemos nem intermediamos apostas. Probabilidades e fechamentos são cálculos matemáticos e não garantem prêmio:
        cada sorteio é independente. O jogo do bicho é contravenção penal no Brasil (Decreto-Lei 3.688/41, art. 58). Proibido para menores de 18 anos.
        Cotações de referência: confirme sempre com a sua banca.</p>
      </div>`;
    document.body.append(f);
  }

  /** Executa fn quando o DOM e os dados estiverem prontos. */
  NM.onReady = (fn) => {
    const go = () => NM.ready.then(fn);
    document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', go) : go();
  };

  document.addEventListener('DOMContentLoaded', () => { header(); footer(); });
  NM.onReady(() => { status(); ticker(); setInterval(status, 30000); });
})();
