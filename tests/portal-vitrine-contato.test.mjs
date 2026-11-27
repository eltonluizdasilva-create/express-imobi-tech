/**
 * D-23.38 / D-23.39 — contato do anúncio na vitrine pública + ficha do imóvel
 * ============================================================================
 * Bug de produção: o cartão da vitrine mandava o visitante para o WhatsApp da
 * PLATAFORMA (+856 …) em vez do WhatsApp da imobiliária dona do anúncio, e não
 * existia ficha expandida (galeria, ficha técnica, link direto, captura de lead).
 *
 * Aqui ficam as provas puras (funções de `src/lib`) e os contratos de fonte que
 * garantem: nenhum número da plataforma no portal, WhatsApp só quando publicado,
 * ficha acessível por teclado, lead no CRM do tenant e config gravada no caminho
 * canônico (`config/geral`) — a causa do checklist travado em 0/3.
 */
import { readFileSync } from 'node:fs';

import {
  imovelCorrespondeAoTermo,
  imovelEhExemplo,
  mensagemInteresseImovel,
  normalizarWhatsappImovel,
  rotuloCodigoImovel,
  urlImovelPortal,
  urlWhatsappImovel,
  whatsappDoImovel,
} from '../src/lib/contatoImovel.js';
import {
  CONFIG_CANONICA,
  CONFIG_LEGADA,
  configParaOnboarding,
  mesclarConfigImobiliaria,
  normalizarConfigImobiliaria,
  snapshotMarcaImobiliaria,
} from '../src/lib/configImobiliaria.js';
import { avaliarPassos, creciInformado, marcaConfigurada, progresso } from '../src/lib/onboarding.js';
import {
  MAX_FOTOS_IMOVEL,
  ORCAMENTO_DOCUMENTO_BYTES,
  ORCAMENTO_FOTOS_BYTES,
  bytesDaFoto,
  limitarFotosAoOrcamento,
} from '../src/lib/fotosImovel.js';

let falhas = 0;
const ok = (nome, condicao, extra = '') => {
  console.log(`${condicao ? 'PASS' : 'FAIL'}  ${nome}${extra ? ' — ' + extra : ''}`);
  if (!condicao) falhas += 1;
};

const ler = (relativo) => readFileSync(new URL(`../${relativo}`, import.meta.url), 'utf8');

/* ------------------- 1. normalização do WhatsApp do anúncio ---------------- */
ok('normaliza fixo com DDD para wa.me com DDI 55', normalizarWhatsappImovel('(34) 3333-4444') === '553433334444');
ok('normaliza celular de 11 dígitos', normalizarWhatsappImovel('34 99999-9999') === '5534999999999');
ok('não duplica o DDI quando o número já vem com 55', normalizarWhatsappImovel('+55 (34) 99999-9999') === '5534999999999');
ok('remove zeros à esquerda antes do DDI', normalizarWhatsappImovel('0034 99999-9999') === '5534999999999');
ok('descarta número curto demais', normalizarWhatsappImovel('123') === '');
ok('descarta valor vazio/nulo', normalizarWhatsappImovel('') === '' && normalizarWhatsappImovel(null) === '');

/* ------------- 2. contato do anúncio: nunca a plataforma ------------------ */
ok('imóvel sem telefone publicado não empresta número nenhum', whatsappDoImovel({ titulo: 'Apartamento' }) === '');
ok('imóvel nulo devolve vazio', whatsappDoImovel(null) === '' && whatsappDoImovel(undefined) === '');
ok(
  'prioriza o WhatsApp do corretor/anúncio publicado',
  whatsappDoImovel({ whatsappCorretor: '', imobiliariaWhatsapp: '(34) 98888-7777' }) === '5534988887777',
);
ok(
  'link wa.me some quando não há WhatsApp no anúncio',
  urlWhatsappImovel({ codigo: 'IMB-1' }) === '',
);
const linkZap = urlWhatsappImovel({ codigo: 'imb-1', whatsapp: '34 98888-7777', valor: 250000 });
ok('link wa.me usa o número da imobiliária', linkZap.startsWith('https://wa.me/5534988887777?text='), linkZap.slice(0, 42));
ok('mensagem do link cita o código do imóvel', decodeURIComponent(linkZap).includes('IMB-1'));
ok(
  'mensagem de interesse traz nome, bairro/cidade e valor',
  (() => {
    const texto = mensagemInteresseImovel(
      { codigo: 'IMB-2', titulo: 'Casa', bairro: 'Centro', cidade: 'Uberlândia', valor: 300000 },
      { nome: 'Ana' },
    );
    return texto.includes('Ana') && texto.includes('Centro, Uberlândia') && texto.includes('IMB-2');
  })(),
);

