// Teste de fumaça: abre todas as páginas e falha se houver erro de JavaScript ou rolagem lateral no celular.
// Uso: servidor em http://localhost:8765 e `node scripts/test/e2e.mjs`
import { chromium } from 'playwright';
import { readdirSync } from 'node:fs';
const base = process.env.BASE || 'http://localhost:8765';
const paginas = readdirSync('.').filter((f) => f.endsWith('.html'));
const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
let falhas = 0;
for (const [nome, vp] of [['desktop', { width: 1360, height: 900 }], ['celular', { width: 390, height: 844 }]]) {
  const ctx = await b.newContext({ viewport: vp });
  for (const p of paginas) {
    const pg = await ctx.newPage(); const erros = [];
    pg.on('pageerror', (e) => erros.push(e.message));
    await pg.goto(`${base}/${p}`); await pg.waitForTimeout(600);
    const lateral = await pg.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    if (erros.length || lateral) { falhas++; console.log(`✗ ${nome} ${p}`, erros, lateral ? 'rolagem lateral' : ''); } else console.log(`✓ ${nome} ${p}`);
    await pg.close();
  }
}
await b.close();
process.exit(falhas ? 1 : 0);
