// Funções utilitárias globais do sistema

/**
 * Remove traços, espaços e especiais - aceita "WWW-0000", "WWW 0000", "WWW0000" como a mesma placa
 */
export const normalizarPlaca = (v) => (v || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

/**
 * Formata valor em moeda brasileira (R$ 1.234,56)
 */
export const formatarMoeda = (valor) => {
    const num = parseFloat(valor) || 0;
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

/**
 * Classifica o status de retorno de uma OS baseado na data de vencimento
 * Retorna: 'vencido' | 'urgente' | 'aviso' | 'agendado' | 'ok'
 */
export const classificarRetorno = (os) => {
    if (os.statusRetorno === 'agendado') return 'agendado';
    if (!os.dataVencimento) return 'ok';
    const hoje = new Date();
    const venc = os.dataVencimento?.toDate ? os.dataVencimento.toDate() : new Date(os.dataVencimento);
    const diffDias = Math.ceil((venc - hoje) / (1000 * 60 * 60 * 24));
    if (diffDias < 0) return 'vencido';
    if (diffDias <= 7) return 'urgente';
    if (diffDias <= 15) return 'aviso';
    return 'ok';
};
