/**
 * Suíte DINÂMICA de segurança das Firestore Rules — Express Imobi Tech
 * ============================================================================
 * Exercita o arquivo real `firestore.rules` contra o Firestore Emulator, no
 * projeto isolado `demo-express-imobi`.
 *
 * Regras de ouro desta suíte (auditoria A1–A10):
 *   • `beforeEach` limpa o banco e recria as fixtures → nenhum teste depende da
 *     ordem de execução, e cada teste roda sozinho (A5).
 *   • Negação é sempre validada como `permission-denied`; qualquer outro erro
 *     (not-found, invalid-argument, query não satisfazível) faz o teste FALHAR
 *     com a causa na mensagem (A3).
 *   • Testes que usam estruturas que o app AINDA NÃO produz ficam marcados
 *     [HIPOTÉTICO] (A4/A10).
 *   • Comportamentos permitidos hoje mas inseguros ficam no último bloco,
 *     [RISCO ACEITO] — verde ali NÃO significa seguro (A9).
 *
 * Verificações puramente textuais ficaram em tests/firestore.rules.static.test.js
 * e rodam sem Emulator (A2).
 *
 * Execução:
 *   npx firebase emulators:exec --only firestore --project demo-express-imobi \
 *     "npx vitest run"
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import {
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

/* ------------------------------------------------------------- constantes */

const PROJETO = 'demo-express-imobi';
const RULES_TEXT = readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8');

const OID_A = 'oficinaA';
const OID_B = 'oficinaB';
const OID_PRO = 'oficinaPro';

const UID_DONO_A = 'uidDonoA';
const UID_DONO_B = 'uidDonoB';
const UID_CORRETOR_A = 'uidCorretorA';
const UID_GERENTE_A = 'uidGerenteA';
const UID_SEM_VINCULO = 'uidSemVinculo';
const UID_DUPLO = 'uidMembroDeAeB';
const UID_DONO_PRO = 'uidDonoPro';
const UID_ADMIN = 'uidAdminPlataforma';

/** Subcoleções com o mesmo contrato de regra: read/write por membro do tenant. */
const COLECOES_TENANT = [
  'tarefas', 'config', 'estoque', 'financeiro', 'fornecedores', 'patrimonio',
  'retornos', 'agendamentos_retorno', 'visitas_imobi', 'revisoes_premium',
  'propostas_imobi', 'relatorios_mensais', 'burocracias', 'descartes',
  'desmanche_parceiros', 'desmanche_pecas', 'desmanche_veiculos',
  'notificacoes_desmanche', 'acompanhamentos_imobi',
];

let testEnv;

/* --------------------------------------------------------------- helpers */

function db(uid, claims) {
  if (!uid) return testEnv.unauthenticatedContext().firestore();
  return testEnv.authenticatedContext(uid, claims || {}).firestore();
}

const anon = () => db(null);
const donoA = () => db(UID_DONO_A);
const donoB = () => db(UID_DONO_B);
const corretorA = () => db(UID_CORRETOR_A);
const gerenteA = () => db(UID_GERENTE_A);
const donoPro = () => db(UID_DONO_PRO);
const admin = () => db(UID_ADMIN, { admin: true });

/**
 * Espera que a operação seja BLOQUEADA pelas Rules, e por nenhum outro motivo.
 * Um `not-found` aqui significa fixture errada; um `invalid-argument` significa
 * query mal montada. Os dois derrubam o teste com a causa explícita.
 */
async function negar(operacao, contexto = '') {
  const rotulo = contexto ? ` (${contexto})` : '';
  try {
    await operacao;
  } catch (erro) {
    const codigo = erro?.code || '';
    if (codigo === 'permission-denied') return;
    throw new Error(
      `esperava permission-denied${rotulo}, veio ${codigo || 'erro sem code'}: ${erro?.message}`,
    );
  }
  throw new Error(`operação foi PERMITIDA${rotulo}, mas deveria ser bloqueada`);
}

/** Espera ALLOW; qualquer erro sobe com o código para diagnóstico. */
async function permitir(operacao, contexto = '') {
  const rotulo = contexto ? ` (${contexto})` : '';
  try {
    return await operacao;
  } catch (erro) {
    throw new Error(
      `esperava ALLOW${rotulo}, veio ${erro?.code || 'erro sem code'}: ${erro?.message}`,
    );
  }
}

function ofertaDeOficina(uid, extra) {
  const agora = new Date();
  const emDias = (dias) => new Date(agora.getTime() + dias * 24 * 3600 * 1000);
  return {
    uid,
    nomeOficina: 'Imobiliária Teste',
    cidade: 'Uberlândia',
    telefone: '34999990000',
    email: 'teste@expressimobi.com',
    plano: 'GRATUITO',
    nivelInteligencia: 'padrao',
    trialInicio: Timestamp.fromDate(agora),
    trialFim: Timestamp.fromDate(emDias(10)),
    ativo: true,
    criadoEm: Timestamp.fromDate(agora),
    modulosAtivos: ['os', 'oleo', 'alinhamento'],
    ...extra,
  };
}

/** Payload real do portal imobiliário (PortalCliente.jsx:124-135) — 11 campos. */
function leadImobi(extra) {
  return {
    nome: 'Cliente Portal',
    telefone: '34988887777',
    interesse: 'Compra',
    bairro: 'Santa Mônica',
    orcamento: 450000,
    estagio: 'Qualificado IA',
    corretorResponsavel: 'Plantão Digital IA',
    origem: 'Portal do Cliente • Compra',
    observacoes: 'Quer apartamento com 3 quartos',
    data_registro: new Date().toISOString(),
    criadoEm: serverTimestamp(),
    ...extra,
  };
}

/** Payload real do portal genérico (PortalCliente.jsx:160-168) — 8 campos. */
function leadGenerico(extra) {
  return {
    nome: 'Cliente Portal',
    telefone: '34988887777',
    imovel: 'Compra',
    problema: 'Lead qualificado via Compra',
    status: 'novo',
    origem: 'portal_cliente_imobi',
    orcamento: 450000,
    data_registro: new Date().toISOString(),
    ...extra,
  };
}

/* -------------------------------------------------------------- fixtures */

/**
 * Recria TODO o cenário. Chamado em `beforeEach` após `clearFirestore()`.
 * `withSecurityRulesDisabled` aparece exclusivamente aqui.
 */
