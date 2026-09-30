/* Na Mosca — layout comum (cabeçalho, rodapé, tema) e componentes visuais. */
(function () {
  const NM = window.NM;

  const NAV = [
    ['index.html', 'Início'],
    ['resultados.html', 'Resultados'],
    ['estatisticas.html', 'Estatísticas'],
    ['analises.html', 'Análises'],
    ['gerador.html', 'Gerador'],
    ['conferidor.html', 'Conferidor'],
    ['tabela.html', 'Tabela'],
    ['sonhos.html', 'Sonhos'],
  ];

  const LOGO = `<svg class="logo-mark" viewBox="0 0 40 40" aria-hidden="true">
    <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" stroke-width="2.5"/>
    <circle cx="20" cy="20" r="11" fill="none" stroke="currentColor" stroke-width="2.5"/>
    <circle cx="20" cy="20" r="4.5" fill="var(--accent)"/>
    <ellipse cx="15.5" cy="16" rx="3.2" ry="1.8" fill="currentColor" opacity=".55" transform="rotate(-35 15.5 16)"/>
    <ellipse cx="24.5" cy="16" rx="3.2" ry="1.8" fill="currentColor" opacity=".55" transform="rotate(35 24.5 16)"/>
  </svg>`;

  // Tema: salvo por visitante, com fallback silencioso
  function getTheme() {
    try { return localStorage.getItem('nm-theme'); } catch (e) { return null; }
  }
  function setTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('nm-theme', t); } catch (e) {}
  }
  const saved = getTheme();
  if (saved) document.documentElement.setAttribute('data-theme', saved);

  NM.getBanca = () => {
    const q = new URLSearchParams(location.search).get('banca');
    if (q) return q;
    try { return localStorage.getItem('nm-banca') || 'rj'; } catch (e) { return 'rj'; }
  };
  NM.setBanca = (id) => { try { localStorage.setItem('nm-banca', id); } catch (e) {} };

  function header() {
    const page = location.pathname.split('/').pop() || 'index.html';
    const h = document.createElement('header');
    h.className = 'site-header';
    h.innerHTML = `
      <div class="wrap header-row">
        <a class="brand" href="index.html">${LOGO}<span>Na <b>Mosca</b></span></a>
        <button class="menu-btn" aria-label="Abrir menu" aria-expanded="false">☰</button>
        <nav class="nav">${NAV.map(([href, label]) =>
          `<a href="${href}"${href === page ? ' aria-current="page"' : ''}>${label}</a>`).join('')}
          <button class="theme-btn" title="Alternar tema claro/escuro" aria-label="Alternar tema">◐</button>
        </nav>
      </div>`;
    document.body.prepend(h);
    const btn = h.querySelector('.menu-btn');
    btn.addEventListener('click', () => {
      const open = h.classList.toggle('open');
      btn.setAttribute('aria-expanded', open);
    });
    h.querySelector('.theme-btn').addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme') ||
        (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      setTheme(cur === 'dark' ? 'light' : 'dark');
    });
  }

  function footer() {
    const f = document.createElement('footer');
    f.className = 'site-footer';
    f.innerHTML = `
      <div class="wrap">
        <div class="footer-grid">
          <div>
            <a class="brand" href="index.html">${LOGO}<span>Na <b>Mosca</b></span></a>
            <p class="muted">Estatísticas, análises e ferramentas para quem gosta de estudar o jogo do bicho.</p>
          </div>
          <div>
            <h4>Ferramentas</h4>
            <a href="gerador.html">Gerador de palpites</a>
            <a href="conferidor.html">Conferidor</a>
            <a href="estatisticas.html">Estatísticas</a>
          </div>
          <div>
            <h4>Consulta</h4>
            <a href="resultados.html">Resultados</a>
            <a href="tabela.html">Tabela dos bichos</a>
            <a href="sonhos.html">Dicionário dos sonhos</a>
          </div>
        </div>
        <p class="disclaimer">
          <b>Aviso:</b> o Na Mosca é um site informativo e de entretenimento. Não vendemos apostas nem
          intermediamos jogos. Nenhuma estatística ou palpite garante acerto — cada sorteio é independente.
          O jogo do bicho é considerado contravenção penal no Brasil (Decreto-Lei 3.688/41, art. 58).
          Proibido para menores de 18 anos. Jogue com responsabilidade.
          <br>Os resultados exibidos nesta versão são <b>dados de demonstração</b> gerados automaticamente.
        </p>
      </div>`;
    document.body.append(f);
  }

  /* ---------- helpers ---------- */
  NM.$ = (s, r = document) => r.querySelector(s);
  NM.$$ = (s, r = document) => [...r.querySelectorAll(s)];
  NM.esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  NM.pct = (x, d = 1) => (x * 100).toFixed(d).replace('.', ',') + '%';
  NM.num = (x, d = 0) => Number(x).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });

  NM.chip = (g, extra = '') => {
    const b = NM.bicho(g);
    return `<span class="chip ${extra}" title="Grupo ${b.grupo} — ${b.nome} (${b.dezenas.join(', ')})">
      <span class="chip-emoji">${b.emoji}</span><span class="chip-g">${NM.pad(b.grupo, 2)}</span><span class="chip-n">${b.nome}</span></span>`;
  };

  NM.bancaSelect = (container, onChange) => {
    const cur = NM.getBanca();
    container.innerHTML = `<label class="field"><span>Banca</span><select>${NM.BANCAS.map((b) =>
      `<option value="${b.id}"${b.id === cur ? ' selected' : ''}>${b.nome}</option>`).join('')}</select></label>`;
    container.querySelector('select').addEventListener('change', (e) => {
      NM.setBanca(e.target.value);
      onChange(e.target.value);
    });
  };

  /* Tabela de uma extração */
  NM.extracaoCard = (ext, { compact = false } = {}) => {
    const rows = ext.premios.slice(0, compact ? 5 : 7).map((p) => {
      const b = NM.bicho(p.grupo);
      const is7 = p.posicao === 7;
      return `<tr${p.posicao === 1 ? ' class="cabeca"' : ''}>
        <td class="pos">${p.posicao}º</td>
        <td class="milhar">${p.milhar}</td>
        <td>${is7 ? '<span class="muted">—</span>' : `${b.emoji} <span class="gnum">${NM.pad(b.grupo, 2)}</span> ${b.nome}`}</td>
      </tr>`;
    }).join('');
    return `<article class="card ext-card">
      <header><div><b>${NM.esc(ext.extracaoNome)}</b> <span class="muted">${ext.hora}</span></div>
      <span class="muted small">${NM.fmtDate(ext.data)}</span></header>
      <table class="res-table"><tbody>${rows}</tbody></table>
    </article>`;
  };

  /* ---------- Tooltip único ---------- */
  let tip;
  NM.tooltip = (root) => {
    if (!tip) {
      tip = document.createElement('div');
      tip.className = 'tooltip';
      tip.setAttribute('role', 'tooltip');
      document.body.append(tip);
    }
    root.addEventListener('pointermove', (e) => {
      const t = e.target.closest('[data-tip]');
      if (!t || !root.contains(t)) { tip.style.opacity = 0; return; }
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

  /**
   * Gráfico de barras vertical (série única) em HTML.
   * items: [{label, value, tip, highlight}]
   */
  NM.barChart = (el, items, { ref = null, refLabel = '', fmt = (v) => v } = {}) => {
    const max = Math.max(...items.map((i) => i.value), ref || 0) || 1;
    const refLine = ref != null
      ? `<div class="bc-ref" style="bottom:${(ref / max) * 100}%"><span>${refLabel}</span></div>` : '';
    el.innerHTML = `<div class="bar-chart" style="--n:${items.length}">
      <div class="bc-plot">${refLine}${items.map((i) => `
        <div class="bc-col" data-tip="${NM.esc(i.tip || `${i.label}: ${fmt(i.value)}`)}">
          <div class="bc-bar${i.highlight ? ' hl' : ''}" style="height:${(i.value / max) * 100}%"></div>
        </div>`).join('')}
      </div>
      <div class="bc-axis">${items.map((i) => `<span>${i.label}</span>`).join('')}</div>
    </div>`;
    NM.tooltip(el);
  };

  /** Barras horizontais com rótulo e valor à direita. */
  NM.hbars = (el, items, { fmt = (v) => v } = {}) => {
    const max = Math.max(...items.map((i) => i.value)) || 1;
    el.innerHTML = `<div class="hbars">${items.map((i) => `
      <div class="hb-row" data-tip="${NM.esc(i.tip || '')}">
        <div class="hb-label">${i.label}</div>
        <div class="hb-track"><div class="hb-bar${i.highlight ? ' hl' : ''}" style="width:${(i.value / max) * 100}%"></div></div>
        <div class="hb-val">${fmt(i.value)}</div>
      </div>`).join('')}</div>`;
    NM.tooltip(el);
  };

  document.addEventListener('DOMContentLoaded', () => {
    header();
    footer();
  });
})();
