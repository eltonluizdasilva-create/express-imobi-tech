/* eslint-disable react/prop-types */
import { COLORS } from './constants';
import { PlusCircle, Zap } from 'lucide-react';

export default function NovaOSBar({ t, tema, MAIN, abaAtiva, setAbaAtiva, listaCarros, irParaNovaOS }) {
  // Filtra as ordens que estão pendentes no banco de dados
  const safeLista = Array.isArray(listaCarros) ? listaCarros : [];
  const pendentes = safeLista.filter(o => {
     const s = (o.statusPagamento || o.status || '').toUpperCase();
     return s === 'PENDENTE' || s === 'ABERTO';
  }).length;
  
  const isActive = abaAtiva === 'os' || abaAtiva === 'lista';
  
  // A lógica solicitada: VERMELHO quando ativo (MAIN), VERDE quando inativo (destaque para ativar)
  const COR_DESTAQUE = isActive ? MAIN : COLORS.GREEN;

  return (
    <div 
      id="nova-os-bar" 
      className="w-full py-6 px-4 flex justify-center items-center bg-transparent select-none"
    >
      <div
        id="tour-botao-nova-os"
        onClick={() => {
          if (irParaNovaOS) {
            irParaNovaOS();
          } else {
            window.dispatchEvent(new CustomEvent('ativarModoFoco'));
            setAbaAtiva('os');
          }
        }}
        className="group relative overflow-hidden cursor-pointer flex items-center gap-4 px-8 py-4 rounded-[2rem] transition-all duration-500 shadow-2xl active:scale-95 border"
        style={{
          background: `linear-gradient(135deg, ${COR_DESTAQUE} 0%, #000000 100%)`,
          borderColor: `${COR_DESTAQUE}66`,
          boxShadow: `0 10px 30px -5px ${COR_DESTAQUE}44`,
        }}
        onMouseEnter={(e) => {
           e.currentTarget.style.background = `linear-gradient(135deg, ${COR_DESTAQUE}, #111111)`;
           e.currentTarget.style.boxShadow = `0 15px 45px -5px ${COR_DESTAQUE}88`;
           e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
           e.currentTarget.style.background = `linear-gradient(135deg, ${COR_DESTAQUE} 0%, #000000 100%)`;
           e.currentTarget.style.boxShadow = `0 10px 30px -5px ${COR_DESTAQUE}44`;
           e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        {/* Shine effect layer */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none" />

        <div 
          className="flex items-center justify-center w-10 h-10 rounded-full text-white transition-transform duration-500 group-hover:rotate-90"
          style={{
            background: `linear-gradient(135deg, ${COR_DESTAQUE}, #000)`,
            boxShadow: `0 0 15px ${COR_DESTAQUE}88`
          }}
        >
           <PlusCircle size={20} className="drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]" />
        </div>

        <div className="flex flex-col items-start">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] opacity-60 transition-opacity group-hover:opacity-100" style={{ color: COR_DESTAQUE }}>
               Painel Operacional
            </span>
            <span className="text-sm md:text-base font-black text-white uppercase italic tracking-tighter flex items-center gap-2">
               Abrir Nova Ordem de Serviço
            </span>
        </div>

        {pendentes > 0 && (
          <div 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black text-white shadow-lg animate-pulse ml-2"
            style={{
               background: COR_DESTAQUE,
               boxShadow: `0 0 20px ${COR_DESTAQUE}aa`
            }}
          >
             <Zap size={10} className="fill-current" />
             <span>{pendentes} PENDENTE{pendentes !== 1 ? 'S' : ''}</span>
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
        .group-hover\\:animate-shimmer {
          animation: shimmer 1s ease-out forwards;
        }
      `}</style>
    </div>
  );
}