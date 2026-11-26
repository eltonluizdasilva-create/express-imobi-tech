/* eslint-disable react/prop-types */
import React, { useState, useMemo } from 'react';
import HeroAba from './admin/HeroAba';
import SeletorUF from './ui/SeletorUF';
import SucessaoPatrimonial from './imobi/SucessaoPatrimonial';
import DueDiligenceMatricula from './imobi/DueDiligenceMatricula';
import AceiteLegalGate from './admin/AceiteLegalGate';
import { AVISO_JURIDICO } from '../lib/assistidos-legais';
import {
  Scale,
  Search,
  Sparkles,
  Copy,
  Check,
  Send,
  BookOpen,
  ShieldAlert,
  FileCheck2,
  HelpCircle,
  MessageCircle,
} from 'lucide-react';

const BASE_CONHECIMENTO_JURIDICO = [
  {
    id: 'multa_rescisao',
    categoria: 'Lei do Inquilinato (Lei 8.245/91)',
    titulo: 'Multa por Entrega Antecipada das Chaves (Rescisão pelo Inquilino)',
    palavrasChave: ['multa', 'rescisão', 'rescisao', 'sair antes', 'entregar chaves', 'proporcional', '12 meses', '30 meses', 'prazo'],
    baseLegal: 'Art. 4º da Lei nº 8.245/91 (Lei do Inquilinato) e Art. 413 do Código Civil.',
    resumoRegra:
      'Durante o prazo estipulado para a duração do contrato, o locador (proprietário) não pode reaver o imóvel alugado. Já o locatário (inquilino) pode devolvê-lo, pagando a multa pactuada, obrigatoriamente proporcional ao período de cumprimento do contrato.',
    orientacaoCorretor:
      '1. Verifique a multa total prevista em contrato (geralmente 3 aluguéis).\n2. Divida o valor total da multa pelo prazo total do contrato (ex: 30 meses) e multiplique pelos meses que faltam cumprir.\n3. Se o contrato tiver cláusula de isenção após o 12º mês, o inquilino deve apenas cumprir o aviso prévio por escrito de 30 dias.',
    clausulaMinuta:
      'CLÁUSULA DE RESCISÃO E MULTA PROPORCIONAL: Caso o LOCATÁRIO devolva o imóvel antes do término do prazo contratual, incidirá multa equivalente a 03 (três) aluguéis vigentes, calculada de forma estritamente proporcional aos meses restantes para o término do contrato, nos termos do Art. 4º da Lei nº 8.245/91.',
  },
  {
    id: 'reparos_benfeitorias',
    categoria: 'Lei do Inquilinato (Lei 8.245/91)',
    titulo: 'Infiltração, Telhado e Estrutural vs. Manutenção do Inquilino',
    palavrasChave: ['infiltração', 'infiltracao', 'vazamento', 'telhado', 'pintura', 'reparo', 'manutenção', 'manutencao', 'elétrica', 'hidráulica', 'benfeitoria'],
    baseLegal: 'Arts. 22 (Obrigações do Locador), 23 (Obrigações do Locatário) e 35/36 da Lei nº 8.245/91.',
    resumoRegra:
      'Vícios ocultos, problemas anteriores à locação e reparos estruturais (telhado, rede hidráulica/elétrica interna na parede, recalque estrutural) são de responsabilidade do PROPRIETÁRIO (Art. 22). Danos causados pelo uso diário (torneiras, tomadas, pintura de saída, entupimento por mau uso) cabem ao INQUILINO (Art. 23, V).',
    orientacaoCorretor:
      '1. Solicite vídeo/fotos do problema e compare com o Laudo de Vistoria de Entrada.\n2. Se for estrutural ou preexistente, notifique o proprietário para autorizar o orçamento (ou abater no aluguel mediante recibo).\n3. Benfeitorias necessárias feitas pelo inquilino (com urgência comprovada) são indenizáveis mesmo sem autorização prévia, salvo disposição contratual expressa de renúncia.',
    clausulaMinuta:
      'COMUNICADO TÉCNICO DE MANUTENÇÃO: Conforme os Arts. 22 e 23 da Lei nº 8.245/91, reparos de natureza estrutural e oculta na edificação competem ao Locador, enquanto a conservação ordinária e reparos decorrentes do uso normal do imóvel competem ao Locatário, devendo o imóvel ser restituído nas condições do Laudo de Vistoria Inicial.',
  },
  {
    id: 'direito_preferencia',
    categoria: 'Lei do Inquilinato (Lei 8.245/91)',
    titulo: 'Venda de Imóvel Alugado e Direito de Preferência (30 Dias)',
    palavrasChave: ['preferência', 'preferencia', 'vender alugado', 'venda', 'comprador', 'desocupação', '90 dias', '30 dias', 'inquilino comprar'],
    baseLegal: 'Arts. 27 a 34 e Art. 8º da Lei nº 8.245/91.',
    resumoRegra:
      'Caso o proprietário deseje colocar o imóvel alugado à venda, deve obrigatoriamente dar conhecimento formal ao inquilino (notificação com preço e condições). O inquilino tem 30 dias corridos para manifestar aceitação. Se não comprar e o imóvel for vendido a terceiro, o novo comprador pode denunciar o contrato concedendo 90 dias para desocupação (salvo se houver cláusula de vigência averbada na matrícula).',
    orientacaoCorretor:
      '1. Antes de anunciar ou assinar proposta de terceiro, envie a Carta de Direito de Preferência ao inquilino com o valor exato e condições de pagamento.\n2. Combine os horários de visita previamente com o inquilino (Art. 23, IX).\n3. Passados 30 dias sem manifestação inequívoca do inquilino, a venda a terceiros está juridicamente segura.',
    clausulaMinuta:
      'NOTIFICAÇÃO DE DIREITO DE PREFERÊNCIA (ART. 27 DA LEI 8.245/91): Fica o(a) LOCATÁRIO(A) formalmente cientificado(a) de que o imóvel objeto da locação encontra-se disponível para venda pelo valor de R$ [VALOR], nas condições [CONDIÇÕES], dispondo do prazo legal improrrogável de 30 (trinta) dias para exercer seu direito de preferência em igualdade de condições.',
  },
  {
    id: 'garantias_locacao',
    categoria: 'Lei do Inquilinato (Lei 8.245/91)',
    titulo: 'Modalidades de Garantia e Proibição de Dupla Garantia',
    palavrasChave: ['garantia', 'caução', 'caucao', 'fiador', 'seguro fiança', 'dupla garantia', '3 meses', 'adiantado', 'aluguel antecipado'],
    baseLegal: 'Arts. 37, 38 e 42 da Lei nº 8.245/91.',
    resumoRegra:
      'A lei permite 4 garantias: Caução (limitada a 3 meses de aluguel em dinheiro/bem), Fiança, Seguro de Fiança Locatícia ou Cessão Fiduciária de Quotas. É NULA de pleno direito a exigência de mais de uma modalidade de garantia no mesmo contrato (Art. 37, parágrafo único). Só é permitido cobrar aluguel antecipado (no início do mês) se o contrato NÃO tiver nenhuma garantia (Art. 42).',
    orientacaoCorretor:
      '1. Nunca combine "Caução + Fiador" no mesmo contrato (constitui contravenção e nulidade da cláusula).\n2. Se o inquilino não tiver garantia aprovada, utilize a Locação Sem Garantia (Art. 42): permite cobrar o aluguel até o 6º dia útil do mês vincendo e dá direito a liminar de despejo em 15 dias em caso de atraso (Art. 59, § 1º, IX)!',
    clausulaMinuta:
      'CLÁUSULA DE GARANTIA LOCATÍCIA: Em estrita observância ao Art. 37, parágrafo único, da Lei nº 8.245/91, as partes elegem como única modalidade de garantia para o presente contrato a [MODALIDADE DE GARANTIA], ficando vedada a cumulação com qualquer outra espécie de garantia.',
  },
  {
    id: 'inadimplencia_despejo',
    categoria: 'Lei do Inquilinato (Lei 8.245/91)',
    titulo: 'Atraso de Aluguel, Multa Moratória e Despejo Liminar',
    palavrasChave: ['atraso', 'inadimplência', 'inadimplencia', 'despejo', 'liminar', '15 dias', 'não pagou', 'cobrança', 'juros'],
    baseLegal: 'Arts. 59 (§ 1º, IX) e 62 da Lei nº 8.245/91.',
    resumoRegra:
      'O atraso no pagamento de aluguel ou encargos (condomínio/IPTU) autoriza o ingresso imediato de ação de despejo por falta de pagamento. Se o contrato estiver desprovido de garantia, o juiz pode conceder liminar para desocupação em 15 dias. O inquilino pode evitar a rescisão ("purgar a mora") pagando o débito atualizado em até 15 dias após a citação.',
    orientacaoCorretor:
      '1. No 2º dia útil de atraso, acione o aviso amigável via WhatsApp.\n2. No 5º dia de atraso, envie notificação extrajudicial com cálculo da multa moratória (usualmente 10%) + juros de 1% a.m.\n3. Se houver Seguro Fiança/CredPago, acione o sinistro dentro da janela da seguradora para garantir o repasse do proprietário.',
    clausulaMinuta:
      'NOTIFICAÇÃO AMIGÁVEL DE DÉBITO LOCATÍCIO: Prezado(a) Locatário(a), identificamos em nosso sistema a pendência referente ao aluguel/encargos com vencimento em [DATA]. Solicitamos a regularização em até 48 horas para evitar a incidência de encargos moratórios contratuais e acionamento da garantia locatícia.',
  },
  {
    id: 'comissao_sinal_arras',
    categoria: 'Código Civil (Compra, Venda & Corretagem)',
    titulo: 'Sinal (Arras), Desistência do Negócio e Comissão do Corretor',
    palavrasChave: ['comissão', 'comissao', 'corretagem', 'sinal', 'arras', 'desistência', 'desistencia', 'arrependimento', 'proposta'],
    baseLegal: 'Arts. 417 a 420 (Arras/Sinal) e Arts. 722 a 729 (Corretagem) do Código Civil.',
    resumoRegra:
      'Se quem deu as arras (comprador) desistir, perde o sinal em favor do vendedor; se quem recebeu (vendedor) desistir, deve devolvê-las em dobro (Art. 418/420 CC). Quanto ao corretor: nos termos do Art. 725 do Código Civil, a remuneração é devida uma vez que tenha alcançado o resultado útil (aproximação efetiva e assinatura do instrumento/compromisso), ainda que este não se efetive por arrependimento posterior das partes.',
    orientacaoCorretor:
      '1. Sempre colha assinatura (física ou eletrônica com validade jurídica) na Proposta de Compra com cláusula expressa de Arras Confirmatórias e honorários de corretagem.\n2. Deixe claro quem é o responsável pelo pagamento da comissão (via de regra o vendedor, salvo ajuste diverso) e o momento de vencimento (no pagamento do sinal).',
    clausulaMinuta:
      'CLÁUSULA DE ARRAS E HONORÁRIOS DE CORRETAGEM (ARTS. 418 E 725 DO CÓDIGO CIVIL): O sinal pago neste ato possui natureza de arras confirmatórias. A intermediação imobiliária resta aperfeiçoada na assinatura deste instrumento, sendo devidos os honorários de corretagem de 6% (seis por cento), nos termos do Art. 725 do Código Civil.',
  },
  {
    id: 'loteamentos_condominios',
    categoria: 'Loteamentos & Condomínios (Lei 6.766/79)',
    titulo: 'Venda de Lotes, Quadra/Lote, Recuos e Lei do Distrato',
    palavrasChave: ['lote', 'loteamento', 'quadra', 'terreno', 'condomínio fechado', 'metragem', 'distrato', 'recuo', 'padrão construtivo'],
    baseLegal: 'Lei nº 6.766/79 (Parcelamento do Solo Urbano) e Lei nº 13.786/2018 (Lei do Distrato em Loteamentos).',
    resumoRegra:
      'A comercialização de lotes exige o Registro do Loteamento na matrícula do Cartório de Registro de Imóveis (Art. 37 da Lei 6.766/79). O comprador deve receber ciência expressa da Quadra, Lote, Metragem (frente, fundo e área total em m²) e das restrições urbanísticas/convenção do condomínio (metragem mínima de construção e recuos).',
    orientacaoCorretor:
      '1. Ao captar um lote, preencha sempre Quadra, Lote e Metragem exata (m²) no sistema.\n2. Entregue ao comprador o regulamento construtivo do condomínio/loteamento antes do fechamento.\n3. Verifique se o lote é plano, aclive ou declive e informe na ficha técnica.',
    clausulaMinuta:
      'IDENTIFICAÇÃO TÉCNICA DE LOTE URBANO: O imóvel objeto desta negociação consiste no Lote nº [LOTE] da Quadra [QUADRA], com área total de [METRAGEM] m², declarando o Comprador ter plena ciência das diretrizes construtivas e recuos obrigatórios do empreendimento.',
  },
  {
    id: 'fazendas_imoveis_rurais',
    categoria: 'Fazendas & Imóveis Rurais (Estatuto da Terra)',
    titulo: 'Compra, Venda e Arrendamento de Fazendas (Hectares, CAR, ITR e CCIR)',
    palavrasChave: ['fazenda', 'rural', 'hectare', 'hectares', 'alqueire', 'aptidão', 'pecuária', 'lavoura', 'soja', 'benfeitorias', 'car', 'itr', 'ccir', 'incra', 'arrendamento'],
    baseLegal: 'Lei nº 4.504/64 (Estatuto da Terra), Lei nº 10.267/2001 (Georreferenciamento INCRA) e Lei nº 12.651/2012 (Código Florestal / CAR).',
    resumoRegra:
      'Negociações de imóveis rurais exigem verificação obrigatória de: 1) Matrícula atualizada com Georreferenciamento certificado pelo INCRA; 2) CAR (Cadastro Ambiental Rural) e percentual de Reserva Legal averbada; 3) CCIR quitado e CND de ITR dos últimos 5 anos; 4) Especificação se a venda é "Ad Corpus" (porteira fechada/corpo certo) ou "Ad Mensuram" (preço por hectare/alqueire — Art. 500 do Código Civil).',
    orientacaoCorretor:
      '1. No cadastro da fazenda, registre a área total em Hectares (ha), a Aptidão (Lavoura, Pecuária ou Dupla Aptidão) e todas as Benfeitorias (sede, curral, cercas, recursos hídricos/outorga).\n2. Especifique na proposta se a venda inclui maquinário/semoventes ("porteira fechada") ou apenas a terra nua.',
    clausulaMinuta:
      'CLÁUSULA DE PROPRIEDADE RURAL E REGULARIDADE AMBIENTAL: O imóvel rural denominado [NOME DA FAZENDA], com área de [HECTARES] hectares e aptidão para [APTIDÃO], é negociado na modalidade [AD CORPUS / AD MENSURAM], comprometendo-se o Vendedor a apresentar CCIR, CND de ITR, recibo do CAR e certificação de georreferenciamento livres de ônus.',
  },
];

