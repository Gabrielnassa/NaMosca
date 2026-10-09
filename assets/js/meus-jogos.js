/* Jogos salvos pelo visitante (ficam no navegador) e backtest com resultados reais. */
(function () {
  const NM = window.NM;
  const KEY = 'nm-meus-jogos';
  NM.meusJogos = {
    listar() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } },
    salvar(item) {
      const l = NM.meusJogos.listar();
      l.unshift({ id: Date.now().toString(36), criado: new Date().toISOString(), ...item });
      try { localStorage.setItem(KEY, JSON.stringify(l.slice(0, 100))); return true; } catch (e) { return false; }
    },
    remover(id) { try { localStorage.setItem(KEY, JSON.stringify(NM.meusJogos.listar().filter((x) => x.id !== id))); } catch (e) {} },
  };

  /** Sorteios reais para conferir: bicho → dezenas do 1º ao 5º (rj+sp); quininha/seninha → concursos. */
  NM.sorteiosReais = async function (jogo, dias = 365) {
    if (jogo === 'bicho' || jogo === 'grupos') {
      return ['rj', 'sp'].filter((b) => NM.isLive(b)).flatMap((b) => NM.loadResults(b, dias)).map((e) => ({
        nome: `${NM.fmtDateCurta(e.data)} ${e.extracao}`, data: e.data + ' ' + e.hora,
        nums: jogo === 'grupos' ? e.premios.slice(0, 5).map((p) => p.grupo) : e.premios.slice(0, 5).map((p) => Number(p.milhar.slice(-2))),
      }));
    }
    const d = await NM.loadLoteria(jogo === 'quininha' ? 'quina' : 'megasena');
    return d ? d.concursos.map((c) => ({ nome: `Concurso ${c.numero}`, data: c.data, nums: c.dezenas })) : [];
  };

  /**
   * Backtest: para cada sorteio, conta jogos premiados (acertos >= tier) e soma prêmio.
   * Retorna { n, comPremio, gasto, ganho, melhor, porSorteio }
   */
  NM.backtest = function (jogos, sorteios, { tier, cot, valor }) {
    let comPremio = 0, ganho = 0, melhor = null;
    const porSorteio = sorteios.map((s) => {
      const set = new Set(s.nums);
      let prem = 0;
      for (const j of jogos) { let h = 0; for (const x of j) if (set.has(x)) h++; if (h >= tier) prem++; }
      const g = prem * cot * valor;
      if (prem) comPremio++;
      ganho += g;
      if (!melhor || g > melhor.g) melhor = { ...s, prem, g };
      return { ...s, prem, g };
    });
    const gasto = sorteios.length * jogos.length * valor;
    return { n: sorteios.length, comPremio, gasto, ganho, melhor, porSorteio };
  };

  NM.backtestHTML = function (r) {
    if (!r.n) return '<p class="empty">Sem resultados reais suficientes para o teste</p>';
    const saldo = r.ganho - r.gasto;
    const ult = r.porSorteio.filter((x) => x.prem).slice(-8).reverse();
    // saldo acumulado, maior queda e maior sequência sem prêmio
    const custo = r.gasto / r.n;
    let acc = 0, pico = 0, queda = 0, seq = 0, maxSeq = 0;
    const serie = r.porSorteio.map((x) => {
      acc += x.g - custo; pico = Math.max(pico, acc); queda = Math.max(queda, pico - acc);
      seq = x.prem ? 0 : seq + 1; maxSeq = Math.max(maxSeq, seq);
      return acc;
    });
    const W = 600, H = 150, mn = Math.min(0, ...serie), mx = Math.max(0, ...serie), rg = mx - mn || 1;
    const X = (i) => (i / Math.max(1, serie.length - 1)) * W, Y = (v) => H - 6 - ((v - mn) / rg) * (H - 12);
    const pts = serie.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
    const grafico = `<div style="margin:4px 0 14px"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="width:100%;height:150px;display:block" role="img" aria-label="Saldo acumulado">
      <line x1="0" x2="${W}" y1="${Y(0)}" y2="${Y(0)}" stroke="var(--line-2)" stroke-dasharray="4 4"/>
      <polyline points="0,${Y(0)} ${pts} ${W},${Y(0)}" fill="${saldo >= 0 ? 'rgba(34,197,94,.12)' : 'rgba(251,113,133,.12)'}" stroke="none"/>
      <polyline points="${pts}" fill="none" stroke="var(--${saldo >= 0 ? 'up' : 'down'})" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>
      <div class="note" style="display:flex;justify-content:space-between"><span>${NM.fmtDate(r.porSorteio[0].data.slice(0, 10))}</span><span>saldo acumulado</span><span>${NM.fmtDate(r.porSorteio[r.n - 1].data.slice(0, 10))}</span></div></div>`;
    return `<div class="kpis" style="margin-bottom:12px">
      <div class="kpi"><div class="label">Sorteios testados</div><div class="value">${NM.num(r.n)}</div><div class="sub">desde ${NM.fmtDate(r.porSorteio[0].data.slice(0, 10))}</div></div>
      <div class="kpi"><div class="label">Com prêmio</div><div class="value">${NM.num(r.comPremio)}</div><div class="sub">${NM.pct(r.comPremio / r.n, 1)} dos sorteios</div></div>
      <div class="kpi"><div class="label">Gasto × ganho</div><div class="value">${NM.brl(r.ganho)}</div><div class="sub">gasto ${NM.brl(r.gasto)}</div></div>
      <div class="kpi"><div class="label">Saldo</div><div class="value ${saldo >= 0 ? 'up' : 'down'}">${saldo >= 0 ? '+' : '−'}${NM.brl(Math.abs(saldo))}</div><div class="sub">${NM.signed((r.ganho / Math.max(1, r.gasto) - 1) * 100, 1, '%')} sobre o gasto</div></div>
      <div class="kpi"><div class="label">Maior queda</div><div class="value down">−${NM.brl(queda)}</div><div class="sub">do pico ao fundo</div></div>
      <div class="kpi"><div class="label">Maior seca</div><div class="value">${maxSeq}</div><div class="sub">sorteios seguidos sem prêmio</div></div>
    </div>${grafico}${ult.length ? `<div class="table-wrap"><table class="data-table dense"><thead><tr><th>Sorteio premiado</th><th class="n">Jogos premiados</th><th class="n">Prêmio</th></tr></thead><tbody>${ult.map((x) =>
      `<tr><td>${x.nome}</td><td class="n">${x.prem}</td><td class="n up">${NM.brl(x.g)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="note">Nenhum sorteio do histórico teria premiado este fechamento.</p>'}
    <p class="note" style="margin:8px 0 0">Resultado passado não garante resultado futuro: cada sorteio é independente.</p>`;
  };
})();