async function prepararCenario() {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const s = ctx.firestore();

    // ---- tenants
    await setDoc(doc(s, 'oficinas', OID_A), {
      uid: OID_A, nomeOficina: 'Imobiliária A', plano: 'GRATUITO',
      nivelInteligencia: 'padrao', ativo: true,
    });
    await setDoc(doc(s, 'oficinas', OID_B), {
      uid: OID_B, nomeOficina: 'Imobiliária B', plano: 'GRATUITO',
      nivelInteligencia: 'padrao', ativo: true,
    });
    await setDoc(doc(s, 'oficinas', OID_PRO), {
      uid: OID_PRO, nomeOficina: 'Imobiliária PRO', plano: 'profissional',
      nivelInteligencia: 'padrao', ativo: true,
    });

    // ---- usuários (estrutura REAL: Cadastro.jsx grava oficinaId + papel 'dono')
    await setDoc(doc(s, 'usuarios', UID_DONO_A), {
      uid: UID_DONO_A, oficinaId: OID_A, email: 'donoa@x.com', papel: 'dono',
    });
    await setDoc(doc(s, 'usuarios', UID_DONO_B), {
      uid: UID_DONO_B, oficinaId: OID_B, email: 'donob@x.com', papel: 'dono',
    });
    await setDoc(doc(s, 'usuarios', UID_DONO_PRO), {
      uid: UID_DONO_PRO, oficinaId: OID_PRO, email: 'pro@x.com', papel: 'dono',
    });
    // papéis 'corretor'/'gerente' em usuarios NÃO são produzidos pelo app hoje
    await setDoc(doc(s, 'usuarios', UID_CORRETOR_A), {
      uid: UID_CORRETOR_A, oficinaId: OID_A, email: 'corretor@x.com', papel: 'corretor',
    });
    await setDoc(doc(s, 'usuarios', UID_GERENTE_A), {
      uid: UID_GERENTE_A, oficinaId: OID_A, email: 'gerente@x.com', papel: 'corretor',
    });
    await setDoc(doc(s, 'usuarios', UID_SEM_VINCULO), {
      uid: UID_SEM_VINCULO, email: 'solto@x.com', papel: 'dono',
    });
    await setDoc(doc(s, 'usuarios', UID_DUPLO), {
      uid: UID_DUPLO, oficinaId: OID_A, email: 'duplo@x.com', papel: 'corretor',
    });

    // ---- equipe [HIPOTÉTICO]: Equipe.jsx usa addDoc (ID aleatório) e o payload
    // não tem `uid`. Estes documentos existem para exercitar papelNoTenant().
    await setDoc(doc(s, 'oficinas', OID_A, 'equipe', UID_GERENTE_A), {
      nome: 'Gerente A', nivelAcesso: 'gerente', ativo: true,
    });
    await setDoc(doc(s, 'oficinas', OID_A, 'equipe', UID_CORRETOR_A), {
      nome: 'Corretor A', nivelAcesso: 'corretor', ativo: true,
    });
    await setDoc(doc(s, 'oficinas', OID_B, 'equipe', UID_DUPLO), {
      nome: 'Membro duplo', nivelAcesso: 'corretor', ativo: true,
    });

    // ---- leads
    await setDoc(doc(s, 'oficinas', OID_A, 'leads_imobi', 'leadA1'), {
      nome: 'Lead A', telefone: '34999990001', estagio: 'Novo Lead',
    });
    await setDoc(doc(s, 'oficinas', OID_B, 'leads_imobi', 'leadB1'), {
      nome: 'Lead B', telefone: '34999990002', estagio: 'Novo Lead',
    });

    // ---- eventos
    await setDoc(doc(s, 'oficinas', OID_A, 'eventos_lead', 'evA1'), {
      tipo: 'contato', descricao: 'Ligação registrada', leadId: 'leadA1',
    });
    await setDoc(doc(s, 'oficinas', OID_B, 'eventos_lead', 'evB1'), {
      tipo: 'contato', descricao: 'Evento B', leadId: 'leadB1',
    });

    // ---- OS e configurações
    await setDoc(doc(s, 'oficinas', OID_A, 'os', 'osA1'), {
      nomeCliente: 'Fulano', telefone: '34999990003', placa: 'ABC1D23',
      kmAtual: 90000, senhaConsulta: '1234', status: 'aberta',
    });
    await setDoc(doc(s, 'oficinas', OID_B, 'os', 'osB1'), {
      nomeCliente: 'Beltrano', telefone: '34999990004', placa: 'XYZ9K88',
      senhaConsulta: '4321', status: 'aberta',
    });
    await setDoc(doc(s, 'oficinas', OID_A, 'configuracoes', 'geral'), {
      nome: 'Imobiliária A', creci: '1234', endereco: 'Rua 1',
      telefone: '34999990000', pixKey: 'pix@imobA.com', logoUrl: '',
    });

    // ---- imóveis / vitrine [HIPOTÉTICO]: nenhum fluxo grava `publico: true`
    await setDoc(doc(s, 'oficinas', OID_A, 'imoveis_imobi', 'imvPublico'), {
      titulo: 'Casa pública', publico: true, preco: 500000, endereco: 'Rua 2',
    });
    await setDoc(doc(s, 'oficinas', OID_A, 'imoveis_imobi', 'imvPrivado'), {
      titulo: 'Casa interna', publico: false, preco: 700000,
    });
    await setDoc(doc(s, 'oficinas', OID_A, 'vistorias', 'vistA1'), {
      imovel: 'Casa pública', publico: true,
    });

    // ---- coleções de tenant (contrato uniforme)
    for (const sub of COLECOES_TENANT) {
      await setDoc(doc(s, 'oficinas', OID_A, sub, 'docA'), { titulo: 'A', valor: 1 });
      await setDoc(doc(s, 'oficinas', OID_B, sub, 'docB'), { titulo: 'B', valor: 2 });
    }

    // ---- coleções com validação de campo própria
    await setDoc(doc(s, 'oficinas', OID_A, 'imoveis_nicho', 'nichoA'), {
      nicho: 'rural', referencia: 'Fazenda 100ha', cib: '12345678901234567890',
    });
    await setDoc(doc(s, 'oficinas', OID_A, 'notas_fiscais_imobi', 'nfA'), {
      valor: 1000, cib: '12345678901234567890',
    });

    // ---- ordensServico [HIPOTÉTICO]: nenhum código escreve nesta coleção
    await setDoc(doc(s, 'ordensServico', 'ordemA1'), {
      oficinaId: OID_A, numero: 'OS-1', valor: 250,
    });
    await setDoc(doc(s, 'ordensServico', 'ordemB1'), {
      oficinaId: OID_B, numero: 'OS-2', valor: 350,
    });

    // ---- acompanhamento público [HIPOTÉTICO no ID]: senha embutida no docId
    await setDoc(doc(s, 'acompanhamentos_publicos', 'IMB-1234_5678'), {
      codigo: 'IMB-1234', senha: '5678', tenantId: OID_A,
      cliente: 'Cliente Processo', etapas: ['Proposta'], concluidas: [],
    });

    // ---- coleções globais
    await setDoc(doc(s, 'desmanche_global', OID_A), {
      nomeOficina: 'Desmanche A', telefone: '34999990000',
      parceiros_ids: [], veiculos_publicados: [],
    });
    await setDoc(doc(s, 'desmanche_global', OID_B), {
      nomeOficina: 'Desmanche B', telefone: '34999990001',
      parceiros_ids: [], veiculos_publicados: [],
    });
    await setDoc(doc(s, 'planos', 'gratis'), { nome: 'Grátis', preco: 0 });
    await setDoc(doc(s, 'oficinas', 'MASTER', 'config', 'global'), { flag: true });
    await setDoc(doc(s, 'tarefas', 'tarefaGlobal'), { titulo: 'global' });
    await setDoc(doc(s, 'telegram_leads', 'tg1'), { texto: 'oi' });
  });
}