/* ---------------------------- 3. link direto ------------------------------ */
ok(
  'link do anúncio leva imobiliária e código do imóvel',
  urlImovelPortal('https://app.exemplo.com/', { codigo: 'IMB-1042', oficinaId: 'ofi_1' }) ===
    'https://app.exemplo.com/portal?imobiliariaId=ofi_1&imovel=IMB-1042',
);
ok('link usa o id quando o imóvel ainda não tem código', urlImovelPortal('', { id: 'doc_9' }) === '/portal?imovel=doc_9');
ok('termo do link casa com id, código e referência', 
  imovelCorrespondeAoTermo({ id: 'doc_9', codigo: 'IMB-1042', referencia: 'REF-7' }, 'doc_9') &&
    imovelCorrespondeAoTermo({ id: 'doc_9', codigo: 'IMB-1042', referencia: 'REF-7' }, 'imb-1042') &&
    imovelCorrespondeAoTermo({ id: 'doc_9', codigo: 'IMB-1042', referencia: 'REF-7' }, 'ref-7'));
ok(
  'termo diferente ou vazio não casa',
  !imovelCorrespondeAoTermo({ id: 'doc_9', codigo: 'IMB-1042' }, 'IMB-999') &&
    !imovelCorrespondeAoTermo({ id: 'doc_9' }, '   '),
);
ok('rótulo do imóvel prioriza código e cai em referência', rotuloCodigoImovel({ referencia: 'ref-9' }) === 'REF-9');
ok('rótulo tem fallback', rotuloCodigoImovel({}) === 'IMÓVEL');
ok(
  'selo de exemplo segue o id de demonstração e o modo vitrine',
  imovelEhExemplo({ id: 'vit_demo_1' }) &&
    imovelEhExemplo({ id: 'real_1' }, { vitrineEmDemonstracao: true }) &&
    !imovelEhExemplo({ id: 'real_1' }),
);

/* ---------------- 4. config: caminho canônico × caminho legado ------------ */
ok(
  'coleção canônica é config/geral (a que o painel lê)',
  CONFIG_CANONICA.colecao === 'config' && CONFIG_CANONICA.docId === 'geral',
);
ok(
  'coleção legada continua conhecida para leitura/espelho',
  CONFIG_LEGADA.colecao === 'configuracoes' && CONFIG_LEGADA.docId === 'geral',
);

const mesclada = mesclarConfigImobiliaria(
  { nome: 'Imob Antiga', whatsapp: '', creci: '' },
  { nome: 'Imob Nova', creci: 'CRECI-MG 12345' },
);
ok('campo preenchido da fonte mais nova vence', mesclada.nome === 'Imob Nova', mesclada.nome);
ok('campo vazio não apaga o que já existia', mesclada.creci === 'CRECI-MG 12345' && !('whatsapp' in mesclada));

const normalizada = normalizarConfigImobiliaria({
  nomeImobiliaria: 'Imob X',
  telefone: '34999999999',
  registroCreci: 'CRECI 12345',
});
ok(
  'normalização sincroniza nome e nomeImobiliaria',
  normalizada.nome === 'Imob X' && normalizada.nomeImobiliaria === 'Imob X',
);
ok('normalização sincroniza CRECI/registroCreci', normalizada.creci === 'CRECI 12345');
ok('normalização leva o telefone para wa.me', normalizada.whatsapp === '5534999999999', normalizada.whatsapp);

const configDaConta = configParaOnboarding({}, { nome: 'Oficina Y', whatsapp: '34 98888-7777', creci: 'CRECI 9999' });
ok(
  'config vazia cai na identidade do cadastro da oficina',
  configDaConta.nome === 'Oficina Y' && configDaConta.whatsapp === '5534988887777',
);
const configSalva = configParaOnboarding({ whatsapp: '34977776666' }, { nome: 'Oficina Y', whatsapp: '34 98888-7777' });
ok(
  'config salva vence o cadastro da oficina',
  configSalva.whatsapp === '5534977776666' && configSalva.nome === 'Oficina Y',
);

const marca = snapshotMarcaImobiliaria({ nome: 'Imob Z', creci: 'CRECI 1', whatsapp: '34999999999' });
ok(
  'snapshot copia nome, CRECI e WhatsApp para o imóvel público',
  marca.imobiliariaNome === 'Imob Z' &&
    marca.imobiliariaCreci === 'CRECI 1' &&
    marca.imobiliariaWhatsapp === '5534999999999',
);

/* ---------- 5. checklist de primeiros passos deixa de ficar em 0/3 ------- */
ok('marca configurada exige nome + WhatsApp com DDD', marcaConfigurada({ nome: 'Imob', whatsapp: '34999999999' }));
ok('só nome não conclui o passo da marca', !marcaConfigurada({ nome: 'Imob' }));
ok('CRECI informado também prova marca configurada', creciInformado({ creci: 'CRECI 12345' }));
ok('CRECI curto demais não conta', !creciInformado({ creci: '12' }));

const passosCreci = avaliarPassos({ config: { nome: 'Imob', creci: 'CRECI 12345' } });
ok('passo 1 conclui com nome + CRECI (bug do 0/3)', passosCreci[0].concluido === true);
ok('passo 2 continua pendente sem imóvel', passosCreci[1].concluido === false);
ok('progresso conta 1 de 3', progresso(passosCreci).rotulo === '1 de 3 concluídos', progresso(passosCreci).rotulo);

