/* eslint-disable react/prop-types */
import React from 'react';
import { 
  LayoutDashboard, Package, DollarSign, CheckSquare, Building, Users,
  History, ShieldCheck, Settings, UserCheck, Megaphone, Wrench,
  User, Lock, ShoppingCart, Tag, RotateCcw, AlertTriangle, FileText, Database,
  Bot, PhoneCall, UserX, Calculator, Award, Youtube
} from 'lucide-react';

export default function MenuNavegacao({
  abaAtiva,
  setAbaAtiva,
  papelLogado,
  isTrial,
  MAIN = '#10b981',
  modoPainel = 'completo'
}) {
  const modulosEssenciais = [
    { id: 'dashboard', label: 'VISÃO GERAL', icon: LayoutDashboard },
    { id: 'estoque', label: 'ESTOQUE', icon: Package },
    { id: 'financeiro', label: 'FINANCEIRO', icon: DollarSign },
    { id: 'tarefa', label: 'TAREFA', icon: CheckSquare },
    { id: 'patrimonio', label: 'PATRIMÔNIO', icon: Building },
    { id: 'fornecedores', label: 'FORNECEDORES', icon: Users },
    { id: 'meuplano', label: 'MEU PLANO (10 DIAS GRÁTIS)', icon: ShieldCheck },
    { id: 'config', label: 'AJUSTES', icon: Settings },
    { id: 'equipe', label: 'EQUIPE', icon: UserCheck },
    { id: 'especialista', label: 'ESPECIALISTA', icon: Wrench },
  ];

  // Degrau 2 — Essencial Plus (R$ 39,90)
  const modulosEssencialPlus = [
    { id: 'historico', label: 'PROPOSTAS & NEGÓCIOS', icon: History },
    { id: 'marketing', label: 'META ADS & CRIATIVOS', icon: Megaphone },
  ];

  const modulosAssinantes = [
    { id: 'clientes', label: 'CLIENTES', icon: User },
    { id: 'fechamento_caixa', label: 'FECHAMENTO DE CAIXA', icon: Lock },
    { id: 'pagamentos_equipe', label: 'GESTÃO DE EQUIPE/PAGAMENTOS', icon: Users },
    { id: 'precificacao', label: 'PRECIFICAÇÃO', icon: Tag },
    { id: 'revisao', label: 'REVISÃO', icon: RotateCcw },
    { id: 'desmanche', label: 'DESMANCHE', icon: AlertTriangle },
    { id: 'notafiscal', label: 'NOTA FISCAL', icon: FileText },
    { id: 'migracao', label: 'MIGRAÇÃO DE DADOS', icon: Database },
  ];

  const modulosIA = [
    { id: 'copiloto', label: 'COPILOTO', icon: Bot },
    { id: 'secretaria', label: 'SECRETÁRIA', icon: PhoneCall },
    { id: 'administrador', label: 'ADMINISTRADOR', icon: UserX },
    { id: 'contador', label: 'ASSIST. FISCAL', icon: Calculator },
    { id: 'retorno', label: 'RETORNO', icon: RotateCcw },
    { id: 'estrategia', label: 'ESTRATÉGIA', icon: Award },
    { id: 'youtube', label: 'YOUTUBE AGENT', icon: Youtube },
  ];

  const renderItem = (item, tierColor) => {
    const Icon = item.icon;
    const ativo = abaAtiva === item.id;

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => setAbaAtiva(item.id)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wider transition-all whitespace-nowrap border ${
          ativo
            ? 'bg-[#10b981] text-white shadow-md scale-[1.02]'
            : 'bg-[#020408] text-zinc-400 hover:text-white hover:border-[#10b981]'
        }`}
        style={{
          backgroundColor: ativo ? '#10b981' : '#020408',
          borderColor: ativo ? '#10b981' : `${tierColor}40`,
        }}
      >
        <Icon size={12} style={{ color: ativo ? '#fff' : '#10b981' }} />
        <span>{item.label}</span>
      </button>
    );
  };

  return (
    <nav style={{ backgroundColor: '#020408' }} className="w-full bg-[#020408] border-b border-zinc-800/80 p-3 flex flex-col gap-3 backdrop-blur-md">
      {/* 1. MÓDULOS ESSENCIAIS (SEMPRE VISÍVEIS) */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[9px] font-black tracking-widest uppercase text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            MÓDULOS ESSENCIAIS {modoPainel === 'lite' ? '(MODO LITE ATIVO)' : '(GRÁTIS - APENAS 100 VAGAS)'}
          </div>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {modulosEssenciais.map((item) => renderItem(item, '#10b981'))}
        </div>
      </div>

      {/* 2 E 3. MÓDULOS EXTRAS (SÓ APARECEM NO MODO COMPLETO) */}
      {modoPainel === 'completo' && (
        <>
          {/* ESSENCIAL PLUS */}
          <div className="flex flex-col gap-1.5 pt-2 border-t border-zinc-900">
            <div className="flex items-center gap-1.5 text-[9px] font-black tracking-widest uppercase text-teal-300">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
              ESSENCIAL PLUS · R$ 39,90
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              {modulosEssencialPlus.map((item) => renderItem(item, '#2dd4bf'))}
            </div>
          </div>

          {/* MÓDULOS ASSINANTES */}
          <div className="flex flex-col gap-1.5 pt-2 border-t border-zinc-900">
            <div className="flex items-center gap-1.5 text-[9px] font-black tracking-widest uppercase text-emerald-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              MÓDULOS ASSINANTES (LEVAM TODOS ESSES + GRÁTIS, ATIVE EM MEU PLANO)
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              {modulosAssinantes.map((item) => renderItem(item, '#10b981'))}
            </div>
          </div>

          {/* INTELIGÊNCIA ARTIFICIAL */}
          <div className="flex flex-col gap-1.5 pt-2 border-t border-zinc-900">
            <div className="flex items-center gap-1.5 text-[9px] font-black tracking-widest uppercase text-purple-400">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              INTELIGÊNCIA ARTIFICIAL (PRO)
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              {modulosIA.map((item) => renderItem(item, '#a855f7'))}
            </div>
          </div>
        </>
      )}
    </nav>
  );
}