/* ------------------------------------------------------------------ ciclo */

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJETO,
    firestore: { rules: RULES_TEXT },
  });
}, 60000);

beforeEach(async () => {
  await testEnv.clearFirestore();
  await prepararCenario();
}, 60000);

afterAll(async () => {
  if (testEnv) await testEnv.cleanup();
});

/* ==========================================================================
 * 1. ISOLAMENTO — estruturas reais
 * ========================================================================== */
describe('1. isolamento entre tenants', () => {
  it('dono de A lê o próprio documento de oficina', async () => {
    await permitir(getDoc(doc(donoA(), 'oficinas', OID_A)));
  });

  it('dono de A não lê o documento de B', async () => {
    await negar(getDoc(doc(donoA(), 'oficinas', OID_B)));
  });

  it('dono de A não atualiza o documento de B', async () => {
    await negar(updateDoc(doc(donoA(), 'oficinas', OID_B), { nomeOficina: 'invasor' }));
  });

  it('corretor de A não lê lead de B', async () => {
    await negar(getDoc(doc(corretorA(), 'oficinas', OID_B, 'leads_imobi', 'leadB1')));
  });

  it('corretor de A não cria tarefa em B', async () => {
    await negar(setDoc(doc(corretorA(), 'oficinas', OID_B, 'tarefas', 'x'), { titulo: 'x' }));
  });

  it('usuário autenticado sem vínculo não lê nenhuma oficina', async () => {
    await negar(getDoc(doc(db(UID_SEM_VINCULO), 'oficinas', OID_A)));
    await negar(getDoc(doc(db(UID_SEM_VINCULO), 'oficinas', OID_B)));
  });

  it('anônimo não lê dados de tenant', async () => {
    await negar(getDoc(doc(anon(), 'oficinas', OID_A, 'leads_imobi', 'leadA1')));
    await negar(getDoc(doc(anon(), 'oficinas', OID_A, 'tarefas', 'docA')));
  });

  it('listagem de oficinas é exclusiva do admin da plataforma', async () => {
    await negar(getDocs(collection(corretorA(), 'oficinas')));
    await permitir(getDocs(collection(admin(), 'oficinas')));
  });

  it('anônimo não descobre a existência de uma oficina', async () => {
    await negar(getDoc(doc(anon(), 'oficinas', OID_A)));
  });
});

/* ==========================================================================
 * 2. USUÁRIOS — escalada de privilégios
 * ========================================================================== */
describe('2. usuarios/{uid}', () => {
  it('corretor não se promove a dono', async () => {
    await negar(updateDoc(doc(corretorA(), 'usuarios', UID_CORRETOR_A), { papel: 'dono' }));
  });

  it('não altera o próprio oficinaId quando o campo já existe', async () => {
    await negar(updateDoc(doc(corretorA(), 'usuarios', UID_CORRETOR_A), { oficinaId: OID_B }));
  });

  it('não redefine oficinaId para o próprio uid quando já existe', async () => {
    await negar(updateDoc(doc(corretorA(), 'usuarios', UID_CORRETOR_A), { oficinaId: UID_CORRETOR_A }));
  });

  it('reparo legítimo: define oficinaId ausente apontando para o próprio uid', async () => {
    await permitir(
      updateDoc(doc(db(UID_SEM_VINCULO), 'usuarios', UID_SEM_VINCULO), { oficinaId: UID_SEM_VINCULO }),
    );
  });

  it('recusa injetar admin, isPro, nivelAcesso e creditosIA', async () => {
    await negar(updateDoc(doc(corretorA(), 'usuarios', UID_CORRETOR_A), { admin: true }));
    await negar(updateDoc(doc(corretorA(), 'usuarios', UID_CORRETOR_A), { isPro: true }));
    await negar(updateDoc(doc(corretorA(), 'usuarios', UID_CORRETOR_A), { nivelAcesso: 'dono' }));
    await negar(updateDoc(doc(corretorA(), 'usuarios', UID_CORRETOR_A), { creditosIA: 999999 }));
  });

  it('permite limpar modulosPermitidos (fim do trial)', async () => {
    await permitir(updateDoc(doc(corretorA(), 'usuarios', UID_CORRETOR_A), { modulosPermitidos: null }));
  });

  it('recusa conceder modulosPermitidos', async () => {
    await negar(updateDoc(doc(corretorA(), 'usuarios', UID_CORRETOR_A), { modulosPermitidos: ['admin'] }));
  });

  it('não lê o documento de outro usuário', async () => {
    await negar(getDoc(doc(corretorA(), 'usuarios', UID_DONO_A)));
  });

  it('admin lê qualquer usuário, mas não o edita', async () => {
    await permitir(getDoc(doc(admin(), 'usuarios', UID_DONO_A)));
    await negar(updateDoc(doc(admin(), 'usuarios', UID_DONO_A), { nome: 'x' }));
  });

  it('cria o próprio documento como dono, com oficinaId == uid', async () => {
    const uid = 'uidNovoDono';
    await permitir(setDoc(doc(db(uid), 'usuarios', uid), {
      uid, oficinaId: uid, email: 'novo@x.com', papel: 'dono',
      permissoes: { dashboard: true, leads: true },
    }));
  });

  it('recusa papel master sem claim admin', async () => {
    const uid = 'uidQuerMaster';
    await negar(setDoc(doc(db(uid), 'usuarios', uid), {
      uid, oficinaId: uid, email: 'm@x.com', papel: 'master',
    }));
  });

  it('recusa campo fora da whitelist na criação', async () => {
    const uid = 'uidComExtra';
    await negar(setDoc(doc(db(uid), 'usuarios', uid), {
      uid, oficinaId: uid, email: 'e@x.com', papel: 'dono', admin: true,
    }));
  });

  it('recusa permissoes com chave desconhecida', async () => {
    const uid = 'uidPermsExtra';
    await negar(setDoc(doc(db(uid), 'usuarios', uid), {
      uid, oficinaId: uid, email: 'p@x.com', papel: 'dono',
      permissoes: { dashboard: true, superpoder: true },
    }));
  });

  it('recusa criar documento de outro uid', async () => {
    await negar(setDoc(doc(corretorA(), 'usuarios', 'uidVitima'), {
      uid: 'uidVitima', oficinaId: 'uidVitima', email: 'v@x.com', papel: 'dono',
    }));
  });

  it('recusa exclusão de usuário, inclusive pelo dono', async () => {
    await negar(deleteDoc(doc(donoA(), 'usuarios', UID_DONO_A)));
  });
});

