/** Fase 4 — parecer IA: LGPD estrita e contrato de saída. */
import {
  sanitizarEntrada, montarPromptParecer, interpretarParecer, CAMPOS_PERMITIDOS,
  AVISO_LEGAL_PARECER, CREDITOS_POR_PARECER,
} from '../src/lib/credito/parecer.js';

let falhas = 0;
const ok = (n, c, e = '') => { console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${e ? ' — ' + e : ''}`); if (!c) falhas += 1; };

/* ---------- LGPD: lista branca ---------- */
const entradaSuja = {
  nome: 'João da Silva',
  cpf: '123.456.789-01',
  email: 'joao@exemplo.com',
  telefone: '34999998888',
  endereco: 'Rua X, 100',
  rendaTotal: 8500,
  idadeMaisVelho: 38,
  vinculo: 'clt',
  restricaoSerasa: true,
  restricaoBacen: false,
  restricaoRegistrato: false,
  tipoRestricao: 'cheque 123456789',
  fgts: 20000,
  entradaDisponivel: 60000,
  valorImovel: 450000,
  numProponentes: 2,
};
const limpo = sanitizarEntrada(entradaSuja);

ok('nome descartado', !('nome' in limpo));
ok('cpf descartado', !('cpf' in limpo));
ok('email descartado', !('email' in limpo));
ok('telefone descartado', !('telefone' in limpo));
ok('endereco descartado', !('endereco' in limpo));
ok('somente campos permitidos', Object.keys(limpo).every((k) => CAMPOS_PERMITIDOS.includes(k)),
   Object.keys(limpo).join(', '));
ok('renda preservada', limpo.rendaTotal === 8500);
ok('restrição vira booleano', limpo.restricaoSerasa === true && limpo.restricaoBacen === false);
ok('tipoRestricao corta dígitos longos', !/\d{5,}/.test(limpo.tipoRestricao), limpo.tipoRestricao);
ok('numProponentes limitado a 6', sanitizarEntrada({ numProponentes: 99 }).numProponentes === 6);
ok('vinculo inválido vira outro', sanitizarEntrada({ vinculo: 'PJ-xyz' }).vinculo === 'outro');
ok('valores negativos viram 0', sanitizarEntrada({ rendaTotal: -500 }).rendaTotal === 0);

/* ---------- prompt ---------- */
const prompt = montarPromptParecer(entradaSuja);
ok('prompt NÃO contém nome', !prompt.includes('João'));
ok('prompt NÃO contém CPF', !prompt.includes('123.456.789-01'));
ok('prompt NÃO contém e-mail', !prompt.includes('joao@exemplo.com'));
ok('prompt NÃO contém telefone', !prompt.includes('34999998888'));
ok('prompt NÃO contém endereço', !prompt.includes('Rua X'));
ok('prompt traz a renda', prompt.includes('8.500'));
ok('prompt traz restrições', prompt.includes('Serasa: SIM'));
ok('prompt exige JSON sem markdown', prompt.includes('APENAS com JSON válido'));
ok('prompt tem os 5 blocos de saída', ['"resumo"', '"bancos"', '"riscos"', '"acoes"', '"comprometimentoEstimado"'].every((k) => prompt.includes(k)));

/* ---------- parsing ---------- */
const resposta = '```json\n' + JSON.stringify({
  resumo: 'Perfil elegível ao SBPE, com atenção ao comprometimento.',
  bancos: [
    { banco: 'Caixa', linha: 'SBPE', chance: 'alta', justificativa: 'Renda estável e entrada de 13%.' },
    { banco: 'Itaú', linha: 'SBPE', chance: 'MEDIA', justificativa: 'Restrição leve em análise.' },
  ],
  riscos: ['Comprometimento acima de 30%', 'Restrição Serasa ativa'],
  acoes: ['Compor renda com cônjuge', 'Quitar apontamento', 'Aumentar entrada em R$ 20 mil'],
  comprometimentoEstimado: 32.4,
}) + '\n```';
const p = interpretarParecer(resposta);
ok('JSON com cerquilha é aceito', p !== null);
ok('resumo extraído', p.resumo.startsWith('Perfil elegível'));
ok('bancos extraídos', p.bancos.length === 2);
ok('chance normalizada para minúscula', p.bancos[1].chance === 'media');
ok('riscos extraídos', p.riscos.length === 2);
ok('ações extraídas', p.acoes.length === 3);
ok('comprometimento numérico', p.comprometimentoEstimado === 32.4);
ok('JSON inválido devolve null', interpretarParecer('desculpe, não consegui') === null);
ok('chance desconhecida vira media', interpretarParecer('{"bancos":[{"banco":"X","chance":"altíssima"}]}').bancos[0].chance === 'media');
ok('custo em créditos = 1', CREDITOS_POR_PARECER === 1);
ok('aviso legal presente', AVISO_LEGAL_PARECER.includes('Não é decisão de crédito'));

console.log(`\n${falhas === 0 ? 'TODOS OS TESTES PASSARAM' : falhas + ' FALHA(S)'}`);
process.exit(falhas === 0 ? 0 : 1);
