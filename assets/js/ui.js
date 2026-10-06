/* Na Mosca — layout comum (barra de status, cabeçalho, ticker, rodapé, tema) e componentes visuais. */
(function () {
  const NM = window.NM;

  const NAV = [
    [null, 'Principal'],
    ['index.html', 'Início', 'home'],
    ['resultados.html', 'Resultados', 'list'],
    ['estatisticas.html', 'Estatísticas', 'chart'],
    [null, 'Ferramentas'],
    ['fechamento-pro.html', 'Fechamento PRO', 'grid', true],
    ['fechamento.html', 'Fechamento do bicho', 'layers'],
    ['quininha.html', 'Quininha', 'ticket'],
    ['seninha.html', 'Seninha', 'ticket'],
    ['gerador.html', 'Gerador', 'dice'],
    ['conferidor.html', 'Conferidor', 'check'],
    [null, 'Referência'],
    ['tabela.html', 'Cotações', 'book'],
    ['analises.html', 'Análises', 'news'],
    ['sonhos.html', 'Sonhos', 'moon'],
  ];

  const ICON = {
    home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    list: '<line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/>',
    grid: '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
    ticket: '<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/>',
    chart: '<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    check: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
    dice: '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><circle cx="15.5" cy="15.5" r="1.5"/><circle cx="15.5" cy="8.5" r="1.5"/><circle cx="8.5" cy="15.5" r="1.5"/>',
    menu: '<line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>',
    layers: '<path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/>',
    news: '<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  };
  NM.icon = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[n]}</svg>`;

  const BOTTOM = [['index.html', 'Início', 'home'], ['resultados.html', 'Resultados', 'list'], ['fechamento.html', 'Fechamento', 'grid'], ['fechamento-pro.html', 'PRO', 'ticket'], ['estatisticas.html', 'Estatísticas', 'chart']];

  const LOGO = `<svg class="logo-mark" viewBox="0 0 40 40" aria-hidden="true">
    <defs><linearGradient id="nmg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#34d399"/><stop offset="1" stop-color="#059669"/></linearGradient></defs>
    <rect width="40" height="40" rx="11" fill="url(#nmg)"/>
    <circle cx="20" cy="20" r="11" fill="none" stroke="#04150f" stroke-width="2.4" opacity=".9"/>
    <circle cx="20" cy="20" r="5.5" fill="none" stroke="#04150f" stroke-width="2.4" opacity=".9"/>
    <circle cx="20" cy="20" r="2" fill="#fbbf24"/></svg>`;
  const BRAND = `<a class="brand" href="index.html" aria-label="Na Mosca — início">${LOGO}<span class="brand-word">Na Mosca<small>Resultados &amp; fechamentos</small></span></a>`;

  // tema: escuro por padrão
  try { const t = localStorage.getItem('nm-tema'); if (t) document.documentElement.setAttribute('data-theme', t); } catch (e) {}

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
    container.innerHTML = `<div class="banca-bar"><div class="lbl">${NM.icon('pin')}<span>Banca: <b>${NM.esc(NM.banca(cur).nome)}</b></span> ${NM.statusTag(cur)}</div>
      <select aria-label="Alterar banca">${NM.BANCAS.map((b) => `<option value="${b.id}"${b.id === cur ? ' selected' : ''}>${b.nome}</option>`).join('')}</select></div>`;
    if (container.parentElement && container.parentElement.classList.contains('toolbar')) container.style.flex = '1 1 320px';
    container.querySelector('select').addEventListener('change', (e) => {
      NM.setBanca(e.target.value);
      container.querySelector('.lbl').innerHTML = `${NM.icon('pin')}<span>Banca: <b>${NM.esc(NM.banca(e.target.value).nome)}</b></span> ${NM.statusTag(e.target.value)}`;
      onChange(e.target.value);
    });
  };

  NM.extracaoCard = (ext, { compact = false } = {}) => {
    const p = ext.premios;
    const box = (x) => {
      const b = NM.bicho(x.grupo);
      return `<div class="premio${x.posicao === 1 ? ' first' : ''}"><div class="pl">${x.posicao}º prêmio</div><div class="pm">${x.milhar}</div><div class="pb">${b.nome} <span>${NM.pad(b.grupo, 2)}</span></div></div>`;
    };
    const titulo = `${ext.hora ? ext.hora.replace(':', 'h') + ' · ' : ''}${NM.esc(ext.extracaoNome)}`;
    const extra = !compact && p.length > 5
      ? `<div class="ext-extra">${p[5] ? `<span>6º <b>${p[5].milhar}</b> ${NM.bicho(p[5].grupo).nome}</span>` : ''}${p[6] ? `<span>7º <b>${p[6].milhar}</b></span>` : ''}</div>` : '';
    return `<article class="card ext-card"><header><h3>${titulo}</h3><span class="muted small">${NM.fmtDate(ext.data)}</span></header>
      <div class="premios${compact ? ' compact' : ''}">${p.slice(0, 5).map(box).join('')}</div>${extra}</article>`;
  };

  /**
   * Grade de sorteios do dia `dia` (ISO). opts: { sel, onSelect(id), link(id) }
   */
  NM.grade = (el, dia, opts = {}) => {
    const hoje = NM.isoDate(new Date());
    const agora = new Date();
    const mins = agora.getHours() * 60 + agora.getMinutes();
    const dow = new Date(dia + 'T12:00').getDay();
    const porBanca = {};
    const res = (b) => (porBanca[b] = porBanca[b] || NM.loadResults(b, 180));
    el.innerHTML = NM.SORTEIOS.map((s) => {
      let cls = '', val = '', bx = '';
      const [h, m] = s.hora.split(':').map(Number);
      if (s.status === 'novo') { cls = 'novo'; bx = 'em breve'; }
      else if (!s.dias.includes(dow)) { cls = 'folga'; bx = 'não corre'; }
      else if (s.banca) {
        const e = res(s.banca).find((x) => x.data === dia && x.extracao === s.id);
        if (e) { cls = 'saiu'; val = e.premios[0].milhar; bx = NM.bicho(e.premios[0].grupo).nome; }
        else if (dia === hoje && mins < h * 60 + m + 10) { cls = 'aguardando'; bx = 'aguardando'; }
        else bx = 'sem resultado';
      } else { cls = 'loto'; bx = s.nome; }
      if (s.tipo !== 'bicho') cls += ' loto';
      if (opts.sel === s.id) cls += ' sel';
      const href = s.link || (opts.link ? opts.link(s.id) : null);
      const tag = href ? `a href="${href}"` : 'button type="button"';
      return `<${tag} class="sorteio ${cls}" data-id="${s.id}" title="${NM.esc(s.nome)} · ${s.hora}"><span class="st"></span>
        <span class="cod">${s.id}</span><span class="hr">${s.hora.replace(':', 'h')}</span>${val ? `<span class="val">${val}</span>` : ''}<span class="bx">${bx}</span></${href ? 'a' : 'button'}>`;
    }).join('');
    if (opts.onSelect) el.onclick = (e) => { const b = e.target.closest('button.sorteio'); if (b) opts.onSelect(b.dataset.id); };
  };
  NM.gradeLegenda = '<div class="grade-legenda"><span><i style="background:#22c55e"></i>saiu</span><span><i style="background:#f59e0b"></i>aguardando</span><span><i style="background:#d1d5db"></i>sem resultado</span><span><i style="background:#fff;border:1px dashed #9ca3af"></i>novo · em breve</span></div>';

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
    const side = document.createElement('aside');
    side.className = 'sidebar';
    side.setAttribute('aria-label', 'Menu');
    side.innerHTML = BRAND + NAV.map(([href, label, ic, pro]) => href
      ? `<a class="side-link" href="${href}"${href === page ? ' aria-current="page"' : ''}>${NM.icon(ic)}<span>${label}</span>${pro ? '<span class="pro-badge">PRO</span>' : ''}</a>`
      : `<div class="side-sec">${label}</div>`).join('')
      + `<div class="side-foot" id="side-foot"><span class="live-dot demo"></span>carregando…</div>`;
    const ov = document.createElement('div');
    ov.className = 'overlay';
    const top = document.createElement('div');
    top.className = 'topbar';
    top.innerHTML = `<button class="icon-btn menu-btn" aria-label="Abrir menu">${NM.icon('menu')}</button><a class="top-brand" href="index.html">${LOGO}<span>Na Mosca</span></a>
      <form class="search" action="resultados.html" role="search">${NM.icon('search')}<input type="search" name="q" placeholder="Buscar milhar ou dezena nos resultados…" inputmode="numeric" maxlength="4" aria-label="Buscar milhar"></form>
      <div class="top-meta"><span class="hide-sm" id="top-data"></span><span id="top-hora"></span>
        <button class="icon-btn" id="tema-btn" aria-label="Alternar tema claro/escuro" title="Tema claro/escuro">${NM.icon('sun')}</button></div>`;
    document.body.prepend(side, ov, top);
    const fechar = () => document.body.classList.remove('nav-open');
    top.querySelector('.menu-btn').addEventListener('click', () => document.body.classList.toggle('nav-open'));
    ov.addEventListener('click', fechar);
    top.querySelector('#tema-btn').addEventListener('click', () => {
      const t = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', t);
      try { localStorage.setItem('nm-tema', t); } catch (e) {}
    });
    const relogio = () => {
      const d = new Date();
      top.querySelector('#top-hora').innerHTML = `<b>${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}</b> BRT`;
      top.querySelector('#top-data').textContent = d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', timeZone: 'America/Sao_Paulo' });
    };
    relogio(); setInterval(relogio, 20000);
    const bn = document.createElement('nav');
    bn.className = 'bottom-nav';
    bn.setAttribute('aria-label', 'Atalhos');
    bn.innerHTML = BOTTOM.map(([href, label, ic]) => `<a href="${href}"${href === page ? ' aria-current="page"' : ''}>${NM.icon(ic)}<span>${label}</span></a>`).join('');
    document.body.append(bn);
  }

  function statusFonte() {
    const vivas = NM.BANCAS.filter((b) => NM.isLive(b.id));
    const el = document.getElementById('side-foot');
    if (el) el.innerHTML = vivas.length
      ? `<span class="live-dot"></span>Ao vivo: ${vivas.map((b) => b.sigla).join(' · ')}<br><span style="opacity:.7">atualiza a cada 15 min</span>`
      : '<span class="live-dot demo"></span>Modo demonstração';
  }

  function footer() {
    const f = document.createElement('footer');
    f.className = 'site-footer';
    f.innerHTML = `<div class="wrap">
        <div class="footer-grid">
          <div>${BRAND}<p class="muted" style="margin-top:10px">Resultados, estatística e fechamentos para o jogo do bicho, Quininha e Seninha.</p></div>
          <div><h4>Ferramentas</h4><a href="fechamento-pro.html">Fechamento PRO</a><a href="fechamento.html">Fechamento do bicho</a><a href="quininha.html">Quininha</a><a href="seninha.html">Seninha</a><a href="gerador.html">Gerador</a><a href="conferidor.html">Conferidor</a></div>
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
  NM.onReady(statusFonte);
})();