/* ==========================================================================
 * 3. OFICINAS — cadastro e proteção comercial
 * ========================================================================== */
describe('3. oficinas/{oid}', () => {
  it('cadastro gratuito legítimo (payload de 12 campos) é aceito', async () => {
    const uid = 'uidCadastroOk';
    await permitir(setDoc(doc(db(uid), 'oficinas', uid), ofertaDeOficina(uid)));
  });

  it('bootstrap do AuthContext (6 campos, plano "grátis") é aceito', async () => {
    const uid = 'uidBootstrap';
    await permitir(setDoc(doc(db(uid), 'oficinas', uid), {
      uid, plano: 'grátis', nome: 'Minha Imobiliária',
      nomeOficina: 'Minha Imobiliária', ativo: true, nivelInteligencia: 'padrao',
    }));
  });

  it('recusa nivelInteligencia diferente de "padrao"', async () => {
    const uid = 'uidNivelAvancado';
    await negar(setDoc(doc(db(uid), 'oficinas', uid), ofertaDeOficina(uid, { nivelInteligencia: 'avancado' })));
  });

  it('recusa creditosIA', async () => {
    const uid = 'uidCreditos';
    await negar(setDoc(doc(db(uid), 'oficinas', uid), ofertaDeOficina(uid, { creditosIA: 999999 })));
  });

  it('recusa limiteUsuarios', async () => {
    const uid = 'uidLimite';
    await negar(setDoc(doc(db(uid), 'oficinas', uid), ofertaDeOficina(uid, { limiteUsuarios: 9999 })));
  });

  it('aceita perfil grátis próprio com isPro false e plano gratis', async () => {
    const uid = 'uidFreeIsProFalse';
    await permitir(setDoc(doc(db(uid), 'oficinas', uid), ofertaDeOficina(uid, {
      plano: 'gratis',
      isPro: false,
    })));
  });

  it('recusa isPro true e planoAssinante', async () => {
    const uid = 'uidPro';
    await negar(setDoc(doc(db(uid), 'oficinas', uid), ofertaDeOficina(uid, { isPro: true })));
    await negar(setDoc(doc(db(uid), 'oficinas', uid), ofertaDeOficina(uid, { planoAssinante: 'master' })));
  });

  it('recusa trialFim em 2099', async () => {
    const uid = 'uidTrialEterno';
    await negar(setDoc(doc(db(uid), 'oficinas', uid), ofertaDeOficina(uid, {
      trialFim: Timestamp.fromDate(new Date('2099-12-31T00:00:00Z')),
    })));
  });

  it('recusa trial de 30 dias e de 253 horas', async () => {
    const uid30 = 'uidTrial30';
    await negar(setDoc(doc(db(uid30), 'oficinas', uid30), ofertaDeOficina(uid30, {
      trialFim: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 3600 * 1000)),
    })));
    const uid253 = 'uidTrial253';
    await negar(setDoc(doc(db(uid253), 'oficinas', uid253), ofertaDeOficina(uid253, {
      trialFim: Timestamp.fromDate(new Date(Date.now() + 253 * 3600 * 1000)),
    })));
  });

  it('aceita trial de 251 horas (dentro da tolerância de 252h)', async () => {
    const uid = 'uidTrial251';
    await permitir(setDoc(doc(db(uid), 'oficinas', uid), ofertaDeOficina(uid, {
      trialFim: Timestamp.fromDate(new Date(Date.now() + 251 * 3600 * 1000)),
    })));
  });

  it('recusa trialFim no passado', async () => {
    const uid = 'uidTrialPassado';
    await negar(setDoc(doc(db(uid), 'oficinas', uid), ofertaDeOficina(uid, {
      trialFim: Timestamp.fromDate(new Date(Date.now() - 3600 * 1000)),
    })));
  });

  it('recusa trialInicio/criadoEm que não sejam timestamp', async () => {
    const uid = 'uidDataString';
    await negar(setDoc(doc(db(uid), 'oficinas', uid), ofertaDeOficina(uid, { criadoEm: '2026-01-01' })));
  });

  it('recusa módulo fora do trio permitido', async () => {
    const uid = 'uidModuloImobi';
    await negar(setDoc(doc(db(uid), 'oficinas', uid), ofertaDeOficina(uid, { modulosAtivos: ['os', 'imobi'] })));
  });

  it('recusa lista de módulos com mais de 3 itens', async () => {
    const uid = 'uidModuloMany';
    await negar(setDoc(doc(db(uid), 'oficinas', uid), ofertaDeOficina(uid, {
      modulosAtivos: ['os', 'oleo', 'alinhamento', 'os'],
    })));
  });

  it('recusa plano pago no cadastro', async () => {
    const uid = 'uidPlanoPro';
    await negar(setDoc(doc(db(uid), 'oficinas', uid), ofertaDeOficina(uid, { plano: 'pro' })));
  });

  it('recusa criar oficina cujo ID não é o próprio uid', async () => {
    await negar(setDoc(doc(donoA(), 'oficinas', 'oficinaDeOutro'), ofertaDeOficina('oficinaDeOutro')));
  });

  it('dono atualiza o nome da própria oficina', async () => {
    await permitir(updateDoc(doc(donoA(), 'oficinas', OID_A), { nomeOficina: 'Novo Nome' }));
  });

  it('dono não troca o plano da própria oficina', async () => {
    await negar(updateDoc(doc(donoA(), 'oficinas', OID_A), { plano: 'master' }));
  });

  it('plano GRATUITO não sobe o nível de IA', async () => {
    await negar(updateDoc(doc(donoA(), 'oficinas', OID_A), { nivelInteligencia: 'avancado' }));
  });

  it('nível de IA combinado com outro campo também é recusado (M4)', async () => {
    await negar(updateDoc(doc(donoA(), 'oficinas', OID_A), {
      nomeOficina: 'Imobiliária A', nivelInteligencia: 'avancado',
    }));
  });

  it('tenant PRO pode subir o nível de IA', async () => {
    await permitir(updateDoc(doc(donoPro(), 'oficinas', OID_PRO), { nivelInteligencia: 'avancado' }));
  });

  it('oficina não pode ser excluída', async () => {
    await negar(deleteDoc(doc(donoA(), 'oficinas', OID_A)));
  });
});

