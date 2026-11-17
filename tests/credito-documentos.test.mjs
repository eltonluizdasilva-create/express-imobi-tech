/** Fase 3 — checklist de documentos (funções puras). */
import {
  BLOCOS, STATUS_DOC, PERFIS_COMPRADOR, gerarChecklist, somarMeses,
  statusEfetivo, resumoChecklist, pendenciasParaWhatsApp, caminhoStorage,
} from '../src/lib/credito/documentos.js';

let falhas = 0;
const ok = (n, c, e = '') => { console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${e ? ' — ' + e : ''}`); if (!c) falhas += 1; };

ok('3 blocos', BLOCOS.length === 3 && BLOCOS.map((b) => b.key).join() === 'comprador,vendedor,imovel');
ok('3 status', STATUS_DOC.map((s) => s.key).join() === 'pendente,recebido,vencido');
ok('4 perfis', PERFIS_COMPRADOR.length === 4);

const clt = gerarChecklist({ perfil: 'clt' });
const mei = gerarChecklist({ perfil: 'autonomo' });
const apos = gerarChecklist({ perfil: 'aposentado' });

ok('CLT gera checklist', clt.length > 10, `${clt.length} itens`);
ok('itens do comprador existem', clt.some((d) => d.bloco === 'comprador'));
ok('itens do vendedor existem', clt.some((d) => d.bloco === 'vendedor'));
ok('itens do imóvel existem', clt.some((d) => d.bloco === 'imovel'));
ok('CLT cita contracheque', clt.some((d) => /contracheque/i.test(d.item)));
ok('Autônomo cita DASN-SIMEI', mei.some((d) => /DASN/i.test(d.item)));
ok('Aposentado cita INSS', apos.some((d) => /INSS/i.test(d.item)));
ok('CLT não cita INSS', !clt.some((d) => /INSS/i.test(d.item)));
ok('perfis geram listas diferentes', clt.length !== mei.length || clt.map((d) => d.item).join() !== mei.map((d) => d.item).join());
ok('todo item nasce pendente', clt.every((d) => d.status === 'pendente'));
ok('todo item tem chave', clt.every((d) => typeof d.chave === 'string' && d.chave.length > 3));
ok('itens com validade têm meses', clt.filter((d) => d.validadeMeses != null).length > 3);

const apto = gerarChecklist({ perfil: 'clt', tipoImovel: 'apartamento', imovelAlugado: true });
ok('apartamento inclui condomínio', apto.some((d) => /condom[ií]nio/i.test(d.item)));
ok('imóvel alugado inclui locação', apto.some((d) => /loca[cç][aã]o/i.test(d.item)));
ok('casa não inclui condomínio', !clt.some((d) => /condom[ií]nio/i.test(d.item)));

const fgts = gerarChecklist({ perfil: 'clt', usaFgts: true });
ok('FGTS adiciona autorização', fgts.some((d) => /FGTS/i.test(d.item) && /autoriza/i.test(d.item)));

/* validade / vencimento */
const agora = new Date('2026-11-18T12:00:00Z');
const recebidoValido = { status: 'recebido', validadeEm: new Date('2026-12-18T12:00:00Z') };
const recebidoVencido = { status: 'recebido', validadeEm: new Date('2026-10-18T12:00:00Z') };
ok('recebido dentro da validade', statusEfetivo(recebidoValido, agora) === 'recebido');
ok('recebido com validade estourada vira vencido', statusEfetivo(recebidoVencido, agora) === 'vencido');
ok('pendente continua pendente', statusEfetivo({ status: 'pendente' }, agora) === 'pendente');
ok('somarMeses 3 meses', somarMeses(new Date('2026-01-15'), 3).getMonth() === 3);
ok('somarMeses 0 = null', somarMeses(new Date(), 0) === null);

/* resumo e WhatsApp */
const lista = [
  { ...clt[0], status: 'recebido' },
  { ...clt[1], status: 'recebido' },
  { ...clt[2], status: 'pendente' },
  { ...clt[3], status: 'recebido', validadeEm: new Date('2020-01-01') },
];
const resumo = resumoChecklist(lista);
ok('resumo conta recebidos', resumo.recebidos === 2, JSON.stringify(resumo));
ok('resumo conta vencidos', resumo.vencidos === 1);
ok('resumo conta pendentes', resumo.pendentes === 1);
ok('percentual inteiro', resumo.percentual === 50, `${resumo.percentual}%`);

const texto = pendenciasParaWhatsApp(lista, 'Cliente Teste');
ok('WhatsApp traz pendentes', texto.includes('pendente') || texto.length > 40);
ok('WhatsApp NÃO lista recebidos', !texto.includes(lista[0].item));
ok('WhatsApp cita o vencido', texto.includes(lista[3].item));
ok('WhatsApp tem cabeçalho', texto.includes('*Documentos pendentes*'));
ok('WhatsApp sem CPF', !/\d{3}\.\d{3}\.\d{3}-\d{2}/.test(texto));
ok('tudo recebido = mensagem positiva', pendenciasParaWhatsApp([{ ...clt[0], status: 'recebido' }]).includes('Tudo certo'));

ok('caminho de storage documentado', caminhoStorage('ofi1', 'proc9', 'doc3') === 'oficinas/ofi1/credito/proc9/doc3');

console.log(`\n${falhas === 0 ? 'TODOS OS TESTES PASSARAM' : falhas + ' FALHA(S)'}`);
process.exit(falhas === 0 ? 0 : 1);
