import React, { useState, useEffect } from 'react';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  Settings, FileText, History, MousePointer2, LayoutDashboard, Package,
  DollarSign, Users, ClipboardList, Receipt, Landmark, Truck,
  CreditCard, UserPlus, Megaphone, Rocket, HelpCircle, Wrench, Battery,
  Zap, Bike, Car, Hammer, Activity, Cpu, MoveHorizontal, Droplet,
  ShieldCheck, Snowflake, Circle, Scissors, Wind, CloudRain, Sparkles,
  Brain, Briefcase, Shield, Calculator, ShoppingCart, Play, Info, Video,
  MessageCircle
} from 'lucide-react';

const ESTILO_BIBLIOTECA = `
  .container-biblioteca { background: #000; min-height: 100vh; padding: 40px 20px; font-family: sans-serif; color: white; padding-bottom: 100px; }
  .wrapper { max-width: 1100px; margin: 0 auto; }
  
  /* Botão de Suporte no Topo */
  .topo-suporte {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 20px;
  }
  .btn-converse {
    background: #000;
    border: 1px solid #ff3131;
    color: white;
    padding: 12px 25px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 900;
    text-transform: uppercase;
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    transition: 0.3s;
    box-shadow: 0 0 15px rgba(255,49,49,0.2);
  }
  .btn-converse:hover {
    background: #ff3131;
    box-shadow: 0 0 25px rgba(255,49,49,0.4);
    transform: scale(1.05);
  }

  .video-principal { 
    background: linear-gradient(145deg, #111, #050505); 
    border: 1px solid #333; border-radius: 24px; padding: 30px; 
    margin-bottom: 50px; display: flex; align-items: center; gap: 25px;
    box-shadow: 0 10px 40px rgba(255,49,49,0.1);
  }
  
  .item-biblioteca { 
    background: #0d0d0d; border: 1px solid #1a1a1a; border-radius: 16px; 
    padding: 16px; margin-bottom: 12px; display: flex; align-items: flex-start; gap: 15px; 
    transition: 0.2s;
  }
  .item-biblioteca:hover { border-color: #ff3131; background: #111; }
  
  .icone-box { width: 45px; height: 45px; background: #1a1a1a; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .label-nome { width: 170px; font-size: 13px; font-weight: 800; color: #fff; text-transform: uppercase; margin-top: 14px; }
  
  .botao-video { 
    background: #151515; border: 1px solid #222; border-radius: 8px; color: #888;
    padding: 10px 15px; font-size: 11px; font-weight: 700; text-decoration: none;
    display: flex; align-items: center; gap: 8px; min-width: 140px; justify-content: center;
    transition: 0.2s;
  }
  .botao-video.ativo:hover { background: #ff3131; color: white; border-color: #ff3131; }
  .botao-video.inativo { opacity: 0.4; pointer-events: none; }
  
  .box-resumo { background: #080808; border: 1px solid #151515; border-radius: 10px; padding: 12px 18px; color: #777; font-size: 12px; flex: 1 1 300px; line-height: 1.5; }
  .titulo-sessao { color: #ff3131; font-size: 14px; font-weight: 900; margin: 40px 0 15px; display: flex; align-items: center; gap: 10px; text-transform: uppercase; }

  @media (max-width: 768px) { .video-principal { flex-direction: column; } .item-biblioteca { flex-direction: column; } }
`;

export default function BibliotecaTreinamento({ onOpenChat }) {
  const [links, setLinks] = useState({});
  const [textos, setTextos] = useState({});

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const snap = await getDoc(doc(db, "configuracoes_admin", "videos"));
        if (snap.exists()) {
          const data = snap.data();
          setLinks(data.videos || {});
          setTextos(data.resumos || {});
        }
      } catch (error) {
        console.error("Erro ao carregar vídeos:", error);
      }
    };
    fetchConfig();
  }, []);

  const renderBotaoVideo = (link) => (
    link && link.trim() !== ""
      ? <a href={link} target="_blank" rel="noreferrer" className="botao-video ativo"><Video size={14} fill="currentColor" /> Assistir Aula</a>
      : <span className="botao-video inativo"><Video size={14} /> Sem Vídeo</span>
  );

  return (
    <div className="container-biblioteca">
      <style>{ESTILO_BIBLIOTECA}</style>
      <div className="wrapper">

        {/* ── BOTÃO NO TOPO (ACIMA DE TUDO) ── */}
        <div className="topo-suporte">
          <button onClick={onOpenChat} className="btn-converse">
            <MessageCircle size={18} color="#ff3131" /> CONVERSE CONOSCO
          </button>
        </div>

        {/* ── VÍDEO PRINCIPAL ── */}
        <div className="video-principal">
          <div style={{ width: '70px', height: '70px', background: '#ff3131', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(255,49,49,0.4)', flexShrink: 0 }}>
            <Play size={32} color="black" fill="black" />
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '900' }}>DOMINANDO O OFICINA IA</h1>
            <p style={{ margin: '5px 0 0', color: '#888', fontSize: '14px' }}>
              {textos.principal || "Assista ao tour completo e entenda o fluxo de trabalho do sistema."}
            </p>
          </div>
          <a href={links.principal || "#"} target="_blank" rel="noreferrer" className="botao-video ativo" style={{ background: '#ff3131', color: 'white', padding: '15px 30px', width: '180px' }}>
            <Play size={16} fill="white" /> AULA PRINCIPAL
          </a>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' }}>
          <Info size={20} color="#ff3131" />
          <h2 style={{ fontSize: '18px', fontWeight: '900', margin: 0 }}>BIBLIOTECA DE VÍDEOS E RESUMOS</h2>
        </div>

        {/* EXEMPLO DE SESSÃO TÉCNICA (PRESENTE NO SEU ORIGINAL) */}
        <div className="titulo-sessao"><div style={{ width: 4, height: 15, background: '#ff3131' }} /> 1. Operacional</div>
        <div className="item-biblioteca">
          <div className="icone-box"><Wrench size={20} color="#ff3131" /></div>
          <div className="label-nome">🔧 Mecânica</div>
          {renderBotaoVideo(links.mecanica)}
          <div className="box-resumo">{textos.mecanica || "Lançamentos específicos para motor e suspensão."}</div>
        </div>

        {/* Adicione aqui as outras 500 linhas de itens que você já tem... */}

      </div>
    </div>
  );
}