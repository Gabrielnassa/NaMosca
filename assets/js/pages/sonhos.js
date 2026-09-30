/* Dicionário dos sonhos — associações da tradição popular (sonho → grupo). */
(function () {
  const { $ } = NM;
  const SONHOS = [
    ['Água limpa', 10, 'Renovação e tranquilidade.'], ['Água suja', 9, 'Preocupações e intrigas.'],
    ['Amigo', 5, 'Lealdade e companhia.'], ['Anel', 19, 'Compromisso e vaidade.'],
    ['Avião', 2, 'Voos altos e viagens.'], ['Bebê', 10, 'Novos começos.'],
    ['Beijo', 4, 'Paixão passageira.'], ['Briga', 22, 'Conflitos e força.'],
    ['Cabelo', 6, 'Vitalidade.'], ['Cadeia / prisão', 3, 'Sensação de estar preso.'],
    ['Café', 14, 'Conversa e vigília.'], ['Caixão', 25, 'Fim de ciclo.'],
    ['Carro', 11, 'Movimento e rapidez.'], ['Casa', 23, 'Proteção e família.'],
    ['Casamento', 19, 'União e festa.'], ['Cemitério', 25, 'Encerramentos.'],
    ['Chuva', 15, 'Limpeza e fartura.'], ['Chave', 13, 'Oportunidades.'],
    ['Criança', 17, 'Alegria e travessura.'], ['Dente caindo', 3, 'Preocupação com família.'],
    ['Deserto', 8, 'Resistência e travessia.'], ['Dinheiro', 20, 'Fartura e sorte.'],
    ['Doença', 18, 'Cuidado com a saúde.'], ['Escada', 12, 'Subida lenta e firme.'],
    ['Espelho', 19, 'Vaidade e reflexão.'], ['Estrada', 11, 'Caminhos novos.'],
    ['Faca', 9, 'Traição.'], ['Família', 23, 'União e abrigo.'],
    ['Festa', 20, 'Celebração.'], ['Flor', 4, 'Beleza e leveza.'],
    ['Fogo', 16, 'Paixão e poder.'], ['Fruta', 17, 'Prosperidade.'],
    ['Gato preto', 14, 'Mistério.'], ['Gravidez', 10, 'Fertilidade.'],
    ['Igreja', 1, 'Fé e proteção.'], ['Ladrão', 17, 'Esperteza.'],
    ['Leite', 25, 'Nutrição e cuidado.'], ['Lua', 14, 'Intuição.'],
    ['Mar', 15, 'Emoções profundas.'], ['Médico', 12, 'Sabedoria.'],
    ['Morte', 25, 'Transformação.'], ['Mulher', 4, 'Graça e delicadeza.'],
    ['Namorado(a)', 7, 'Afeto e ternura.'], ['Navio', 15, 'Viagem longa.'],
    ['Neve', 23, 'Calma e isolamento.'], ['Noiva', 19, 'Compromisso.'],
    ['Nuvem', 2, 'Elevação.'], ['Ouro', 16, 'Riqueza e poder.'],
    ['Ovo', 13, 'Nascimento de ideias.'], ['Padre', 7, 'Paz e mansidão.'],
    ['Pai', 21, 'Força e autoridade.'], ['Mãe', 25, 'Amor e cuidado.'],
    ['Palhaço', 17, 'Diversão.'], ['Pássaro', 2, 'Liberdade.'],
    ['Peixe', 15, 'Fartura.'], ['Polícia', 5, 'Vigilância.'],
    ['Ponte', 8, 'Travessia.'], ['Porta', 13, 'Novas chances.'],
    ['Queda', 3, 'Insegurança.'], ['Rato', 14, 'Pequenas perdas.'],
    ['Rei / rainha', 16, 'Liderança.'], ['Rio', 15, 'Fluxo da vida.'],
    ['Roupa nova', 19, 'Mudança de imagem.'], ['Sangue', 22, 'Força vital.'],
    ['Sapato', 3, 'Caminhada.'], ['Sol', 16, 'Sucesso.'],
    ['Telefone', 13, 'Notícias.'], ['Terremoto', 12, 'Grandes mudanças.'],
    ['Trabalho', 3, 'Esforço recompensado.'], ['Trem', 12, 'Jornada longa.'],
    ['Vela', 1, 'Pedidos e fé.'], ['Viagem', 8, 'Novos horizontes.'],
    ['Vizinho', 5, 'Relações próximas.'], ['Vôo', 2, 'Ambição.'],
  ];
  const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  function render() {
    const q = norm($('#q').value.trim());
    const list = SONHOS.filter(([s]) => !q || norm(s).includes(q));
    $('#lista').innerHTML = list.length ? list.map(([s, g, d]) => {
      const b = NM.bicho(g);
      return `<div class="card" style="display:flex;gap:14px;align-items:center">
        <div style="font-size:2.2rem">${b.emoji}</div>
        <div style="min-width:0"><h3 style="margin:0">${s}</h3>
          <div class="small"><b>Grupo ${NM.pad(g, 2)} · ${b.nome}</b> · dezenas <span class="mono">${b.dezenas.join(' ')}</span></div>
          <div class="muted small">${d}</div></div></div>`;
    }).join('') : '<p class="empty">Nenhum sonho encontrado. Tente outra palavra.</p>';
  }
  document.addEventListener('DOMContentLoaded', () => {
    $('#q').addEventListener('input', render);
    render();
  });
})();