/* ==========================================================================
 * 4. LEADS PÚBLICOS
 * ========================================================================== */
describe('4. leads públicos', () => {
  it('anônimo cria lead imobiliário válido (11 campos)', async () => {
    await permitir(setDoc(doc(anon(), 'oficinas', OID_A, 'leads_imobi', 'leadPortal1'), leadImobi()));
  });

  it('anônimo cria lead genérico válido (8 campos)', async () => {
    await permitir(setDoc(doc(anon(), 'oficinas', OID_A, 'leads', 'leadPortal2'), leadGenerico()));
  });

  it('anônimo não cria na coleção global /leads', async () => {
    await negar(setDoc(doc(anon(), 'leads', 'leadGlobal'), leadImobi()));
  });

  it('recusa comissão injetada no lead imobiliário', async () => {
    await negar(setDoc(doc(anon(), 'oficinas', OID_A, 'leads_imobi', 'leadX1'), leadImobi({ comissao: 0.06 })));
  });

  it('recusa corretorUid e posVendaStatus injetados', async () => {
    await negar(setDoc(doc(anon(), 'oficinas', OID_A, 'leads_imobi', 'leadX2'), leadImobi({ corretorUid: 'x' })));
    await negar(setDoc(doc(anon(), 'oficinas', OID_A, 'leads_imobi', 'leadX3'), leadImobi({ posVendaStatus: 'pendente' })));
  });

  it('recusa estágio interno ("Fechado") na criação pública', async () => {
    await negar(setDoc(doc(anon(), 'oficinas', OID_A, 'leads_imobi', 'leadX4'), leadImobi({ estagio: 'Fechado' })));
  });

  it('recusa status diferente de "novo" no lead genérico', async () => {
    await negar(setDoc(doc(anon(), 'oficinas', OID_A, 'leads', 'leadX5'), leadGenerico({ status: 'fechado' })));
  });

  it('recusa campo do fluxo genérico no caminho imobiliário', async () => {
    await negar(setDoc(doc(anon(), 'oficinas', OID_A, 'leads_imobi', 'leadX6'), leadImobi({ problema: 'x' })));
  });

  it('recusa campo do fluxo imobiliário no caminho genérico', async () => {
    await negar(setDoc(doc(anon(), 'oficinas', OID_A, 'leads', 'leadX7'), leadGenerico({ estagio: 'Novo Lead' })));
  });

  it('recusa criação em oficina inexistente', async () => {
    await negar(setDoc(doc(anon(), 'oficinas', 'oficinaFantasma', 'leads_imobi', 'leadFantasma'), leadImobi()));
  });

  it('anônimo não lê, não atualiza e não exclui lead', async () => {
    await negar(getDoc(doc(anon(), 'oficinas', OID_A, 'leads_imobi', 'leadA1')));
    await negar(updateDoc(doc(anon(), 'oficinas', OID_A, 'leads_imobi', 'leadA1'), { estagio: 'Fechado' }));
    await negar(deleteDoc(doc(anon(), 'oficinas', OID_A, 'leads_imobi', 'leadA1')));
  });

  it('corretor de A move o lead do próprio tenant com campos internos', async () => {
    await permitir(updateDoc(doc(corretorA(), 'oficinas', OID_A, 'leads_imobi', 'leadA1'), {
      estagio: 'Proposta', corretorUid: UID_CORRETOR_A,
    }));
  });

  it('corretor de A não move lead de B', async () => {
    await negar(updateDoc(doc(corretorA(), 'oficinas', OID_B, 'leads_imobi', 'leadB1'), { estagio: 'Fechado' }));
  });

  it('corretor de A exclui lead do próprio tenant e não do vizinho', async () => {
    await permitir(deleteDoc(doc(corretorA(), 'oficinas', OID_A, 'leads_imobi', 'leadA1')));
    await negar(deleteDoc(doc(corretorA(), 'oficinas', OID_B, 'leads_imobi', 'leadB1')));
  });
});

/* ==========================================================================
 * 5. EVENTOS_LEAD — histórico imutável
 * ========================================================================== */
describe('5. eventos_lead', () => {
  it('membro cria evento válido com serverTimestamp', async () => {
    await permitir(setDoc(doc(corretorA(), 'oficinas', OID_A, 'eventos_lead', 'evNovo'), {
      tipo: 'contato', descricao: 'Ligação', leadId: 'leadA1', criadoEm: serverTimestamp(),
    }));
  });

  it('recusa evento sem tipo/descricao', async () => {
    await negar(setDoc(doc(corretorA(), 'oficinas', OID_A, 'eventos_lead', 'evInvalido'), { leadId: 'leadA1' }));
  });

  it('recusa tipo com mais de 40 caracteres', async () => {
    await negar(setDoc(doc(corretorA(), 'oficinas', OID_A, 'eventos_lead', 'evLongo'), {
      tipo: 'x'.repeat(41), descricao: 'ok', criadoEm: serverTimestamp(),
    }));
  });

  it('recusa descricao com mais de 500 caracteres', async () => {
    await negar(setDoc(doc(corretorA(), 'oficinas', OID_A, 'eventos_lead', 'evDesc'), {
      tipo: 'contato', descricao: 'x'.repeat(501), criadoEm: serverTimestamp(),
    }));
  });

  it('recusa criadoEm diferente de request.time', async () => {
    await negar(setDoc(doc(corretorA(), 'oficinas', OID_A, 'eventos_lead', 'evData'), {
      tipo: 'contato', descricao: 'ok', criadoEm: Timestamp.fromDate(new Date(Date.now() - 60000)),
    }));
  });

  it('ninguém atualiza evento registrado', async () => {
    await negar(updateDoc(doc(corretorA(), 'oficinas', OID_A, 'eventos_lead', 'evA1'), { descricao: 'editado' }));
    await negar(updateDoc(doc(donoA(), 'oficinas', OID_A, 'eventos_lead', 'evA1'), { descricao: 'editado' }));
  });

  it('ninguém exclui evento registrado', async () => {
    await negar(deleteDoc(doc(donoA(), 'oficinas', OID_A, 'eventos_lead', 'evA1')));
  });

  it('anônimo não lê eventos', async () => {
    await negar(getDoc(doc(anon(), 'oficinas', OID_A, 'eventos_lead', 'evA1')));
  });

  it('membro de B não lê evento de A', async () => {
    await negar(getDoc(doc(donoB(), 'oficinas', OID_A, 'eventos_lead', 'evA1')));
  });
});

/* ==========================================================================
 * 6. OS E CONFIGURAÇÕES
 * ========================================================================== */
