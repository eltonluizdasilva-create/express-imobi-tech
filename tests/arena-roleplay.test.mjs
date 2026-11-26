import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  CENARIOS_ROLEPLAY,
  NIVEIS_DIFICULDADE,
  SYSTEM_PROMPT_SIMULADOR_CLIENTE,
  SYSTEM_PROMPT_AVALIADOR_ROLEPLAY,
  montarPromptTurnoCliente,
  montarPromptAvaliacao,
  interpretarTurnoCliente,
  interpretarAvaliacaoRoleplay,
} from '../src/agent/arenaRoleplayPrompt.js';

test('cenários: cobre os 4 cenários essenciais de mercado mais o personalizado', () => {
  const ids = CENARIOS_ROLEPLAY.map((c) => c.id);
  assert.ok(ids.includes('imovel_caro'), 'Falta cenário imovel_caro');
  assert.ok(ids.includes('sem_exclusividade'), 'Falta cenário sem_exclusividade');
  assert.ok(ids.includes('sumiu_pos_visita'), 'Falta cenário sumiu_pos_visita');
  assert.ok(ids.includes('esperar_juros'), 'Falta cenário esperar_juros');
  assert.ok(ids.includes('personalizado'), 'Falta cenário personalizado');

  const caro = CENARIOS_ROLEPLAY.find((c) => c.id === 'imovel_caro');
  assert.match(caro.titulo, /caro/i);
  assert.ok(caro.primeiraFala.length > 20);

  const exclusividade = CENARIOS_ROLEPLAY.find((c) => c.id === 'sem_exclusividade');
  assert.match(exclusividade.titulo, /exclusividade/i);

  const juros = CENARIOS_ROLEPLAY.find((c) => c.id === 'esperar_juros');
  assert.match(juros.titulo, /juros/i);
});

test('dificuldades: disponibiliza os 3 níveis de exigência do cliente', () => {
  const ids = NIVEIS_DIFICULDADE.map((d) => d.id);
  assert.deepEqual(ids, ['moderado', 'exigente', 'tubarao']);
});

test('prompt simulador: SYSTEM_PROMPT_SIMULADOR_CLIENTE orienta persona em 5 turnos e tom brasileiro', () => {
  assert.match(SYSTEM_PROMPT_SIMULADOR_CLIENTE, /CLIENTE/);
  assert.match(SYSTEM_PROMPT_SIMULADOR_CLIENTE, /5 turnos/i);
  assert.match(SYSTEM_PROMPT_SIMULADOR_CLIENTE, /Tubarão/i);
  assert.match(SYSTEM_PROMPT_SIMULADOR_CLIENTE, /JSON/);
});

test('montarPromptTurnoCliente: formata histórico, mensagem do corretor e turno', () => {
  const prompt = montarPromptTurnoCliente({
    cenarioObj: CENARIOS_ROLEPLAY[0],
    dificuldadeId: 'exigente',
    historico: [
      { autor: 'cliente', texto: 'Achei o valor de R$ 750 mil muito alto.' },
      { autor: 'corretor', texto: 'Compreendo. O acabamento deste imóvel é padrão luxo e inclui 2 vagas livres.' },
    ],
    mensagemCorretor: 'Além disso, o condomínio tem gerador pleno para todas as unidades.',
    turnoAtual: 2,
  });

  assert.match(prompt, /Cliente achou o imóvel caro/);
  assert.match(prompt, /Exigente/);
  assert.match(prompt, /TURNO ATUAL: 2 de 5/);
  assert.match(prompt, /gerador pleno/);
});

test('interpretarTurnoCliente: extrai JSON com fala e emoção do cliente', () => {
  const jsonMock = JSON.stringify({
    respostaCliente: 'Gerador é bom, mas ainda não justifica R$ 70 mil a mais. Se o proprietário tirar R$ 40 mil podemos conversar.',
    emocaoCliente: 'firme',
    conducaoCorretor: 'REGULAR',
    observacaoInterna: 'Corretor usou bom argumento técnico mas não fez pergunta investigativa.',
  });

  const res = interpretarTurnoCliente(jsonMock);
  assert.match(res.respostaCliente, /R\$ 70 mil a mais/);
  assert.equal(res.emocaoCliente, 'firme');
  assert.equal(res.conducaoCorretor, 'REGULAR');
});

test('interpretarTurnoCliente: resiliência para markdown e fallbacks', () => {
  const markdown = `Aqui está a resposta:
\`\`\`json
{
  "respostaCliente": "Não tenho pressa para vender.",
  "emocaoCliente": "cético",
  "conducaoCorretor": "FRACA"
}
\`\`\``;

  const res = interpretarTurnoCliente(markdown);
  assert.equal(res.respostaCliente, 'Não tenho pressa para vender.');
  assert.equal(res.emocaoCliente, 'cético');

  const fallback = interpretarTurnoCliente('texto quebrado sem json');
  assert.ok(typeof fallback.respostaCliente === 'string' && fallback.respostaCliente.length > 5);
});

