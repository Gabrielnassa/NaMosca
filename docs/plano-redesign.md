# Plano de redesign — Na Mosca no estilo "Precision Night Vision"

Referência visual: [`docs/DESIGN_1.md`](DESIGN_1.md) (estilo Rive). Execução agendada para 29/10/2026 às 00h05 (Brasília).
Objetivo: deixar o site com cara de ferramenta profissional de alta precisão — fundo preto puro, tipografia técnica,
um único acento laranja, profundidade por camadas de superfície (sem sombras e sem gradientes) — mantendo todas as funções.

Regra geral: **mudar só o visual e a organização; nenhuma ferramenta, cálculo ou dado pode quebrar.**
Ao final, rodar `node scripts/test/parser.test.mjs` e `node scripts/test/e2e.mjs` (todas as páginas, desktop e celular).

---

## 1. Fundação (tokens, fontes, regras)
1. Trocar os tokens de `assets/css/style.css` pelos da referência:
   - fundo `#000000` (Obsidian); superfícies `#111111` (Charcoal), `#1d1d1d` (Graphite), `#262626` (Tarmac, também bordas/divisórias);
   - texto: títulos `#ffffff`, corpo de destaque `#f1f1f1`, corpo `#aaaaaa`, secundário/navegação `#999999`;
   - acento único `#ffa41c` (Ignition Orange).
2. Fontes: **Tomorrow** (400/500) em títulos, subtítulos, rótulos, navegação, números de destaque; **Inter** (400/500/600) no corpo.
   Substitutos: Share Tech Mono / Roboto Mono. Carregar via Google Fonts com `display=swap` e `preconnect`.
3. Escala tipográfica da referência: legenda 11px (+1,1px de espaçamento), corpo 16px/1.6, subtítulo 20px, título pequeno 24px,
   título grande 40px (−1,32px de espaçamento). Rótulos pequenos em caixa alta com espaçamento positivo.
4. Raio de **8px** em botões, cards, campos e tags (4–8px). **Acabar com formatos de pílula** (`border-radius: 999px`) em botões, abas, filtros e chips.
5. **Remover todas as sombras** (`box-shadow`) e **todos os gradientes** (hero, botões, bolas, barras, seleção, logo). Profundidade só por superfície: página `#000` → card `#111` → elemento interno `#1d1d1d` → interativo `#262626`.
6. Remover o brilho/grade decorativa do fundo e o halo verde do `body`.
7. Espaçamento compacto: card com 16px de padding, gap entre elementos 8–16px, seções com respiro maior (80–120px na página inicial; 40–60px nas ferramentas).

## 2. Cores com função (adaptação necessária)
A referência proíbe outras cores saturadas, mas o site precisa de sinais de dados. Decisão:
8. **Laranja só em ação principal**: um botão primário por tela (Gerar fechamento, Simular, Anotar, Ver resultado…) e nos rótulos "eyebrow". Nunca em texto comum, bordas ou decoração.
9. **1º prêmio**: destacar por superfície (`#262626`) + número em branco maior/peso 500, sem dourado.
10. **Ganho/perda** (saldo, backtest, simulador, variação): manter verde e vermelho **apenas em números de resultado financeiro**, em tons dessaturados (ex.: `#7fd6a0` / `#ff8a80`), sem fundos coloridos.
11. **Status de sorteio** (saiu / aguardando / sem resultado / em breve): usar formas e texto (ponto cheio, ponto vazado, tracejado) em tons de cinza/branco; o ponto "aguardando" pode usar o laranja só se for o próximo sorteio clicável.
12. **Gráficos** em escala de cinza: barras `#262626`, destaque `#ffffff`; linhas do backtest/simulador em branco, faixa de 90% em `#1d1d1d`; mapas de calor em rampa de cinza (preto → branco).
13. **Selos** (conferido/divergente/demo/PRO): tags retangulares 4px, fundo `#1d1d1d`, texto cinza; divergente com texto vermelho dessaturado.
14. **Bolas do volante**: quadradas arredondadas 8px (não círculos); marcada = branco com texto preto; fixa = borda branca dupla; acerto = fundo `#262626` com contorno branco.
15. **Remover o tema claro** (a referência é só escuro) ou mantê-lo escondido — decisão: remover o botão de tema e o CSS do tema claro.

## 3. Componentes
16. **Botões**: primário laranja (texto branco, 12px 24px, Inter 600); secundário `#111`/`#1d1d1d` com texto branco; terciário `#1d1d1d` 8px 10px com ícone.
17. **Navegação lateral**: links Tomorrow 500, cinza `#999` → branco no hover/ativo; item ativo com fundo `#111` e marcador fino branco (sem verde).
18. **Barra superior**: fundo `#000` com borda `#262626`; busca com fundo `#111`.
19. **Cards**: `#111` sem sombra, borda `#262626` opcional, cabeçalho com rótulo Tomorrow 11–12px caixa alta em `#999`.
20. **Grade de sorteios** = "Category Tag Card": `#1d1d1d`, borda `#262626`, código em Tomorrow 20px branco, hora em cinza; hover clareia; selecionado = `#262626` com borda branca.
21. **Card de extração**: 5 prêmios em células `#1d1d1d`, milhar em Tomorrow 24px; 1º prêmio em `#262626`.
22. **Tabelas**: cabeçalho Tomorrow 11px caixa alta `#999`, linhas com divisória `#262626`, números tabulares.
23. **KPIs**: número grande em Tomorrow branco, rótulo 11px caixa alta, sem o círculo decorativo.
24. **Abas / filtros / segmentos**: retângulos de 8px; ativo = `#262626` + texto branco (não laranja).
25. **Campos**: fundo `#111`, borda `#262626`, foco com contorno branco 1px.
26. **Modal de boas-vindas**: superfície `#111`, sem desfoque colorido; botão "Tenho 18 anos" é o único laranja.
27. **Logo**: ver a seção 7 (identidade nova, feita com cuidado de marca de verdade).

