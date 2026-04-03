export const COLORS = {
  MAIN: '#ff0033',
  GREEN: '#22c55e',
  KM: '#facc15',
  MASTER: '#8b5cf6',
  COPILOTO: '#06b6d4',
  WARN_YELLOW: '#eab308',
  BLUE_INFO: '#3b82f6'
};

export const TAB_COLORS = {
  mecanica: '#a855f7',
  lataria: '#ef4444',
  mercadolivre: '#facc15',
  mercado_livre: '#facc15',
  hibrido: '#10b981',
  eletrico: '#22c55e',
  moto: '#f97316',
  amortecedor: '#0ea5e9',
  injecao: '#ec4899',
  eletrica: '#8b5cf6',
  alinhamento: '#06b6d4',
  oleo: '#f43f5e',
  revisao: '#6366f1',
  ar_condicionado: '#3b82f6',
  pneus: '#d946ef',
  desmanche: '#64748b',
  escapamento: '#9ca3af',
  lavajato: '#0284c7',
  estetica: '#f472b6',
  copiloto: '#14b8a6',
  secretaria: '#c026d3',
  administrador: '#4f46e5',
  contador: '#16a34a',
  dashboard: '#ffffff',
  financeiro: '#10b981',
  estoque: '#a855f7',
  leads: '#f97316',
  historico: '#64748b',
  tarefa: '#10b981',
  notafiscal: '#3b82f6',
  retorno: '#f59e0b',
  patrimonio: '#8b5cf6',
  fornecedores: '#f97316',
  estrategia: '#00E676',
  ajuda: '#06b6d4',
  equipe: '#06b6d4',
  config: '#6366f1',
  marketing: '#ec4899',
  meuplano: '#8b5cf6',
};

export const normalizarPlaca = (v) => v ? v.toUpperCase().replace(/[^A-Z0-9]/g, '') : '';

export const formatarMoeda = (v) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
};

export const formatarData = (dataStr) => {
  if (!dataStr) return '--/--/----';
  const data = new Date(dataStr);
  return data.toLocaleDateString('pt-BR');
};

export const formatarTelefone = (v) => {
  if (!v) return '';
  v = v.replace(/\D/g, '');
  if (v.length > 11) v = v.slice(0, 11);
  if (v.length > 10) {
    return `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
  } else if (v.length > 5) {
    return `(${v.slice(0, 2)}) ${v.slice(2, 6)}-${v.slice(6)}`;
  } else if (v.length > 2) {
    return `(${v.slice(0, 2)}) ${v.slice(2)}`;
  }
  return v;
};

export const diasParaVencer = (dataVencimento) => {
  if (!dataVencimento) return null;
  const hoje = new Date();
  const venc = new Date(dataVencimento);
  const diffTime = venc - hoje;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const classificarRetorno = (retorno) => {
  if (!retorno || !retorno.dataVencimento) return { status: 'Sem Retorno', color: 'gray' };
  const dias = diasParaVencer(retorno.dataVencimento);
  if (dias < 0) return { status: 'Vencido', color: 'red' };
  if (dias <= 7) return { status: 'Urgente', color: 'orange' };
  return { status: 'Agendado', color: 'green' };
};