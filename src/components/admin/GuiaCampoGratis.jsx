import React, { useState, useRef, useEffect } from 'react';
import {
  Briefcase,
  Building2,
  Info,
  MapPin,
  Shirt,
  Video,
  Swords,
  Mic,
  MicOff,
  Send,
  Sparkles,
  RotateCcw,
  Check,
  Copy,
  AlertCircle,
  Award,
  TrendingUp,
  User,
  Bot,
  Compass,
  BookOpen,
  ShieldAlert,
  CheckCircle2,
  Sliders,
  ChevronRight,
  Flame,
} from 'lucide-react';
import HeroAba from './HeroAba';
import {
  CENARIOS_ROLEPLAY,
  NIVEIS_DIFICULDADE,
  processarTurnoRoleplayIA,
  processarAvaliacaoRoleplayIA,
} from '../../agent/arenaRoleplayPrompt';

const SECOES_MANUAL_ESTATICO = [
  {
    id: 'vestimenta',
    titulo: 'Vestimenta e Postura',
    icone: Shirt,
    itens: [
      {
        titulo: 'Visita a terreno',
        texto: 'Use roupa limpa e prática, com calçado fechado; considere o clima e as condições do acesso.',
      },
      {
        titulo: 'Imóvel pronto ou condomínio',
        texto: 'Mantenha uma apresentação discreta, respeite as regras do local e cuide da privacidade dos moradores.',
      },
      {
        titulo: 'Reunião com proprietário ou gestor',
        texto: 'Chegue no horário, leve as informações que já confirmou e ajuste a formalidade ao contexto.',
      },
      {
        titulo: 'Presença e objeções',
        texto: 'Escute sem interromper. Em vez de rebater, pergunte: "O que pesa mais nessa decisão?" e responda com fatos verificáveis.',
      },
    ],
  },
  {
    id: 'gestao',
    titulo: 'Visão do Dono de Imobiliária',
    icone: Building2,
    itens: [
      {
        titulo: 'Organização',
        texto: 'Cada lead precisa de responsável, etapa e próximo passo claros; registre o combinado no CRM.',
      },
      {
        titulo: 'Confiabilidade',
        texto: 'Cumpra horários e retornos prometidos. Se algo mudar, avise antes de o cliente precisar cobrar.',
      },
      {
        titulo: 'Cuidado com os leads',
        texto: 'Aborde com contexto, respeite o interesse demonstrado e evite mensagens repetidas sem necessidade.',
      },
      {
        titulo: 'Constância e saúde da operação',
        texto: 'Acompanhe retornos, visitas, propostas e pendências ao longo da semana — não só o volume de contatos.',
      },
    ],
  },
  {
    id: 'campo',
    titulo: 'Campo e Imóveis',
    icone: MapPin,
    itens: [
      {
        titulo: 'Em terrenos',
        texto: 'Observe poste e infraestrutura aparente, bueiro e escoamento, declive/caimento, divisas visíveis e condição da rua. Confirme medidas e serviços em fontes confiáveis antes de afirmar.',
      },
      {
        titulo: 'Antes e durante a visita',
        texto: 'Confirme horário, acesso, chaves e características do imóvel. Retome o que o cliente procura, deixe tempo para observar e responda sem pressionar.',
      },
      {
        titulo: 'Ao encerrar',
        texto: 'Pergunte o que fez sentido e o que faltou. Combine uma ação, quem ficará responsável e quando haverá retorno.',
      },
    ],
  },
  {
    id: 'videos',
    titulo: 'Vídeos, Redes Sociais e Sinais de Alerta',
    icone: Video,
    itens: [
      {
        titulo: 'Vídeo simples no celular',
        texto: 'Limpe a lente, grave na vertical com luz natural e faça uma apresentação curta: localização, um destaque confirmado e um convite claro para conversar.',
      },
      {
        titulo: 'Publicação responsável',
        texto: 'Peça autorização para filmar, evite mostrar pessoas, documentos, chaves ou detalhes de segurança e revise legenda e dados antes de postar.',
      },
      {
        titulo: 'Não prometa o que não sabe',
        texto: 'Preço, área, documentação, infraestrutura, financiamento e disponibilidade devem ser confirmados. Se não souber, diga que vai verificar.',
      },
      {
        titulo: 'Não deixe a conversa solta',
        texto: 'Feche cada contato com um resumo e um próximo passo combinado; registre o retorno para não depender da memória.',
      },
    ],
  },
];

