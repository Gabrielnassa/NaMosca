# Na Mosca 🎯

Site de estatísticas, análises e ferramentas para o jogo do bicho, inspirado no estilo de portais de
análise de loterias como o MegaCover.

## Páginas

| Página | O que faz |
|---|---|
| `index.html` | Último resultado, destaques (quente, atrasado, puxada), últimos resultados, gráficos |
| `resultados.html` | Resultados do 1º ao 7º prêmio por banca/data + busca de milhar/dezena |
| `estatisticas.html` | Frequência por grupo, atrasos (atual, médio, recorde), tendência, bicho puxa bicho, mapa de calor por dia da semana, dezenas 00–99, dígitos por posição, par/ímpar |
| `analises.html` | Análise do dia (gerada dos dados) + artigos (retorno esperado, falácia do apostador etc.) |
| `gerador.html` | Palpites de grupo, duque/terno, dezena, centena, milhar com estratégias (quentes, frios, vencidos, puxada…), fixar/excluir bichos |
| `conferidor.html` | Confere apostas contra qualquer extração (cabeça ou 1º ao 5º) |
| `tabela.html` | Tabela dos 25 bichos, busca “qual o bicho do número”, modalidades e cotações |
| `sonhos.html` | Dicionário dos sonhos |

## Como rodar

É um site estático, sem build. Abra `index.html` no navegador ou sirva a pasta:

```bash
python3 -m http.server 8000
```

Funciona direto no GitHub Pages.

## Dados

Nesta versão os resultados são **dados de demonstração** gerados de forma determinística em
`assets/js/data.js` (`NM.loadResults`). Para usar resultados reais, substitua essa função por uma leitura
da sua fonte mantendo o formato:

```js
{ banca, bancaNome, extracao, extracaoNome, hora, data: 'AAAA-MM-DD',
  premios: [{ posicao: 1, milhar: '4532', grupo: 8 }, …] }
```

## Estrutura

```
assets/css/style.css     tema claro/escuro, componentes
assets/js/data.js        bichos, bancas, extrações, cotações
assets/js/stats.js       estatísticas, gerador, conferidor
assets/js/ui.js          cabeçalho, rodapé, gráficos, tooltip
assets/js/artigos.js     análises e probabilidades
assets/js/pages/*.js     script de cada página
```

## Aviso

Site informativo e de entretenimento. Não vende nem intermedeia apostas. Nenhuma estatística garante acerto.
Proibido para menores de 18 anos.
