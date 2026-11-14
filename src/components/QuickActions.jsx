/* eslint-disable react/prop-types */
import React, { useState } from 'react';
import {
    Wallet,
    Users,
    Sparkles,
    Mic,
    CheckCircle2,
    Trash2,
    Zap,
    Calendar,
    Clock,
    ExternalLink,
    CheckSquare,
} from 'lucide-react';
import { useGroq } from '../hooks/useGroq';

const TAREFAS_1_CLIQUE_IMOBI = [
    {
        titulo: '📸 Realizar Vistoria de Entrada',
        descricao: 'Fotografar cômodos e gerar laudo com IA antes da entrega.',
        categoria: 'Vistoria',
    },
    {
        titulo: '🔑 Entrega de Chaves ao Cliente',
        descricao: 'Conferir assinatura do contrato e termo de entrega de chaves.',
        categoria: 'Entrega',
    },
    {
        titulo: '📞 Follow-up Lead Quente (WhatsApp)',
        descricao: 'Retornar contato com opções de imóveis filtradas por bairro.',
        categoria: 'CRM / VGV',
    },
    {
        titulo: '🏠 Captar Novo Imóvel na Região',
        descricao: 'Cadastrar fotos, valor de venda/locação e autorização do proprietário.',
        categoria: 'Captação',
    },
    {
        titulo: '📄 Enviar Minuta de Contrato / Proposta',
        descricao: 'Validar documentação das partes e condições de pagamento/FGTS.',
        categoria: 'Jurídico',
    },
    {
        titulo: '📅 Confirmar Visita Presencial Hoje',
        descricao: 'Enviar localização e confirmar presença com cliente e proprietário.',
        categoria: 'Visitas',
    },
];

const PRESETS_FINANCEIRO_IMOBI = [
    { label: '+ Comissão Venda (6%)', tipo: 'entrada', desc: 'Comissão de Intermediação de Venda' },
    { label: '+ Taxa Locação', tipo: 'entrada', desc: 'Taxa de Administração de Locação' },
    { label: '- Tráfego Meta Ads', tipo: 'despesa', desc: 'Investimento em Campanhas Meta Ads' },
    { label: '- Portal Imobiliário', tipo: 'despesa', desc: 'Mensalidade Portal de Anúncios Imobiliários' },
];

