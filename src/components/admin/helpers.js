import { db } from '../../lib/firebase';
import { collection, addDoc, updateDoc, doc, query, where, getDocs, setDoc } from 'firebase/firestore';
import { normalizarPlaca } from './constants';

export const salvarCliente = async (oficinaId, dadosCliente) => {
  if (!oficinaId || !dadosCliente) return;
  
  const { nome, telefone, placa, modelo, veiculo } = dadosCliente;
  const telefoneLimpo = (telefone || '').replace(/\D/g, '');
  const placaNormalizada = normalizarPlaca(placa || '');

  try {
    let clienteId = null;

    if (telefoneLimpo) {
      const q = query(
        collection(db, 'oficinas', oficinaId, 'leads'),
        where('telefoneLimpo', '==', telefoneLimpo)
      );
      const existing = await getDocs(q);
      if (!existing.empty) {
        clienteId = existing.docs[0].id;
      }
    }

    if (!clienteId && placaNormalizada && placaNormalizada.length >= 7) {
      const q2 = query(
        collection(db, 'oficinas', oficinaId, 'leads'),
        where('placaNormalizada', '==', placaNormalizada)
      );
      const existing2 = await getDocs(q2);
      if (!existing2.empty) {
        clienteId = existing2.docs[0].id;
      }
    }

    const dadosClienteDoc = {
      nome: nome || '',
      telefone: telefoneLimpo,
      telefoneFormatado: telefone || '',
      placa: placaNormalizada,
      placaFormatada: placa || '',
      modelo: modelo || veiculo || '',
      data_ultimo_contato: new Date().toISOString(),
    };

    if (clienteId) {
      await updateDoc(
        doc(db, 'oficinas', oficinaId, 'leads', clienteId),
        {
          ...dadosClienteDoc,
          totalVisitas: (existing?.docs?.[0]?.data()?.totalVisitas || 0) + 1,
        }
      );
    } else {
      const novoDoc = await addDoc(
        collection(db, 'oficinas', oficinaId, 'leads'),
        {
          ...dadosClienteDoc,
          telefoneLimpo,
          placaNormalizada,
          status: 'cliente',
          data_cadastro: new Date().toISOString(),
          data_registro: new Date(),
          totalVisitas: 1,
        }
      );
      clienteId = novoDoc.id;
    }

    return clienteId;
  } catch (e) {
    console.warn('Erro ao salvar cliente:', e.message);
    return null;
  }
};

export const PLANOS_CADEADOS = {
  oleo: { label: 'Módulo Óleo', plano: 'base' },
  alinhamento: { label: 'Alinhamento', plano: 'base' },
  eletrica: { label: 'Elétrica', plano: 'eletrica' },
  revisao: { label: 'Revisão IA', plano: 'revisaoIa' },
  copiloto: { label: 'Copiloto IA', plano: 'copiloto' },
  estoque: { label: 'Estoque', plano: 'estoque' },
  financeiro: { label: 'Financeiro', plano: 'base' },
  equipe: { label: 'Equipe', plano: 'base' },
  leads: { label: 'Clientes', plano: 'clientes' },
  marketing: { label: 'Marketing', plano: 'marketing' },
  estrategia: { label: 'Estratégia', plano: 'base' },
  lava_jato: { label: 'Lava Jato', plano: 'lavajato' },
  ar_condicionado: { label: 'Ar Condicionado', plano: 'ar_condicionado' },
  escapamento: { label: 'Escapamento', plano: 'escapamento' },
  estetica: { label: 'Estética', plano: 'estetica' },
  motos: { label: 'Motos', plano: 'motos' },
  lataria: { label: 'Lataria', plano: 'lataria' },
  amortecedor: { label: 'Amortecedor', plano: 'amortecedor' },
  injecao: { label: 'Injeção', plano: 'injecao' },
  patrimonio: { label: 'Patrimônio', plano: 'base' },
};

export const temAcessoModulo = (plano, modulo) => {
  if (!plano) return false;
  if (plano === 'pago' || plano === 'trial') return true;
  
  const moduloConfig = PLANOS_CADEADOS[modulo];
  if (!moduloConfig) return true;
  
  return plano === 'pago' || plano === 'trial';
};