export default function GuiaCampoGratis({ temaClaro = false }) {
  const [subAba, setSubAba] = useState('arena'); // 'arena' | 'manual'

  // Estados da Arena de Roleplay
  const [cenarioId, setCenarioId] = useState('imovel_caro');
  const [dificuldadeId, setDificuldadeId] = useState('moderado');
  const [cenarioCustom, setCenarioCustom] = useState({
    titulo: '',
    contexto: '',
    primeiraFala: '',
  });

  const [simulacaoIniciada, setSimulacaoIniciada] = useState(false);
  const [turnoAtual, setTurnoAtual] = useState(1);
  const [historico, setHistorico] = useState([]);
  const [mensagemInput, setMensagemInput] = useState('');
  const [carregandoIA, setCarregandoIA] = useState(false);
  const [carregandoAvaliacao, setCarregandoAvaliacao] = useState(false);
  const [avaliacaoFinal, setAvaliacaoFinal] = useState(null);
  const [erroTurno, setErroTurno] = useState('');
  const [copiado, setCopiado] = useState(false);

  // Reconhecimento de Voz (Web Speech API)
  const [gravandoVoz, setGravandoVoz] = useState(false);
  const [duracaoVoz, setDuracaoVoz] = useState(0);
  const recognitionRef = useRef(null);
  const timerVozRef = useRef(null);
  const chatBottomRef = useRef(null);

  const cenarioAtual = CENARIOS_ROLEPLAY.find((c) => c.id === cenarioId) || CENARIOS_ROLEPLAY[0];
  const cenarioObjEfetivo = cenarioId === 'personalizado'
    ? {
        id: 'personalizado',
        titulo: cenarioCustom.titulo.trim() || 'Cenário Personalizado',
        contexto: cenarioCustom.contexto.trim() || 'Situação específica de atendimento.',
        primeiraFala: cenarioCustom.primeiraFala.trim() || 'Tenho sérias ressalvas sobre este negócio.',
        dicaEstrategica: 'Mantenha a autoridade, faça perguntas abertas e isole as objeções.',
      }
    : cenarioAtual;

  const dificuldadeAtual = NIVEIS_DIFICULDADE.find((d) => d.id === dificuldadeId) || NIVEIS_DIFICULDADE[0];

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [historico, carregandoIA]);

  // Gestão do microfone
  const alternarGravacaoVoz = () => {
    if (gravandoVoz) {
      pararGravacaoVoz();
    } else {
      iniciarGravacaoVoz();
    }
  };

  const iniciarGravacaoVoz = () => {
    const SpeechRecognition = typeof window !== 'undefined'
      ? (window.SpeechRecognition || window.webkitSpeechRecognition)
      : null;

    if (!SpeechRecognition) {
      alert('Seu navegador não suporta reconhecimento de voz nativo. Utilize o Google Chrome ou Microsoft Edge.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setGravandoVoz(true);
        setDuracaoVoz(0);
        timerVozRef.current = setInterval(() => {
          setDuracaoVoz((s) => s + 1);
        }, 1000);
      };

      recognition.onresult = (event) => {
        let textoParcial = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            const transcript = event.results[i][0].transcript;
            setMensagemInput((prev) => (prev ? `${prev} ${transcript}`.trim() : transcript.trim()));
          } else {
            textoParcial += event.results[i][0].transcript;
          }
        }
      };

      recognition.onerror = (e) => {
        console.warn('Erro na transcrição de voz:', e);
        pararGravacaoVoz();
      };

      recognition.onend = () => {
        pararGravacaoVoz();
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.error('Falha ao acionar reconhecimento de voz:', err);
      pararGravacaoVoz();
    }
  };

  const pararGravacaoVoz = () => {
    if (timerVozRef.current) {
      clearInterval(timerVozRef.current);
      timerVozRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // no-op
      }
      recognitionRef.current = null;
    }
    setGravandoVoz(false);
  };

  // Iniciar Simulação
  const handleIniciarSimulacao = () => {
    setSimulacaoIniciada(true);
    setTurnoAtual(1);
    setAvaliacaoFinal(null);
    setErroTurno('');
    setMensagemInput('');
    setHistorico([
      {
        id: 'msg_0',
        autor: 'cliente',
        texto: cenarioObjEfetivo.primeiraFala,
        emocao: 'cético',
        turno: 1,
      },
    ]);
  };

  // Reiniciar
  const handleReiniciar = () => {
    pararGravacaoVoz();
    setSimulacaoIniciada(false);
    setTurnoAtual(1);
    setHistorico([]);
    setMensagemInput('');
    setAvaliacaoFinal(null);
    setErroTurno('');
  };

  // Enviar Turno do Corretor
  const handleEnviarTurno = async () => {
    const texto = mensagemInput.trim();
    if (!texto || carregandoIA) return;

    pararGravacaoVoz();
    setErroTurno('');

    const novoHistorico = [
      ...historico,
      {
        id: `msg_${historico.length}`,
        autor: 'corretor',
        texto,
        turno: turnoAtual,
      },
    ];

    setHistorico(novoHistorico);
    setMensagemInput('');

    // Se já estava no 5º turno do corretor, encerra e avalia automaticamente
    if (turnoAtual >= 5) {
      handleFinalizarAvaliacao(novoHistorico);
      return;
    }

    setCarregandoIA(true);
    try {
      const res = await processarTurnoRoleplayIA({
        cenarioObj: cenarioObjEfetivo,
        dificuldadeId,
        historico: novoHistorico,
        mensagemCorretor: texto,
        turnoAtual,
      });

      setHistorico([
        ...novoHistorico,
        {
          id: `msg_${novoHistorico.length}`,
          autor: 'cliente',
          texto: res.respostaCliente,
          emocao: res.emocaoCliente,
          conducao: res.conducaoCorretor,
          turno: turnoAtual + 1,
        },
      ]);
      setTurnoAtual((t) => Math.min(5, t + 1));
    } catch (err) {
      console.error('Erro no turno da IA:', err);
      setErroTurno(err.message || 'Falha na resposta do cliente. Você pode tentar novamente ou encerrar e avaliar.');
    } finally {
      setCarregandoIA(false);
    }
  };

  // Finalizar e Avaliar Sessão
  const handleFinalizarAvaliacao = async (historicoParaAvaliar = null) => {
    pararGravacaoVoz();
    setCarregandoAvaliacao(true);
    setErroTurno('');

    const baseHistorico = historicoParaAvaliar || historico;
    try {
      const relatorio = await processarAvaliacaoRoleplayIA({
        cenarioObj: cenarioObjEfetivo,
        dificuldadeId,
        historico: baseHistorico,
      });
      setAvaliacaoFinal(relatorio);
    } catch (err) {
      console.error('Erro na avaliação executiva:', err);
      setErroTurno(err.message || 'Falha ao gerar o diagnóstico. Tente clicar em avaliar novamente.');
    } finally {
      setCarregandoAvaliacao(false);
    }
  };

  // Copiar frases de contorno
  const handleCopiarFrases = () => {
    if (!avaliacaoFinal?.frasesIdeaisContorno?.length) return;
    const texto = avaliacaoFinal.frasesIdeaisContorno
      .map((item, idx) => `[Objeção ${idx + 1}] ${item.objecao}\nScript Recomendado: "${item.fraseRecomendada}"\nPor que funciona: ${item.porQueFunciona}`)
      .join('\n\n');

    navigator.clipboard.writeText(texto).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    });
  };

  const superficie = temaClaro
    ? 'border-slate-200 bg-white shadow-sm'
    : 'border-slate-800 bg-[#060a10]';
  const cardSuperficie = temaClaro
    ? 'border-slate-200 bg-slate-50'
    : 'border-slate-800/80 bg-[#0B1215]';
  const tituloCor = temaClaro ? 'text-slate-900' : 'text-white';
  const textoCor = temaClaro ? 'text-slate-600' : 'text-slate-300';
  const subtituloCor = temaClaro ? 'text-slate-500' : 'text-slate-400';

  return (
    <div className="space-y-6">
      <HeroAba
        icone={Swords}
        titulo="ARENA DE"
        destaque="TREINAMENTO & ROLEPLAY"
        chip="SIMULADOR DE OBJEÇÕES · ATÉ 5 TURNOS · FEEDBACK EXECUTIVO"
        subtitulo="Treine situações reais de alta pressão imobiliária com inteligência artificial, pratique por texto ou voz e receba avaliação detalhada da sua autoridade."
        cor="#10b981"
      />

      {/* Sub-abas de Navegação */}
      <div className="flex border-b border-slate-800">
        <button
          type="button"
          onClick={() => setSubAba('arena')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition cursor-pointer ${
            subAba === 'arena'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Swords size={16} />
          <span>Arena de Roleplay IA</span>
          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black text-emerald-400">
            Interativo
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSubAba('manual')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition cursor-pointer ${
            subAba === 'manual'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen size={16} />
          <span>Manual de Campo & Postura</span>
        </button>
      </div>

      {/* ABA 1: ARENA DE ROLEPLAY IA */}
      {subAba === 'arena' && (
        <div className="space-y-6">
          {/* PAINEL DE CONFIGURAÇÃO (quando não iniciado) */}
          {!simulacaoIniciada && !avaliacaoFinal && (
            <div className={`rounded-2xl border p-6 space-y-6 ${superficie}`}>
              <div>
                <h3 className={`text-lg font-black tracking-tight ${tituloCor}`}>
                  1. Escolha o Cenário de Objeção
                </h3>
                <p className={`text-xs mt-1 ${subtituloCor}`}>
                  Selecione o desafio imobiliário real que você deseja simular agora.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {CENARIOS_ROLEPLAY.map((cenario) => {
                  const ativo = cenarioId === cenario.id;
                  return (
                    <button
                      key={cenario.id}
                      type="button"
                      onClick={() => setCenarioId(cenario.id)}
                      className={`text-left p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                        ativo
                          ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                          : `${cardSuperficie} hover:border-slate-700`
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-sm font-bold ${ativo ? 'text-emerald-400' : tituloCor}`}>
                            {cenario.titulo}
                          </span>
                          {ativo && <Check size={16} className="text-emerald-400 shrink-0" />}
                        </div>
                        <p className={`text-xs mt-1.5 leading-relaxed ${subtituloCor}`}>
                          {cenario.subtitulo}
                        </p>
                      </div>
                      <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center gap-1.5 text-[11px] text-emerald-400/80">
                        <Flame size={12} />
                        <span>{cenario.id === 'personalizado' ? 'Customizável' : 'Caso Real'}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Formulário do cenário personalizado */}
              {cenarioId === 'personalizado' && (
                <div className={`p-4 rounded-xl border border-slate-800 space-y-3 ${cardSuperficie}`}>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Título da Situação
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Cliente quer desconto de 20% à vista"
                      value={cenarioCustom.titulo}
                      onChange={(e) => setCenarioCustom({ ...cenarioCustom, titulo: e.target.value })}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Primeira fala do cliente (Abertura da objeção)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Ex: Só compro se fizer 20% abaixo da tabela. O que acha?"
                      value={cenarioCustom.primeiraFala}
                      onChange={(e) => setCenarioCustom({ ...cenarioCustom, primeiraFala: e.target.value })}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Seleção de Nível de Dificuldade */}
              <div>
                <h3 className={`text-lg font-black tracking-tight ${tituloCor}`}>
                  2. Nível de Exigência do Cliente
                </h3>
                <p className={`text-xs mt-1 ${subtituloCor}`}>
                  Defina o perfil psicológico e a agressividade do negociador simulado.
                </p>
                <div className="grid gap-3 sm:grid-cols-3 mt-3">
                  {NIVEIS_DIFICULDADE.map((dif) => {
                    const ativo = dificuldadeId === dif.id;
                    return (
                      <button
                        key={dif.id}
                        type="button"
                        onClick={() => setDificuldadeId(dif.id)}
                        className={`text-left p-4 rounded-xl border transition cursor-pointer ${
                          ativo
                            ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                            : `${cardSuperficie} hover:border-slate-700`
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-black ${ativo ? 'text-emerald-400' : tituloCor}`}>
                            {dif.label}
                          </span>
                          <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${dif.badge}`}>
                            Nível
                          </span>
                        </div>
                        <p className={`text-xs mt-2 leading-relaxed ${subtituloCor}`}>
                          {dif.descricao}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Botão de Iniciar */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleIniciarSimulacao}
                  style={{ backgroundColor: '#10b981' }}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-black text-slate-950 text-sm shadow-lg hover:brightness-110 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Swords size={18} />
                  <span>Entrar na Arena & Iniciar Simulação</span>
                </button>
              </div>
            </div>
          )}

          {/* SIMULAÇÃO EM ANDAMENTO */}
          {simulacaoIniciada && !avaliacaoFinal && (
            <div className={`rounded-2xl border p-5 md:p-6 space-y-6 ${superficie}`}>
              {/* Barra Superior do Round */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400">
                      {cenarioObjEfetivo.titulo}
                    </span>
                    <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${dificuldadeAtual.badge}`}>
                      Cliente {dificuldadeAtual.label}
                    </span>
                  </div>
                  <p className={`text-xs ${subtituloCor}`}>
                    Dica: {cenarioObjEfetivo.dicaEstrategica}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Turno {turnoAtual} de 5
                    </div>
                    <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden mt-1">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-300"
                        style={{ width: `${(turnoAtual / 5) * 100}%` }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleReiniciar}
                    title="Reiniciar Simulação"
                    className="p-2 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition cursor-pointer"
                  >
                    <RotateCcw size={16} />
                  </button>
                </div>
              </div>

              {/* Chat / Histórico de Conversa */}
              <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
                {historico.map((item) => {
                  const ehCliente = item.autor === 'cliente';
                  return (
                    <div
                      key={item.id}
                      className={`flex gap-3 ${ehCliente ? 'justify-start' : 'justify-end'}`}
                    >
                      {ehCliente && (
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-slate-300">
                          <User size={16} />
                        </div>
                      )}

                      <div
                        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-sm ${
                          ehCliente
                            ? 'bg-[#0f172a]/90 border border-slate-700/80 text-slate-200'
                            : 'bg-emerald-600/15 border border-emerald-500/40 text-emerald-100'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 mb-1 text-[10px] font-bold tracking-wide uppercase">
                          <span className={ehCliente ? 'text-amber-400' : 'text-emerald-400'}>
                            {ehCliente ? `Cliente (${item.emocao || 'Cético'})` : 'Você (Corretor)'}
                          </span>
                          <span className="text-slate-500">
                            Turno {item.turno || 1}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap">{item.texto}</p>
                      </div>

                      {!ehCliente && (
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 text-emerald-400">
                          <Bot size={16} />
                        </div>
                      )}
                    </div>
                  );
                })}

                {carregandoIA && (
                  <div className="flex items-center gap-3 text-slate-400 text-xs italic p-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>O cliente está formulando a resposta...</span>
                  </div>
                )}

                <div ref={chatBottomRef} />
              </div>

              {erroTurno && (
                <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{erroTurno}</span>
                </div>
              )}

              {/* Caixa de Entrada do Corretor */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="relative">
                  <textarea
                    rows={3}
                    disabled={carregandoIA || carregandoAvaliacao}
                    placeholder="Digite seu argumento ou use o microfone para responder por voz..."
                    value={mensagemInput}
                    onChange={(e) => setMensagemInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleEnviarTurno();
                      }
                    }}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/90 p-3.5 pr-12 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none resize-none"
                  />

                  {/* Botão de Microfone Flutuante */}
                  <button
                    type="button"
                    onClick={alternarGravacaoVoz}
                    disabled={carregandoIA || carregandoAvaliacao}
                    title={gravandoVoz ? 'Parar Gravação de Voz' : 'Falar por Voz'}
                    className={`absolute right-3 top-3.5 p-2 rounded-lg transition cursor-pointer ${
                      gravandoVoz
                        ? 'bg-rose-500 text-white animate-pulse shadow-lg'
                        : 'bg-slate-800 text-slate-400 hover:text-emerald-400 hover:bg-slate-700'
                    }`}
                  >
                    {gravandoVoz ? <MicOff size={16} /> : <Mic size={16} />}
                  </button>
                </div>

                {gravandoVoz && (
                  <div className="flex items-center justify-between text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg">
                    <span className="flex items-center gap-1.5 font-bold">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                      Gravando fala... ({duracaoVoz}s)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Fale com clareza; clique no microfone para encerrar.
                    </span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-500">
                    Pressione <kbd className="rounded border border-slate-700 bg-slate-800 px-1 py-0.5 text-[10px] text-slate-400">Enter</kbd> para enviar
                  </span>

                  <div className="flex items-center gap-2.5">
                    {historico.length >= 2 && (
                      <button
                        type="button"
                        onClick={() => handleFinalizarAvaliacao()}
                        disabled={carregandoAvaliacao || carregandoIA}
                        className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 text-xs font-bold transition cursor-pointer"
                      >
                        {carregandoAvaliacao ? 'Avaliando com IA...' : 'Encerrar & Avaliar'}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleEnviarTurno}
                      disabled={!mensagemInput.trim() || carregandoIA || carregandoAvaliacao}
                      style={{ backgroundColor: '#10b981' }}
                      className="px-6 py-2.5 rounded-xl font-bold text-slate-950 text-xs shadow-md hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-2 cursor-pointer"
                    >
                      <Send size={15} />
                      <span>{turnoAtual >= 5 ? 'Enviar & Avaliar Final' : 'Enviar Resposta'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PLACAR E DIAGNÓSTICO EXECUTIVO FINAL */}
          {avaliacaoFinal && (
            <div className={`rounded-2xl border p-6 space-y-6 ${superficie}`}>
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-400">
                    DIAGNÓSTICO EXECUTIVO DE ATENDIMENTO
                  </span>
                  <h3 className={`text-xl font-black tracking-tight mt-2 ${tituloCor}`}>
                    Relatório de Desempenho & Autoridade
                  </h3>
                  <p className={`text-xs mt-1 ${subtituloCor}`}>
                    Cenário: {cenarioObjEfetivo.titulo} · Dificuldade: {dificuldadeAtual.label}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-center p-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 min-w-[110px]">
                    <div className="text-3xl font-black text-emerald-400">
                      {avaliacaoFinal.nota}
                      <span className="text-xs text-slate-400 font-normal">/10</span>
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-wider text-emerald-300 mt-0.5">
                      {avaliacaoFinal.nivelDesempenho}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleReiniciar}
                    style={{ backgroundColor: '#10b981' }}
                    className="px-4 py-3 rounded-xl font-black text-slate-950 text-xs shadow-md hover:brightness-110 transition flex items-center gap-2 cursor-pointer"
                  >
                    <RotateCcw size={16} />
                    <span>Novo Treino</span>
                  </button>
                </div>
              </div>

              {/* Resumo Executivo */}
              <div className={`p-4 rounded-xl border border-slate-800/80 ${cardSuperficie}`}>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1">
                  Parecer Geral da Condução
                </h4>
                <p className={`text-xs sm:text-sm leading-relaxed ${textoCor}`}>
                  {avaliacaoFinal.resumoExecutivo}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Pontos Fortes */}
                <div className={`p-5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] space-y-3`}>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 size={18} />
                    <h4 className="text-xs font-black uppercase tracking-wider">
                      Pontos Fortes Demonstrados
                    </h4>
                  </div>
                  <ul className="space-y-2">
                    {avaliacaoFinal.pontosFortes?.map((pt, idx) => (
                      <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                        <span className="text-emerald-500 font-bold shrink-0">•</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Onde Perdeu Autoridade */}
                <div className={`p-5 rounded-xl border border-amber-500/20 bg-amber-500/[0.03] space-y-3`}>
                  <div className="flex items-center gap-2 text-amber-400">
                    <ShieldAlert size={18} />
                    <h4 className="text-xs font-black uppercase tracking-wider">
                      Onde Perdeu Autoridade / Condução
                    </h4>
                  </div>
                  <ul className="space-y-2">
                    {avaliacaoFinal.ondePerdeuAutoridade?.map((pt, idx) => (
                      <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                        <span className="text-amber-500 font-bold shrink-0">•</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Frases Ideais de Contorno */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className={`text-sm font-black tracking-tight ${tituloCor}`}>
                    Frases Ideais de Contorno (Scripts de Fechamento)
                  </h4>
                  <button
                    type="button"
                    onClick={handleCopiarFrases}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs font-bold text-slate-300 hover:text-white hover:border-slate-600 transition cursor-pointer"
                  >
                    {copiado ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    <span>{copiado ? 'Copiado!' : 'Copiar Frases de Contorno'}</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {avaliacaoFinal.frasesIdeaisContorno?.map((script, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border border-slate-800 space-y-2 ${cardSuperficie}`}
                    >
                      <div className="text-[11px] font-bold text-amber-400">
                        Objeção: {script.objecao}
                      </div>
                      <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-xs font-mono text-emerald-300">
                        "{script.fraseRecomendada}"
                      </div>
                      <div className="text-[11px] text-slate-400">
                        <strong>Por que funciona:</strong> {script.porQueFunciona}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Plano de Melhoria */}
              {avaliacaoFinal.planoMelhoria?.length > 0 && (
                <div className={`p-4 rounded-xl border border-slate-800 ${cardSuperficie}`}>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                    Próximos Passos de Aperfeiçoamento
                  </h4>
                  <ul className="space-y-1.5">
                    {avaliacaoFinal.planoMelhoria.map((passo, idx) => (
                      <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                        <span className="text-emerald-500 font-bold shrink-0">→</span>
                        <span>{passo}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ABA 2: MANUAL ESTÁTICO DE CAMPO & POSTURA */}
      {subAba === 'manual' && (
        <div className="space-y-5">
          <div className="grid gap-4 xl:grid-cols-2">
            {SECOES_MANUAL_ESTATICO.map(({ id, titulo, icone: Icone, itens }) => (
              <section
                key={titulo}
                className={`rounded-2xl border p-5 md:p-6 ${superficie}`}
                aria-labelledby={`guia-campo-${id}`}
              >
                <header className="mb-4 flex items-center gap-3">
                  <span className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-500">
                    <Icone size={21} aria-hidden="true" />
                  </span>
                  <h2
                    id={`guia-campo-${id}`}
                    className={`text-base font-black md:text-lg ${tituloCor}`}
                  >
                    {titulo}
                  </h2>
                </header>

                <ul className="space-y-4">
                  {itens.map((item) => (
                    <li key={item.titulo} className="border-l-2 border-emerald-500/40 pl-3">
                      <h3 className="text-xs font-black uppercase tracking-wide text-emerald-400">
                        {item.titulo}
                      </h3>
                      <p className={`mt-1 text-sm leading-relaxed ${textoCor}`}>{item.texto}</p>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <aside className={`flex gap-3 rounded-2xl border p-4 ${superficie}`}>
            <Info className="mt-0.5 shrink-0 text-emerald-500" size={18} aria-hidden="true" />
            <p className={`text-xs leading-relaxed ${textoCor}`}>
              Use este guia como apoio prático de campo. Confirme informações do imóvel com o responsável e
              consulte documentos ou profissionais habilitados quando a resposta depender deles.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
