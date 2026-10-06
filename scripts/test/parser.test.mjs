// Teste do parser com layouts típicos. Rode: node scripts/test/parser.test.mjs
import assert from 'node:assert/strict';
import { parsePage } from '../parser.mjs';

const porTabela = `<html><h1>Resultado do Jogo do Bicho RJ - 06/10/2026</h1>
<div><h2>Resultado PTM 11:20 - 06/10/2026</h2><table>
<tr><th>Prêmio</th><th>Milhar</th><th>Grupo</th><th>Bicho</th></tr>
<tr><td>1º</td><td>4.532</td><td>08</td><td>Camelo</td></tr>
<tr><td>2º</td><td>0120</td><td>05</td><td>Cachorro</td></tr>
<tr><td>3&ordm;</td><td>8623</td><td>06</td><td>Cabra</td></tr>
<tr><td>4º</td><td>7050</td><td>13</td><td>Galo</td></tr>
<tr><td>5º</td><td>1112</td><td>03</td><td>Burro</td></tr>
<tr><td>6º</td><td>1437</td><td>10</td><td>Coelho</td></tr>
<tr><td>7º</td><td>544</td><td>11</td><td>Cavalo</td></tr></table></div>
<div><h2>Resultado PT 14h20</h2><table>
<tr><td>1º Prêmio</td><td>9674</td></tr><tr><td>2º Prêmio</td><td>7912</td></tr><tr><td>3º Prêmio</td><td>4191</td></tr>
<tr><td>4º Prêmio</td><td>1649</td></tr><tr><td>5º Prêmio</td><td>8857</td></tr></table></div>
<table><tr><td>Menu</td><td>Links</td></tr></table></html>`;

const colunas = `<p>Deu no poste 05/10/2026</p><table>
<tr><th></th><th>PTM</th><th>PT</th><th>PTV</th></tr>
<tr><td>1º</td><td>1111</td><td>2222</td><td>3333</td></tr>
<tr><td>2º</td><td>1112</td><td>2223</td><td>3334</td></tr>
<tr><td>3º</td><td>1113</td><td>2224</td><td></td></tr>
<tr><td>4º</td><td>1114</td><td>2225</td><td></td></tr>
<tr><td>5º</td><td>1115</td><td>2226</td><td></td></tr></table>`;

const a = parsePage(porTabela, { hoje: '2026-10-06' });
assert.equal(a.length, 2);
assert.deepEqual(a[0], { data: '2026-10-06', label: 'PTM', hora: '11:20', premios: ['4532', '0120', '8623', '7050', '1112', '1437', '544'] });
assert.equal(a[1].hora, '14:20');
assert.equal(a[1].label, 'PT');

const b = parsePage(colunas, { hoje: '2026-10-06' });
assert.equal(b.length, 2, 'PTV incompleto deve ser descartado');
assert.deepEqual(b.map((x) => [x.label, x.data, x.premios[0]]), [['PTM', '2026-10-05', '1111'], ['PT', '2026-10-05', '2222']]);
console.log('parser ok');
