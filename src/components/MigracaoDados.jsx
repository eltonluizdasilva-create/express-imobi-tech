import React, { useState } from 'react';
import { 
  UploadCloud, 
  Zap, 
  FileText, 
  ShieldCheck, 
  Sparkles, 
  BrainCircuit, 
  Search, 
  DollarSign, 
  AlertTriangle,
  CheckCircle2,
  Lock,
  TrendingUp,
  History,
  Clock
} from 'lucide-react';

export default function MigracaoDados({ dadosOficina, setAbaAtiva }) {
  const [showActivationModal, setShowActivationModal] = useState(false);
  const isPremium = dadosOficina?.planoAssinante === true || dadosOficina?.plano === 'premium' || dadosOficina?.papel === 'master';

  const handleActivationClick = () => {
    setShowActivationModal(true);
  };

  return (
    <div className="w-full min-h-screen bg-[#09090b] text-white p-4 md:p-8 lg:p-12 font-sans animate-in fade-in duration-500 selection:bg-amber-500/30">
      
      {/* Header Reestilizado (Vibe Riqueza/Ouro) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div className="relative">
          <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-1 h-20 bg-gradient-to-b from-amber-500 to-transparent rounded-full blur-sm hidden md:block"></div>
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-amber-500/10 text-amber-400 text-[10px] font-black px-3 py-1.5 rounded-full border border-amber-500/20 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles size={10} /> Exclusivo Premium
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-white via-amber-100 to-amber-400 bg-clip-text text-transparent tracking-tight leading-tight uppercase">
            Inteligência de <br className="md:hidden" /> <span className="text-amber-500 italic">Dados Antigos</span>
          </h1>
          <p className="text-zinc-500 mt-3 text-sm md:text-base max-w-xl font-medium">
            Transforme o seu arquivo morto em uma máquina geradora de vendas recorrentes com o poder da Inteligência Artificial.
          </p>
        </div>
      </div>

      {/* Banner de Ativação Premium com Novo Design Dourado/Laranja */}
      {!isPremium && (
        <div className="relative overflow-hidden mb-12 rounded-[2.5rem] border border-amber-500/30 bg-gradient-to-br from-amber-950/40 via-zinc-950 to-black shadow-[0_30px_60px_-12px_rgba(217,119,6,0.15)]">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 blur-[120px] rounded-full -mr-20 -mt-20"></div>
          <div className="relative p-8 md:p-12 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="flex items-start gap-6 max-w-3xl">
              <div className="hidden md:flex w-20 h-20 shrink-0 bg-gradient-to-br from-amber-500/20 to-orange-500/10 rounded-3xl items-center justify-center border border-amber-500/30 text-amber-400 shadow-[0_0_30px_rgba(217,119,6,0.3)]">
                <TrendingUp size={40} />
              </div>
              <div>
                <h3 className="text-amber-500 font-black tracking-widest uppercase text-[10px] mb-3 flex items-center gap-2">
                  <Lock size={12} /> ESTE RECURSO É O MOTOR DE CRESCIMENTO DA OFICINA
                </h3>
                <h2 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tight uppercase">
                  💎 Ative a Máquina de Vendas
                </h2>
                <p className="text-zinc-400 text-base md:text-lg leading-relaxed">
                  Não comece do zero! Assinantes ativos importam todo o histórico e deixam a nossa IA caçar <strong className="text-amber-200">orçamentos perdidos</strong> no passado para vender hoje.
                </p>
              </div>
            </div>
            <button 
              onClick={handleActivationClick}
              className="group relative w-full lg:w-auto px-10 py-6 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-black text-lg rounded-2xl transition-all shadow-[0_15px_40px_rgba(217,119,6,0.4)] hover:shadow-[0_20px_50px_rgba(217,119,6,0.6)] hover:-translate-y-1 flex items-center justify-center gap-3 active:translate-y-0"
            >
              <Zap size={22} className="fill-black" />
              ATIVE AGORA EM MEU PLANO
            </button>
          </div>
        </div>
      )}

      {isPremium && (
        <div className="mb-12 rounded-3xl border border-green-500/20 bg-green-950/10 p-6 flex items-center gap-4 shadow-[0_0_30px_rgba(34,197,94,0.05)]">
          <div className="bg-green-500/20 p-3 rounded-2xl text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <h3 className="text-green-400 font-black text-lg tracking-tight uppercase">Módulo Liberado</h3>
            <p className="text-zinc-500 text-sm font-medium">Você possui passe livre para transformar seu histórico em dinheiro.</p>
          </div>
        </div>
      )}

      {/* Grid Split com Textos Explicativos Reforçados */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        
        {/* Esquerda: Ação principal de Upload */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          
          {/* NOVO CARD DE UPLOAD - Mais Minimalista e Robusto */}
          <div className={`group relative rounded-[3rem] border-2 border-dashed ${isPremium ? 'border-zinc-800 hover:border-amber-500/50 bg-zinc-900/30 cursor-pointer' : 'border-zinc-900 bg-zinc-950 cursor-not-allowed'} transition-all duration-500 h-[350px] flex flex-col items-center justify-center overflow-hidden`}
               onClick={() => !isPremium && handleActivationClick()}>
            
            {isPremium && <div className="absolute inset-0 bg-amber-500/0 group-hover:bg-amber-500/[0.02] transition-all duration-500 pointer-events-none"></div>}
            
            {!isPremium && (
              <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-[4px] z-10 flex flex-col items-center justify-center">
                 <div className="bg-zinc-900 p-4 rounded-full mb-4 border border-zinc-800">
                    <Lock className="text-zinc-600" size={30} />
                 </div>
                 <span className="text-zinc-400 font-black uppercase tracking-widest text-[10px]">Área Restrita a Assinantes</span>
              </div>
            )}
            
            <div className="relative z-10 flex flex-col items-center text-center p-8">
              <div className={`w-24 h-24 rounded-full ${isPremium ? 'bg-zinc-900 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-black text-amber-500 border-zinc-800' : 'bg-zinc-900 text-zinc-600 border-transparent'} border flex items-center justify-center mb-6 transition-all duration-500 shadow-2xl`}>
                <UploadCloud size={44} strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-black text-white mb-2 tracking-tight uppercase">Suba sua Base Antiga</h3>
              <p className="text-zinc-500 text-sm max-w-xs font-medium">
                Suporta backups em <span className="text-zinc-300 font-bold">Excel (.xlsx), CSV ou Zip</span> extraídos de qualquer sistema do mercado.
              </p>
              
              <div className={`mt-8 px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border ${isPremium ? 'bg-white text-black border-white hover:bg-zinc-200' : 'bg-zinc-900 text-zinc-700 border-zinc-800'} transition-all shadow-lg flex items-center gap-2`}>
                 Escolher Arquivo <Zap size={12} className="fill-current" />
              </div>
            </div>
          </div>

          {/* AVISO DE COMO FUNCIONA - Textos Explicando "O que ela faz" */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#0c0c0c] border border-zinc-900 rounded-3xl p-6 hover:border-zinc-800 transition-all">
              <div className="text-amber-500 mb-4"><FileText size={24} /></div>
              <h4 className="text-white font-black text-sm uppercase mb-2">1. Leitura Profunda</h4>
              <p className="text-zinc-500 text-xs leading-relaxed font-medium">
                Nossa IA escaneia suas planilhas em segundos. Ela detecta sozinha onde estão nomes, telefones, veículos e o que foi feito no passado.
              </p>
            </div>
            <div className="bg-[#0c0c0c] border border-zinc-900 rounded-3xl p-6 hover:border-zinc-800 transition-all">
              <div className="text-orange-500 mb-4"><BrainCircuit size={24} /></div>
              <h4 className="text-white font-black text-sm uppercase mb-2">2. Limpeza & Cura</h4>
              <p className="text-zinc-500 text-xs leading-relaxed font-medium">
                Adeus cadastros duplicados! O sistema limpa CPFs inválidos e padroniza o WhatsApp para garantir que suas mensagens cheguem sem erros.
              </p>
            </div>
            <div className="bg-[#0c0c0c] border border-zinc-900 rounded-3xl p-6 hover:border-zinc-800 transition-all">
              <div className="text-emerald-500 mb-4"><History size={24} /></div>
              <h4 className="text-white font-black text-sm uppercase mb-2">3. Reativação</h4>
              <p className="text-zinc-500 text-xs leading-relaxed font-medium">
                A mágica acontece aqui: o histórico vira lembrete. Quem trocou óleo há 6 meses será avisado automaticamente para voltar!
              </p>
            </div>
          </div>

        </div>

        {/* Direita: Métrica de Valor e Copy Explicativo reforçado */}
        <div className="lg:col-span-5 space-y-6 flex flex-col">
          
          {/* Card do Saldo de Riqueza - Destaque Maior e Melhor Explicado */}
          <div className="bg-gradient-to-br from-[#0f0f0c] to-[#090909] rounded-[2.5rem] p-10 border border-amber-500/20 relative overflow-hidden shadow-2xl flex-shrink-0">
            <div className="absolute -top-20 -right-20 w-48 h-48 bg-emerald-500/10 blur-[60px] rounded-full"></div>
            
            <div className="relative z-10 text-center">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 flex items-center justify-center text-emerald-400 mx-auto mb-6 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)] rotate-3">
                <DollarSign size={40} />
              </div>
              
              <h3 className="text-zinc-400 font-black text-[10px] mb-3 uppercase tracking-[0.2em]">Potencial de Faturamento Oculto</h3>
              <div className="flex flex-col items-center justify-center">
                 <span className="text-5xl font-black text-white tracking-tight drop-shadow-[0_0_25px_rgba(255,255,255,0.1)] mb-1">R$ 0,00</span>
                 <span className="text-emerald-500 text-[9px] font-black tracking-widest uppercase flex items-center gap-1 bg-emerald-500/10 px-3 py-1 rounded-full">
                    <TrendingUp size={10} /> Pronto para recuperar
                 </span>
              </div>

              <div className="w-full bg-zinc-900 h-2 rounded-full mt-8 overflow-hidden border border-zinc-800 p-[2px]">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 w-[10%] h-full rounded-full"></div>
              </div>
              <p className="text-zinc-600 text-[10px] mt-4 italic font-medium max-w-xs mx-auto">
                Esta barra cresce à medida que importamos seus serviços antigos e calculamos os retornos previstos.
              </p>
            </div>
          </div>

          {/* Card explicativo "Por que isso dá dinheiro?" */}
          <div className="flex-1 bg-[#0c0c0c] border border-zinc-900 rounded-[2.5rem] p-8 flex flex-col relative overflow-hidden">
             <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-30"></div>
             
             <h3 className="text-xl font-black text-amber-200 mb-6 flex items-center gap-3 tracking-tight uppercase">
                <Zap className="text-amber-500" size={20} /> A Mina de Ouro dos Dados
             </h3>
             
             <div className="space-y-6">
                <div className="flex gap-4 group">
                   <div className="shrink-0 w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-400 group-hover:border-amber-500/50 transition-colors">
                      <Search size={18} />
                   </div>
                   <div>
                      <h4 className="text-white font-bold text-sm mb-1">Identificação de "Dorminhocos"</h4>
                      <p className="text-zinc-500 text-xs leading-relaxed">
                        Localizamos clientes que costumavam gastar muito e não aparecem há mais de 6 meses. O sistema sugere uma mensagem personalizada para trazê-los de volta.
                      </p>
                   </div>
                </div>

                <div className="flex gap-4 group">
                   <div className="shrink-0 w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-orange-400 group-hover:border-orange-500/50 transition-colors">
                      <Clock size={18} />
                   </div>
                   <div>
                      <h4 className="text-white font-bold text-sm mb-1">Manutenção Preventiva Preditiva</h4>
                      <p className="text-zinc-500 text-xs leading-relaxed">
                         A IA lê o que foi feito na última OS importada (ex: Troca de Óleo 10W40) e agenda no futuro a data exata da próxima troca, avisando o cliente.
                      </p>
                   </div>
                </div>

                <div className="flex gap-4 group">
                   <div className="shrink-0 w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-green-400 group-hover:border-green-500/50 transition-colors">
                      <TrendingUp size={18} />
                   </div>
                   <div>
                      <h4 className="text-white font-bold text-sm mb-1">Faturamento Imediato</h4>
                      <p className="text-zinc-500 text-xs leading-relaxed">
                         Transforme 1.000 clientes antigos que você "perdeu contato" em 1.000 novas oportunidades de abrir ordens de serviço ainda hoje.
                      </p>
                   </div>
                </div>
             </div>
          </div>

        </div>
      </div>

      {/* Footer de Segurança LGPD */}
      <div className="flex items-center justify-center py-6 border-t border-zinc-900/50 gap-3 text-zinc-600">
        <ShieldCheck size={18} className="text-zinc-700" />
        <span className="text-xs font-medium tracking-wide">Segurança Bancária: Dados Criptografados e 100% Protegidos Seguindo LGPD</span>
      </div>

      {/* Modal de Upgrade Modernizado com o Novo Tema Amber */}
      {showActivationModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowActivationModal(false)}></div>
          <div className="relative w-full max-w-md bg-zinc-950 rounded-[2.5rem] border border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500"></div>
            
            <div className="p-10 text-center pt-12">
              <div className="w-20 h-20 rounded-[2rem] bg-amber-500/20 flex items-center justify-center mx-auto mb-6 border border-amber-500/30 text-amber-400 shadow-[0_0_40px_rgba(245,158,11,0.2)]">
                {isPremium ? <CheckCircle2 size={36} /> : <Sparkles size={36} />}
              </div>
              
              {isPremium ? (
                <>
                  <h2 className="text-2xl font-black text-white mb-2 tracking-tight uppercase">Sucesso Total!</h2>
                  <p className="text-zinc-400 mb-8 text-sm leading-relaxed font-medium">Parabéns! Seu ecossistema Premium está liberado. O motor de dados já está pronto para acelerar seu faturamento.</p>
                  <button 
                    onClick={() => setShowActivationModal(false)}
                    className="w-full bg-white text-black font-black py-5 rounded-2xl transition-all uppercase tracking-widest text-xs shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Começar a Usar
                  </button>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-black text-white mb-2 tracking-tight uppercase">Liberar Inteligência</h2>
                  <p className="text-zinc-500 mb-8 text-sm font-medium leading-relaxed">A migração inteligente é exclusiva do Plano Premium. Dê vida aos seus dados antigos agora!</p>
                  
                  <div className="bg-[#0c0c0c] border border-zinc-800 rounded-3xl p-6 mb-8 flex items-center justify-between shadow-inner relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/[0.03] to-transparent"></div>
                    <div className="text-left relative z-10">
                      <span className="text-[9px] font-black text-amber-500 uppercase tracking-[0.2em] mb-1 block">PREMIUM ANUAL</span>
                      <p className="text-white font-black text-lg uppercase tracking-tight">Acesso Total</p>
                    </div>
                    <div className="text-right relative z-10">
                      <span className="text-zinc-600 line-through text-[10px] font-bold">R$ 197,00</span>
                      <p className="text-white font-black text-2xl flex items-baseline justify-end gap-1 leading-none">
                         <span className="text-xs font-medium text-zinc-500">R$</span> 97<span className="text-[10px] font-medium text-zinc-500">/mês</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <button 
                      onClick={() => {
                        setShowActivationModal(false);
                        setAbaAtiva('meuplano');
                      }}
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-black py-5 rounded-2xl transition-all shadow-[0_15px_30px_rgba(217,119,6,0.3)] uppercase tracking-widest text-xs"
                    >
                      💎 MUDAR DE PLANO AGORA
                    </button>
                    <button 
                      onClick={() => setShowActivationModal(false)}
                      className="w-full bg-transparent text-zinc-600 hover:text-zinc-400 font-black py-2 rounded-xl transition-all text-[10px] uppercase tracking-widest"
                    >
                      Talvez mais tarde
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
