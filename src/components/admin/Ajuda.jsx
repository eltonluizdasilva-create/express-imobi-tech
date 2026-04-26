import React, { useState, useEffect } from 'react';
import { getDoc, doc } from 'firebase/firestore';
import { db } from "../../lib/firebase";
import {
  Settings, FileText, History, MousePointer2, LayoutDashboard, Package,
  DollarSign, Users, ClipboardList, Receipt, Landmark, Truck,
  CreditCard, UserPlus, Megaphone, Rocket, HelpCircle, Wrench, Battery,
  Zap, Bike, Car, Hammer, Activity, Cpu, MoveHorizontal, Droplet,
  ShieldCheck, Snowflake, Circle, Scissors, Wind, CloudRain, Sparkles,
  Brain, Briefcase, Shield, Calculator, ShoppingCart, Play, Info, Video
} from 'lucide-react';

const ESTILO_BIBLIOTECA = `
  .container-biblioteca { 
    background: #000; min-height: 100vh; padding: 40px 20px; 
    font-family: sans-serif; color: white; padding-bottom: 100px; 
  }
  .wrapper { maxWidth: 1100px; margin: 0 auto; }
  
  .video-principal { 
    background: linear-gradient(145deg, #111, #050505); 
    border: 1px solid #333; border-radius: 24px; padding: 30px; 
    margin-bottom: 50px; display: flex; align-items: center; gap: 25px;
    box-shadow: 0 10px 40px rgba(255,49,49,0.1);
  }
  
  .item-biblioteca { 
    background: #0d0d0d; border: 1px solid #1a1a1a; border-radius: 16px; 
    padding: 16px; margin-bottom: 12px; display: flex; align-items: flex-start; gap: 15px; 
    flex-wrap: wrap;
    transition: 0.2s;
  }
  .item-biblioteca:hover { border-color: #ff3131; background: #111; }
  
  .icone-box { 
    width: 45px; height: 45px; background: #1a1a1a; border-radius: 12px; 
    display: flex; align-items: center; justify-content: center; flex-shrink: 0; 
  }
  .label-nome { 
    width: 170px; font-size: 13px; font-weight: 800; color: #fff; 
    text-transform: uppercase; margin-top: 14px; 
  }
  
  .botao-video { 
    background: #151515; border: 1px solid #222; border-radius: 8px; color: #888;
    padding: 10px 15px; font-size: 11px; font-weight: 700; text-decoration: none;
    display: flex; align-items: center; gap: 8px; min-width: 140px; justify-content: center;
    transition: 0.2s;
    margin-top: 5px;
  }
  .botao-video.ativo { background: #ff3131; color: white; border-color: #ff3131; cursor: pointer; }
  .botao-video.ativo:hover { background: #ff5555; }
  .botao-video.inativo { opacity: 0.4; pointer-events: none; }
  
  .box-resumo { 
    background: #080808; border: 1px solid #151515; border-radius: 10px; 
    padding: 12px 18px; color: #777; font-size: 12px; flex: 1 1 300px; line-height: 1.5; 
    width: 100%; max-width: 100%; box-sizing: border-box;
  }
  
  .titulo-sessao { 
    color: #ff3131; font-size: 14px; font-weight: 900; margin: 40px 0 15px; 
    display: flex; align-items: center; gap: 10px; text-transform: uppercase; 
    letter-spacing: 1px; 
  }

  @media (max-width: 768px) {
    .video-principal {
      flex-direction: column;
      align-items: flex-start;
      gap: 15px;
    }
    .item-biblioteca {
      flex-direction: column;
      align-items: flex-start;
      gap: 15px;
    }
    .label-nome {
      width: 100%;
      margin-top: 0;
    }
    .botao-video {
      width: 100%;
      box-sizing: border-box;
      margin-top: 0;
    }
    .box-resumo {
      width: 100%;
      margin-top: 10px;
    }
  }
`;