describe('6. os e configuracoes', () => {
  it('anônimo lê a OS por ID (comportamento atual do /status)', async () => {
    const snap = await permitir(getDoc(doc(anon(), 'oficinas', OID_A, 'os', 'osA1')));
    expect(snap.exists()).toBe(true);
  });

  it('anônimo não lista OS', async () => {
    await negar(getDocs(collection(anon(), 'oficinas', OID_A, 'os')));
  });

  it('anônimo não altera a OS, nem apenas senhaConsulta', async () => {
    await negar(updateDoc(doc(anon(), 'oficinas', OID_A, 'os', 'osA1'), { senhaConsulta: '9999' }));
    await negar(updateDoc(doc(anon(), 'oficinas', OID_A, 'os', 'osA1'), { status: 'fechada' }));
  });

  it('anônimo não exclui OS', async () => {
    await negar(deleteDoc(doc(anon(), 'oficinas', OID_A, 'os', 'osA1')));
  });

  it('membro cria, atualiza e exclui OS do próprio tenant', async () => {
    await permitir(setDoc(doc(corretorA(), 'oficinas', OID_A, 'os', 'osNova'), {
      nomeCliente: 'X', status: 'aberta',
    }));
    await permitir(updateDoc(doc(corretorA(), 'oficinas', OID_A, 'os', 'osNova'), { senhaConsulta: '4321' }));
    await permitir(deleteDoc(doc(corretorA(), 'oficinas', OID_A, 'os', 'osNova')));
  });

  it('membro não lê nem altera OS de outro tenant', async () => {
    await negar(getDoc(doc(corretorA(), 'oficinas', OID_B, 'os', 'osB1')));
    await negar(updateDoc(doc(corretorA(), 'oficinas', OID_B, 'os', 'osB1'), { status: 'fechada' }));
    await negar(deleteDoc(doc(corretorA(), 'oficinas', OID_B, 'os', 'osB1')));
  });

  it('anônimo lê configuracoes/geral (comportamento atual do /status)', async () => {
    const snap = await permitir(getDoc(doc(anon(), 'oficinas', OID_A, 'configuracoes', 'geral')));
    expect(snap.exists()).toBe(true);
  });

  it('anônimo não lista configurações nem escreve', async () => {
    await negar(getDocs(collection(anon(), 'oficinas', OID_A, 'configuracoes')));
    await negar(setDoc(doc(anon(), 'oficinas', OID_A, 'configuracoes', 'geral'), { pixKey: 'atacante@x.com' }));
  });

  it('membro escreve configurações do próprio tenant e não do vizinho', async () => {
    await permitir(updateDoc(doc(corretorA(), 'oficinas', OID_A, 'configuracoes', 'geral'), { telefone: '34999991111' }));
    await negar(updateDoc(doc(corretorA(), 'oficinas', OID_B, 'configuracoes', 'geral'), { telefone: 'x' }));
  });
});

/* ==========================================================================
 * 7. IMÓVEIS E VISTORIAS — [HIPOTÉTICO] nenhum fluxo grava publico: true
 * ========================================================================== */
describe('7. imoveis_imobi e vistorias [HIPOTÉTICO]', () => {
  it('anônimo lê imóvel marcado publico: true', async () => {
    await permitir(getDoc(doc(anon(), 'oficinas', OID_A, 'imoveis_imobi', 'imvPublico')));
  });

  it('anônimo não lê imóvel com publico: false', async () => {
    await negar(getDoc(doc(anon(), 'oficinas', OID_A, 'imoveis_imobi', 'imvPrivado')));
  });

  it('query sem filtro de publico é recusada; com filtro é aceita', async () => {
    await negar(getDocs(collection(anon(), 'oficinas', OID_A, 'imoveis_imobi')));
    await permitir(getDocs(query(
      collection(anon(), 'oficinas', OID_A, 'imoveis_imobi'),
      where('publico', '==', true),
    )));
  });

  it('collection group exige o filtro publico == true', async () => {
    await permitir(getDocs(query(collectionGroup(anon(), 'imoveis_imobi'), where('publico', '==', true))));
    await negar(getDocs(collectionGroup(anon(), 'imoveis_imobi')));
  });

  it('membro escreve no próprio tenant e não no vizinho', async () => {
    await permitir(setDoc(doc(corretorA(), 'oficinas', OID_A, 'imoveis_imobi', 'imvNovo'), { titulo: 'Novo' }));
    await negar(setDoc(doc(corretorA(), 'oficinas', OID_B, 'imoveis_imobi', 'imvInvasor'), { titulo: 'X' }));
  });

  it('membro exclui imóvel do próprio tenant e não do vizinho', async () => {
    await permitir(deleteDoc(doc(corretorA(), 'oficinas', OID_A, 'imoveis_imobi', 'imvPrivado')));
    await negar(deleteDoc(doc(corretorA(), 'oficinas', OID_B, 'imoveis_imobi', 'imvB')));
  });

  it('vistoria pública segue a mesma regra', async () => {
    await permitir(getDoc(doc(anon(), 'oficinas', OID_A, 'vistorias', 'vistA1')));
  });
});

/* ==========================================================================
 * 8. ACOMPANHAMENTOS PÚBLICOS
 * ========================================================================== */
describe('8. acompanhamentos_publicos', () => {
  it('anônimo lê pelo ID (código + senha)', async () => {
    await permitir(getDoc(doc(anon(), 'acompanhamentos_publicos', 'IMB-1234_5678')));
  });

  it('anônimo não lista a coleção', async () => {
    await negar(getDocs(collection(anon(), 'acompanhamentos_publicos')));
  });

  it('anônimo não cria espelho público', async () => {
    await negar(setDoc(doc(anon(), 'acompanhamentos_publicos', 'IMB-0000_0000'), {
      codigo: 'IMB-0000', senha: '0000', tenantId: OID_A,
    }));
  });

  it('membro cria espelho para o próprio tenant', async () => {
    await permitir(setDoc(doc(corretorA(), 'acompanhamentos_publicos', 'IMB-2222_3333'), {
      codigo: 'IMB-2222', senha: '3333', tenantId: OID_A,
    }));
  });

  it('membro não cria espelho para outro tenant', async () => {
    await negar(setDoc(doc(corretorA(), 'acompanhamentos_publicos', 'IMB-4444_5555'), {
      codigo: 'IMB-4444', senha: '5555', tenantId: OID_B,
    }));
  });

  it('membro atualiza e exclui o espelho do próprio tenant', async () => {
    await permitir(updateDoc(doc(corretorA(), 'acompanhamentos_publicos', 'IMB-1234_5678'), { cliente: 'Editado' }));
    await permitir(deleteDoc(doc(corretorA(), 'acompanhamentos_publicos', 'IMB-1234_5678')));
  });

  it('membro de outro tenant não altera nem exclui o espelho', async () => {
    await negar(updateDoc(doc(donoB(), 'acompanhamentos_publicos', 'IMB-1234_5678'), { cliente: 'invasor' }));
    await negar(deleteDoc(doc(donoB(), 'acompanhamentos_publicos', 'IMB-1234_5678')));
  });
});

