#!/usr/bin/env node
/**
 * Coletor de resultados do Na Mosca.
 *  - Jogo do bicho: lê as páginas de scripts/fontes.json e grava data/bicho/<banca>.json
 *  - Loterias Caixa (Mega-Sena, Quina, Federal): grava data/loterias/<jogo>.json
 *
 * Uso: node scripts/atualizar-resultados.mjs [--so-bicho] [--so-loterias] [--backfill=60]
 * Roda no GitHub Actions (.github/workflows/resultados.yml) e também localmente (Node 20+).
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsePage } from './parser.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]));
const cfg = JSON.parse(await readFile(join(ROOT, 'scripts/fontes.json'), 'utf8'));
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';
const MANTER_DIAS = 400;

const hojeBRT = () => new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, type = 'text') {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 20000);
  try {
    const r = await fetch(url, { headers: { 'user-agent': UA, accept: type === 'json' ? 'application/json' : 'text/html' }, signal: ctrl.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return type === 'json' ? r.json() : r.text();
  } finally { clearTimeout(t); }
}
async function readJSON(p, fallback) {
  try { return JSON.parse(await readFile(p, 'utf8')); } catch { return fallback; }
}
async function writeJSON(p, obj) {
  await mkdir(dirname(p), { recursive: true });
  await writeFile(p, JSON.stringify(obj) + '\n');
}

/* ---------------- Jogo do bicho ---------------- */
function completar(premios) {
  const p = premios.slice(0, 7);
  const n = p.slice(0, 5).map(Number);
  if (!p[5]) p[5] = String(n.reduce((a, b) => a + b, 0) % 10000).padStart(4, '0');
  if (!p[6]) p[6] = String(Math.floor((n[0] * n[1]) / 1000) % 1000).padStart(3, '0');
  return p;
}

/** Código do sorteio na grade da banca (ex.: PTM → CTG, 17:20 em SP → SP17). */
function codigo(b, e) {
  const m = b.mapa || {};
  if (e.label && m[e.label]) return m[e.label];
  if (e.hora && m[e.hora]) return m[e.hora];
  if (b.prefixoHora && e.hora) return b.prefixoHora + e.hora.slice(0, 2);
  return e.label || `H${(e.hora || '').replace(':', '')}`;
}

async function coletarBanca(b) {
  const arq = join(ROOT, 'data/bicho', `${b.id}.json`);
  const atual = await readJSON(arq, { banca: b.id, nome: b.nome, extracoes: [] });
  const porChave = new Map(atual.extracoes.map((e) => [`${e.data}|${e.id}`, e]));
  let novos = 0, fonteOk = null;

  for (const url of b.urls) {
    try {
      const html = await get(url);
      const lidas = parsePage(html, { hoje: hojeBRT() });
      if (!lidas.length) { console.log(`  ${b.id}: nenhuma extração reconhecida em ${url}`); continue; }
      for (const e of lidas) {
        const id = codigo(b, e);
        const chave = `${e.data}|${id}`;
        const reg = { data: e.data, id, nome: id, hora: e.hora, premios: completar(e.premios) };
        const antes = porChave.get(chave);
        if (!antes || JSON.stringify(antes.premios) !== JSON.stringify(reg.premios)) novos++;
        porChave.set(chave, reg);
      }
      fonteOk = url;
      console.log(`  ${b.id}: ${lidas.length} extrações lidas de ${url}`);
      break;
    } catch (err) {
      console.log(`  ${b.id}: falha em ${url} (${err.message})`);
    }
  }
  if (!fonteOk) return 0;
  const limite = new Date(Date.now() - MANTER_DIAS * 864e5).toISOString().slice(0, 10);
  const extracoes = [...porChave.values()]
    .filter((e) => e.data >= limite)
    .sort((a, b) => (a.data + (a.hora || '')).localeCompare(b.data + (b.hora || '')));
  if (novos) await writeJSON(arq, { banca: b.id, nome: b.nome, fonte: fonteOk, atualizado: new Date().toISOString(), extracoes });
  return novos;
}

/* ---------------- Loterias Caixa ---------------- */
const iso = (d) => { const [dd, mm, yy] = String(d).split('/'); return yy ? `${yy}-${mm}-${dd}` : d; };

async function concurso(jogo, numero) {
  const sufixo = numero ? `/${numero}` : '';
  try {
    const j = await get(`${cfg.caixa}/${jogo}${sufixo}`, 'json');
    return { numero: j.numero, data: iso(j.dataApuracao), dezenas: (j.dezenasSorteadasOrdemSorteio?.length ? j.dezenasSorteadasOrdemSorteio : j.listaDezenas).map(String) };
  } catch (e) {
    const j = await get(`${cfg.caixaAlternativa}/${jogo}/${numero || 'latest'}`, 'json');
    return { numero: j.concurso, data: iso(j.data), dezenas: (j.dezenasOrdemSorteio?.length ? j.dezenasOrdemSorteio : j.dezenas).map(String) };
  }
}

async function coletarLoteria(jogo, backfill) {
  const arq = join(ROOT, 'data/loterias', `${jogo}.json`);
  const atual = await readJSON(arq, { jogo, concursos: [] });
  const tem = new Set(atual.concursos.map((c) => c.numero));
  const ultimo = await concurso(jogo);
  const lista = [...atual.concursos];
  if (!tem.has(ultimo.numero)) lista.push(ultimo);
  for (let n = ultimo.numero - 1; n > ultimo.numero - backfill && n > 0; n--) {
    if (tem.has(n)) continue;
    try { lista.push(await concurso(jogo, n)); await sleep(250); } catch (e) { console.log(`  ${jogo} ${n}: ${e.message}`); }
  }
  lista.sort((a, b) => b.numero - a.numero);
  const novos = lista.length - atual.concursos.length;
  if (novos) await writeJSON(arq, { jogo, atualizado: new Date().toISOString(), concursos: lista.slice(0, 500) });
  console.log(`  ${jogo}: último ${ultimo.numero} (${ultimo.data}), +${novos}`);
  return novos;
}

/* Federal também alimenta o jogo do bicho (5 bilhetes → 5 milhares) */
async function federalParaBicho() {
  const fed = await readJSON(join(ROOT, 'data/loterias/federal.json'), null);
  if (!fed) return;
  const extracoes = fed.concursos.slice().reverse()
    .filter((c) => c.dezenas.length >= 5)
    .map((c) => ({ data: c.data, id: 'FED', nome: `Federal ${c.numero}`, hora: '19:00', premios: completar(c.dezenas.slice(0, 5).map((d) => d.replace(/\D/g, '').slice(-4).padStart(4, '0'))) }));
  await writeJSON(join(ROOT, 'data/bicho/fed.json'), { banca: 'fed', nome: 'Federal', fonte: 'Caixa', atualizado: new Date().toISOString(), extracoes });
}

let total = 0;
if (!args['so-loterias']) {
  console.log('Jogo do bicho');
  for (const b of cfg.bancas) total += await coletarBanca(b);
}
if (!args['so-bicho']) {
  console.log('Loterias Caixa');
  for (const j of cfg.loterias) {
    try { total += await coletarLoteria(j, Number(args.backfill || 60)); } catch (e) { console.log(`  ${j}: falha (${e.message})`); }
  }
  await federalParaBicho();
}
console.log(`Concluído: ${total} registro(s) novo(s).`);
