/** Visibilidade do menu por papel (espelho das Firestore Rules). */
import {
  MODULOS_SO_GESTAO, PAPEIS_GESTAO, ehGestor, moduloPermitido, filtrarModulos, AVISO_ABA_GESTAO,
} from '../src/lib/permissoes-menu.js';

let falhas = 0;
const ok = (n, c, e = '') => { console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${e ? ' — ' + e : ''}`); if (!c) falhas += 1; };

const MENU = [
  { id: 'dashboard_imobi', label: 'Painel' },
  { id: 'funil_leads', label: 'Leads' },
  { id: 'financeiro', label: 'Financeiro' },
  { id: 'historico', label: 'Propostas' },
  { id: 'notafiscal', label: 'Repasses & NF' },
  { id: 'credito', label: 'Correspondente' },
  { id: 'config', label: 'Configurações' },
  { id: 'fornecedores', label: 'Fornecedores' },
  { id: 'patrimonio', label: 'Patrimônio' },
  { id: 'relatorios_mensais', label: 'Relatórios' },
  { id: 'fechamentos_diarios', label: 'Caixa' },
];

ok('3 papéis de gestão', PAPEIS_GESTAO.join() === 'dono,admin,master');
ok('7 módulos restritos', MODULOS_SO_GESTAO.size === 7, [...MODULOS_SO_GESTAO].join(', '));
ok('dono é gestor', ehGestor('dono') && ehGestor('admin') && ehGestor('master'));
ok('corretor não é gestor', !ehGestor('corretor'));
ok('papel nulo não é gestor', !ehGestor(null) && !ehGestor(undefined) && !ehGestor(''));
ok('papel em maiúsculas funciona', ehGestor('DONO'));

ok('dono vê financeiro', moduloPermitido('financeiro', 'dono'));
ok('admin vê configurações', moduloPermitido('config', 'admin'));
ok('master vê tudo', MENU.every((m) => moduloPermitido(m.id, 'master')));
ok('corretor NÃO vê financeiro', !moduloPermitido('financeiro', 'corretor'));
ok('corretor NÃO vê config', !moduloPermitido('config', 'corretor'));
ok('corretor NÃO vê notafiscal', !moduloPermitido('notafiscal', 'corretor'));
ok('corretor NÃO vê fornecedores', !moduloPermitido('fornecedores', 'corretor'));
ok('corretor NÃO vê patrimonio', !moduloPermitido('patrimonio', 'corretor'));
ok('corretor NÃO vê relatorios', !moduloPermitido('relatorios_mensais', 'corretor'));
ok('corretor NÃO vê fechamentos', !moduloPermitido('fechamentos_diarios', 'corretor'));
ok('corretor VÊ leads', moduloPermitido('funil_leads', 'corretor'));
ok('corretor VÊ crédito', moduloPermitido('credito', 'corretor'));

const doDono = filtrarModulos(MENU, 'dono');
const doCorretor = filtrarModulos(MENU, 'corretor');
ok('dono recebe lista inteira', doDono.length === MENU.length, `${doDono.length}/${MENU.length}`);
ok('corretor recebe 4 itens (11 - 7)', doCorretor.length === 4, `${doCorretor.length}`);
ok('corretor mantém a ordem', doCorretor.map((m) => m.id).join() === 'dashboard_imobi,funil_leads,historico,credito',
   doCorretor.map((m) => m.id).join());
ok('nenhum módulo de gestão passa para o corretor',
   doCorretor.every((m) => !MODULOS_SO_GESTAO.has(m.id)));
ok('nenhum item é inventado', doCorretor.every((m) => MENU.some((x) => x.id === m.id)));
ok('lista inválida não quebra', filtrarModulos(null, 'corretor').length === 0 && filtrarModulos(undefined, 'dono').length === 0);
ok('item sem id é descartado para corretor', filtrarModulos([{ label: 'x' }, { id: 'funil_leads' }], 'corretor').length === 1);
ok('aviso de gestão definido', AVISO_ABA_GESTAO.includes('gestão'));

console.log(`\n${falhas === 0 ? 'TODOS OS TESTES PASSARAM' : falhas + ' FALHA(S)'}`);
process.exit(falhas === 0 ? 0 : 1);
