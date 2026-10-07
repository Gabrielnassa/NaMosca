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

// Formato em blocos (deunoposte.app.br)
const blocos = `<p class="chamada-tabela">Resultado ... sorteio 9 horas PPT premiou a milhar 2279</p><div class="caixa-tabela bixo"><div class="topo-tabela"><h2><span class="titulo">Deu no Poste Rio de Janeiro</span><span class="sorteio">Sorteio 9 horas PPT</span><span class="texto-sorteio">terça-feira 06/10/2026</span></h2></div>
<div class="numeros-bicho"><div class="bicho-individual"><span class="numero-individual">1º</span><span class="milhar">2279</span><small>Peru (20) </small></div>
<div class="bicho-individual"><span class="numero-individual">2º</span><span class="milhar">6544</span><small>Cavalo (11) </small></div>
<div class="bicho-individual"><span class="numero-individual">3º</span><span class="milhar">3883</span><small>Touro (21) </small></div>
<div class="bicho-individual"><span class="numero-individual">4º</span><span class="milhar">0203</span><small>Avestruz (1) </small></div>
<div class="bicho-individual"><span class="numero-individual">5º</span><span class="milhar">6565</span><small>Macaco (17) </small></div>
<div class="bicho-individual"><span class="numero-individual">6º</span><span class="milhar">19474</span><small>Soma </small></div>
<div class="bicho-individual"><span class="numero-individual">7º</span><span class="milhar">913</span><small>Multiplicação </small></div></div></div>
<p class="chamada-tabela">Resultado ... sorteio 21 horas Corujinha premiou</p><div class="caixa-tabela"><h2><span class="sorteio">Sorteio 21 horas Corujinha</span><span class="texto-sorteio">segunda-feira 05/10/2026</span></h2>
<div class="bicho-individual"><span>1º</span><span>3451</span><small>Galo (13)</small></div><div><span>2º</span><span>6879</span><small>Peru (20)</small></div>
<div><span>3º</span><span>5024</span></div><div><span>4º</span><span>9438</span></div><div><span>5º</span><span>1480</span></div></div>`;
const c = parsePage(blocos, { hoje: '2026-10-06' });
assert.deepEqual(c.map((x) => [x.label, x.hora, x.data, x.premios.join(',')]), [
  ['PPT', '09:00', '2026-10-06', '2279,6544,3883,0203,6565,9474,913'],
  ['COR', '21:00', '2026-10-05', '3451,6879,5024,9438,1480'],
]);
console.log('blocos ok');

// Formato D (portalbrasil, arquivo diário): prêmios em colunas
const diario = `<p>Acompanhe o resultado do Jogo do Bicho de <strong>02/10/2026</strong>.</p><h2>Resultado de 02/10/2026 – Rio de Janeiro</h2><table><thead><tr><th>EXTRAÇÃO</th><th>1º</th><th>2º</th><th>3º</th><th>4º</th><th>5º</th><th>STATUS</th></tr></thead><tbody>
<tr><td>PPT 09h</td><td>2707</td><td>7738</td><td>1360</td><td>6359</td><td>2583</td><td><strong>ÁGUIA</strong></td></tr>
<tr><td>FEDERAL 11h<br /><span>Somente domingo</span></td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td>só aos DOMINGOS</td></tr>
<tr><td>PTM 11h</td><td>9802</td><td>1348</td><td>4301</td><td>3815</td><td>4848</td><td>AVESTRUZ</td></tr>
<tr><td>CORUJA 21h</td><td>1111</td><td>2222</td><td>3333</td><td>4444</td><td>5555</td><td>x</td></tr></tbody></table>`;
const d = parsePage(diario, { hoje: '2026-10-07' });
assert.deepEqual(d.map((x) => [x.label, x.hora, x.data, x.premios[0]]), [['PPT', '09:00', '2026-10-02', '2707'], ['PTM', '11:00', '2026-10-02', '9802'], ['COR', '21:00', '2026-10-02', '1111']]);
console.log('diário ok');
