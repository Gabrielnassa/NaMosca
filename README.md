# Na Mosca

Site de resultados e ferramentas para o jogo do bicho, a Quininha e a Seninha: resultados de todas as bancas,
estatísticas, fechamentos com garantia e retorno esperado de cada aposta. É um site estático
(HTML, CSS e JavaScript, sem build), alimentado por um coletor que roda no GitHub Actions.

## Páginas

| Página | Conteúdo |
|---|---|
| `index.html` | Painel: último resultado, quadro de todas as bancas, em alta/em baixa, atrasos, frequência, retorno por modalidade |
| `resultados.html` | 1º ao 7º prêmio por banca e data, busca de milhar/dezena |
| `estatisticas.html` | Frequência, atraso atual/médio/recorde, tendência, puxada, mapa de calor, dezenas, dígitos |
| `fechamento.html` | Fechamento do bicho: TG, TGC, DG, DGC, TDZ, DDZ, Quina de Grupo (5/10/15), Passe/PVV, Lotinho, MM/CC/MCC |
| `quininha.html` | Quininha (13–45 de 80, base Quina): calculadora, fechamento com garantia, conferência, frequência |
| `seninha.html` | Seninha (14–40 de 60, base Mega-Sena): idem |
| `gerador.html` | Palpites por frequência, atraso, vencimento ou puxada |
| `conferidor.html` | Confere apostas contra qualquer extração |
| `tabela.html` | As 24 modalidades com código, colocações, cotação (editável), chance e retorno; horários limite |
| `analises.html`, `sonhos.html` | Artigos e dicionário dos sonhos |

## Resultados reais

`scripts/atualizar-resultados.mjs` (Node 20, sem dependências) grava:

- `data/bicho/<banca>.json` — Rio (RJ09, CTG, PT, BAN, PTV, PTN, COR) e São Paulo (SP08 a SP20);
- `data/loterias/{megasena,quina,federal}.json` — API oficial da Caixa, com uma API comunitária como reserva;
- `data/bicho/fed.json` — a Federal convertida para o bicho (últimos 4 dígitos dos 5 bilhetes).

A grade de sorteios (26 códigos, igual à máquina da banca) fica em `NM.BANCAS`/`NM.SORTEIOS` em `assets/js/data.js`.
Sorteios novos (PTN-SB, FED-DM, QN-DM, SN-DM) aparecem como "em breve" até terem resultados.
As fontes de cada banca ficam em `scripts/fontes.json`: portalbrasil.net primeiro, deunoposte.app.br e resultadofacil como reserva. O coletor tenta as URLs em ordem e usa um leitor
genérico de tabelas (`scripts/parser.mjs`) que reconhece os dois layouts mais comuns: uma tabela por extração,
ou extrações em colunas. Só aceita uma extração com o 1º ao 5º prêmio completos. Teste: `node scripts/test/parser.test.mjs`.

O workflow `.github/workflows/resultados.yml` roda a cada 15 minutos, das 8h às 22h45 (horário de Brasília), e faz
commit em `data/` quando há novidade. Para rodar na hora: **Actions → Atualizar resultados → Run workflow**.
Rodando localmente: `node scripts/atualizar-resultados.mjs`.

Enquanto uma banca não tem arquivo, o site mostra dados de demonstração para ela, com o selo **DEMO**.
Bancas com dados reais aparecem como **AO VIVO**.

## Publicar

Ative o GitHub Pages (Settings → Pages → branch principal, pasta `/`). Abrindo o `index.html` direto do disco,
o site funciona apenas em modo demonstração, porque o navegador bloqueia a leitura de `data/` via `file://`.
Para testar localmente: `python3 -m http.server 8000`.

## Fechamentos

- **Bicho:** gera todas as combinações e calcula a distribuição exata de quantos dos seus bichos/dezenas saem no
  1º–5º (ou na colocação escolhida). Para cada cenário mostra os jogos premiados, o prêmio e o líquido, além do retorno esperado.
- **Quininha, Seninha e Lotinho:** fechamento com garantia (covering design guloso, num Web Worker). Exemplo: 18 dezenas
  fechadas em jogos de 13 dão 23 jogos, e se as 5 da Quina estiverem entre as 18, pelo menos um jogo acerta. Com
  "máximo de jogos" menor, a página mostra a cobertura parcial obtida.

As cotações padrão seguem a tabela da banca (Milhar 3000, Centena 500, Dezena 50, Unidade 5, Grupo 15, Passe 75,
TDZ 3000, DDZ 200, TG 100, TGC 1000, DG 16, DGC 160, Lotinho 10/100/1000, QG 500/100/10). Podem ser alteradas na
página Cotações e ficam salvas no navegador de quem alterou. O PVV usa a metade do Passe como padrão.

## Aviso

Site informativo. Não vende nem intermedeia apostas. Probabilidade e fechamento não garantem prêmio. Proibido para menores de 18 anos.