## 4. Página inicial (vitrine)
28. Hero em tela cheia: eyebrow laranja "RESULTADOS · FECHAMENTOS · ESTATÍSTICA", título grande Tomorrow ("ACERTE NA MOSCA" ou "O BICHO EM NÚMEROS"), subtítulo em Inter cinza e **um** botão laranja ("Ver sorteios de hoje") + um secundário ("Fechamento PRO").
29. Logo abaixo, a grade de sorteios de hoje como bloco principal.
30. Seções espaçadas: últimos resultados, ferramentas (cards de categoria), destaques, análises — cada uma com eyebrow + título 24px.

## 5. Revisão página a página
31. Aplicar o novo visual e conferir: index, resultados, estatisticas, fechamento-pro, fechamento, milhar, quininha, seninha, simulador, diario, meus-jogos, gerador, conferidor, tabela, status, analises, sonhos, ajuda, sobre, privacidade, termos.
32. Trocar cores fixas no JavaScript (ex.: `#22c55e`, `#f59e0b`, `#fcd34d`, `#fff` nas legendas, mapas de calor, imagem de compartilhar, gráficos SVG) por variáveis do novo tema.
33. Corrigir textos que se cortam (rótulos de barras, cabeçalhos de tabela) com a nova fonte, que é mais larga.
34. Celular: conferir menu gaveta, menu inferior (ícones brancos, ativo branco + marcador), grade 3 colunas, volantes, tabelas com rolagem.

## 7. Logo nova (prioridade alta — "100% perfeita", sem cara de IA)
O que evitar (é o que dá "cara de IA"): gradientes, brilhos, alvo genérico de 3 círculos, ícone dentro de quadrado arredondado colorido,
excesso de detalhes, simetria sem ajuste óptico, traços com espessuras aleatórias, mascote/clip-art.

Conceito: **"Na Mosca" = acertar o centro do alvo**. Marca tipo símbolo de ferramenta de precisão (como Linear, Vercel, Raycast):
39. Criar **3 conceitos** em SVG desenhados à mão numa grade de 24×24 / 48×48 (geometria simples, traço único consistente):
   - A) **Mira de precisão**: retícula fina (cruz com vão central) e um único ponto laranja exatamente no centro — “acertou na mosca”.
   - B) **Mosca geométrica**: silhueta mínima de uma mosca vista de cima (corpo + duas asas em formas puras) pousada no centro de um anel.
   - C) **Monograma "NM"** construído com as mesmas linhas da retícula, com o ponto laranja como “pingo” no centro.
40. Regras de construção: traço igual (ex.: 2px em 24px), cantos e terminais consistentes, **compensação óptica** (o círculo um pouco maior que o quadrado, o ponto centralizado visualmente), espaço interno mínimo, nada de efeitos.
41. **Logotipo** "NA MOSCA" em Tomorrow 500, caixa alta, espaçamento positivo ajustado à mão (kerning entre N-A, M-O, S-C); versão horizontal (símbolo + nome) e empilhada.
42. Cores: branco sobre preto; versão invertida preto sobre branco; o laranja `#ffa41c` aparece **apenas** no ponto central.
43. Testar legibilidade em 16, 24, 32, 48, 180 e 512px (favicon, aba do navegador, ícone do app, compartilhamento); nos tamanhos pequenos usar uma versão simplificada (menos linhas).
44. Renderizar os 3 conceitos lado a lado (prancha de comparação em PNG, fundo preto e branco, vários tamanhos), escolher o melhor pelos critérios acima e justificar a escolha no resumo final; guardar a prancha em `docs/logo/` para o dono do site poder pedir outro conceito.
45. Aplicar a escolhida: barra lateral, barra superior do celular, rodapé, modal de boas-vindas, `favicon`, `assets/img/icon-192.png`, `icon-512.png`, `icon-maskable-512.png` (com área de segurança), `apple-touch-icon.png`, imagem de compartilhar resultado e `og:image` (criar uma imagem 1200×630 com logo + frase).
46. Salvar os SVGs-fonte em `assets/img/logo/` (`simbolo.svg`, `logotipo-horizontal.svg`, `logotipo-empilhado.svg`, `favicon.svg`).

## 6. Qualidade
35. Contraste AA: `#aaaaaa` e `#999999` sobre `#000`/`#111` passam; garantir que texto sobre laranja seja legível (se o branco não atingir 4,5:1, usar preto `#000` no botão laranja e registrar a exceção).
36. Foco visível em todos os elementos (contorno branco), `prefers-reduced-motion` respeitado, nenhuma rolagem lateral.
37. Rodar os testes (parser + e2e) e tirar capturas de: início, resultados, Fechamento PRO, estatísticas, simulador e celular.
38. Atualizar README (seção de design) e fazer commit/push na branch `claude/friendly-darwin-buomgl`.
