#!/usr/bin/env node
// Mostra a estrutura de uma página de resultados (para ajustar o parser). Uso: node scripts/inspecionar.mjs URL [URL...]
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';
for (const url of process.argv.slice(2)) {
  console.log(`\n==================== ${url}`);
  try {
    const r = await fetch(url, { headers: { 'user-agent': UA, accept: 'text/html' } });
    let h = await r.text();
    console.log(`status ${r.status} · ${h.length} bytes · tables=${(h.match(/<table/gi) || []).length} · scripts=${(h.match(/<script/gi) || []).length}`);
    h = h.replace(/<script[\s\S]*?<\/script>/gi, '<script/>').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<svg[\s\S]*?<\/svg>/gi, '<svg/>').replace(/\s+/g, ' ');
    // trecho a partir da primeira milhar com cara de resultado
    const i = h.search(/>\s*\d{4}\s*</);
    console.log('--- primeira milhar em', i);
    console.log(h.slice(Math.max(0, i - 2500), i + 3500));
    const links = [...new Set([...h.matchAll(/href="([^"]+)"/gi)].map((m) => m[1]).filter((u) => /paulo|sp|band|federal|look|nacional/i.test(u)))].slice(0, 40);
    console.log('--- links:', links.join('\n'));
    const urls = [...new Set([...h.matchAll(/https?:\/\/[^"' ]*(json|api)[^"' ]*/gi)].map((m) => m[0]))].slice(0, 15);
    console.log('--- urls json/api:', urls.join('\n'));
  } catch (e) { console.log('erro', e.message); }
}