const QuickActions = ({
    oficinaId,
    modalTarefaAberto,
    setModalTarefaAberto,
    tarefaRapidaTitulo,
    setTarefaRapidaTitulo,
    tarefaRapidaDesc,
    setTarefaRapidaDesc,
    tarefaRapidaData,
    setTarefaRapidaData,
    tarefaRapidaHora,
    setTarefaRapidaHora,
    salvarTarefaRapida,
    salvandoTarefaRapida,
    tarefasRapidas = [],
    alternarStatusTarefaRapida,
    excluirTarefaRapida,
    feedbackTarefa,
    modalFinanceiroAberto,
    setModalFinanceiroAberto,
    finTipo,
    setFinTipo,
    finDesc,
    setFinDesc,
    finValor,
    setFinValor,
    finPagamento,
    setFinPagamento,
    salvarFinanceiroRapido,
    finSalvando,
    modalClienteAberto,
    setModalClienteAberto,
    leadNome,
    setLeadNome,
    leadTelefone,
    setLeadTelefone,
    leadProblema,
    setLeadProblema,
    salvarLeadRapido,
    leadSalvando,
    ouvirFinDesc,
    finCampoOuvindo,
    ouvirCampoLead,
    leadCampoOuvindo,
    setAbaAtiva,
}) => {
    const { analyzeText } = useGroq(oficinaId);
    const [preenchendoVoz, setPreenchendoVoz] = useState(false);

    const ouvirEPreencherTudo = () => {
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window))
            return alert('Use o Chrome para reconhecimento de voz.');

        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        const rec = new SpeechRec();
        rec.lang = 'pt-BR';

        rec.onstart = () => {
            setPreenchendoVoz('ouvindo');
        };

        rec.onresult = async (e) => {
            const transcricao = e.results[0][0].transcript;
            if (!transcricao.trim()) {
                setPreenchendoVoz(false);
                return;
            }

            setPreenchendoVoz('processando');

            try {
                const prompt = `Aja como um extrator de dados JSON estruturado para um CRM imobiliário. Analise a fala de um corretor de imóveis descrevendo um novo lead/cliente. Retorne SEMPRE e APENAS um objeto JSON no formato:
{
  "nome": "Nome do cliente extraído",
  "telefone": "Apenas os números do telefone com DDD",
  "problema": "Tipo de imóvel buscado, bairro de interesse, compra ou locação e faixa de valor citada"
}

Fala transcrita: "${transcricao}"`;

                const response = await analyzeText(prompt);
                const cleanJson = String(response || '').replace(/```json|```/g, '').trim();
                const parsed = JSON.parse(cleanJson);

                if (parsed.nome) setLeadNome(parsed.nome);
                if (parsed.telefone) setLeadTelefone(parsed.telefone);
                if (parsed.problema) setLeadProblema(parsed.problema);
            } catch (err) {
                console.error('[Voz IA Imobi] Erro:', err);
                alert('Não foi possível decifrar o áudio. Tente falar mais pausadamente.');
            } finally {
                setPreenchendoVoz(false);
            }
        };

        rec.onend = () => {
            setTimeout(() => setPreenchendoVoz((p) => (p === 'ouvindo' ? false : p)), 500);
        };

        rec.start();
    };

    const ouvirERegistrarTarefa = () => {
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window))
            return alert('Use o Chrome para reconhecimento de voz.');

        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        const rec = new SpeechRec();
        rec.lang = 'pt-BR';

        rec.onstart = () => {
            setPreenchendoVoz('ouvindo_tarefa');
        };

        rec.onresult = async (e) => {
            const transcricao = e.results[0][0].transcript;
            if (!transcricao.trim()) {
                setPreenchendoVoz(false);
                return;
            }

            setPreenchendoVoz('processando');

            try {
                const hoje = new Date();
                const hojeIso = hoje.toISOString().split('T')[0];
                const dias = [
                    'domingo',
                    'segunda-feira',
                    'terça-feira',
                    'quarta-feira',
                    'quinta-feira',
                    'sexta-feira',
                    'sábado',
                ];
                const diaSemana = dias[hoje.getDay()];

                const prompt = `Aja como um extrator inteligente para um painel de tarefas imobiliárias. Hoje é dia ${hojeIso} (${diaSemana}). Analise a frase ditada pelo corretor e extraia título, detalhes, data e hora.
Retorne APENAS um objeto JSON estruturado seguindo exatamente este formato:
{
  "titulo": "Resumo da tarefa imobiliária (máx 6 palavras, ex: Vistoria Apto 302 Jardins)",
  "detalhes": "Explicação complementar da tarefa caso exista",
  "data": "AAAA-MM-DD (Se nenhuma data for citada, use ${hojeIso})",
  "hora": "HH:MM (Se não for citada, deixe vazio)"
}

Fala do corretor: "${transcricao}"`;

                const response = await analyzeText(prompt);
                const cleanJson = String(response || '').replace(/```json|```/g, '').trim();
                const parsed = JSON.parse(cleanJson);

                if (parsed.titulo) setTarefaRapidaTitulo(parsed.titulo);
                if (parsed.detalhes) setTarefaRapidaDesc(parsed.detalhes);
                if (parsed.data) setTarefaRapidaData(parsed.data);
                if (parsed.hora) setTarefaRapidaHora(parsed.hora);
            } catch (err) {
                console.error('[Voz Tarefa Imobi] Erro:', err);
                alert('Não consegui capturar os detalhes da tarefa. Fale mais pausadamente.');
            } finally {
                setPreenchendoVoz(false);
            }
        };

        rec.onend = () => {
            setTimeout(() => setPreenchendoVoz((p) => (p === 'ouvindo_tarefa' ? false : p)), 500);
        };

        rec.start();
    };

    return (
        <>
            {/* ✅ MODAL 1: TAREFAS IMOBILIÁRIAS RÁPIDAS (CRIAÇÃO COM 1 CLIQUE + FORMULÁRIO) */}
            {modalTarefaAberto && (
                <div className="fixed inset-0 z-[1000000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div
                        style={{ backgroundColor: '#020408' }}
                        className="w-full max-w-lg rounded-3xl p-6 border border-[#10b981]/40 shadow-[0_20px_60px_rgba(0,0,0,0.85)] relative my-8 max-h-[90vh] overflow-y-auto"
                    >
                        <button
                            type="button"
                            onClick={() => setModalTarefaAberto(false)}
                            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-900 border border-slate-700 text-[#10b981] hover:bg-[#10b981] hover:text-slate-950 flex items-center justify-center font-bold transition cursor-pointer"
                        >
                            ✕
                        </button>

                        <div className="flex items-center gap-2.5 mb-4">
                            <div
                                style={{ backgroundColor: '#10b981' }}
                                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-950"
                            >
                                <CheckSquare size={18} />
                            </div>
                            <div>
                                <h3 className="text-white font-black text-base uppercase tracking-wider">
                                    Tarefas & Compromissos Imobiliários
                                </h3>
                                <p className="text-[11px] text-slate-400">
                                    Crie uma tarefa instantânea com 1 clique ou personalize abaixo.
                                </p>
                            </div>
                        </div>

                        {feedbackTarefa && (
                            <div className="mb-4 px-4 py-2.5 rounded-xl bg-[#10b981]/15 border border-[#10b981] text-[#10b981] text-xs font-extrabold flex items-center gap-2">
                                <CheckCircle2 size={15} />
                                <span>{feedbackTarefa}</span>
                            </div>
                        )}

                        {/* ⚡ SEÇÃO 1: CRIAÇÃO RÁPIDA COM 1 ÚNICO CLIQUE */}
                        <div className="mb-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5">
                            <div className="flex items-center justify-between mb-2.5">
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#10b981] flex items-center gap-1.5">
                                    <Zap size={12} /> Criação Rápida com 1 Clique
                                </span>
                                <span className="text-[10px] text-slate-400">Clique para registar na hora</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {(TAREFAS_1_CLIQUE_IMOBI || [])?.map((preset) => (
                                    <button
                                        key={preset.titulo}
                                        type="button"
                                        disabled={salvandoTarefaRapida}
                                        onClick={() => salvarTarefaRapida(preset)}
                                        className="text-left px-3 py-2.5 rounded-xl bg-[#020408] border border-slate-800 hover:border-[#10b981] hover:bg-[#10b981]/10 transition flex items-center justify-between gap-2 group cursor-pointer"
                                    >
                                        <span className="text-xs font-bold text-slate-200 group-hover:text-white truncate">
                                            {preset.titulo}
                                        </span>
                                        <span
                                            style={{ backgroundColor: '#10b981' }}
                                            className="shrink-0 text-[9px] font-black uppercase px-2 py-0.5 rounded-md text-slate-950"
                                        >
                                            + 1 Clique
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 🧠 SEÇÃO 2: VOZ IA + CADASTRO PERSONALIZADO */}
                        <div className="mb-4">
                            <button
                                type="button"
                                onClick={ouvirERegistrarTarefa}
                                disabled={preenchendoVoz === 'processando'}
                                className={`w-full py-3 rounded-xl border border-[#10b981]/40 bg-[#10b981]/10 text-[#10b981] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer ${
                                    preenchendoVoz === 'ouvindo_tarefa' ? 'animate-pulse ring-2 ring-[#10b981]' : ''
                                }`}
                            >
                                {preenchendoVoz === 'processando' ? (
                                    <>⏳ PROCESSANDO TAREFA IMOBILIÁRIA...</>
                                ) : preenchendoVoz === 'ouvindo_tarefa' ? (
                                    <>🔴 OUVINDO... FALE AGORA</>
                                ) : (
                                    <>
                                        <Sparkles size={14} />
                                        <Mic size={14} />
                                        Ditar Tarefa por Voz (IA)
                                    </>
                                )}
                            </button>
                            <p className="mt-1.5 text-[10px] text-slate-400 text-center">
                                💡 Ex: <i>"Vistoria de entrada no apartamento 302 amanhã às 14h"</i>
                            </p>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                                    Título da Tarefa Imobiliária
                                </label>
                                <input
                                    type="text"
                                    value={tarefaRapidaTitulo}
                                    onChange={(e) => setTarefaRapidaTitulo(e.target.value)}
                                    placeholder="Ex: Vistoria de Saída — Cobertura Jardins"
                                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 focus:border-[#10b981] text-white rounded-xl text-sm outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                                    Observações / Imóvel / Cliente
                                </label>
                                <textarea
                                    value={tarefaRapidaDesc}
                                    onChange={(e) => setTarefaRapidaDesc(e.target.value)}
                                    placeholder="Código do imóvel, nome do proprietário ou detalhes..."
                                    rows={2}
                                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 focus:border-[#10b981] text-white rounded-xl text-sm resize-none outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                                        📅 Data
                                    </label>
                                    <input
                                        type="date"
                                        value={tarefaRapidaData}
                                        onChange={(e) => setTarefaRapidaData(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded-xl text-xs outline-none"
                                        style={{ colorScheme: 'dark' }}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                                        ⏰ Hora
                                    </label>
                                    <input
                                        type="time"
                                        value={tarefaRapidaHora}
                                        onChange={(e) => setTarefaRapidaHora(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded-xl text-xs outline-none"
                                        style={{ colorScheme: 'dark' }}
                                    />
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => salvarTarefaRapida()}
                                disabled={salvandoTarefaRapida || !tarefaRapidaTitulo.trim()}
                                style={{ backgroundColor: '#10b981' }}
                                className="w-full py-3.5 rounded-xl text-slate-950 font-black text-xs uppercase tracking-widest hover:opacity-90 disabled:opacity-40 transition cursor-pointer shadow-lg shadow-[#10b981]/25"
                            >
                                {salvandoTarefaRapida ? 'SALVANDO...' : '+ ADICIONAR TAREFA PERSONALIZADA'}
                            </button>
                        </div>

                        {/* 📋 SEÇÃO 3: LISTA DE TAREFAS RÁPIDAS ATIVAS */}
                        <div className="mt-5 pt-4 border-t border-slate-800">
                            <div className="flex items-center justify-between mb-2.5">
                                <span className="text-[11px] font-black uppercase tracking-wider text-slate-300">
                                    Tarefas Recentes ({(tarefasRapidas || []).length})
                                </span>
                                {setAbaAtiva && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setModalTarefaAberto(false);
                                            setAbaAtiva('tarefa');
                                        }}
                                        className="text-[11px] font-bold text-[#10b981] hover:underline flex items-center gap-1 cursor-pointer"
                                    >
                                        Abrir Vistorias & Tarefas <ExternalLink size={11} />
                                    </button>
                                )}
                            </div>

                            {(tarefasRapidas || []).length === 0 ? (
                                <p className="text-xs text-slate-500 italic py-3 text-center">
                                    Nenhuma tarefa pendente. Clique num botão acima para criar com 1 clique!
                                </p>
                            ) : (
                                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                                    {(tarefasRapidas || []).slice(0, 8)?.map((tar) => {
                                        const concluida = tar.status === 'concluida';
                                        return (
                                            <div
                                                key={tar.id}
                                                className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800"
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        alternarStatusTarefaRapida && alternarStatusTarefaRapida(tar)
                                                    }
                                                    className="flex items-center gap-2.5 text-left flex-1 min-w-0 cursor-pointer"
                                                >
                                                    <span
                                                        style={concluida ? { backgroundColor: '#10b981' } : undefined}
                                                        className={`w-4 h-4 rounded-md flex items-center justify-center border shrink-0 ${
                                                            concluida
                                                                ? 'border-[#10b981] text-slate-950'
                                                                : 'border-slate-600 text-transparent'
                                                        }`}
                                                    >
                                                        ✓
                                                    </span>
                                                    <div className="truncate">
                                                        <p
                                                            className={`text-xs font-bold truncate ${
                                                                concluida ? 'line-through text-slate-500' : 'text-white'
                                                            }`}
                                                        >
                                                            {tar.titulo}
                                                        </p>
                                                        {tar.descricao && (
                                                            <p className="text-[10px] text-slate-400 truncate">
                                                                {tar.descricao}
                                                            </p>
                                                        )}
                                                    </div>
                                                </button>
                                                {excluirTarefaRapida && (
                                                    <button
                                                        type="button"
                                                        onClick={() => excluirTarefaRapida(tar.id)}
                                                        className="text-slate-500 hover:text-emerald-400 p-1 cursor-pointer"
                                                        title="Excluir tarefa"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ✅ MODAL 2: LANÇAMENTO FINANCEIRO & VGV RÁPIDO */}
            {modalFinanceiroAberto && (
                <div className="fixed inset-0 z-[1000000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div
                        style={{ backgroundColor: '#020408' }}
                        className="w-full max-w-md rounded-3xl p-6 border border-[#10b981]/40 shadow-2xl relative"
                    >
                        <button
                            type="button"
                            onClick={() => setModalFinanceiroAberto(false)}
                            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-900 border border-slate-700 text-[#10b981] hover:bg-[#10b981] hover:text-slate-950 flex items-center justify-center font-bold cursor-pointer"
                        >
                            ✕
                        </button>

                        <h3 className="text-white font-black text-base uppercase tracking-wider mb-1 flex items-center gap-2">
                            <Wallet size={18} className="text-[#10b981]" /> Lançamento Rápido — Caixa & VGV
                        </h3>
                        <p className="text-xs text-slate-400 mb-4">
                            Registre comissões de venda, taxas de locação ou despesas da imobiliária.
                        </p>

                        {/* Atalhos 1 clique */}
                        <div className="flex flex-wrap gap-1.5 mb-4">
                            {(PRESETS_FINANCEIRO_IMOBI || [])?.map((p) => (
                                <button
                                    key={p.label}
                                    type="button"
                                    onClick={() => {
                                        setFinTipo(p.tipo);
                                        setFinDesc(p.desc);
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 hover:border-[#10b981] text-[10px] font-bold text-slate-200 hover:text-[#10b981] cursor-pointer transition"
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-4 bg-slate-900 p-1 rounded-xl border border-slate-800">
                            <button
                                type="button"
                                onClick={() => setFinTipo('entrada')}
                                style={finTipo === 'entrada' ? { backgroundColor: '#10b981' } : undefined}
                                className={`py-2.5 rounded-lg font-black text-xs cursor-pointer transition ${
                                    finTipo === 'entrada' ? 'text-slate-950' : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                + COMISSÃO / RECEITA
                            </button>
                            <button
                                type="button"
                                onClick={() => setFinTipo('despesa')}
                                style={
                                    finTipo === 'despesa' || finTipo === 'saida'
                                        ? { backgroundColor: '#10b981' }
                                        : undefined
                                }
                                className={`py-2.5 rounded-lg font-black text-xs cursor-pointer transition ${
                                    finTipo === 'despesa' || finTipo === 'saida'
                                        ? 'text-slate-950'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                - DESPESA / REPASSE
                            </button>
                        </div>

                        <div className="flex gap-2 mb-3">
                            <input
                                type="text"
                                value={finDesc}
                                onChange={(e) => setFinDesc(e.target.value)}
                                placeholder="Ex: Comissão Venda Apto Jardins / Meta Ads"
                                className="flex-1 px-3.5 py-3 bg-slate-900 border border-slate-700 focus:border-[#10b981] text-white rounded-xl text-sm outline-none"
                            />
                            {ouvirFinDesc && (
                                <button
                                    type="button"
                                    onClick={ouvirFinDesc}
                                    className="w-12 bg-slate-900 border border-slate-700 rounded-xl text-white flex items-center justify-center cursor-pointer"
                                >
                                    {finCampoOuvindo ? '🔴' : '🎙️'}
                                </button>
                            )}
                        </div>

                        <div className="relative mb-3">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#10b981] font-black text-sm">
                                R$
                            </span>
                            <input
                                type="text"
                                inputMode="decimal"
                                value={finValor}
                                onChange={(e) => setFinValor(e.target.value)}
                                placeholder="0,00"
                                className="w-full pl-11 pr-4 py-3.5 bg-slate-900 border border-slate-700 focus:border-[#10b981] text-[#10b981] rounded-xl text-2xl font-black outline-none"
                            />
                        </div>

                        <select
                            value={finPagamento}
                            onChange={(e) => setFinPagamento(e.target.value)}
                            className="w-full px-3.5 py-3 bg-slate-900 border border-slate-700 text-white rounded-xl mb-5 text-sm outline-none"
                        >
                            {['PIX', 'Transferência TED/DOC', 'Boleto', 'Cartão', 'Dinheiro'].map((p) => (
                                <option key={p} value={p}>
                                    {p}
                                </option>
                            ))}
                        </select>

                        <button
                            type="button"
                            onClick={() => {
                                if (!finDesc.trim() || !finValor) {
                                    alert('Preencha a descrição e o valor!');
                                    return;
                                }
                                salvarFinanceiroRapido();
                            }}
                            disabled={finSalvando || !finDesc.trim() || !finValor}
                            style={{ backgroundColor: '#10b981' }}
                            className="w-full py-3.5 rounded-xl text-slate-950 font-black text-xs uppercase tracking-widest hover:opacity-90 disabled:opacity-40 transition cursor-pointer shadow-lg shadow-[#10b981]/25"
                        >
                            {finSalvando ? 'SALVANDO...' : '💵 REGISTRAR NO FINANCEIRO'}
                        </button>
                    </div>
                </div>
            )}

            {/* ✅ MODAL 3: NOVO LEAD / CLIENTE IMOBILIÁRIO RÁPIDO */}
            {modalClienteAberto && (
                <div className="fixed inset-0 z-[1000000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div
                        style={{ backgroundColor: '#020408' }}
                        className="w-full max-w-md rounded-3xl p-6 border border-[#10b981]/40 shadow-2xl relative"
                    >
                        <button
                            type="button"
                            onClick={() => setModalClienteAberto(false)}
                            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-900 border border-slate-700 text-[#10b981] hover:bg-[#10b981] hover:text-slate-950 flex items-center justify-center font-bold cursor-pointer"
                        >
                            ✕
                        </button>

                        <h3 className="text-white font-black text-base uppercase tracking-wider mb-1 flex items-center gap-2">
                            <Users size={18} className="text-[#10b981]" /> Novo Lead / Cliente Imobiliário
                        </h3>
                        <p className="text-xs text-slate-400 mb-4">
                            O lead cadastrado entra imediatamente no Funil CRM da imobiliária.
                        </p>

                        <div className="mb-4">
                            <button
                                type="button"
                                onClick={ouvirEPreencherTudo}
                                disabled={preenchendoVoz === 'processando'}
                                className={`w-full py-3 rounded-xl border border-[#10b981]/40 bg-[#10b981]/10 text-[#10b981] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer ${
                                    preenchendoVoz === 'ouvindo' ? 'animate-pulse ring-2 ring-[#10b981]' : ''
                                }`}
                            >
                                {preenchendoVoz === 'processando' ? (
                                    <>⏳ PROCESSANDO ÁUDIO...</>
                                ) : preenchendoVoz === 'ouvindo' ? (
                                    <>🔴 PODE FALAR AGORA...</>
                                ) : (
                                    <>
                                        <Sparkles size={14} />
                                        <Mic size={14} />
                                        Preenchimento Rápido por Voz (IA)
                                    </>
                                )}
                            </button>
                            <p className="mt-1.5 text-[10px] text-slate-400 text-center">
                                💡 Ex: <i>"Cadastrar Mariana, WhatsApp 11 99999-8888, procura cobertura no Jardins"</i>
                            </p>
                        </div>

                        <div className="space-y-3 mb-5">
                            <input
                                type="text"
                                value={leadNome}
                                onChange={(e) => setLeadNome(e.target.value)}
                                placeholder="Nome do Cliente / Comprador *"
                                className="w-full px-3.5 py-3 bg-slate-900 border border-slate-700 focus:border-[#10b981] text-white rounded-xl text-sm outline-none"
                            />

                            <input
                                type="tel"
                                value={leadTelefone}
                                onChange={(e) => setLeadTelefone(e.target.value)}
                                placeholder="WhatsApp com DDD (Ex: 11999998888) *"
                                className="w-full px-3.5 py-3 bg-slate-900 border border-slate-700 focus:border-[#10b981] text-white rounded-xl text-sm outline-none"
                            />

                            <div className="flex gap-2">
                                <textarea
                                    value={leadProblema}
                                    onChange={(e) => setLeadProblema(e.target.value)}
                                    placeholder="Imóvel buscado, Bairro de Interesse, Compra ou Locação..."
                                    rows={3}
                                    className="flex-1 px-3.5 py-3 bg-slate-900 border border-slate-700 focus:border-[#10b981] text-white rounded-xl text-sm resize-none outline-none"
                                />
                                {ouvirCampoLead && (
                                    <button
                                        type="button"
                                        onClick={() => ouvirCampoLead('problema')}
                                        className="w-12 bg-slate-900 border border-slate-700 rounded-xl text-white flex items-center justify-center cursor-pointer"
                                    >
                                        {leadCampoOuvindo === 'problema' ? '🔴' : '🎙️'}
                                    </button>
                                )}
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={salvarLeadRapido}
                            disabled={leadSalvando || (!leadNome.trim() && !leadTelefone.trim())}
                            style={{ backgroundColor: '#10b981' }}
                            className="w-full py-3.5 rounded-xl text-slate-950 font-black text-xs uppercase tracking-widest hover:opacity-90 disabled:opacity-40 transition cursor-pointer shadow-lg shadow-[#10b981]/25"
                        >
                            {leadSalvando ? 'CADASTRANDO...' : '+ CADASTRAR LEAD NO CRM'}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default QuickActions;
