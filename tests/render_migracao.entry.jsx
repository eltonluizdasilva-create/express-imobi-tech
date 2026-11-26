/* global process */
/**
 * tests/render_migracao.entry.jsx — SSR do wizard de Migração (D-23.16).
 * Prova que as 3 etapas montam sem quebrar e que não existe trava de plano.
 */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import MigracaoWizard from '../src/components/migracao/MigracaoWizard.jsx';
import PreviaImportacao from '../src/components/migracao/PreviaImportacao.jsx';
import ConclusaoImportacao from '../src/components/migracao/ConclusaoImportacao.jsx';

let falhas = 0;
const ok = (nome, condicao, extra = '') => {
  console.log(`${condicao ? 'PASS' : 'FAIL'}  ${nome}${extra ? ` — ${extra}` : ''}`);
  if (!condicao) falhas += 1;
};

const etapa1 = renderToStaticMarkup(
  React.createElement(MigracaoWizard, {
    dadosOficina: { nome: 'Imobiliária Horizonte', oficinaId: 'OFICINA_TESTE' },
    setAbaAtiva: () => {},
    tema: 'claro',
    listaLeads: [],
  }),
);

ok('wizard abre na Etapa 1', etapa1.includes('Etapa 1') && etapa1.includes('Origem dos dados'));
ok(
  'quatro origens visíveis',
  ['Planilha', 'Link XML de portal', 'Documento PDF com IA', 'Texto rápido'].every((t) => etapa1.includes(t)),
);
ok(
  'formatos aceitos visíveis',
  ['.xlsx', '.csv', 'VRSync', 'VivaReal', 'OLX', 'Ctrl + V'].every((t) => etapa1.includes(t)),
);
ok(
  'régua com as três temperaturas',
  ['Quente', 'Morno', 'Frio', '0 a 5 dias', '6 a 10 dias', '11+ dias ou sem data'].every((t) =>
    etapa1.includes(t),
  ),
);
ok('status explícito explicado', etapa1.includes('Status explícito manda') && etapa1.includes('Proposta'));
ok(
  'aba liberada, sem bloqueio de plano',
  etapa1.includes('Sem bloqueio de plano') && !/Exclusivo Premium|Área Restrita|Mudar de Plano/i.test(etapa1),
);
ok('explica fotos WebP e capa', etapa1.includes('WebP') && etapa1.includes('Foto 1 é a capa'));
ok(
  'continuar desabilitado sem lote',
  etapa1.includes('Continuar para pré-visualização') && etapa1.includes('disabled'),
);

const leads = [
  {
    id: 'l1',
    nome: 'João Silva',
    telefone: '5534999998888',
    telefoneExibicao: '(34) 99999-8888',
    bairro: 'Santa Mônica',
    cidade: 'Uberlândia',
    interesse: 'Apartamento',
    orcamento: 350000,
    temperatura: 'quente',
    temperaturaOrigem: 'status',
    statusOriginal: 'Proposta',
    diasSemContato: 3,
    valido: true,
    selecionado: true,
    motivo: '',
    mensagem: 'Oi João! Separei as fotos e os valores.',
  },
  {
    id: 'l2',
    nome: 'Maria Souza',
    telefone: '5534988887777',
    telefoneExibicao: '(34) 98888-7777',
    temperatura: 'frio',
    temperaturaOrigem: 'data',
    diasSemContato: 45,
    dataContatoISO: '2026-10-01T00:00:00.000Z',
    valido: true,
    selecionado: true,
    motivo: '',
    mensagem: 'Oi Maria! Você ainda está procurando?',
  },
];

const imoveis = [
  {
    id: 'i1',
    titulo: 'Apartamento em Santa Mônica',
    codigo: 'AP001',
    tipo: 'Apartamento',
    finalidade: 'Venda',
    bairro: 'Santa Mônica',
    cidade: 'Uberlândia',
    uf: 'MG',
    valor: 450000,
    quartos: 3,
    banheiros: 2,
    vagas: 2,
    area: 78,
    fotos: ['https://cdn.exemplo.com/1.jpg', 'https://cdn.exemplo.com/2.jpg'],
    fotoCapa: 'https://cdn.exemplo.com/1.jpg',
    selecionado: true,
    avisos: [],
  },
];

const etapa2 = renderToStaticMarkup(
  React.createElement(PreviaImportacao, {
    temaClaro: false,
    leads,
    imoveis,
    avisos: ['Formato detectado: VRSync.'],
  }),
);

ok('prévia lista os leads', etapa2.includes('João Silva') && etapa2.includes('Maria Souza'));
ok(
  'tag de temperatura editável em 1 clique',
  etapa2.includes('Clique para alternar a temperatura') &&
    etapa2.includes('Quente') &&
    etapa2.includes('Frio'),
);
ok(
  'mensagem pronta com Copiar e WhatsApp',
  etapa2.includes('Ver mensagem') &&
    etapa2.includes('Copiar') &&
    etapa2.includes('wa.me/5534999998888'),
);
ok('imóvel com capa e regra das 7 fotos', etapa2.includes('Capa') && etapa2.includes('até 7 por imóvel'));
ok('aviso do feed aparece', etapa2.includes('Formato detectado: VRSync.'));

const etapa3 = renderToStaticMarkup(
  React.createElement(ConclusaoImportacao, {
    resultado: { leads: 2, imoveis: 1, fotos: 2, falhas: [] },
    onIrPara: () => {},
    onRecomecar: () => {},
  }),
);

ok(
  'conclusão mostra o que foi gravado',
  etapa3.includes('Importação concluída') &&
    etapa3.includes('Leads no CRM') &&
    etapa3.includes('Fotos no Storage'),
);
ok(
  'conclusão leva para CRM e captação',
  etapa3.includes('Abrir o Funil CRM') && etapa3.includes('Abrir Captação'),
);

if (falhas) {
  console.error(`\n${falhas} FALHA(S)`);
  process.exit(1);
}
console.log('\nTODOS OS TESTES PASSARAM');
