/* Na Mosca — análises editoriais. Cada artigo tem `body` em HTML (pode usar funções para conteúdo calculado). */
(function () {
  const NM = window.NM;

  function tabelaRetorno() {
    return `<div class="table-wrap"><table class="data-table">
      <thead><tr><th>Modalidade</th><th class="n">Paga (x)</th><th class="n">Chance</th><th class="n">1 em…</th><th class="n">Retorno por R$ 100</th></tr></thead>
      <tbody>${NM.MODALIDADES.filter((m) => NM.ev(m.id) != null).map((m) => {
        const p = NM.PROB[m.id];
        const ev = NM.ev(m.id);
        const c = NM.cot(m.id);
        return `<tr><td><span class="gtag">${m.sig}</span> ${m.nome}</td><td class="n">${NM.num(c, c % 1 ? 1 : 0)}</td>
          <td class="n">${NM.pct(p, p < 0.001 ? 3 : 2)}</td><td class="n">${NM.num(1 / p)}</td>
          <td class="n"><b>R$ ${NM.num(ev * 100, 2)}</b></td></tr>`;
      }).join('')}</tbody></table></div>`;
  }

  NM.ARTIGOS = [
    {
      id: 'retorno-esperado',
      titulo: 'Quanto a banca realmente devolve? O retorno esperado de cada modalidade',
      resumo: 'Colocamos cotação e probabilidade lado a lado para mostrar quanto volta, em média, de cada R$ 100 apostados.',
      tag: 'Matemática',
      data: '2026-09-28',
      leitura: 5,
      body: () => `
        <p>Toda modalidade do jogo do bicho tem duas informações que raramente aparecem juntas: <b>quanto paga</b>
        (a cotação) e <b>qual a chance real de acerto</b>. Multiplicando uma pela outra chegamos ao
        <i>retorno esperado</i> — quanto, em média, volta para o apostador a cada R$ 100 jogados no longo prazo.</p>
        ${tabelaRetorno()}
        <p class="muted small">Cotações em vigor (editáveis na página Cotações), na cabeça (1º prêmio) para grupo, dezena, centena e milhar, e do 1º ao 5º para duque/terno.
        Cada banca pratica valores próprios.</p>
        <h2>O que a tabela mostra</h2>
        <p>Nenhuma modalidade devolve R$ 100. A diferença é a margem da banca. O <b>grupo</b>, que parece a aposta
        "mais fácil", devolve cerca de ${NM.brl(NM.ev('grupo') * 100)}; a <b>milhar</b>, apesar do prêmio alto, devolve ${NM.brl(NM.ev('milhar') * 100)}.
        Quanto mais rara a combinação, maior costuma ser a margem — a quina de grupo com 5 bichos é o caso extremo.</p>
        <div class="callout">Use a tabela para comparar modalidades — não para esperar lucro. Estatística ajuda a
        escolher com consciência, mas não muda a matemática do jogo.</div>`,
    },
    {
      id: 'falacia-atraso',
      titulo: 'Bicho atrasado vai sair? Entenda a falácia do apostador',
      resumo: 'Um bicho que não sai há 80 extrações está "vencido"? Veja o que a probabilidade diz sobre atrasos.',
      tag: 'Estatística',
      data: '2026-09-24',
      leitura: 4,
      body: () => `
        <p>A lista de <a href="estatisticas.html">bichos atrasados</a> é uma das mais consultadas do Na Mosca. E é
        natural pensar: "se o Tigre não sai há tanto tempo, agora ele tem que vir". Esse raciocínio tem nome —
        <b>falácia do apostador</b>.</p>
        <h2>Cada sorteio começa do zero</h2>
        <p>Em um sorteio justo, as bolas (ou a extração) não têm memória. A chance de qualquer grupo sair na cabeça
        é sempre de <b>1 em 25 (4%)</b>, não importa o que aconteceu antes.</p>
        <h2>Então por que olhar atrasos?</h2>
        <p>Atrasos são úteis para <b>descrever</b> o histórico e detectar anomalias. Em 25 grupos, é esperado que
        algum fique 60, 70, até 100 extrações sem sair na cabeça: a chance de um grupo específico passar
        n extrações sem aparecer é (24/25)<sup>n</sup>. Para n = 75, isso dá cerca de ${NM.pct(Math.pow(24 / 25, 75))}.
        Com 25 grupos, quase sempre algum estará nessa situação.</p>
        <div class="callout">Na página de estatísticas você encontra o <b>índice de vencimento</b> (atraso atual ÷ atraso médio).
        Ele mostra o quanto o atraso atual foge do padrão — uma curiosidade, não uma previsão.</div>`,
    },
    {
      id: 'cabeca-ou-cinco',
      titulo: 'Na cabeça ou do 1º ao 5º: como a probabilidade muda',
      resumo: 'Jogar "cercado" multiplica a chance por quase cinco, mas divide o prêmio por cinco. Vale a pena?',
      tag: 'Estratégia',
      data: '2026-09-19',
      leitura: 3,
      body: () => `
        <p>Quem joga no grupo pode escolher apostar só na <b>cabeça</b> (1º prêmio) ou <b>cercar do 1º ao 5º</b>.</p>
        <table class="data-table" style="max-width:520px">
          <thead><tr><th>Aposta</th><th class="n">Chance de acertar pelo menos 1</th></tr></thead>
          <tbody>${[1, 2, 3, 5].map((k) => `<tr><td>Grupo do 1º ao ${k}º</td><td class="n">${NM.pct(NM.probEmK(1 / 25, k))}</td></tr>`).join('')}</tbody>
        </table>
        <p style="margin-top:1em">Como a cotação do 1º ao 5º costuma ser a da cabeça dividida por 5, o retorno esperado
        fica praticamente igual. A diferença está na <b>variância</b>: cercado você acerta mais vezes, com prêmios menores.</p>`,
    },
    {
      id: 'bicho-puxa-bicho',
      titulo: 'Bicho puxa bicho: o que os dados dizem sobre as "puxadas"',
      resumo: 'A tradição diz que certos bichos chamam outros. Medimos as transições entre extrações seguidas.',
      tag: 'Dados',
      data: '2026-09-15',
      leitura: 4,
      body: () => {
        const res = NM.loadResults(NM.getBanca ? NM.getBanca() : 'rj', 180);
        const st = NM.stats(res, { ate: 1 });
        const linhas = NM.BICHOS.slice(0, 25).map((b) => {
          const p = NM.puxada(st, b.grupo, 3);
          return `<tr><td>${NM.chip(b.grupo)}</td><td>${p.map((x) => `${NM.chip(x.g)} <span class="muted mono">${x.c}×</span>`).join(' ')}</td></tr>`;
        }).join('');
        return `
        <p>A "puxada" é uma das tradições mais antigas do bicho: depois que um animal sai na cabeça, outro viria em seguida.
        Medimos, nas últimas ${res.length} extrações, qual grupo veio na cabeça logo depois de cada um.</p>
        <div class="table-wrap"><table class="data-table"><thead><tr><th>Quando sai…</th><th>Os que mais vieram depois</th></tr></thead><tbody>${linhas}</tbody></table></div>
        <p style="margin-top:1em">Com cerca de ${Math.round(res.length / 25)} ocorrências por bicho, cada contagem é pequena e bastante sujeita ao acaso.
        Use a estratégia "Puxada" do <a href="gerador.html">gerador</a> para testar a ideia, sabendo que ela é uma tradição e não uma lei.</p>`;
      },
    },
    {
      id: 'tabela-grupos',
      titulo: 'Como funciona a tabela do bicho: grupos, dezenas e a Vaca do 00',
      resumo: 'Os 25 bichos, as 100 dezenas e por que o 00 pertence à Vaca. Guia rápido para iniciantes.',
      tag: 'Guia',
      data: '2026-09-10',
      leitura: 3,
      body: () => `
        <p>O jogo do bicho usa 25 grupos, cada um com 4 dezenas consecutivas. O Avestruz (grupo 01) fica com 01, 02, 03 e 04;
        a Águia (02) com 05 a 08, e assim por diante, até a Vaca (25), que recebe 97, 98, 99 e <b>00</b>.</p>
        <p>Para saber o bicho de uma milhar, olhe apenas para os <b>dois últimos dígitos</b>. Exemplo: a milhar 4.532 termina
        em 32, que pertence ao grupo 08 — Camelo.</p>
        <p>A regra prática: divida a dezena por 4 e arredonde para cima (00 vale 100). Veja a
        <a href="tabela.html">tabela completa</a>.</p>`,
    },
    {
      id: 'jogo-responsavel',
      titulo: 'Jogo responsável: cinco regras para não perder o controle',
      resumo: 'Limite de valor, limite de tempo e sinais de alerta. O Na Mosca é sobre análise — não sobre apostar mais.',
      tag: 'Responsabilidade',
      data: '2026-09-05',
      leitura: 3,
      body: () => `
        <ol>
          <li><b>Defina um valor por mês</b> e trate-o como gasto com entretenimento, não investimento.</li>
          <li><b>Nunca tente recuperar perdas</b> aumentando apostas.</li>
          <li><b>Não use dinheiro de contas</b>, empréstimos ou cartão de crédito.</li>
          <li><b>Faça pausas</b>. Se o jogo ocupa seus pensamentos o dia todo, é hora de parar.</li>
          <li><b>Peça ajuda</b>: os Jogadores Anônimos e o CVV (188) oferecem apoio gratuito.</li>
        </ol>
        <div class="callout">Lembre-se: o retorno esperado de todas as modalidades é menor que o valor apostado. Veja a
        <a href="analises.html?id=retorno-esperado">análise completa</a>.</div>`,
    },
  ];

  NM.artigoCards = (list) => list.map((a) => `
    <article class="card article-card">
      <div class="meta"><span class="tag neutral">${a.tag}</span> · ${NM.fmtDate(a.data)} · ${a.leitura} min</div>
      <h3><a href="analises.html?id=${a.id}">${a.titulo}</a></h3>
      <p class="muted small" style="margin:0">${a.resumo}</p>
    </article>`).join('');
})();
