
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import DorESolucao from '../src/components/ui/DorESolucao.jsx';

const abas = ['dashboard_imobi', 'captacao_imobi', 'funil_leads', 'visitas_imobi', 'financeiro',
  'historico', 'marketing', 'tarefa', 'notafiscal', 'avaliacao_imovel', 'credito', 'agentes_ia',
  'administrador', 'contador', 'juridico_imobi', 'copiloto', 'secretaria', 'whatsapp_hub',
  'meuplano', 'migracao', 'especialista', 'acompanhamento_cliente', 'aba_inexistente'];

let falhas = 0;
for (const aba of abas) {
  const html = renderToStaticMarkup(React.createElement(DorESolucao, { abaAtiva: aba }));
  const temDor = html.includes('Dor');
  const temGanho = html.includes('Ganho');
  const naoLixo = !html.includes('undefined') && !html.includes('NaN');
  const ok = temDor && temGanho && naoLixo;
  if (!ok) falhas += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${aba.padEnd(18)} ${html.length} chars`);
}

// o texto não pode encostar no chip: chip e conteúdo precisam ser elementos irmãos
const adm = renderToStaticMarkup(React.createElement(DorESolucao, { abaAtiva: 'administrador' }));
// o texto do GANHO precisa vir em <span> próprio, logo depois do chip
const separados = /Ganho<\/span>\s*<span[^>]*>[^<]+/.test(adm)
  && (adm.match(/>Dor<\/span>/g) || []).length === 1;
console.log(`${separados ? 'PASS' : 'FAIL'}  chip 'Dor' isolado em <span> próprio`);
if (!separados) falhas += 1;

const credito = renderToStaticMarkup(React.createElement(DorESolucao, { abaAtiva: 'credito' }));
console.log(`\nExemplo (crédito): ${credito.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 190)}`);
console.log(`\n${falhas === 0 ? 'RENDER OK' : falhas + ' FALHA(S)'}`);
process.exit(falhas === 0 ? 0 : 1);
