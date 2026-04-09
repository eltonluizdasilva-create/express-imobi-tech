/* Pure OS helpers — no React hooks, no state */

export const TIPO_TITULOS = {
  hibrido: 'Híbridos / EV',
  eletrico: '100% ELÉTRICO',
  moto: 'Motos',
  funilaria: 'Funilaria',
  amortecedor: 'Amortecedor',
  injecao: 'Injeção Eletrônica',
  mecanica: 'Mecânica',
  eletrica: 'Elétrica',
  oleo: 'Óleo',
  alinhamento: 'Alinhamento',
  revisao: 'Revisão',
  ar_condicionado: 'Ar-Condicionado',
  pneus: 'Pneus',
  escapamento: 'Escapamento',
  estetica: 'Estética',
  desmanche: 'Desmanche',
  lavajato: 'Lava Jato',
};

export const TIPO_EXPLICACOES = {
  hibrido: 'Triagem encaminhada para laudo de baterias e sistema EV.',
  eletrico: 'Triagem encaminhada para laudo de veículos elétricos.',
  moto: 'Triagem encaminhada para oficina de motocicletas.',
  funilaria: 'Triagem encaminhada para funilaria e pintura.',
  amortecedor: 'Triagem encaminhada para suspensão e amortecedores.',
  injecao: 'Triagem encaminhada para diagnóstico de injeção eletrônica.',
  mecanica: 'Triagem encaminhada para diagnóstico mecânico e peças.',
  eletrica: 'Triagem encaminhada para laudo técnico elétrico.',
  oleo: 'Triagem encaminhada para troca de óleo e fluidos.',
  alinhamento: 'Triagem encaminhada para alinhamento e geometria.',
  revisao: 'Triagem encaminhada para revisão preventiva.',
  ar_condicionado: 'Triagem encaminhada para climatização e ar-condicionado.',
  pneus: 'Triagem encaminhada para borracharia e troca de pneus.',
  escapamento: 'Triagem encaminhada para diagnóstico de escapamento.',
  estetica: 'Triagem encaminhada para acabamento e estética automotiva.',
  desmanche: 'Triagem encaminhada para gestão de desmanche e peças.',
  lavajato: 'Triagem encaminhada para estética e lava jato.',
};

export function resolverTipoOS(os) {
  if (!os) return 'mecanica';
  const valor = os?.tipo || os?.tipoServico || os?.setor || '';
  const t = String(valor).toLowerCase().trim();
  const map = {
    hibrido: 'hibrido', moto: 'moto', eletrico: 'eletrico', funilaria: 'funilaria',
    amortecedor: 'amortecedor', injecao: 'injecao',
    eletrica: 'eletrica', oleo: 'oleo', alinhamento: 'alinhamento',
    revisao: 'revisao', lavajato: 'lavajato', lava_jato: 'lavajato',
    ar_condicionado: 'ar_condicionado', arcondicionado: 'ar_condicionado', pneus: 'pneus',
    escapamento: 'escapamento', estetica: 'estetica', desmanche: 'desmanche',
  };
  return map[t] || 'mecanica';
}

export function resolverAbaDestino(tipo) {
  const tipoSeguro = tipo || 'mecanica';
  const map = {
    hibrido: 'hibrido', eletrico: 'eletrico', moto: 'moto', funilaria: 'funilaria',
    amortecedor: 'amortecedor', injecao: 'injecao',
    eletrica: 'eletrica', oleo: 'oleo', alinhamento: 'alinhamento',
    revisao: 'revisao', lavajato: 'lavajato',
    ar_condicionado: 'ar_condicionado', pneus: 'pneus', pneu: 'pneus', escapamento: 'escapamento',
    estetica: 'estetica', desmanche: 'desmanche',
  };
  return map[tipoSeguro] || 'mecanica';
}

export function buscarDadosPorPlaca(listaCarros, placaDigitada, normalizarPlaca, callbacks) {
  const placaNorm = normalizarPlaca(placaDigitada || '');
  if (placaNorm.length < 7) return null;
  const lista = listaCarros || [];
  const match = lista
    .filter(o => normalizarPlaca(o.placa || '') === placaNorm)
    .sort((a, b) => new Date(b.data_registro || 0) - new Date(a.data_registro || 0))[0];
  if (match && callbacks) {
    if (callbacks.setNome) callbacks.setNome(match.nomeCliente || '');
    if (callbacks.setTelefone) callbacks.setTelefone(match.telefone || '');
    if (callbacks.setModelo) callbacks.setModelo(match.modelo || '');
    if (callbacks.setKm) callbacks.setKm(match.kmAtual || '');
    if (callbacks.onFound) callbacks.onFound(match);
  }
  return match || null;
}

export function abrirMercado(os) {
  const full = os?.modelo || '';
  const parts = full.trim().split(' ');
  const marca = parts.length > 0 ? parts[0] : '';
  const resto = parts.length > 1 ? parts.slice(1).join(' ') : full;
  const termoBusca = `Peças para ${marca}${resto ? ' ' + resto : ''}`.trim();
  return termoBusca;
}
