
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import CorrespondenteCredito from '../src/components/credito/CorrespondenteCredito.jsx';
import FichaCaixa from '../src/components/credito/FichaCaixa.jsx';
import EsteiraKanban from '../src/components/credito/EsteiraKanban.jsx';
import FormularioSimulacao from '../src/components/credito/FormularioSimulacao.jsx';
import { simular } from '../src/lib/credito/simulador.js';
import { PARAMETROS_PADRAO } from '../src/lib/credito/parametrosPadrao.js';

const html = renderToStaticMarkup(React.createElement(CorrespondenteCredito, {
  dadosOficina: { id: 'ofi_teste', nomeOficina: 'Imob Teste' },
  usuario: { uid: 'uid_corretor' },
  papelLogado: 'corretor',
}));

// A ficha depende de uma simulação: em SSR o hook ainda não carregou os
// parâmetros (useEffect não roda), então montamos o cenário direto.
const sim = simular({
  valorImovel: 450000, tipo: 'usado', uf: 'MG', cidade: 'Uberlândia',
  rendas: [6000, 2500], nascimentoMaisVelho: '1988-05-10', numProponentes: 2,
  fgts: 20000, usaFgts: true, entradaDinheiro: 40000,
  sistema: 'sac', prazo: 360, taxaAnual: 10.5, primeiroImovel: true,
}, PARAMETROS_PADRAO);

const htmlFicha = renderToStaticMarkup(React.createElement(FichaCaixa, {
  sim, oficial: { numero: '', valorFinanciado: '', parcela: '', data: '' }, setOficial: () => {},
}));

const htmlForm = renderToStaticMarkup(React.createElement(FormularioSimulacao, {
  entrada: { ...sim.entrada, valorImovel: '450000', rendas: ['6000', '2500'] },
  setEntrada: () => {}, parametros: PARAMETROS_PADRAO, prefilled: null,
}));

const htmlEsteira = renderToStaticMarkup(React.createElement(EsteiraKanban, {
  oficinaId: 'ofi_teste', usuario: { uid: 'uid_corretor', nome: 'Corretor' },
  papelLogado: 'corretor', simAtual: null, onAbrirSimulador: () => {},
}));

const checagensExtra = {
  'esteira: cabeçalho': htmlEsteira.includes('Esteira de crédito'),
  'esteira: botão novo processo': htmlEsteira.includes('Novo processo'),
  'esteira: aviso de escopo do corretor': htmlEsteira.includes('apenas os processos'),
  'esteira: estado de carregamento': htmlEsteira.includes('Carregando processos'),
  'ficha: título': htmlFicha.includes('Ficha espelho'),
  'ficha: linhas na ordem': htmlFicha.includes('1. Tipo de imóvel') && htmlFicha.includes('11. Enquadramento sugerido'),
  'ficha: taxa nominal rotulada': htmlFicha.includes('Taxa (nominal)'),
  'ficha: seguros com/sem': htmlFicha.includes('Parcela com / sem seguros'),
  'ficha: entrada exigida/disponível': htmlFicha.includes('Entrada exigida / disponível'),
  'ficha: campo nº da simulação': htmlFicha.includes('Nº da simulação'),
  'ficha: botão copiar': htmlFicha.includes('Copiar ficha'),
  'ficha: parcela calculada presente': /R\$ ?[\d.]+/.test(htmlFicha),
  'form: 2 proponentes (botões remover)': (htmlForm.match(/Remover/g) || []).length === 2,
  'form: checkbox primeiro imóvel': htmlForm.includes('Primeiro imóvel'),
};

const checagens = {
  'hero Correspondente': html.includes('Correspondente'),
  'chip de pré-simulação': html.includes('Pré-simulação MCMV + SBPE'),
  'aviso de pré-simulação': html.includes('Não aprova crédito'),
  'sub-aba Simulador': html.includes('Simulador'),
  'sub-aba Esteira': html.includes('Esteira'),
  'sub-aba Documentos': html.includes('Documentos'),
  'sub-aba Receita': html.includes('Receita'),
  'campo valor do imóvel': html.includes('Valor do imóvel'),
  'campo renda': html.includes('Renda bruta mensal'),
  'campo FGTS': html.includes('Saldo FGTS'),
  'campo sistema': html.includes('SAC'),
  'botão salvar cenário': html.includes('Salvar cenário'),
  'botão WhatsApp': html.includes('Enviar resumo no WhatsApp'),
  // Obs.: a ficha não aparece no HTML do shell em SSR porque os parâmetros são
  // carregados em useEffect (não roda no servidor). Ela é verificada abaixo,
  // renderizada diretamente com uma simulação pronta.
  ...checagensExtra,
};
for (const [nome, v] of Object.entries(checagens)) console.log(`${v ? 'PASS' : 'FAIL'}  ${nome}`);
console.log(`\nHTML: ${html.length} caracteres`);
const falhas = Object.values(checagens).filter((v) => !v).length;
console.log(falhas === 0 ? 'RENDER OK' : `${falhas} FALHA(S)`);
process.exit(falhas === 0 ? 0 : 1);