test('interpretarAvaliacaoRoleplay: extrai nota (0 a 10), pontos fortes, autoridade e scripts', () => {
  const avaliacaoMock = JSON.stringify({
    nota: 7.8,
    nivelDesempenho: 'Profissional Competente',
    resumoExecutivo: 'Boa defesa de diferenciais do imóvel, porém hesitou na pergunta de fechamento.',
    pontosFortes: [
      'Argumentou com precisão sobre as vagas livres e o gerador pleno.',
      'Manteve tom profissional e calmo diante da pressão.',
    ],
    ondePerdeuAutoridade: [
      'Aceitou discutir desconto no turno 2 antes de ancorar o valor por m².',
    ],
    frasesIdeaisContorno: [
      {
        objecao: 'Comparação com unidade mais barata no mesmo bairro',
        fraseRecomendada: 'Excelente ponto. Ao comparar os R$ 680 mil daquela unidade, você notou que ela necessita de R$ 90 mil em reforma e tem apenas 1 vaga presa?',
        porQueFunciona: 'Inverte o ônus da prova e ancora o custo real da reforma.',
      },
    ],
    planoMelhoria: [
      'Treinar fechamento por isolamento de objeção.',
    ],
  });

  const res = interpretarAvaliacaoRoleplay(avaliacaoMock);
  assert.equal(res.nota, 7.8);
  assert.equal(res.nivelDesempenho, 'Profissional Competente');
  assert.equal(res.pontosFortes.length, 2);
  assert.equal(res.ondePerdeuAutoridade.length, 1);
  assert.equal(res.frasesIdeaisContorno.length, 1);
  assert.match(res.frasesIdeaisContorno[0].fraseRecomendada, /reforma/);
  assert.ok(res.planoMelhoria.length >= 1);
});

test('interpretarAvaliacaoRoleplay: valida limites de nota e resiliência', () => {
  const invalido = interpretarAvaliacaoRoleplay(null);
  assert.ok(typeof invalido.nota === 'number' && invalido.nota >= 0 && invalido.nota <= 10);
  assert.ok(Array.isArray(invalido.pontosFortes));
  assert.ok(Array.isArray(invalido.ondePerdeuAutoridade));
  assert.ok(Array.isArray(invalido.frasesIdeaisContorno));

  const notaAlta = interpretarAvaliacaoRoleplay(JSON.stringify({ nota: 15 }));
  assert.equal(notaAlta.nota, 10);

  const notaBaixa = interpretarAvaliacaoRoleplay(JSON.stringify({ nota: -5 }));
  assert.equal(notaBaixa.nota, 0);
});

test('catálogo: shared/planos.json inclui guia_campo_bonus no Grátis e sincroniza com backend', () => {
  const cat = JSON.parse(readFileSync(new URL('../shared/planos.json', import.meta.url), 'utf8'));
  const catBack = JSON.parse(readFileSync(new URL('../functions/planos.json', import.meta.url), 'utf8'));

  assert.ok(cat.modulos.gratis.includes('guia_campo_bonus'), 'Falta guia_campo_bonus em gratis');
  assert.ok(catBack.modulos.gratis.includes('guia_campo_bonus'), 'Falta sincronia em functions/planos.json');
});

test('modulosMap: guia_campo_bonus está mapeado para componente GuiaCampoGratis', () => {
  const fonte = readFileSync(new URL('../src/modulosMap.jsx', import.meta.url), 'utf8');
  assert.match(fonte, /import GuiaCampoGratis from '\.\/components\/admin\/GuiaCampoGratis';/);
  assert.match(fonte, /guia_campo_bonus:\s*GuiaCampoGratis/);
});

test('SidebarAdmin: inclui guia_campo_bonus como Arena & Treinamento no pilar Grátis', () => {
  const fonte = readFileSync(new URL('../src/components/admin/SidebarAdmin.jsx', import.meta.url), 'utf8');
  assert.match(fonte, /id:\s*'guia_campo_bonus'/);
  assert.match(fonte, /label:\s*'Arena & Treinamento'/);
});

test('AdminNovo: preserva os 10 botões do bloco essencial e mapeia guia_campo_bonus', () => {
  const fonte = readFileSync(new URL('../src/AdminNovo.jsx', import.meta.url), 'utf8');
  assert.match(fonte, /id:\s*'guia_campo_bonus'/);
  assert.match(fonte, /GuiaCampoGratis/);
});

test('GuiaCampoGratis: possui suporte a voz, turnos 1 a 5 e cópia de frases', () => {
  const fonte = readFileSync(new URL('../src/components/admin/GuiaCampoGratis.jsx', import.meta.url), 'utf8');
  assert.match(fonte, /SpeechRecognition/);
  assert.match(fonte, /Turno \{turnoAtual\} de 5/);
  assert.match(fonte, /handleCopiarFrases|Copiar Frases de Contorno/);
  assert.match(fonte, /Arena de Roleplay IA/);
  assert.match(fonte, /Manual de Campo & Postura/);
});