export default function AssistenteJuridicoImobi({ oficinaId }) {
  const [busca, setBusca] = useState('');
  const [perguntaIA, setPerguntaIA] = useState('');
  const [topicoSelecionado, setTopicoSelecionado] = useState(BASE_CONHECIMENTO_JURIDICO[0]);
  const [respostaPersonalizada, setRespostaPersonalizada] = useState(null);
  const [copiadoId, setCopiadoId] = useState('');

  const copiarTexto = (id, texto) => {
    if (!texto) return;
    navigator.clipboard?.writeText(texto);
    setCopiadoId(id);
    setTimeout(() => setCopiadoId(''), 2500);
  };

  const topicosFiltrados = useMemo(() => {
    if (!busca.trim()) return BASE_CONHECIMENTO_JURIDICO;
    const termo = busca.toLowerCase();
    return (BASE_CONHECIMENTO_JURIDICO || []).filter(
      (item) =>
        item.titulo.toLowerCase().includes(termo) ||
        item.categoria.toLowerCase().includes(termo) ||
        item.resumoRegra.toLowerCase().includes(termo) ||
        (item.palavrasChave || []).some((k) => k.toLowerCase().includes(termo))
    );
  }, [busca]);

  const consultarAssistenteJuridico = (e) => {
    if (e) e.preventDefault();
    if (!perguntaIA.trim()) return;
    const q = perguntaIA.trim().toLowerCase();

    // Encontra o tema com maior correspondência semântica na base legal
    let melhorMatch = BASE_CONHECIMENTO_JURIDICO[0];
    let maiorScore = -1;

    (BASE_CONHECIMENTO_JURIDICO || []).forEach((item) => {
      let score = 0;
      (item.palavrasChave || []).forEach((kw) => {
        if (q.includes(kw.toLowerCase())) score += 3;
      });
      if (q.includes('alug') || q.includes('inquilin')) {
        if (item.categoria.includes('Inquilinato')) score += 1;
      }
      if (q.includes('fazenda') || q.includes('hectare') || q.includes('rural')) {
        if (item.id === 'fazendas_imoveis_rurais') score += 5;
      }
      if (q.includes('lote') || q.includes('quadra')) {
        if (item.id === 'loteamentos_condominios') score += 5;
      }
      if (score > maiorScore) {
        maiorScore = score;
        melhorMatch = item;
      }
    });

    setTopicoSelecionado(melhorMatch);
    setRespostaPersonalizada({
      perguntaOriginal: perguntaIA.trim(),
      itemBase: melhorMatch,
      horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    });
  };

  const itemAtivo = respostaPersonalizada?.itemBase || topicoSelecionado || BASE_CONHECIMENTO_JURIDICO[0];

  return (
    <AceiteLegalGate chave="juridico_imobi" oficinaId={oficinaId}>
    <div style={{ backgroundColor: '#020408' }} className="space-y-6 text-slate-100 font-sans">
      <SeletorUF />

      {/* ─── DUE DILIGENCE & RAIO-X DE MATRÍCULA COM IA (PLANO PLUS) ────────── */}
      <DueDiligenceMatricula />

      {/* ═══════════════════════════════════════════════════════════════════════
          1. CABEÇALHO DO ASSISTENTE JURÍDICO IMOBILIÁRIO (LEI 8.245/91 & CC)
         ═══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <HeroAba
              flat
              icone={Scale}
              chip="Minutas & Checklist · Lei nº 8.245/91"
              titulo="Minuta rápida, com a lei citada e o checklist do que falta"
              subtitulo="Modelos de cláusula, notificação e checklist operacional com o dispositivo legal citado. É rascunho de trabalho: a revisão por advogado inscrito na OAB é obrigatória antes de usar com cliente."
              cor="#f43f5e"
            />
          </div>

          <div className="bg-[#020408] border border-[#10b981]/40 rounded-2xl p-4 space-y-1.5 min-w-[260px]">
            <span className="text-xs font-extrabold uppercase text-[#10b981] flex items-center gap-1.5">
              <BookOpen size={15} /> Legislação Integrada
            </span>
            <p className="text-xs text-slate-300 font-bold">• Lei 8.245/91 (Locação Urbana)</p>
            <p className="text-xs text-slate-300 font-bold">• Código Civil (Arts. 417 e 722)</p>
            <p className="text-xs text-slate-300 font-bold">• Lei 6.766/79 & Estatuto da Terra</p>
          </div>
        </div>

        {/* Barra de Consulta Inteligente por Linguagem Natural */}
        <form onSubmit={consultarAssistenteJuridico} className="flex flex-col sm:flex-row gap-3 pt-2">
          <div className="relative flex-1">
            <HelpCircle size={18} className="text-[#10b981] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              value={perguntaIA}
              onChange={(e) => setPerguntaIA(e.target.value)}
              placeholder="Descreva a situação (ex: Inquilino quer sair antes de 12 meses — preciso da cláusula de multa / Infiltração no teto: quem responde / Venda de fazenda: documentos)"
              className="w-full bg-[#020408] border border-[#10b981]/50 focus:border-[#10b981] rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white outline-none"
            />
          </div>
          <button
            type="submit"
            style={{ backgroundColor: '#10b981' }}
            className="px-6 py-3.5 rounded-2xl text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 transition cursor-pointer shadow-lg shadow-[#10b981]/25"
          >
            <Sparkles size={16} /> Buscar minuta e checklist
          </button>
        </form>
      </div>

      <SucessaoPatrimonial />

      {/* ═══════════════════════════════════════════════════════════════════════
          2. PAINEL DE CONSULTA: TEMAS JURÍDICOS + PARECER E CLÁUSULA PRONTA
         ═══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna Esquerda: Filtro Rápido de Situações Jurídicas */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
              <Search size={16} className="text-[#10b981]" /> Situações Mais Comuns na Negociação
            </h2>
            <span className="text-[11px] font-bold text-[#10b981]">
              {(topicosFiltrados || []).length} temas
            </span>
          </div>

          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Filtrar por palavra-chave (ex: caução, multa, lote, fazenda)..."
            className="w-full bg-[#020408] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white"
          />

          <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1">
            {(topicosFiltrados || [])?.map((item) => {
              const ativo = itemAtivo?.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setTopicoSelecionado(item);
                    setRespostaPersonalizada(null);
                  }}
                  style={ativo ? { borderColor: '#10b981' } : undefined}
                  className={`w-full text-left p-3.5 rounded-2xl border transition cursor-pointer ${
                    ativo
                      ? 'bg-[#020408] border-[#10b981] shadow-md shadow-[#10b981]/15'
                      : 'bg-[#020408]/70 border-slate-800 hover:border-slate-600'
                  }`}
                >
                  <span className="text-[10px] font-extrabold uppercase text-[#10b981] block mb-1">
                    {item.categoria}
                  </span>
                  <h3 className="text-xs font-black text-white leading-snug">{item.titulo}</h3>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{item.baseLegal}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Coluna Direita: Parecer Legal Instantâneo + Orientação Prática + Cláusula Pronta */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-5 flex flex-col justify-between">
          <div className="space-y-5">
            {respostaPersonalizada && (
              <div className="bg-[#020408] border border-[#10b981]/50 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] font-extrabold uppercase text-[#10b981]">
                  💬 Sua Dúvida Consultada às {respostaPersonalizada.horario}:
                </span>
                <p className="text-sm font-bold text-white">&ldquo;{respostaPersonalizada.perguntaOriginal}&rdquo;</p>
              </div>
            )}

            <div className="border-b border-slate-800 pb-4 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-[#10b981]/15 border border-[#10b981]/30 text-[#10b981] text-[11px] font-extrabold">
                  {itemAtivo.categoria}
                </span>
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                  <FileCheck2 size={14} className="text-[#10b981]" /> {itemAtivo.baseLegal}
                </span>
              </div>
              <h2 className="text-xl font-black text-white">{itemAtivo.titulo}</h2>
            </div>

            {/* Base Legal Explicada */}
            <div className="bg-[#020408] border border-slate-800 rounded-2xl p-4 space-y-2">
              <span className="text-xs font-extrabold uppercase text-[#10b981] block">
                1. O que a lei diz (referência do rascunho)
              </span>
              <p className="text-xs text-slate-200 leading-relaxed">{itemAtivo.resumoRegra}</p>
            </div>

            {/* Como o Corretor Deve Proceder na Negociação */}
            <div className="bg-[#020408] border border-slate-800 rounded-2xl p-4 space-y-2">
              <span className="text-xs font-extrabold uppercase text-[#10b981] block">
                2. Orientação Prática: Como Proceder na Negociação
              </span>
              <p className="text-xs text-slate-200 whitespace-pre-line leading-relaxed">
                {itemAtivo.orientacaoCorretor}
              </p>
            </div>

            {/* Minuta de Cláusula / Notificação Pronta para Copiar */}
            <div className="bg-[#020408] border border-[#10b981]/40 rounded-2xl p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-extrabold uppercase text-[#10b981]">
                  3. Rascunho de cláusula / comunicado (revisão do advogado antes de usar)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => copiarTexto('clausula_ativa', itemAtivo.clausulaMinuta)}
                    style={{ backgroundColor: '#10b981' }}
                    className="px-3 py-1.5 rounded-xl text-white text-xs font-extrabold flex items-center gap-1.5 hover:opacity-90 transition cursor-pointer"
                  >
                    {copiadoId === 'clausula_ativa' ? <Check size={13} /> : <Copy size={13} />}
                    {copiadoId === 'clausula_ativa' ? 'Copiado!' : 'Copiar Cláusula'}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      window.open(
                        `https://api.whatsapp.com/send?text=${encodeURIComponent(
                          `📝 *RASCUNHO OPERACIONAL — REVISÃO OBRIGATÓRIA POR ADVOGADO (OAB)*\nReferência: ${itemAtivo.baseLegal}\n\n${itemAtivo.clausulaMinuta}\n\n⚠️ ${AVISO_JURIDICO}`
                        )}`,
                        '_blank'
                      )
                    }
                    className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-[#10b981] text-xs font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <MessageCircle size={13} className="text-[#10b981]" /> Enviar no Zap
                  </button>
                </div>
              </div>

              <pre className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
                {itemAtivo.clausulaMinuta}
              </pre>
            </div>
          </div>

          {/* Aviso Legal Obrigatório */}
          <div className="bg-[#020408] border border-amber-500/40 rounded-2xl p-3.5 flex items-start gap-2.5 text-[11px] text-slate-300">
            <ShieldAlert size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong className="text-amber-400">Aviso obrigatório:</strong> {AVISO_JURIDICO} O texto
              abaixo é modelo, não parecer: não afirma nulidade, não decide litígio e não substitui
              advogado inscrito na OAB.
            </span>
          </div>
        </div>
      </div>
    </div>
    </AceiteLegalGate>
  );
}