/* ==========================================================================
 * 9. COLEÇÕES GLOBAIS
 * ========================================================================== */
describe('9. coleções globais', () => {
  it('dono escreve somente o próprio documento do desmanche', async () => {
    await permitir(setDoc(doc(donoA(), 'desmanche_global', OID_A), {
      nomeOficina: 'A', parceiros_ids: [], veiculos_publicados: [],
    }));
    await negar(setDoc(doc(donoA(), 'desmanche_global', OID_B), { nomeOficina: 'invasor' }));
  });

  it('dono exclui o próprio documento do desmanche e não o do vizinho', async () => {
    await permitir(deleteDoc(doc(donoA(), 'desmanche_global', OID_A)));
    await negar(deleteDoc(doc(donoA(), 'desmanche_global', OID_B)));
  });

  it('catálogo do desmanche é legível por autenticado, não por anônimo', async () => {
    await permitir(getDocs(collection(corretorA(), 'desmanche_global')));
    await negar(getDocs(collection(anon(), 'desmanche_global')));
  });

  it('planos: leitura autenticada, escrita só com claim admin', async () => {
    await negar(getDoc(doc(anon(), 'planos', 'gratis')));
    await permitir(getDoc(doc(corretorA(), 'planos', 'gratis')));
    await negar(setDoc(doc(corretorA(), 'planos', 'gratis'), { preco: 0 }));
    await permitir(setDoc(doc(admin(), 'planos', 'gratis'), { preco: 0 }));
  });

  it('MASTER: leitura autenticada, escrita só com claim admin', async () => {
    await permitir(getDoc(doc(corretorA(), 'oficinas', 'MASTER', 'config', 'global')));
    await negar(getDoc(doc(anon(), 'oficinas', 'MASTER', 'config', 'global')));
    await negar(setDoc(doc(corretorA(), 'oficinas', 'MASTER', 'config', 'global'), { flag: false }));
    await permitir(setDoc(doc(admin(), 'oficinas', 'MASTER', 'config', 'global'), { flag: false }));
  });

  it('tarefas e telegram_leads de topo são exclusivas do admin', async () => {
    await negar(getDoc(doc(corretorA(), 'tarefas', 'tarefaGlobal')));
    await negar(setDoc(doc(corretorA(), 'tarefas', 'tarefaNova'), { titulo: 'x' }));
    await negar(getDoc(doc(corretorA(), 'telegram_leads', 'tg1')));
    await permitir(getDoc(doc(admin(), 'telegram_leads', 'tg1')));
    await permitir(setDoc(doc(admin(), 'telegram_leads', 'tg2'), { texto: 'ok' }));
  });

  it('configuracoes_admin é exclusiva do admin', async () => {
    await negar(getDocs(collection(corretorA(), 'configuracoes_admin')));
    await negar(setDoc(doc(corretorA(), 'configuracoes_admin', 'doc'), { x: 1 }));
    await permitir(setDoc(doc(admin(), 'configuracoes_admin', 'doc'), { x: 1 }));
  });
});

/* ==========================================================================
 * 10. ORDENSSERVICO — [HIPOTÉTICO] nenhum código escreve nesta coleção
 * ========================================================================== */
describe('10. ordensServico [HIPOTÉTICO]', () => {
  it('membro lê e atualiza a ordem do próprio tenant', async () => {
    await permitir(getDoc(doc(corretorA(), 'ordensServico', 'ordemA1')));
    await permitir(updateDoc(doc(corretorA(), 'ordensServico', 'ordemA1'), { valor: 300 }));
  });

  it('membro não lê, não atualiza e não exclui ordem de outro tenant', async () => {
    await negar(getDoc(doc(corretorA(), 'ordensServico', 'ordemB1')));
    await negar(updateDoc(doc(corretorA(), 'ordensServico', 'ordemB1'), { valor: 1 }));
    await negar(deleteDoc(doc(corretorA(), 'ordensServico', 'ordemB1')));
  });

  it('membro exclui a ordem do próprio tenant', async () => {
    await permitir(deleteDoc(doc(corretorA(), 'ordensServico', 'ordemA1')));
  });

  it('ninguém transfere a ordem para outra oficina', async () => {
    await negar(updateDoc(doc(corretorA(), 'ordensServico', 'ordemA1'), { oficinaId: OID_B }));
  });

  it('quem é membro de A e B também não transfere', async () => {
    await negar(updateDoc(doc(db(UID_DUPLO), 'ordensServico', 'ordemA1'), { oficinaId: OID_B }));
  });

  it('criação exige oficinaId não vazio e membresia', async () => {
    await permitir(setDoc(doc(corretorA(), 'ordensServico', 'ordemNova'), { oficinaId: OID_A, valor: 100 }));
    await negar(setDoc(doc(corretorA(), 'ordensServico', 'ordemInvalida'), { valor: 100 }));
  });

  it('anônimo não acessa ordens de serviço', async () => {
    await negar(getDoc(doc(anon(), 'ordensServico', 'ordemA1')));
    await negar(setDoc(doc(anon(), 'ordensServico', 'ordemAnon'), { oficinaId: OID_A }));
  });
});

/* ==========================================================================
 * 11. EQUIPE — estrutura real (papel em usuarios) e hipotética (equipe/{uid})
 * ========================================================================== */
describe('11. equipe', () => {
  it('[REAL] dono administra a equipe via usuarios.papel + oficinaId', async () => {
    await permitir(setDoc(doc(donoA(), 'oficinas', OID_A, 'equipe', 'uidNovoMembro'), {
      nome: 'Novo', nivelAcesso: 'corretor', ativo: true,
    }));
  });

  it('[REAL] corretor não administra a equipe', async () => {
    await negar(setDoc(doc(corretorA(), 'oficinas', OID_A, 'equipe', 'uidOutro'), {
      nome: 'Outro', nivelAcesso: 'gerente',
    }));
  });

  it('[REAL] papel global "dono" não autoriza equipe de outro tenant', async () => {
    await negar(setDoc(doc(donoA(), 'oficinas', OID_B, 'equipe', 'uidInvasor'), { nome: 'X' }));
  });

  it('[REAL] dono exclui membro da própria equipe e não da vizinha', async () => {
    await permitir(deleteDoc(doc(donoA(), 'oficinas', OID_A, 'equipe', UID_CORRETOR_A)));
    await negar(deleteDoc(doc(donoA(), 'oficinas', OID_B, 'equipe', UID_DUPLO)));
  });

  it('[HIPOTÉTICO] gerente registrado em equipe/{uid} administra a equipe', async () => {
    await permitir(setDoc(doc(gerenteA(), 'oficinas', OID_A, 'equipe', 'uidConvidado'), {
      nome: 'Convidado', nivelAcesso: 'corretor',
    }));
  });

  it('membro comum lê a equipe, mas não escreve', async () => {
    await permitir(getDoc(doc(corretorA(), 'oficinas', OID_A, 'equipe', UID_GERENTE_A)));
    await negar(updateDoc(doc(corretorA(), 'oficinas', OID_A, 'equipe', UID_GERENTE_A), { nivelAcesso: 'dono' }));
  });

  it('subcoleção usuarios do tenant: leitura por membro, escrita só por gestor', async () => {
    await negar(setDoc(doc(corretorA(), 'oficinas', OID_A, 'usuarios', 'docX'), { nome: 'X' }));
    await permitir(setDoc(doc(donoA(), 'oficinas', OID_A, 'usuarios', 'docY'), { nome: 'Y' }));
    await negar(setDoc(doc(donoA(), 'oficinas', OID_B, 'usuarios', 'docZ'), { nome: 'Z' }));
  });
});