const passosCompletos = avaliarPassos({ config: {}, imoveis: [{ id: 'a' }], passo3Feito: true });
ok('1 imóvel cadastrado conclui o passo 2', passosCompletos[1].concluido === true);
ok('arte/vitrine gerada conclui o passo 3', passosCompletos[2].concluido === true);
ok('progresso chega a 2 de 3 antes do passo da marca', progresso(passosCompletos).concluidos === 2);


/* --------------------- 6. orçamento de fotos do imóvel ------------------- */
ok('limite de fotos do cadastro é 7', MAX_FOTOS_IMOVEL === 7);
ok('orçamento de fotos fica abaixo do teto de 1 MiB do documento', ORCAMENTO_FOTOS_BYTES < ORCAMENTO_DOCUMENTO_BYTES);
ok('link http não pesa no documento', bytesDaFoto('https://cdn.exemplo.com/foto.jpg') === 0);
ok('data URL paga 3/4 do base64', bytesDaFoto(`data:image/webp;base64,${'A'.repeat(4000)}`) === 3000);

const fotoGigante = `data:image/webp;base64,${'A'.repeat(1000000)}`;
const fotoPequena = `data:image/webp;base64,${'A'.repeat(1000)}`;
const aceitas = limitarFotosAoOrcamento(['https://cdn.exemplo.com/capa.jpg', fotoGigante, fotoPequena]);
ok(
  'foto que estoura o orçamento é descartada (causa do Salvar Imóvel silencioso)',
  aceitas.length === 2,
  String(aceitas.length),
);
ok('link de capa e foto pequena continuam no anúncio', aceitas[0].startsWith('https://') && aceitas[1] === fotoPequena);
ok(
  'lista inválida não quebra o salvamento',
  Array.isArray(limitarFotosAoOrcamento(null)) && limitarFotosAoOrcamento(null).length === 0,
);

/* ------------------- 7. contratos de fonte (regressão) ------------------- */
const portal = ler('src/PortalCliente.jsx');
const admin = ler('src/AdminNovo.jsx');
const hook = ler('src/hooks/useCarregamentoInicial.jsx');
const configuracoes = ler('src/Configuracoes.jsx');
const numeroSuporte = (ler('src/lib/contato.js').match(/WHATSAPP_SUPORTE\s*=\s*'(\d+)'/) || [])[1] || '';

ok('número da plataforma é localizado na fonte única', numeroSuporte.length >= 10);
ok('portal público não contém o número do suporte', Boolean(numeroSuporte) && !portal.includes(numeroSuporte));
ok('portal não importa mais o contato da plataforma', !portal.includes("from './lib/contato'"));
ok(
  'portal usa o contato do imóvel',
  portal.includes("from './lib/contatoImovel'") && portal.includes('whatsappDoImovel(imv) && ('),
);
ok('ficha do imóvel é um diálogo acessível', portal.includes('role="dialog"') && portal.includes('aria-modal="true"'));
ok(
  'cartão da vitrine abre a ficha por clique e por teclado',
  portal.includes('onClick={() => abrirFichaImovel(imv)}') && portal.includes('abrirFichaImovel(imv);'),
);
ok(
  'ficha tem galeria navegável e link partilhável',
  portal.includes('aria-label="Foto anterior"') && portal.includes('copiarLinkImovel'),
);
ok(
  'lead da ficha cai no CRM do tenant',
  portal.includes('await registrarLeadNoCRM({') && portal.includes('oficinaIdPreferencial: alvo.oficinaId'),
);
ok('deep link ?imovel= abre a ficha do anúncio', portal.includes('if (!imovelIdDireto) return;'));

ok('AdminNovo grava o imóvel com orçamento de fotos', admin.includes('limitarFotosAoOrcamento(fotosEscolhidas)'));
ok(
  'AdminNovo copia a marca da imobiliária para o anúncio',
  admin.includes('snapshotMarcaImobiliaria(config, dadosImobiliaria)'),
);
ok(
  'AdminNovo fecha o modal só depois de gravar o documento',
  admin.indexOf('setModalNovoImovel(false)') > admin.indexOf("'imoveis_imobi'"),
);
ok('AdminNovo mostra o erro do salvamento dentro do modal', admin.includes('{erroImovel && ('));
ok('AdminNovo confirma o sucesso na aba Captação', admin.includes('{sucessoImovel && ('));
ok(
  'hook de carga lê config canônica e legada',
  hook.includes('CONFIG_CANONICA') && hook.includes('CONFIG_LEGADA') && hook.includes('mesclarConfigImobiliaria'),
);
ok(
  'tela de Configurações grava nos dois caminhos',
  configuracoes.includes('CONFIG_CANONICA.colecao') && configuracoes.includes('CONFIG_LEGADA.colecao'),
);

console.log(`\n${falhas === 0 ? 'TODOS OS TESTES PASSARAM' : falhas + ' FALHA(S)'}`);
process.exit(falhas === 0 ? 0 : 1);

