import React, { useState } from 'react';
import { Calendar, Clock, Sparkles, CheckCircle2, User, Star } from 'lucide-react';

export default function Especialista({ dadosOficina }) {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedTime, setSelectedTime] = useState(null);

    const abrirWhatsAppEstrategico = (tipo) => {
        if (!selectedTime) return alert('Por favor, selecione primeiro o horário disponível no calendário! 🕒');

        const fone = "5534991439845";
        const nomeOficina = dadosOficina?.nome || "Minha Oficina";
        const dataFormatada = selectedDate.split('-').reverse().join('/');

        let textoMsg = "";

        if (tipo === 'bonus') {
            textoMsg = `Olá! 👋\n\nSou da oficina *${nomeOficina}* e gostaria de resgatar meu *🎁 Bônus de Boas-vindas (Conversa Inicial)*.\n\n📅 *Sugestão de Data:* ${dataFormatada}\n⏰ *Horário:* ${selectedTime}\n\nPodem confirmar o agendamento para mim? Obrigado!`;
        } else {
            textoMsg = `Olá! 👋\n\nTenho interesse na *💎 Consultoria Individual com um dos Engenheiros* da plataforma.\n\n🏢 *Oficina:* ${nomeOficina}\n📅 *Data Solicitada:* ${dataFormatada}\n⏰ *Horário:* ${selectedTime}\n\nPodem me enviar o link de contratação e confirmar a agenda? Fico no aguardo!`;
        }

        const url = `https://wa.me/${fone}?text=${encodeURIComponent(textoMsg)}`;
        window.open(url, '_blank');
    };

    // Fator determinístico para travar horários ocupados por data e não mudar no refresh
    const isSlotSimuladoReservado = (slot, dataStr) => {
        const seed = slot + dataStr;
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
            hash = ((hash << 5) - hash) + seed.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash) % 5 < 2; // Cerca de 40% de chance de vir bloqueado
    };

    const getDiaSemana = (dtString) => {
        // Força meio-dia para não flutuar com Timezone na conversão da string
        const dt = new Date(dtString + 'T12:00:00');
        return dt.getDay(); // 0 = Domingo, 1 = Segunda... 5 = Sexta, 6 = Sábado
    };

    const diaSemana = getDiaSemana(selectedDate);

    // Slots da Manhã (100% Bloqueado como Produção)
    const morningSlots = ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30"];

    // Slots da Tarde (Sexta até 16:00, ou seja, último slot inicia 15:30)
    let afternoonSlots = ["14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"];
    if (diaSemana === 5) {
        afternoonSlots = ["14:00", "14:30", "15:00", "15:30"]; // Sexta reduzida
    }

    // Slots da Noite (Apenas Segunda=1 e Quarta=3)
    const temSlotsNoite = diaSemana === 1 || diaSemana === 3;
    const nightSlots = ["18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30"];

    const renderSlotGrid = (slots, customColor = 'green') => {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {slots.map((slot) => {
                    const estaReservado = isSlotSimuladoReservado(slot, selectedDate);
                    
                    if (estaReservado) {
                        return (
                            <div 
                                key={slot} 
                                className="bg-zinc-900/30 border border-zinc-900 text-zinc-700 rounded-xl py-4 text-center text-xs font-bold cursor-not-allowed flex flex-col items-center justify-center"
                                title="Horário já preenchido"
                            >
                                <span>{slot}</span>
                                <span className="text-[7px] uppercase tracking-widest opacity-40">OCUPADO</span>
                            </div>
                        );
                    }

                    const isActive = selectedTime === slot;
                    const colorClass = customColor === 'purple' 
                        ? (isActive ? 'bg-gradient-to-br from-purple-500 to-pink-600' : 'hover:border-purple-500 hover:text-purple-400 hover:shadow-[0_0_15px_rgba(168,85,247,0.2)]')
                        : (isActive ? 'bg-gradient-to-br from-green-500 to-teal-600' : 'hover:border-green-500 hover:text-green-400 hover:shadow-[0_0_15px_rgba(34,197,94,0.2)]');

                    return (
                        <button 
                            key={slot}
                            onClick={() => setSelectedTime(slot)}
                            className={`border-2 rounded-xl py-4 font-black text-sm transition-all relative group overflow-hidden ${
                                isActive 
                                ? `${colorClass} border-white text-white shadow-[0_0_25px_rgba(255,255,255,0.2)] scale-[1.02]` 
                                : `bg-zinc-950 border-zinc-800 text-zinc-300 ${colorClass}`
                            }`}
                        >
                            {isActive && (
                                <div className="absolute top-1 right-1 text-white">
                                    <CheckCircle2 size={12} />
                                </div>
                            )}
                            {slot}
                        </button>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="min-h-screen text-white font-sans p-4 md:p-8 max-w-6xl mx-auto animate-in fade-in duration-500">
            
            {/* HEADER / HERO */}
            <div className="text-center mb-12 pt-4">
                <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 px-4 py-1.5 rounded-full mb-6 animate-bounce-slow shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                    <Sparkles size={14} className="text-purple-400" />
                    <span className="text-purple-300 text-[10px] font-black uppercase tracking-widest">Área VIP Estratégica</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 uppercase bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
                    Conversa com um <span className="text-green-400 underline decoration-green-500/30 underline-offset-8">Especialista</span> 🛠️
                </h1>
                <p className="text-zinc-400 text-sm md:text-lg max-w-2xl mx-auto font-medium leading-relaxed">
                    "A tecnologia faz o trabalho, mas a estratégia define o lucro. Agende um tempo com quem entende de engenharia de processos."
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* COLUNA ESQUERDA & CENTRAL: O CALENDÁRIO E HORÁRIOS */}
                <div className="lg:col-span-2 space-y-6">
                    
                    <div className="bg-[#0c0c0c] border border-zinc-800 rounded-3xl p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.4)] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/5 blur-[80px] rounded-full -z-10"></div>
                        
                        <div className="flex items-center gap-3 mb-8 border-b border-zinc-900 pb-6">
                            <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center border border-zinc-800 shadow-inner">
                                <Calendar className="text-white" size={20} />
                            </div>
                            <div>
                                <h3 className="text-white font-black uppercase text-lg tracking-tight">Calendário Estratégico</h3>
                                <p className="text-zinc-500 text-xs font-medium">Selecione o dia e horário da sua consultoria</p>
                            </div>
                        </div>

                        <div className="mb-8 flex flex-col md:flex-row md:items-end gap-4">
                            <div className="flex-1">
                                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-2 block">Selecione a Data:</label>
                                <input 
                                    type="date" 
                                    value={selectedDate} 
                                    min={new Date().toISOString().split('T')[0]}
                                    onChange={(e) => {
                                        setSelectedDate(e.target.value);
                                        setSelectedTime(null); // Reseta hora ao trocar data
                                    }}
                                    className="w-full max-w-xs bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white font-bold focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                                    style={{ colorScheme: 'dark' }}
                                />
                            </div>
                            
                            {/* AVISO DE HORÁRIO ESPECIAL */}
                            <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4 flex items-center gap-3 max-w-md md:mb-0.5 shadow-[0_10px_20px_rgba(0,0,0,0.2)]">
                                <div className="bg-purple-500/20 text-purple-400 p-2 rounded-lg">
                                    <Sparkles size={16} />
                                </div>
                                <div>
                                    <p className="text-purple-300 text-[10px] font-black uppercase tracking-widest mb-1">Horários Diferenciados</p>
                                    <p className="text-zinc-400 text-[11px] font-medium leading-relaxed">
                                        Às <strong className="text-white">Segundas e Quartas</strong> atendemos até as <strong className="text-purple-400">22:00</strong> para não parar o seu pátio!
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8">
                            {/* PERÍODO DA MANHÃ (BLOQUEADO SEMPRE) */}
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-zinc-600 font-black text-[11px] uppercase tracking-widest flex items-center gap-2">
                                        <Clock size={14} /> Período da Manhã (08:00 às 12:00)
                                    </h4>
                                    <span className="bg-zinc-800/50 text-zinc-500 px-3 py-1 rounded-full text-[9px] font-black uppercase border border-zinc-800">Reservado / Produção</span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {morningSlots.map((slot) => (
                                        <div 
                                            key={slot} 
                                            className="bg-zinc-900/40 border border-zinc-900 text-zinc-700 rounded-xl py-3 text-center text-xs font-bold cursor-not-allowed grayscale"
                                        >
                                            {slot} <br />
                                            <span className="text-[7px] opacity-40 tracking-widest uppercase">PRODUÇÃO</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* PERÍODO DA TARDE */}
                            {afternoonSlots.length > 0 && (
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-green-400 font-black text-[11px] uppercase tracking-widest flex items-center gap-2">
                                            <Clock size={14} /> Período da Tarde {diaSemana === 5 ? '(Até 16:00)' : '(14:00 às 17:30)'}
                                        </h4>
                                        <span className="bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-[9px] font-black uppercase border border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)] animate-pulse">🔥 Horários Livres</span>
                                    </div>
                                    {renderSlotGrid(afternoonSlots, 'green')}
                                </div>
                            )}

                            {/* PERÍODO NOTURNO (BÔNUS SEG/QUA) */}
                            {temSlotsNoite && (
                                <div className="animate-fade-in border-t border-zinc-900 pt-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-purple-400 font-black text-[11px] uppercase tracking-widest flex items-center gap-2">
                                            <Sparkles size={14} /> Período Noturno (18:00 às 22:00)
                                        </h4>
                                        <span className="bg-purple-500/10 text-purple-400 px-3 py-1 rounded-full text-[9px] font-black uppercase border border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.1)]">🌙 Exclusivo Pós-Expediente</span>
                                    </div>
                                    {renderSlotGrid(nightSlots, 'purple')}
                                </div>
                            )}

                            {/* MENSAGEM FIM DE SEMANA */}
                            {(diaSemana === 0 || diaSemana === 6) && (
                                <div className="text-center bg-zinc-900/20 border border-dashed border-zinc-800 p-8 rounded-2xl">
                                    <p className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-2">Descanso Semanal</p>
                                    <p className="text-zinc-600 text-[10px]">Nossa equipe técnica recarrega as energias no final de semana. Escolha uma data de segunda a sexta.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <p className="text-center text-zinc-500 text-[10px] font-medium uppercase tracking-widest flex items-center justify-center gap-2 pt-4">
                        <span className="w-2 h-2 bg-zinc-700 rounded-full"></span>
                        Conversa com um dos nossos engenheiros
                    </p>

                </div>

                {/* COLUNA DIREITA: CARDS DE AGENDAMENTO */}
                <div className="flex flex-col gap-6">
                    
                    {/* CARD 1: BÔNUS DE BOAS VINDAS */}
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-purple-600 rounded-3xl blur opacity-30 group-hover:opacity-70 transition duration-700"></div>
                        <div className="relative bg-[#080808] border border-white/10 rounded-3xl p-8 h-full flex flex-col shadow-2xl">
                            <div className="bg-green-500/20 w-fit p-3 rounded-2xl text-green-400 mb-6">
                                <Star size={24} />
                            </div>
                            
                            <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2 leading-tight">
                                Resgate sua Conversa Inicial (30 min)
                            </h3>
                            <div className="inline-flex items-center text-[10px] font-black text-green-400 uppercase tracking-widest bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full w-fit mb-6">
                                🎁 Bônus de Boas-vindas
                            </div>
                            
                            <p className="text-zinc-400 text-xs mb-6 leading-relaxed font-medium">
                                Alinhe os primeiros passos, configure seu sistema e aprenda a ler os relatórios vitais da sua oficina.
                            </p>

                            <ul className="space-y-2 mb-8 flex-1">
                                <li className="flex items-center gap-2 text-zinc-300 text-xs">
                                    <CheckCircle2 size={14} className="text-green-500" /> Grátis p/ assinantes ativos
                                </li>
                                <li className="flex items-center gap-2 text-zinc-500 text-[10px] italic">
                                    (Válido apenas 1 vez por Assinatura / Empresa)
                                </li>
                            </ul>

                            <button 
                                onClick={() => abrirWhatsAppEstrategico('bonus')}
                                className="w-full bg-gradient-to-r from-zinc-100 to-zinc-300 hover:from-white hover:to-white text-black font-black uppercase text-xs tracking-widest py-4 rounded-xl shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                RESERVAR MEU BÔNUS
                            </button>
                        </div>
                    </div>

                    {/* CARD 2: CONSULTORIA AVANÇADA */}
                    <div className="bg-[#0c0c0c] border border-zinc-800 rounded-3xl p-8 shadow-xl relative flex flex-col h-full overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 to-pink-600"></div>
                        
                        <div className="bg-purple-500/10 w-fit p-3 rounded-2xl text-purple-400 mb-6 border border-purple-500/20">
                            <User size={24} />
                        </div>

                        <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2 leading-tight">
                            Consultoria Individual com um dos nossos Engenheiros
                        </h3>
                        
                        <div className="mb-6">
                            <span className="text-3xl font-black text-white tracking-tighter">R$ 500</span>
                            <span className="text-zinc-500 text-xs font-bold"> / hora</span>
                        </div>

                        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-4 border-b border-zinc-900 pb-2">Foco de Atuação:</p>
                        <ul className="space-y-3 mb-8 flex-1">
                            <li className="flex gap-3 items-start">
                                <div className="bg-zinc-900 p-1 rounded-md mt-0.5"><CheckCircle2 size={12} className="text-purple-500" /></div>
                                <span className="text-zinc-300 text-xs leading-relaxed font-medium">Automação pesada e otimização de fluxo produtivo (Kanban físico e digital).</span>
                            </li>
                            <li className="flex gap-3 items-start">
                                <div className="bg-zinc-900 p-1 rounded-md mt-0.5"><CheckCircle2 size={12} className="text-purple-500" /></div>
                                <span className="text-zinc-300 text-xs leading-relaxed font-medium">Análise Profunda de Lucratividade e Expansão do Pátio.</span>
                            </li>
                            <li className="flex gap-3 items-start">
                                <div className="bg-zinc-900 p-1 rounded-md mt-0.5"><CheckCircle2 size={12} className="text-purple-500" /></div>
                                <span className="text-zinc-300 text-xs leading-relaxed font-medium">Criação de Campanhas de Marketing & IA aplicadas a vendas.</span>
                            </li>
                        </ul>

                        <button 
                            onClick={() => abrirWhatsAppEstrategico('consultoria')}
                            className="w-full bg-zinc-900 hover:bg-zinc-800 border border-purple-500/40 text-purple-400 hover:text-white font-black uppercase text-xs tracking-widest py-4 rounded-xl transition-all hover:scale-[1.02] shadow-[0_5px_15px_rgba(0,0,0,0.3)] hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]"
                        >
                            CONTRATAR AGORA
                        </button>
                    </div>

                </div>
            </div>

            {/* CSS ADDONS */}
            <style>{`
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
                .animate-bounce-slow {
                    animation: bounce-slow 3s ease-in-out infinite;
                }
            `}</style>

        </div>
    );
}