export default function BibliotecaTreinamento() {
  const [links, setLinks] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        // Sincroniza com a localização correta do MasterPanel
        const snap = await getDoc(doc(db, "oficinas", "MASTER", "configuracoes", "videos_ajuda"));
        if (snap.exists()) {
          const data = snap.data();
          setLinks(data || {});
          console.log("[Ajuda] Biblioteca sincronizada com MasterPanel:", data);
        } else {
          console.log("[Ajuda] Nenhuma biblioteca de vídeos encontrada no MasterPanel.");
        }
      } catch (error) {
        console.error("Erro ao sincronizar biblioteca com MasterPanel:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const renderBotaoVideo = (link) => {
    if (link && link.trim() !== "") {
      return (
        <a href={link} target="_blank" rel="noreferrer" className="botao-video ativo">
          <Video size={14} fill="currentColor" /> ASSISTIR
        </a>
      );
    }
    return (
      <span className="botao-video inativo">
        <Video size={14} /> EM BREVE
      </span>
    );
  };

  if (loading) {
    return (
      <div className="container-biblioteca">
        <style>{ESTILO_BIBLIOTECA}</style>
        <div className="wrapper" style={{ textAlign: 'center', paddingTop: '100px' }}>
          <p style={{ color: '#888' }}>Carregando biblioteca de vídeos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-biblioteca">
      <style>{ESTILO_BIBLIOTECA}</style>
      <div className="wrapper">

        {/* ── VÍDEO PRINCIPAL ── */}
        <div className="video-principal">
          <div style={{ width: '70px', height: '70px', background: '#ff3131', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(255,49,49,0.4)', flexShrink: 0 }}>
            <Play size={32} color="black" fill="black" />
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '900' }}>DOMINANDO O OFICINA IA</h1>
            <p style={{ margin: '5px 0 0', color: '#888', fontSize: '14px' }}>
              Acesse vídeos e tutoriais para dominar cada funcionalidade
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' }}>
          <Info size={20} color="#ff3131" />
          <h2 style={{ fontSize: '18px', fontWeight: '900', margin: 0 }}>BIBLIOTECA DE VÍDEOS</h2>
        </div>

        {/* ==========================================
            SEÇÃO 0: FERRAMENTAS GRATUITAS (NOVO)
        ========================================== */}
        <div style={{
          background: 'linear-gradient(145deg, rgba(255,215,0,0.06) 0%, rgba(255,160,0,0.04) 50%, #0a0a0a 100%)',
          borderRadius: '24px',
          border: '1px solid rgba(255,215,0,0.25)',
          padding: '30px',
          marginBottom: '50px',
          boxShadow: '0 0 30px rgba(255,215,0,0.05)'
        }}>
          <h3 style={{
            color: '#FFD700', margin: '0 0 10px 0', fontSize: '24px', fontWeight: '900',
            textShadow: '0 0 30px rgba(255,215,0,0.4)'
          }}>
            🎁 Ferramenta Grátis: Sua Oficina Organizada
          </h3>
          <p style={{ color: '#aaa', fontSize: '14px', lineHeight: '1.6', margin: '0 0 25px 0' }}>
            Acesso vitalício para organizar sua oficina com as 7 ferramentas essenciais de gestão.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {[
              { icon: '👥', label: 'Clientes', desc: 'Cadastro e gestão ilimitada da sua base de contatos.' },
              { icon: '💰', label: 'Financeiro', desc: 'Controle total de entradas e saídas do fluxo de caixa.' },
              { icon: '📊', label: 'Visão Geral', desc: 'Dashboard intuitivo da saúde e produtividade da oficina.' },
              { icon: '📋', label: 'Tarefa', desc: 'Organize atividades e acompanhe o que precisa ser feito.' },
              { icon: '📊', label: 'Patrimônio', desc: 'Inventário de ferramentas, elevadores e equipamentos.' },
              { icon: '🤝', label: 'Fornecedores', desc: 'Lista de parceiros e autopeças para cotações rápidas.' },
              { icon: '📋', label: 'Histórico', desc: 'Auditoria completa com segurança e transparência.' },
            ].map(item => (
              <div key={item.label} style={{
                background: 'rgba(255,255,255,0.02)',
                padding: '16px',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.05)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '18px' }}>{item.icon}</span>
                  <span style={{ color: '#fff', fontSize: '13px', fontWeight: '900', textTransform: 'uppercase' }}>
                    {item.label}
                  </span>
                </div>
                <p style={{ color: '#777', fontSize: '11px', margin: 0, lineHeight: '1.5' }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ==========================================
            SEÇÃO 1: CONFIGURAÇÃO INICIAL
        ========================================== */}
        <div className="titulo-sessao"><div style={{ width: 4, height: 15, background: '#ff3131' }} /> 1. Configuração Inicial</div>

        <div className="item-biblioteca">
          <div className="icone-box"><Settings size={20} color="#ff3131" /></div>
          <div className="label-nome">⚙️ Ajustes</div>
          {renderBotaoVideo(links.ajustes)}
          <div className="box-resumo">Primeiro passo! Configure seus dados, logo, PIX e preferências para emitir recibos profissionais.</div>
        </div>

        {/* ==========================================
            SEÇÃO 2: OPERACIONAL
        ========================================== */}
        <div className="titulo-sessao"><div style={{ width: 4, height: 15, background: '#ff3131' }} /> 2. Operacional (Coração do App)</div>

        <div className="item-biblioteca">
          <div className="icone-box"><FileText size={20} color="#00e5ff" /></div>
          <div className="label-nome">OS (Ordem de Serviço)</div>
          {renderBotaoVideo(links.os)}
          <div className="box-resumo">O coração do app. Dados do cliente, orçamentos, recibos, PIX, link para cliente e escolha de serviços.</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><History size={20} color="#a855f7" /></div>
          <div className="label-nome">📅 Retorno</div>
          {renderBotaoVideo(links.retorno)}
          <div className="box-resumo">Avisos automáticos sobre prazos de serviços já realizados (Bateria, Óleo, Revisões).</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><MousePointer2 size={20} color="#22c55e" /></div>
          <div className="label-nome">Botões Flutuantes</div>
          {renderBotaoVideo(links.botoesflutuantes)}
          <div className="box-resumo">Atalhos rápidos que agilizam o atendimento sem sair da tela atual.</div>
        </div>

        {/* ==========================================
            SEÇÃO 3: GESTÃO E RELATÓRIOS
        ========================================== */}
        <div className="titulo-sessao"><div style={{ width: 4, height: 15, background: '#ff3131' }} /> 3. Gestão e Relatórios</div>

        <div className="item-biblioteca">
          <div className="icone-box"><LayoutDashboard size={20} color="#22c55e" /></div>
          <div className="label-nome">📊 Visão Geral</div>
          {renderBotaoVideo(links.visao_geral)}
          <div className="box-resumo">Faturamento, ticket médio e visão em tempo real da produtividade da oficina.</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><Package size={20} color="#2196f3" /></div>
          <div className="label-nome">📦 Estoque</div>
          {renderBotaoVideo(links.estoque)}
          <div className="box-resumo">Controle de peças e insumos com histórico e alertas de quantidade mínima.</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><DollarSign size={20} color="#00e676" /></div>
          <div className="label-nome">💰 Financeiro</div>
          {renderBotaoVideo(links.financeiro)}
          <div className="box-resumo">Fluxo de caixa, contas a pagar/receber e fechamentos diários e mensais.</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><Users size={20} color="#2196f3" /></div>
          <div className="label-nome">👥 Clientes</div>
          {renderBotaoVideo(links.clientes)}
          <div className="box-resumo">Base de dados com todos os clientes, histórico de consumo e gerenciamento de leads.</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><ClipboardList size={20} color="#ff9800" /></div>
          <div className="label-nome">📋 Tarefa</div>
          {renderBotaoVideo(links.tarefas)}
          <div className="box-resumo">Atribua e acompanhe tarefas diárias para sua equipe não deixar nada para trás.</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><Receipt size={20} color="#03a9f4" /></div>
          <div className="label-nome">📄 Nota Fiscal</div>
          {renderBotaoVideo(links.notafiscal)}
          <div className="box-resumo">Emissão rápida de notas fiscais diretamente dos serviços fechados.</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><Landmark size={20} color="#e91e63" /></div>
          <div className="label-nome">📊 Patrimônio</div>
          {renderBotaoVideo(links.patrimonio)}
          <div className="box-resumo">Gestão de ferramentas, maquinários, elevadores e ativos da oficina.</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><Truck size={20} color="#009688" /></div>
          <div className="label-nome">🤝 Fornecedores</div>
          {renderBotaoVideo(links.fornecedores)}
          <div className="box-resumo">Catálogo de parceiros, autopeças e distribuidores com cotações e histórico de compras.</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><Calculator size={20} color="#4caf50" /></div>
          <div className="label-nome">💰 Precificação</div>
          {renderBotaoVideo(links.precificacao)}
          <div className="box-resumo">Configure custos e o sistema calcula sua HORA TÉCNICA. Gere orçamentos para WhatsApp.</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><History size={20} color="#673ab7" /></div>
          <div className="label-nome">📋 Histórico</div>
          {renderBotaoVideo(links.historico)}
          <div className="box-resumo">Timeline auditável de tudo no sistema com segurança e transparência total.</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><CreditCard size={20} color="#ffc107" /></div>
          <div className="label-nome">💰 Meu Plano</div>
          {renderBotaoVideo(links.meuplano)}
          <div className="box-resumo">Gerencie sua assinatura, slots, pagamento e upgrade de recursos.</div>
        </div>

        {/* ==========================================
            SEÇÃO 4: EQUIPE E CRESCIMENTO
        ========================================== */}
        <div className="titulo-sessao"><div style={{ width: 4, height: 15, background: '#ff3131' }} /> 4. Equipe e Crescimento</div>

        <div className="item-biblioteca">
          <div className="icone-box"><UserPlus size={20} color="#22c55e" /></div>
          <div className="label-nome">👥 Equipe</div>
          {renderBotaoVideo(links.equipe)}
          <div className="box-resumo">Controle de acessos, comissões e produtividade por mecânico ou funcionário.</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><Megaphone size={20} color="#ff3131" /></div>
          <div className="label-nome">📣 Marketing</div>
          {renderBotaoVideo(links.marketing)}
          <div className="box-resumo">Campanhas promocionais e reativação de clientes via WhatsApp.</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><Rocket size={20} color="#00e5ff" /></div>
          <div className="label-nome">🚀 Estratégia</div>
          {renderBotaoVideo(links.estrategia)}
          <div className="box-resumo">Análises avançadas e BI para direcionar crescimento do faturamento.</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><HelpCircle size={20} color="#9c27b0" /></div>
          <div className="label-nome">❓ Ajuda</div>
          {renderBotaoVideo(links.ajuda)}
          <div className="box-resumo">Central de suporte para falar diretamente com nosso atendimento.</div>
        </div>

        {/* ==========================================
            SEÇÃO 5: ESPECIALIDADES TÉCNICAS
        ========================================== */}
        <div className="titulo-sessao"><div style={{ width: 4, height: 15, background: '#ff3131' }} /> 5. Especialidades Técnicas</div>

        <div className="item-biblioteca">
          <div className="icone-box"><Wrench size={20} color="#ffc107" /></div>
          <div className="label-nome">🔧 Mecânica</div>
          {renderBotaoVideo(links.mecanica)}
          <div className="box-resumo">Motor, suspensão, freios e manutenções em geral.</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><Battery size={20} color="#22c55e" /></div>
          <div className="label-nome">🔋 Híbridos</div>
          {renderBotaoVideo(links.hibrido_ev)}
          <div className="box-resumo">Segurança NR10/NR12 e checklists para sistemas híbridos e elétricos.</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><Zap size={20} color="#00e5ff" /></div>
          <div className="label-nome">🔌 Elétricos (EV)</div>
          {renderBotaoVideo(links.veiculo_eletrico)}
          <div className="box-resumo">Gestão para veículos BEV e sistemas de alta voltagem.</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><Bike size={20} color="#e91e63" /></div>
          <div className="label-nome">🏍️ Motos</div>
          {renderBotaoVideo(links.motos)}
          <div className="box-resumo">Fluxo de O.S. adaptado para baixa, média e alta cilindrada.</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><Hammer size={20} color="#ff6f00" /></div>
          <div className="label-nome">🚗 Lataria</div>
          {renderBotaoVideo(links.lataria)}
          <div className="box-resumo">Orçamentos complexos, pintura e acompanhamento de sinistrados.</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><Activity size={20} color="#673ab7" /></div>
          <div className="label-nome">🧰 Amortecedor</div>
          {renderBotaoVideo(links.amortecedor)}
          <div className="box-resumo">Suspensão, testes e recondicionamento de amortecedores.</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><Cpu size={20} color="#009688" /></div>
          <div className="label-nome">🛠️ Injeção</div>
          {renderBotaoVideo(links.injecao)}
          <div className="box-resumo">Diagnósticos com scanner e limpeza de bicos injetores.</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><Zap size={20} color="#ffc107" /></div>
          <div className="label-nome">⚡ Elétrica</div>
          {renderBotaoVideo(links.eletrica)}
          <div className="box-resumo">Baterias, alternadores, arranques e diagnósticos de chicotes.</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><MoveHorizontal size={20} color="#03a9f4" /></div>
          <div className="label-nome">⚙️ Alinhamento</div>
          {renderBotaoVideo(links.alinhamento)}
          <div className="box-resumo">Geometria 3D, balanceamento, cambagem e caster.</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><Circle size={20} color="#8d6e63" /></div>
          <div className="label-nome">🛞 Pneus</div>
          {renderBotaoVideo(links.pneus)}
          <div className="box-resumo">Estoque, vendas e montagem de pneus novos ou recapados.</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><Droplet size={20} color="#ff9800" /></div>
          <div className="label-nome">🛢️ Óleo</div>
          {renderBotaoVideo(links.oleo)}
          <div className="box-resumo">Troca de óleo de motor e transmissão com checklists e etiquetas.</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><ShieldCheck size={20} color="#4caf50" /></div>
          <div className="label-nome">🛡️ Revisão</div>
          {renderBotaoVideo(links.revisao)}
          <div className="box-resumo">Pacotes de revisão preventiva por quilometragem e fabricante.</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><Snowflake size={20} color="#03a9f4" /></div>
          <div className="label-nome">❄️ Ar-Cond.</div>
          {renderBotaoVideo(links.ar_condicionado)}
          <div className="box-resumo">Higienização, carga de gás e conserto de compressores.</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><Wind size={20} color="#64b5f6" /></div>
          <div className="label-nome">🪛 Escapamento</div>
          {renderBotaoVideo(links.escapamento)}
          <div className="box-resumo">Soldas, catalisadores, abafadores e tubulações de exaustão.</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><CloudRain size={20} color="#00e5ff" /></div>
          <div className="label-nome">🚿 Lava Jato</div>
          {renderBotaoVideo(links.lavajato)}
          <div className="box-resumo">Lavagem simples, completa, higienização interna e serviços rápidos.</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><Sparkles size={20} color="#a855f7" /></div>
          <div className="label-nome">✨ Estética</div>
          {renderBotaoVideo(links.estetica)}
          <div className="box-resumo">Polimento, espelhamento, vitrificação e cuidados de estética.</div>
        </div>

        {/* ==========================================
            SEÇÃO 6: INTELIGÊNCIA E SUPORTE
        ========================================== */}
        <div className="titulo-sessao"><div style={{ width: 4, height: 15, background: '#ff3131' }} /> 6. Inteligência e Suporte Admin</div>

        <div className="item-biblioteca">
          <div className="icone-box"><Brain size={20} color="#ff3131" /></div>
          <div className="label-nome">🤖 Copiloto IA</div>
          {renderBotaoVideo(links.copiloto)}
          <div className="box-resumo">Inteligência Artificial para diagnósticos avançados e esquemas técnicos.</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><Briefcase size={20} color="#2196f3" /></div>
          <div className="label-nome">👩‍💼 Secretária</div>
          {renderBotaoVideo(links.secretaria)}
          <div className="box-resumo">Automação para atendimento, orçamentos e agendamentos via WhatsApp.</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><Shield size={20} color="#ffc107" /></div>
          <div className="label-nome">👔 Administrador</div>
          {renderBotaoVideo(links.administrador)}
          <div className="box-resumo">Painel de controle para donos que gerenciam métricas ou redes.</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><Calculator size={20} color="#00b894" /></div>
          <div className="label-nome">📋 Assistente Fiscal</div>
          {renderBotaoVideo(links.assistente_fiscal)}
          <div className="box-resumo">Suporte fiscal e organização. Apoio ao seu contador profissional.</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><ShoppingCart size={20} color="#2196f3" /></div>
          <div className="label-nome">📦 MercadoLivre</div>
          {renderBotaoVideo(links.mercadolivre)}
          <div className="box-resumo">Pesquisa de peças, cotações e repasse com integração de afiliação.</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><Scissors size={20} color="#e91e63" /></div>
          <div className="label-nome">🚗 Desmanche</div>
          {renderBotaoVideo(links.desmanche)}
          <div className="box-resumo">Gestão de peças de reaproveitamento, rede global e WhatsApp.</div>
        </div>

      </div>
    </div>
  );
}