/* ==========================================================================
 * 12. MATRIZ DAS SUBCOLEÇÕES DE TENANT (19 coleções × 3 blocos)
 * ========================================================================== */
describe('12. subcoleções de tenant (matriz)', () => {
  for (const sub of COLECOES_TENANT) {
    it(`${sub}: membro lê, cria e exclui no próprio tenant`, async () => {
      await permitir(getDoc(doc(corretorA(), 'oficinas', OID_A, sub, 'docA')));
      await permitir(setDoc(doc(corretorA(), 'oficinas', OID_A, sub, 'docNovo'), { titulo: 'novo' }));
      await permitir(deleteDoc(doc(corretorA(), 'oficinas', OID_A, sub, 'docNovo')));
    });

    it(`${sub}: membro não lê, não escreve e não exclui no tenant vizinho`, async () => {
      await negar(getDoc(doc(corretorA(), 'oficinas', OID_B, sub, 'docB')));
      await negar(setDoc(doc(corretorA(), 'oficinas', OID_B, sub, 'docInvasor'), { titulo: 'x' }));
      await negar(deleteDoc(doc(corretorA(), 'oficinas', OID_B, sub, 'docB')));
    });

    it(`${sub}: anônimo é recusado em tudo`, async () => {
      await negar(getDoc(doc(anon(), 'oficinas', OID_A, sub, 'docA')));
      await negar(setDoc(doc(anon(), 'oficinas', OID_A, sub, 'docAnon'), { titulo: 'x' }));
      await negar(deleteDoc(doc(anon(), 'oficinas', OID_A, sub, 'docA')));
    });
  }

  it('imoveis_nicho valida nicho, referencia e cib', async () => {
    await negar(setDoc(doc(corretorA(), 'oficinas', OID_A, 'imoveis_nicho', 'nichoRuim'), {
      nicho: 'inexistente', referencia: 'X', cib: '1',
    }));
    await permitir(setDoc(doc(corretorA(), 'oficinas', OID_A, 'imoveis_nicho', 'nichoOk'), {
      nicho: 'rural', referencia: 'Fazenda 200ha', cib: '12345678901234567890',
    }));
  });

  it('notas_fiscais_imobi limita o CIB a 20 caracteres', async () => {
    await negar(setDoc(doc(corretorA(), 'oficinas', OID_A, 'notas_fiscais_imobi', 'nfRuim'), {
      valor: 10, cib: '1'.repeat(21),
    }));
    await permitir(setDoc(doc(corretorA(), 'oficinas', OID_A, 'notas_fiscais_imobi', 'nfOk'), {
      valor: 10, cib: '12345678901234567890',
    }));
  });
});

/* ==========================================================================
 * 13. [RISCO ACEITO] — permitido HOJE, considerado inseguro.
 * --------------------------------------------------------------------------
 * ATENÇÃO: um teste VERDE neste bloco significa apenas que a regra atual
 * permite a operação. NÃO significa que o comportamento é seguro.
 * Cada item tem decisão pendente em tests/PENDENCIAS.md.
 * Quando a correção for aplicada, o teste deve virar `negar(...)`.
 * ========================================================================== */
describe('13. [RISCO ACEITO] permitido hoje, inseguro', () => {
  it('[R1] anônimo direciona lead para o tenant que quiser', async () => {
    await permitir(setDoc(doc(anon(), 'oficinas', OID_B, 'leads_imobi', 'leadCrossTenant'), leadImobi()));
  });

  it('[R2] anônimo escolhe o corretorResponsavel do lead', async () => {
    await permitir(setDoc(doc(anon(), 'oficinas', OID_A, 'leads_imobi', 'leadX8'),
      leadImobi({ corretorResponsavel: 'Maria Corretora' })));
  });

  it('[R3] anônimo lê a OS inteira (dado pessoal do cliente final)', async () => {
    const snap = await permitir(getDoc(doc(anon(), 'oficinas', OID_A, 'os', 'osA1')));
    expect(snap.data()).toHaveProperty('telefone');
    expect(snap.data()).toHaveProperty('nomeCliente');
  });

  it('[R4] anônimo lê configuracoes/geral inteira, incluindo pixKey', async () => {
    const snap = await permitir(getDoc(doc(anon(), 'oficinas', OID_A, 'configuracoes', 'geral')));
    expect(snap.data()).toHaveProperty('pixKey');
  });

  it('[R5] o ID do acompanhamento público contém a senha em texto claro', async () => {
    const snap = await permitir(getDoc(doc(anon(), 'acompanhamentos_publicos', 'IMB-1234_5678')));
    expect(snap.id).toBe('IMB-1234_5678');
    expect(snap.data().senha).toBe('5678');
  });

  it('[R6] imóvel público expõe o documento completo', async () => {
    const snap = await permitir(getDoc(doc(anon(), 'oficinas', OID_A, 'imoveis_imobi', 'imvPublico')));
    expect(snap.data()).toHaveProperty('preco');
    expect(snap.data()).toHaveProperty('endereco');
  });

  it('[R7] qualquer autenticado lista o catálogo cruzado de desmanche', async () => {
    const snap = await permitir(getDocs(collection(corretorA(), 'desmanche_global')));
    expect(snap.size).toBeGreaterThanOrEqual(2);
  });

  it('[R8] qualquer autenticado lê o catálogo comercial de planos', async () => {
    await permitir(getDoc(doc(corretorA(), 'planos', 'gratis')));
  });

  it('[R9] nem o admin consegue excluir conta de usuário', async () => {
    await negar(deleteDoc(doc(admin(), 'usuarios', UID_DONO_A)));
  });
});
