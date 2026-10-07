/**
 * Parser genérico de páginas de resultado do jogo do bicho.
 *
 * Não depende do layout exato de um site: lê todas as <table> da página e reconhece dois formatos
 *   A) uma tabela por extração, com linhas "1º | 1234 | 09 | Cobra" (título/horário antes da tabela);
 *   B) uma tabela com várias extrações em colunas ("PTM | PT | PTV ...") e prêmios nas linhas.
 * Cada extração precisa ter pelo menos do 1º ao 5º prêmio com 4 dígitos para ser aceita.
 */

const ENT = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", ordm: 'º', deg: '°', ordf: 'ª' };
export function decode(s) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => ENT[n.toLowerCase()] ?? m);
}
export const toText = (html) =>
  decode(html.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

const LABELS = ['PPT', 'PTM', 'PTV', 'PTN', 'PT', 'COR', 'CORUJA', 'FEDERAL', 'FED', 'BAND', 'BANDEIRANTES', 'PTP', 'PNP', 'CTG', 'LOOK', 'NACIONAL', 'MALUCA', 'LOTEP', 'LOTECE', 'ALVORADA', 'CORUJINHA'];
const LABEL_RE = new RegExp(`(?:^|[^A-ZÀ-Ú])(${LABELS.join('|')})(?![A-ZÀ-Ú])`, 'gi');
const TIME_RE = /(?:^|[^\d])([01]?\d|2[0-3])\s*(?::|h|hs|horas?)\s*([0-5]\d)?(?!\d)/gi;
const DATE_RE = /(\d{2})[\/.-](\d{2})[\/.-](\d{4})/g;

function lastMatch(re, text) {
  let m, last = null;
  re.lastIndex = 0;
  while ((m = re.exec(text))) last = m;
  return last;
}
export function findTime(text) {
  const m = lastMatch(TIME_RE, text);
  if (!m) return null;
  return `${m[1].padStart(2, '0')}:${(m[2] || '00').padStart(2, '0')}`;
}
export function findLabel(text) {
  const m = lastMatch(LABEL_RE, text.toUpperCase());
  return m ? m[1].toUpperCase().replace('FEDERAL', 'FED').replace('CORUJINHA', 'COR').replace('CORUJA', 'COR').replace('BANDEIRANTES', 'BAND') : null;
}
export function findDate(text) {
  const m = lastMatch(DATE_RE, text);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

function posicao(cell) {
  const m = /^(\d{1,2})\s*(?:º|°|o|ª|\.)?\s*(?:pr[eê]mio)?$/i.exec(cell.trim());
  if (!m) return null;
  const n = Number(m[1]);
  return n >= 1 && n <= 10 ? n : null;
}
function milhar(cell) {
  const s = cell.replace(/[.\s]/g, '');
  if (!/^\d{3,6}$/.test(s)) return null;
  return s.length > 4 ? s.slice(-4) : s;
}

export function tables(html) {
  html = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');
  const out = [];
  const re = /<table[\s\S]*?<\/table>/gi;
  let m, prevEnd = 0;
  while ((m = re.exec(html))) {
    const before = toText(html.slice(Math.max(prevEnd, m.index - 2500), m.index));
    const rows = [...m[0].matchAll(/<tr[\s\S]*?<\/tr>/gi)].map((r) =>
      [...r[0].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)].map((c) => toText(c[1])));
    const caption = toText((/<caption[\s\S]*?<\/caption>/i.exec(m[0]) || [''])[0]);
    out.push({ context: before.slice(-400) + ' ' + caption, rows: rows.filter((r) => r.length) });
    prevEnd = m.index + m[0].length;
  }
  return out;
}

/**
 * Formato C (blocos em <div>): lê os textos da página em sequência e procura "1º … 1234", "2º … 5678"…
 * O título/horário/data do bloco vêm dos textos imediatamente anteriores ao 1º prêmio.
 */
export function parseBlocks(html, { hoje } = {}) {
  html = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ');
  const toks = [...html.matchAll(/>([^<]+)</g)].map((m) => decode(m[1]).replace(/\s+/g, ' ').trim()).filter(Boolean);
  const out = [];
  for (let i = 0; i < toks.length; i++) {
    if (posicao(toks[i]) !== 1) continue;
    const premios = [];
    let j = i, esperado = 1;
    while (j < toks.length && esperado <= 10) {
      if (posicao(toks[j]) === esperado) {
        const v = toks.slice(j + 1, j + 3).map(milhar).find(Boolean);
        if (!v) break;
        premios[esperado - 1] = v;
        esperado++;
        j += 2;
      } else if (j > i && posicao(toks[j]) === 1) break;
      else j++;
      if (j - i > 60) break;
    }
    // contexto: textos anteriores até o fim do bloco anterior
    const ctx = toks.slice(Math.max(0, i - 8), i).join(' ');
    push(out, { data: findDate(ctx) || hoje, label: findLabel(ctx), hora: findTime(ctx), premios });
    i = Math.max(i, j - 1);
  }
  return out;
}

export function parsePage(html, { hoje } = {}) {
  const pageDate = findDate(toText(html).slice(0, 4000)) || hoje;
  const result = [];

  for (const t of tables(html)) {
    const header = t.rows.find((r) => !posicao(r[0] || '')) || [];

    // Formato D: prêmios em colunas ("Extração | 1º | 2º | … | 5º"), uma extração por linha
    const posCols = header.map((c) => posicao(c));
    if (posCols.filter(Boolean).length >= 5) {
      const date = findDate(t.context) || pageDate;
      for (const r of t.rows) {
        if (r === header || !r[0]) continue;
        const premios = [];
        r.forEach((c, i) => { const p = posCols[i]; if (p) { const v = milhar(c); if (v) premios[p - 1] = v; } });
        push(result, { data: date, label: findLabel(r[0]), hora: findTime(r[0]), premios });
      }
      continue;
    }

    // Formato B: extrações em colunas
    const colMeta = header.map((c) => ({ label: findLabel(c), hora: findTime(c) }));
    const nCols = colMeta.filter((c) => c.label || c.hora).length;
    if (nCols >= 2) {
      const cols = colMeta.map(() => []);
      for (const r of t.rows) {
        const p = posicao(r[0] || '');
        if (!p) continue;
        r.forEach((c, i) => { if (i > 0 && (colMeta[i]?.label || colMeta[i]?.hora)) { const v = milhar(c); if (v) cols[i][p - 1] = v; } });
      }
      const date = findDate(t.context) || findDate(header.join(' ')) || pageDate;
      cols.forEach((premios, i) => {
        if (!(colMeta[i]?.label || colMeta[i]?.hora)) return;
        push(result, { data: date, label: colMeta[i].label, hora: colMeta[i].hora, premios });
      });
      continue;
    }

    // Formato A: uma extração por tabela
    const premios = [];
    for (const r of t.rows) {
      const p = posicao(r[0] || '');
      if (!p) continue;
      const v = r.slice(1).map(milhar).find(Boolean);
      if (v) premios[p - 1] = v;
    }
    const ctx = `${t.context} ${header.join(' ')}`;
    push(result, { data: findDate(ctx) || pageDate, label: findLabel(ctx), hora: findTime(ctx), premios });
  }
  return result.length ? result : parseBlocks(html, { hoje: pageDate });
}

function push(list, { data, label, hora, premios }) {
  const p = premios.slice(0, 7);
  if (p.length < 5 || p.slice(0, 5).some((x) => !x || x.length !== 4)) return;
  if (!data || (!label && !hora)) return;
  list.push({ data, label, hora, premios: p.map((x) => x || null) });
}
