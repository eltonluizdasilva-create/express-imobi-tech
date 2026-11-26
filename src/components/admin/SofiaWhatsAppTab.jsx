import React, { useState, useMemo } from 'react';
import {
  MessageCircle,
  ShieldCheck,
  Camera,
  Zap,
  Sparkles,
  Clock,
  ArrowRight,
  TrendingUp,
  Moon,
  Sun,
  Sunrise,
  Sunset,
  CalendarCheck,
  Users,
  CheckCircle2,
  Lock,
  Phone,
  Video,
  MoreVertical,
  CheckCheck,
  Building,
  MapPin,
  BadgePercent,
  Play,
  RotateCcw,
} from 'lucide-react';
import SimuladorPolen from '../imobi/SimuladorPolen';
import { linkWhatsApp } from '../../lib/contato';

export default function SofiaWhatsAppTab({
  abaInicial = 'simulador',
  childrenMap = {},
  onAbrirCopiloto = null,
  liberado = true,
  onAbrirPlanos = null,
  onAbrirCaptacao = null,
  catalogoImoveis = [],
  dadosOficina = {},
  leads = [],
}) {
  const [cenarioAtivo, setCenarioAtivo] = useState('madrugada'); // 'madrugada' | 'qualificacao'
  const [visaoAtiva, setVisaoAtiva] = useState(
    abaInicial === 'secretaria' || abaInicial === 'whatsapp_hub' ? abaInicial : 'simulador'
  );

  // Cenários do Mockup de Celular ao vivo
  const cenariosWhatsApp = {
    madrugada: {
      titulo: 'Lead de Madrugada (02:14)',
      descricao: 'Cliente busca imóvel no anúncio às 02h da manhã e recebe resposta imediata com agendamento.',
      horario: '02:14',
      mensagens: [
        {
          id: 1,
          autor: 'cliente',
          hora: '02:14',
          texto: 'Boa noite! Ainda tá disponível aquele apartamento de 3 quartos no Centro que vi no anúncio? Qual o valor do condomínio?',
        },
        {
          id: 2,
          autor: 'polen',
          hora: '02:14',
          texto: 'Olá! Sim, está disponível! 🏢 O condomínio é R$ 420/mês e o imóvel já conta com varanda gourmet e 2 vagas cobertas.',
          temCard: true,
          imovel: {
            titulo: 'Residencial Boulevard Jardins',
            detalhes: '3 Quartos (1 Suíte) • 88m² • 2 Vagas',
            valor: 'R$ 490.000',
            condominio: 'Condomínio: R$ 420/mês',
            local: 'Centro, Uberlândia - MG',
            foto: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&auto=format&fit=crop&q=80',
          },
        },
        {
          id: 3,
          autor: 'cliente',
          hora: '02:15',
          texto: 'Consigo visitar esse fim de semana? Sábado pela manhã seria perfeito.',
        },
        {
          id: 4,
          autor: 'polen',
          hora: '02:15',
          texto: 'Combinado! Pré-reservei seu horário para este Sábado às 10:00 com o corretor responsável da nossa equipe. Já deixei a chave e a ficha separadas!',
          seloAgendamento: '✓ Visita Agendada Automaticamente (Sábado · 10h)',
        },
      ],
    },
    qualificacao: {
      titulo: '2. Qualificação & Envio do Catálogo',
      descricao: 'Cliente informa bairro e perfil desejado; Pólen filtra o catálogo, envia imóvel compatível e encaminha lead qualificado ao corretor.',
      horario: '19:42',
      mensagens: [
        {
          id: 1,
          autor: 'cliente',
          hora: '19:42',
          texto: 'Boa noite! Procuro um apartamento de 2 ou 3 quartos no Jardim Finotti ou Santa Mônica, com varanda gourmet e até R$ 450 mil. Tem opções no catálogo?',
        },
        {
          id: 2,
          autor: 'polen',
          hora: '19:42',
          texto: 'Olá! Temos excelentes opções dentro do seu perfil! 🏢 Separei a melhor oportunidade no Jardim Finotti, recém-anunciada e pronta para morar:',
          temCard: true,
          imovel: {
            titulo: 'Residencial Grand Park',
            detalhes: '3 Quartos (1 Suíte) • 82m² • Varanda Gourmet',
            valor: 'R$ 440.000',
            condominio: 'Condomínio: R$ 380/mês',
            local: 'Jardim Finotti, Uberlândia - MG',
            foto: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&auto=format&fit=crop&q=80',
          },
        },
        {
          id: 3,
          autor: 'cliente',
          hora: '19:43',
          texto: 'Gostei muito dessa unidade! Quero falar com um corretor para ver a documentação.',
        },
        {
          id: 4,
          autor: 'polen',
          hora: '19:43',
          texto: 'Excelente escolha! Acabei de qualificar seus dados e o corretor especialista dessa região já recebeu sua ficha e vai entrar em contato em instantes.',
          seloAgendamento: '✓ Lead Qualificado & Encaminhado ao Corretor',
        },
      ],
    },
  };

  // Métricas do Funil e Turnos (dados reais ou cenário demo inteligente)
  const metricas = useMemo(() => {
    const totalLeads = Array.isArray(leads) && leads.length > 0 ? leads.length : 124;
    const qualificados = Math.round(totalLeads * 0.69);
    const agendadas = Math.round(totalLeads * 0.25);

    return {
      totalLeads,
      qualificados,
      agendadas,
      turnos: [
        { id: 'manha', nome: 'Manhã (06h–12h)', pct: 28, cor: 'from-emerald-500 to-emerald-400', icone: Sunrise },
        { id: 'tarde', nome: 'Tarde (12h–18h)', pct: 34, cor: 'from-emerald-500 to-teal-400', icone: Sun },
        { id: 'noite', nome: 'Noite (18h–00h)', pct: 26, cor: 'from-amber-500 to-amber-400', icone: Sunset },
        { id: 'madrugada', nome: 'Madrugada (00h–06h)', pct: 12, cor: 'from-amber-400 to-amber-300', icone: Moon, destaque: true },
      ],
      pctForaComercial: 38, // 26% noite + 12% madrugada
    };
  }, [leads]);

  const handleQueroPolen = () => {
    const url = linkWhatsApp('Olá! Quero saber mais sobre a IA Pólen e ativar o atendimento 24h no meu WhatsApp.');
    window.open(url, '_blank');
  };

  const cenario = cenariosWhatsApp[cenarioAtivo] || cenariosWhatsApp.madrugada;

  return (
    <div
      data-tema="escuro-forcado"
      className="painel-escuro space-y-8 animate-in fade-in duration-500 rounded-3xl p-2 md:p-4"
      style={{ backgroundColor: '#05070A', color: '#ffffff' }}
    >
      {/* ─── HERO TECNOLÓGICO COM MALHA NEURAL ESMERALDA & MOCKUP WHATSAPP 02:14 ─── */}
      <div
        className="relative overflow-hidden rounded-3xl border border-emerald-500/30 p-6 md:p-8 shadow-2xl"
        style={{
          backgroundColor: '#070C12',
          backgroundImage:
            'radial-gradient(900px 320px at 10% -20%, rgba(16, 185, 129, 0.18), transparent 70%), radial-gradient(700px 280px at 90% -10%, rgba(245, 158, 11, 0.12), transparent 60%), linear-gradient(180deg, #070C12 0%, #04070B 100%)',
        }}
      >
        {/* Malha neural SVG luminosa de fundo */}
        <div className="pointer-events-none absolute inset-0 opacity-25">
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="neural-grid-polen" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="1" fill="#10b981" fillOpacity="0.4" />
                <path d="M 20 0 L 20 40 M 0 20 L 40 20" stroke="#10b981" strokeWidth="0.5" strokeOpacity="0.12" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#neural-grid-polen)" />
          </svg>
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Coluna Esquerda: Texto & Identidade */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-[10.5px] font-black uppercase tracking-wider text-[#10b981]">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                ● ATENDENDO 24H
              </span>
              <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-[10.5px] font-black uppercase tracking-wider text-amber-300">
                WhatsApp Oficial do Corretor
              </span>
            </div>

            <div className="flex items-start gap-4">
              <div className="relative shrink-0">
                <div className="h-20 w-20 md:h-24 md:w-24 rounded-2xl overflow-hidden border-2 border-emerald-400/80 bg-zinc-950 shadow-2xl shadow-emerald-500/30">
                  <img
                    src="/images/avatar-polen.png"
                    onError={(e) => { e.currentTarget.src = '/images/avatar-polen.svg'; }}
                    alt="IA Pólen"
                    className="h-full w-full object-cover"
                  />
                </div>
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-[#070C12]"></span>
                </span>
              </div>

              <div className="space-y-1.5">
                <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>
                  IA PÓLEN · <span className="text-[#10b981]" style={{ color: '#10b981', WebkitTextFillColor: '#10b981' }}>SECRETÁRIA 24H</span>
                </h1>
                <p className="text-sm md:text-base font-semibold text-emerald-300">
                  Atendimento Comercial Ativo no WhatsApp da sua Imobiliária
                </p>
                <p className="text-xs md:text-sm text-slate-300 leading-relaxed max-w-xl" style={{ color: '#cbd5e1' }}>
                  Veja como ela atende seus clientes às <strong>02h da manhã</strong> e entrega a visita agendada na sua agenda. Qualifica compradores, consulta o catálogo real da imobiliária e distribui o cliente pronto para o corretor da vez.
                </p>
              </div>
            </div>

            {/* Alternador de Cenários Rápidos */}
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block" style={{ color: '#94a3b8' }}>
                Simulação Rápida em 1 Clique:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCenarioAtivo('qualificacao')}
                  className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                    cenarioAtivo === 'qualificacao'
                      ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25'
                      : 'bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  <Building size={14} className={cenarioAtivo === 'qualificacao' ? 'text-slate-950' : 'text-emerald-400'} />
                  2. Qualificação & Envio do Catálogo
                </button>
              </div>
            </div>

            {/* Ações principais */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleQueroPolen}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 px-6 py-3.5 text-xs font-black uppercase tracking-wider text-slate-950 transition shadow-xl shadow-emerald-500/25 cursor-pointer font-sans"
              >
                Quero a Pólen no meu WhatsApp →
              </button>

              <button
                type="button"
                onClick={() => setVisaoAtiva(visaoAtiva === 'conexao' ? 'simulador' : 'conexao')}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-emerald-500/30 px-4 py-3.5 text-xs font-black uppercase tracking-wider text-emerald-300 transition cursor-pointer"
              >
                <Camera size={14} />
                {visaoAtiva === 'conexao' ? 'Voltar ao Simulador 24h' : 'Como Funciona a Ativação Oficial'}
              </button>
            </div>
          </div>

          {/* Coluna Direita: Mockup de Celular Moderno (WhatsApp às 02:14 da manhã) */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-[340px] rounded-[2.8rem] border-[6px] border-slate-800 bg-[#075E54] shadow-2xl overflow-hidden shadow-emerald-950/50">
              {/* Notch */}
              <div className="absolute left-1/2 top-0 z-30 h-5 w-32 -translate-x-1/2 rounded-b-xl bg-slate-900 flex items-center justify-center">
                <div className="h-2 w-12 rounded-full bg-slate-800/80" />
              </div>

              {/* Top Bar WhatsApp */}
              <div className="relative z-20 flex items-center justify-between bg-[#075E54] px-4 pt-6 pb-2.5 text-white">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full overflow-hidden border border-white/30 bg-emerald-800">
                    <img src="/images/avatar-polen.png" alt="Pólen" className="h-full w-full object-cover" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white leading-tight" style={{ color: '#ffffff' }}>
                      IA Pólen · Imobiliária
                    </h4>
                    <span className="text-[9.5px] text-emerald-200 block">online às {cenario.horario}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-white/80">
                  <Video size={14} />
                  <Phone size={14} />
                  <MoreVertical size={14} />
                </div>
              </div>

              {/* Tela de Conversa do WhatsApp */}
              <div
                className="h-[430px] overflow-y-auto p-3 space-y-3"
                style={{
                  backgroundColor: '#0c1317',
                  backgroundImage:
                    'radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.05) 0%, transparent 80%)',
                }}
              >
                <div className="text-center my-1">
                  <span className="px-2.5 py-0.5 rounded-md bg-[#182229] text-[9.5px] font-bold text-slate-400">
                    Hoje · {cenario.horario} (Madrugada)
                  </span>
                </div>

                {cenario.mensagens.map((msg) => {
                  const ehCliente = msg.autor === 'cliente';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${ehCliente ? 'items-end' : 'items-start'} space-y-1`}
                    >
                      <div
                        className={`max-w-[88%] rounded-2xl p-2.5 text-[11px] leading-relaxed shadow-sm ${
                          ehCliente
                            ? 'bg-[#005c4b] text-white rounded-tr-none'
                            : 'bg-[#202c33] text-slate-100 rounded-tl-none border border-slate-700/40'
                        }`}
                      >
                        {!ehCliente && (
                          <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-[#10b981] mb-1">
                            <Sparkles size={10} /> IA Pólen 24h
                          </div>
                        )}

                        <p className="whitespace-pre-line" style={ehCliente ? { color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' } : undefined}>{msg.texto}</p>

                        {/* Card do Imóvel anexado na conversa */}
                        {msg.temCard && msg.imovel && (
                          <div className="mt-2 rounded-xl overflow-hidden bg-[#111b21] border border-slate-700/60 p-2 space-y-1.5">
                            <img
                              src={msg.imovel.foto}
                              alt={msg.imovel.titulo}
                              className="h-28 w-full object-cover rounded-lg"
                            />
                            <div>
                              <span className="text-[10px] font-black text-white block">{msg.imovel.titulo}</span>
                              <span className="text-[9px] text-slate-400 block">{msg.imovel.detalhes}</span>
                              <span className="text-[10px] font-black text-emerald-400 block mt-0.5">{msg.imovel.valor}</span>
                              <span className="text-[9px] text-slate-400 block">{msg.imovel.condominio}</span>
                            </div>
                          </div>
                        )}

                        {/* Selo de Visita Agendada */}
                        {msg.seloAgendamento && (
                          <div className="mt-2 rounded-lg bg-emerald-500/20 border border-emerald-400/50 p-2 text-center">
                            <span className="text-[10px] font-black text-emerald-300 flex items-center justify-center gap-1">
                              <CalendarCheck size={12} />
                              {msg.seloAgendamento}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-1 text-[8.5px] mt-1" style={{ color: ehCliente ? '#A7F3D0' : '#94a3b8' }}>
                          <span style={ehCliente ? { color: '#A7F3D0', WebkitTextFillColor: '#A7F3D0' } : undefined}>{msg.hora}</span>
                          <CheckCheck size={11} className={ehCliente ? 'text-emerald-300' : 'text-[#53bdeb]'} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Barra inferior de digitação simulada */}
              <div className="bg-[#202c33] p-2 flex items-center gap-2 border-t border-slate-800">
                <div className="flex-1 rounded-full bg-[#2a3942] px-3 py-1.5 text-[10px] text-slate-400">
                  Resposta automática em 4s...
                </div>
                <div className="h-7 w-7 rounded-full bg-[#00a884] flex items-center justify-center text-slate-950 font-bold">
                  <Play size={10} className="fill-current" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── VISÃO: ATIVAÇÃO OFICIAL PÓS-CONTRATAÇÃO ────────── */}
      {visaoAtiva === 'conexao' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#10b981]" />
              Ativação Oficial da IA Pólen no WhatsApp da sua Imobiliária
            </span>
            <button
              type="button"
              onClick={() => setVisaoAtiva('simulador')}
              className="text-xs text-[#10b981] font-bold hover:underline cursor-pointer"
            >
              ← Voltar ao Simulador de Atendimento
            </button>
          </div>

          <div
            className="rounded-3xl border border-emerald-500/30 p-6 md:p-8 shadow-2xl relative overflow-hidden"
            style={{
              backgroundColor: '#070C12',
              backgroundImage:
                'radial-gradient(900px 300px at 15% 0%, rgba(16, 185, 129, 0.12), transparent 70%), linear-gradient(180deg, #070C12 0%, #04080D 100%)',
              color: '#ffffff',
            }}
          >
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="text-center space-y-2">
                <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider text-[#10b981]">
                  Instalação Assistida & Protegida
                </span>
                <h3 className="text-xl md:text-2xl font-black text-white" style={{ color: '#ffffff' }}>
                  Como funciona a ativação da Pólen no seu número
                </h3>
                <p className="text-xs md:text-sm text-slate-300 leading-relaxed" style={{ color: '#cbd5e1' }}>
                  A Pólen não utiliza extensões amadoras ou robôs que trazem risco de bloqueio. O pareamento é realizado de forma assistida por engenheiros da Express Tech em infraestrutura em nuvem dedicada.
                </p>
              </div>

              {/* 3 Passos da Ativação Oficial */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-[#10b981] font-black text-sm flex items-center justify-center">
                    1
                  </div>
                  <h4 className="text-sm font-black text-white">Solicitação & Regras</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Você solicita a ativação e alinhamos as regras comerciais da sua imobiliária (bairros atendidos, equipe de corretores e horários de plantão).
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/90 border border-emerald-500/30 bg-emerald-950/10 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 font-black text-sm flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    2
                  </div>
                  <h4 className="text-sm font-black text-emerald-300">Pareamento Seguro</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Nossa equipe conecta o número oficial da sua imobiliária em um servidor seguro com IP dedicado e tecnologia anti-bloqueio.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-[#10b981] font-black text-sm flex items-center justify-center">
                    3
                  </div>
                  <h4 className="text-sm font-black text-white">Treinamento & 24H Ativo</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    A Pólen aprende automaticamente todo o seu catálogo de imóveis e passa a responder compradores e agendar visitas no WhatsApp 24 horas por dia.
                  </p>
                </div>
              </div>

              {/* Ações */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={handleQueroPolen}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 px-7 py-4 text-xs font-black uppercase tracking-wider text-slate-950 transition shadow-xl shadow-emerald-500/25 cursor-pointer font-sans"
                >
                  Quero Ativar a Pólen no Meu WhatsApp →
                </button>

                <button
                  type="button"
                  onClick={() => setVisaoAtiva('simulador')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-200 transition cursor-pointer"
                >
                  Testar no Simulador de Atendimento ao Vivo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── VISÃO: GRÁFICO DARK DE CONVERSÃO & SIMULADOR DO COMPRADOR ──────── */}
      {visaoAtiva === 'simulador' && (
        <div className="space-y-8">
          {/* PAINEL ESCURO INTEGRADO: Gráfico de Turnos & Funil */}
          <div
            className="rounded-3xl border border-emerald-500/25 p-6 shadow-2xl space-y-6"
            style={{ backgroundColor: '#070C12', color: '#ffffff' }}
          >
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#10b981] flex items-center gap-1.5">
                  <TrendingUp size={12} /> Desempenho Operacional 24 Horas
                </span>
                <h3 className="text-base md:text-lg font-black text-white mt-1" style={{ color: '#ffffff' }}>
                  Atendimentos por Turno & Esteira Comercial
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs font-black text-amber-300">
                  🔥 {metricas.pctForaComercial}% dos leads atendidos fora do horário comercial
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Coluna 1: Distribuição por Turno em barras escuras estilizadas */}
              <div className="lg:col-span-7 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2" style={{ color: '#cbd5e1' }}>
                  <Clock size={14} className="text-[#10b981]" />
                  Volume de Atendimento por Horário
                </h4>
                <div className="space-y-3">
                  {metricas.turnos.map((t) => {
                    const IconeTurno = t.icone;
                    return (
                      <div
                        key={t.id}
                        className="space-y-1.5 p-3.5 rounded-2xl border border-slate-800"
                        style={{ backgroundColor: '#0A0F17' }}
                      >
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-200 font-bold flex items-center gap-2">
                            <IconeTurno size={14} className={t.destaque ? 'text-amber-400' : 'text-emerald-400'} />
                            {t.nome}
                          </span>
                          <span className={`font-black ${t.destaque ? 'text-amber-300' : 'text-emerald-400'}`}>
                            {t.pct}% {t.destaque && '★ Madrugada'}
                          </span>
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-slate-800/80 overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${t.cor} transition-all duration-700`}
                            style={{ width: `${t.pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Coluna 2: Funil Comercial da Pólen */}
              <div
                className="lg:col-span-5 flex flex-col justify-between p-5 rounded-2xl border border-emerald-500/20"
                style={{ backgroundColor: '#091018' }}
              >
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2" style={{ color: '#cbd5e1' }}>
                    <CalendarCheck size={14} className="text-[#10b981]" />
                    Funil da Esteira Comercial no WhatsApp
                  </h4>

                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Users size={16} className="text-slate-400" />
                        <span className="text-xs font-bold text-slate-300">Mensagens Recebidas</span>
                      </div>
                      <span className="text-sm font-black text-white">{metricas.totalLeads}</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 size={16} className="text-[#10b981]" />
                        <span className="text-xs font-bold text-slate-200">Interessados Qualificados</span>
                      </div>
                      <span className="text-sm font-black text-[#10b981]">{metricas.qualificados} <span className="text-[10px] text-slate-400 font-normal">(69%)</span></span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-400/40 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <CalendarCheck size={16} className="text-emerald-300" />
                        <span className="text-xs font-bold text-emerald-200">Visitas Agendadas</span>
                      </div>
                      <span className="text-sm font-black text-emerald-300">{metricas.agendadas} <span className="text-[10px] text-emerald-400/80 font-normal">(25%)</span></span>
                    </div>
                  </div>
                </div>

                <p className="mt-4 text-[11px] text-slate-400 leading-relaxed border-t border-slate-800 pt-3">
                  A Pólen filtra compradores descompromissados e entrega para sua equipe apenas quem tem perfil e horário confirmado para visita.
                </p>
              </div>
            </div>
          </div>

          {/* SIMULADOR INTERATIVO DO COMPRADOR */}
          <div
            className="rounded-3xl border border-slate-800 p-6 md:p-8 shadow-2xl"
            style={{ backgroundColor: '#070C12', color: '#ffffff' }}
          >
            <div className="mb-6 text-center max-w-xl mx-auto space-y-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider text-[#10b981]">
                Simulação Direta com Catálogo Real
              </span>
              <h3 className="text-xl md:text-2xl font-black text-white" style={{ color: '#ffffff' }}>
                Simulador de Atendimento ao Comprador
              </h3>
              <p className="text-xs text-slate-300" style={{ color: '#cbd5e1' }}>
                Faça perguntas como se fosse um cliente interessado em um imóvel. A Pólen responde com base no seu catálogo de imóveis e conduz até a visita agendada.
              </p>
            </div>

            <SimuladorPolen
              catalogoImoveis={catalogoImoveis}
              nomeImobiliaria={dadosOficina?.nome || 'Sua Imobiliária'}
              nomeCorretor={dadosOficina?.nomeResponsavel || 'Corretor'}
              liberado={liberado}
              onAbrirPlanos={onAbrirPlanos}
              onAbrirCaptacao={onAbrirCaptacao}
            />
          </div>
        </div>
      )}

      {onAbrirCopiloto && (
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={onAbrirCopiloto}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.02] px-3.5 py-1.5 text-[10.5px] font-bold text-slate-400 transition-all hover:text-white"
          >
            <Zap size={12} />
            Abrir Hermes Copiloto
          </button>
        </div>
      )}
    </div>
  );
}
