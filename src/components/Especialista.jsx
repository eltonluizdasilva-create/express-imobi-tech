import React, { useState } from 'react';
import HeroAba from './admin/HeroAba';
import { Calendar, Clock, Sparkles, CheckCircle2, User, Star, Building2 } from 'lucide-react';

export default function Especialista({ dadosOficina, dadosImobiliaria }) {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedTime, setSelectedTime] = useState(null);

    const dadosAtivos = dadosImobiliaria || dadosOficina;

    const abrirWhatsAppEstrategico = (tipo) => {
        if (!selectedTime) return alert('Por favor, selecione primeiro o horário disponível no calendário! 🕒');

        const fone = '5534991439845';
        const nomeImobi = dadosAtivos?.nome || 'Minha Imobiliária / Corretor';
        const dataFormatada = selectedDate.split('-').reverse().join('/');

        let textoMsg = '';

        if (tipo === 'bonus') {
            textoMsg = `Olá! 👋\n\nSou da *${nomeImobi}* (Express Imobi Tech) e gostaria de resgatar meu *🎁 Bônus de Boas-vindas (Diagnóstico de VGV & Funil Imobiliário)*.\n\n📅 *Sugestão de Data:* ${dataFormatada}\n⏰ *Horário:* ${selectedTime}\n\nPodem confirmar o agendamento para mim? Obrigado!`;
        } else {
            textoMsg = `Olá! 👋\n\nTenho interesse na *💎 Consultoria Estratégica Imobiliária & Implantação de Agentes IA*.\n\n🏢 *Imobiliária / Corretor:* ${nomeImobi}\n📅 *Data Solicitada:* ${dataFormatada}\n⏰ *Horário:* ${selectedTime}\n\nPodem me enviar os detalhes e confirmar a agenda? Fico no aguardo!`;
        }

        const url = `https://wa.me/${fone}?text=${encodeURIComponent(textoMsg)}`;
        window.open(url, '_blank');
    };

    const isSlotSimuladoReservado = (slot, dataStr) => {
        const seed = slot + dataStr;
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
            hash = (hash << 5) - hash + seed.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash) % 5 < 2;
    };

    const getDiaSemana = (dtString) => {
        const dt = new Date(dtString + 'T12:00:00');
        return dt.getDay();
    };

    const diaSemana = getDiaSemana(selectedDate);

    const morningSlots = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30'];

    let afternoonSlots = ['14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'];
    if (diaSemana === 5) {
        afternoonSlots = ['14:00', '14:30', '15:00', '15:30'];
    }

    const temSlotsNoite = diaSemana === 1 || diaSemana === 3;
    const nightSlots = ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'];

    const renderSlotGrid = (slots) => {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(slots || [])?.map((slot) => {
                    const estaReservado = isSlotSimuladoReservado(slot, selectedDate);

                    if (estaReservado) {
                        return (
                            <div
                                key={slot}
                                className="bg-slate-900/40 border border-slate-900 text-slate-600 rounded-xl py-4 text-center text-xs font-bold cursor-not-allowed flex flex-col items-center justify-center"
                                title="Horário já preenchido"
                            >
                                <span>{slot}</span>
                                <span className="text-[7px] uppercase tracking-widest opacity-40">OCUPADO</span>
                            </div>
                        );
                    }

                    const isActive = selectedTime === slot;

                    return (
                        <button
                            key={slot}
                            type="button"
                            onClick={() => setSelectedTime(slot)}
                            style={isActive ? { backgroundColor: '#10b981', borderColor: '#10b981' } : undefined}
                            className={`border-2 rounded-xl py-4 font-black text-sm transition-all relative group overflow-hidden cursor-pointer ${
                                isActive
                                    ? 'text-slate-950 shadow-[0_0_25px_rgba(16,185,129,0.3)] scale-[1.02]'
                                    : 'bg-[#020408] border-slate-800 text-slate-200 hover:border-[#10b981] hover:text-[#10b981]'
                            }`}
                        >
                            {isActive && (
                                <div className="absolute top-1 right-1 text-slate-950">
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
        <div
            style={{ backgroundColor: '#020408' }}
            className="min-h-screen text-white font-sans p-4 md:p-8 max-w-6xl mx-auto animate-in fade-in duration-500 rounded-3xl"
        >
            <div className="text-center mb-12 pt-4">
                <HeroAba
                    flat
                    icone={Sparkles}
                    chip="Mentoria Executiva Express Imobi Tech"
                    titulo="Suporte com Especialista Imobiliário"
                    subtitulo="Escale seu VGV, estruture a Roleta de Leads da sua equipe e configure o Esquadrão de IA no WhatsApp com acompanhamento especializado."
                    cor="#10b981"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
                        <div className="flex items-center gap-3 mb-8 border-b border-slate-800 pb-6">
                            <div
                                style={{ backgroundColor: '#10b981' }}
                                className="w-12 h-12 rounded-2xl flex items-center justify-center text-slate-950"
                            >
                                <Calendar size={20} />
                            </div>
                            <div>
                                <h3 className="text-white font-black uppercase text-lg tracking-tight">
                                    Agenda de Consultoria Imobiliária
                                </h3>
                                <p className="text-slate-400 text-xs font-medium">
                                    Selecione o dia e horário para alinhar sua operação de VGV e Leads
                                </p>
                            </div>
                        </div>

                        <div className="mb-8 flex flex-col md:flex-row md:items-end gap-4">
                            <div className="flex-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">
                                    Selecione a Data:
                                </label>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    min={new Date().toISOString().split('T')[0]}
                                    onChange={(e) => {
                                        setSelectedDate(e.target.value);
                                        setSelectedTime(null);
                                    }}
                                    className="w-full max-w-xs bg-[#020408] border border-slate-800 rounded-xl p-4 text-white font-bold focus:border-[#10b981] outline-none transition-all"
                                    style={{ colorScheme: 'dark' }}
                                />
                            </div>

                            <div className="bg-[#10b981]/10 border border-[#10b981]/30 rounded-xl p-4 flex items-center gap-3 max-w-md">
                                <div className="bg-[#10b981]/20 text-[#10b981] p-2 rounded-lg">
                                    <Building2 size={16} />
                                </div>
                                <div>
                                    <p className="text-[#10b981] text-[10px] font-black uppercase tracking-widest mb-1">
                                        Plantão Estendido
                                    </p>
                                    <p className="text-slate-300 text-[11px] font-medium leading-relaxed">
                                        Às <strong className="text-white">Segundas e Quartas</strong> atendemos até as{' '}
                                        <strong className="text-[#10b981]">22:00</strong> para não interromper suas visitas e plantões!
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-slate-500 font-black text-[11px] uppercase tracking-widest flex items-center gap-2">
                                        <Clock size={14} /> Período da Manhã (08:00 às 12:00)
                                    </h4>
                                    <span className="bg-slate-800/60 text-slate-400 px-3 py-1 rounded-full text-[9px] font-black uppercase border border-slate-700">
                                        Implantação Interna
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {(morningSlots || [])?.map((slot) => (
                                        <div
                                            key={slot}
                                            className="bg-slate-950/60 border border-slate-900 text-slate-600 rounded-xl py-3 text-center text-xs font-bold cursor-not-allowed"
                                        >
                                            {slot} <br />
                                            <span className="text-[7px] opacity-40 tracking-widest uppercase">INTERNO</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {afternoonSlots.length > 0 && (
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-[#10b981] font-black text-[11px] uppercase tracking-widest flex items-center gap-2">
                                            <Clock size={14} /> Período da Tarde{' '}
                                            {diaSemana === 5 ? '(Até 16:00)' : '(14:00 às 17:30)'}
                                        </h4>
                                        <span className="bg-[#10b981]/15 text-[#10b981] px-3 py-1 rounded-full text-[9px] font-black uppercase border border-[#10b981]/30">
                                            🔥 Horários Livres
                                        </span>
                                    </div>
                                    {renderSlotGrid(afternoonSlots)}
                                </div>
                            )}

                            {temSlotsNoite && (
                                <div className="pt-4 border-t border-slate-800">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-[#10b981] font-black text-[11px] uppercase tracking-widest flex items-center gap-2">
                                            <Sparkles size={14} /> Plantão Noturno (18:00 às 22:00)
                                        </h4>
                                        <span className="bg-[#10b981]/15 text-[#10b981] px-3 py-1 rounded-full text-[9px] font-black uppercase border border-[#10b981]/30">
                                            ✨ Exclusivo Seg & Qua
                                        </span>
                                    </div>
                                    {renderSlotGrid(nightSlots)}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-slate-900/90 border-2 border-[#10b981]/40 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                        <div className="inline-flex items-center gap-1.5 bg-[#10b981]/15 text-[#10b981] px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-4 border border-[#10b981]/30">
                            🎁 Bônus de Onboarding
                        </div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">
                            Diagnóstico Inicial de Funil & VGV
                        </h3>
                        <p className="text-slate-400 text-xs leading-relaxed mb-6">
                            Sessão rápida de 20 minutos para configurar sua Roleta de Leads, cadastrar seus primeiros imóveis e validar o Portal do Cliente.
                        </p>
                        <button
                            type="button"
                            onClick={() => abrirWhatsAppEstrategico('bonus')}
                            style={{ backgroundColor: '#10b981' }}
                            className="w-full py-4 rounded-xl text-slate-950 font-black text-xs uppercase tracking-widest hover:opacity-90 transition cursor-pointer shadow-lg shadow-[#10b981]/25"
                        >
                            Agendar Diagnóstico Grátis
                        </button>
                    </div>

                    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                        <div className="inline-flex items-center gap-1.5 bg-slate-800 text-emerald-300 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-4">
                            <Star size={11} className="text-[#10b981]" /> Implantação VIP
                        </div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">
                            Setup Esquadrão IA & WhatsApp
                        </h3>
                        <p className="text-slate-400 text-xs leading-relaxed mb-6">
                            Acompanhamento individual com nossos especialistas para conectar a Sofia (Triagem 24h), o Hermes Copiloto e a Roleta de Leads na sua imobiliária.
                        </p>
                        <button
                            type="button"
                            onClick={() => abrirWhatsAppEstrategico('vip')}
                            className="w-full py-4 rounded-xl bg-[#020408] border border-[#10b981] text-[#10b981] hover:bg-[#10b981] hover:text-slate-950 font-black text-xs uppercase tracking-widest transition cursor-pointer"
                        >
                            Solicitar Setup Assistido
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
