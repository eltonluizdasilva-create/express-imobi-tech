/**
 * Máscara de moeda brasileira + número limpo no Firestore.
 * Node puro: exercita src/lib/moedaBR.js (mesmo módulo que o painel usa).
 */
import { mascararMoedaBR, finalizarMoedaBR, parseMoedaBR } from '../src/lib/moedaBR.js';

let falhas = 0;
function ok(descricao, condicao) {
  if (condicao) {
    console.log(`PASS · ${descricao}`);
  } else {
    console.log(`FAIL · ${descricao}`);
    falhas += 1;
  }
}

// ─── digitação: separador de milhar enquanto escreve ───────────────────────────
ok('digitar 350000 forma 350.000', mascararMoedaBR('350000') === '350.000');
ok('digitar 35000000 forma 35.000.000', mascararMoedaBR('35000000') === '35.000.000');
ok('digitar 350000,5 mantém centavo parcial', mascararMoedaBR('350000,5') === '350.000,5');
ok('separador repetido não duplica', mascararMoedaBR('350.0.0.0') === '350.000');
ok('colar "R$ 350.000,00" vira 350.000,00', mascararMoedaBR('R$ 350.000,00') === '350.000,00');
ok('apagar tudo devolve vazio', mascararMoedaBR('') === '' && mascararMoedaBR('abc') === '');
ok('centavos limitados a 2 dígitos', mascararMoedaBR('1234,5678') === '1.234,56');

// ─── ao sair do campo: centavos garantidos ─────────────────────────────────────
ok('blur em 350.000 vira 350.000,00', finalizarMoedaBR('350000') === '350.000,00');
ok('blur em 350.000,5 vira 350.000,50', finalizarMoedaBR('350000,5') === '350.000,50');
ok('blur em vazio continua vazio (sem valor, não R$ 0,00)', finalizarMoedaBR('') === '');

// ─── o que vai para o Firestore: Number limpo ──────────────────────────────────
ok('parseMoedaBR("350.000,00") = 350000', parseMoedaBR('350.000,00') === 350000);
ok('parseMoedaBR("350.000") = 350000', parseMoedaBR('350.000') === 350000);
ok('parseMoedaBR("R$ 1.234.567,89") = 1234567.89', parseMoedaBR('R$ 1.234.567,89') === 1234567.89);
ok('parseMoedaBR("") = 0', parseMoedaBR('') === 0);

// ─── ciclo real da tela: digita -> sai do campo -> salva ───────────────────────
function cicloDaTela(digitado) {
  const mascarado = mascararMoedaBR(digitado);
  const aoSair = finalizarMoedaBR(mascarado);
  return { aoSair, salvo: parseMoedaBR(aoSair) };
}
const ciclo = cicloDaTela('350000');
ok('ciclo da tela exibe 350.000,00', ciclo.aoSair === '350.000,00');
ok('ciclo da tela grava Number 350000', ciclo.salvo === 350000 && typeof ciclo.salvo === 'number');
ok('valor gravado não tem ponto nem vírgula', String(ciclo.salvo) === '350000');

console.log(`\n${falhas === 0 ? 'TODOS OS TESTES PASSARAM' : falhas + ' FALHA(S)'}`);
process.exit(falhas === 0 ? 0 : 1);
