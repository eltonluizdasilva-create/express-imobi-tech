import React, { useState, useEffect } from 'react';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  Settings, FileText, History, MousePointer2, LayoutDashboard, Package,
  DollarSign, Users, ClipboardList, Receipt, Landmark, Truck,
  CreditCard, UserPlus, Megaphone, Rocket, HelpCircle, Wrench, Battery,
  Zap, Bike, Car, Hammer, Activity, Cpu, MoveHorizontal, Droplet,
  ShieldCheck, Snowflake, Circle, Scissors, Wind, CloudRain, Sparkles,
  Brain, Briefcase, Shield, Calculator, ShoppingCart, Play, Info, Video
} from 'lucide-react';

const ESTILO_BIBLIOTECA = `
  .container-biblioteca { background: #000; min-height: 100vh; padding: 40px 20px; font-family: sans-serif; color: white; padding-bottom: 100px; }
  .wrapper { maxWidth: 1100px; margin: 0 auto; }
  
  .video-principal { 
    background: linear-gradient(145deg, #111, #050505); 
    border: 1px solid #333; border-radius: 24px; padding: 30px; 
    margin-bottom: 50px; display: flex; align-items: center; gap: 25px;
    box-shadow: 0 10px 40px rgba(255,49,49,0.1);
  }
  
  .item-biblioteca { 
    background: #0d0d0d; border: 1px solid #1a1a1a; border-radius: 16px; 
    padding: 16px; margin-bottom: 12px; display: flex; align-items: center; gap: 15px; 
    transition: 0.2s;
  }
  .item-biblioteca:hover { border-color: #ff3131; background: #111; }
  
  .icone-box { 
    width: 45px; height: 45px; background: #1a1a1a; border-radius: 12px; 
    display: flex; align-items: center; justify-content: center; flex-shrink: 0; 
  }
  .label-nome { width: 170px; font-size: 13px; font-weight: 800; color: #fff; text-transform: uppercase; }
  
  .botao-video { 
    background: #151515; border: 1px solid #222; border-radius: 8px; color: #888;
    padding: 10px 15px; font-size: 11px; font-weight: 700; text-decoration: none;
    display: flex; align-items: center; gap: 8px; min-width: 140px; justify-content: center;
    transition: 0.2s;
  }
  .botao-video.ativo:hover { background: #ff3131; color: white; border-color: #ff3131; }
  .botao-video.inativo { opacity: 0.4; pointer-events: none; }
  
  .box-resumo { 
    background: #080808; border: 1px solid #151515; border-radius: 10px; 
    padding: 12px 18px; color: #777; font-size: 12px; flex: 1; line-height: 1.5; 
  }
  .titulo-sessao { color: #ff3131; font-size: 14px; font-weight: 900; margin: 40px 0 15px; display: flex; align-items: center; gap: 10px; text-transform: uppercase; letter-spacing: 1px; }
`;

export default function BibliotecaTreinamento() {
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
          console.log("[Ajuda] Dados carregados:", data);
        } else {
          console.log("[Ajuda] Nenhum dado de ajuda encontrado.");
        }
      } catch (error) {
        console.error("Erro ao buscar dados de ajuda:", error);
      }
    };
    fetchConfig();
  }, []);

  // Função para renderizar o botão. Se o link existir no Master, ele fica vermelho e clicável.
  const renderBotaoVideo = (link) => {
    if (link && link.trim() !== "") {
      return (
        <a href={link} target="_blank" rel="noreferrer" className="botao-video ativo">
          <Video size={14} fill="currentColor" /> Assistir Aula
        </a>
      );
    }
    return (
      <span className="botao-video inativo">
        <Video size={14} /> Sem Vídeo
      </span>
    );
  };

  return (
    <div className="container-biblioteca">
      <style>{ESTILO_BIBLIOTECA}</style>
      <div className="wrapper">

        {/* ── VÍDEO PRINCIPAL DE INTRODUÇÃO ── */}
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
          <a href={links.principal || "#"} target="_blank" rel="noreferrer" className="botao-video ativo" style={{ background: '#ff3131', color: 'white', padding: '15px 30px', fontSize: '14px' }}>
            <Play size={16} fill="white" /> AULA PRINCIPAL
          </a>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' }}>
          <Info size={20} color="#ff3131" />
          <h2 style={{ fontSize: '18px', fontWeight: '900', margin: 0 }}>BIBLIOTECA DE VÍDEOS E RESUMOS</h2>
        </div>

        {/* ==========================================
            SESSÃO 1: CONFIGURAÇÃO INICIAL
        ========================================== */}
        <div className="titulo-sessao"><div style={{ width: 4, height: 15, background: '#ff3131' }} /> 1. Configuração Inicial</div>

        <div className="item-biblioteca">
          <div className="icone-box"><Settings size={20} color="#ff3131" /></div>
          <div className="label-nome">⚙️ Ajustes</div>
          {renderBotaoVideo(links.config)}
          <div className="box-resumo">{textos.config || "Esse é o primeiro passo! Coloque seus dados, logo da empresa e sua chave PIX. Assim, quando for emitir o recibo, os dados da empresa e seu PIX já estarão lá."}</div>
        </div>

        {/* ==========================================
            SESSÃO 2: OPERACIONAL (CORAÇÃO DO APP)
        ========================================== */}
        <div className="titulo-sessao"><div style={{ width: 4, height: 15, background: '#ff3131' }} /> 2. Operacional (Coração do App)</div>

        <div className="item-biblioteca">
          <div className="icone-box"><FileText size={20} color="#00e5ff" /></div>
          <div className="label-nome">OS (Ordem de Serviço)</div>
          {renderBotaoVideo(links.os)}
          <div className="box-resumo">{textos.os || "O coração do app. Aqui você coloca os dados do cliente, manda orçamentos, faz recibos, fecha pagamento (PIX), manda o link para o cliente e escolhe/edita os serviços."}</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><History size={20} color="#a855f7" /></div>
          <div className="label-nome">📅 Retorno</div>
          {renderBotaoVideo(links.retorno)}
          <div className="box-resumo">{textos.retorno || "Totalmente integrado. Ele avisa automaticamente sobre os prazos de serviços como Elétrica (Bateria), Troca de Óleo e revisões já realizadas."}</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><MousePointer2 size={20} color="#22c55e" /></div>
          <div className="label-nome">Botões Flutuantes</div>
          {renderBotaoVideo(links.botoesFlutuantes)}
          <div className="box-resumo">{textos.botoesFlutuantes || "Entenda para que servem os atalhos rápidos flutuantes que agilizam o atendimento sem precisar sair da tela atual."}</div>
        </div>

        {/* ==========================================
            SESSÃO 3: GESTÃO E RELATÓRIOS
        ========================================== */}
        <div className="titulo-sessao"><div style={{ width: 4, height: 15, background: '#ff3131' }} /> 3. Gestão e Relatórios</div>

        <div className="item-biblioteca">
          <div className="icone-box"><LayoutDashboard size={20} /></div>
          <div className="label-nome">📊 Visão Geral</div>
          {renderBotaoVideo(links.dashboard)}
          <div className="box-resumo">{textos.dashboard || "Painel de controle com faturamento estimado, ticket médio e visão em tempo real da produtividade da oficina."}</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><Package size={20} /></div>
          <div className="label-nome">📦 Estoque</div>
          {renderBotaoVideo(links.estoque)}
          <div className="box-resumo">{textos.estoque || "Controle completo de peças e insumos, com histórico de entradas e saídas e alertas de quantidade mínima."}</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><DollarSign size={20} color="#00e676" /></div>
          <div className="label-nome">📊 Financeiro</div>
          {renderBotaoVideo(links.financeiro)}
          <div className="box-resumo">{textos.financeiro || "Seu fluxo de caixa. Controle de contas a pagar, contas a receber e fechamentos diários e mensais."}</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><Users size={20} /></div>
          <div className="label-nome">👥 Clientes</div>
          {renderBotaoVideo(links.clientes)}
          <div className="box-resumo">{textos.clientes || "Base de dados centralizada com todos os seus clientes, histórico de consumo e gerenciamento de leads."}</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><ClipboardList size={20} /></div>
          <div className="label-nome">📋 Tarefa</div>
          {renderBotaoVideo(links.tarefa)}
          <div className="box-resumo">{textos.tarefa || "Organização interna. Atribua e acompanhe tarefas diárias para a sua equipe não deixar nada para trás."}</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><Receipt size={20} color="#03a9f4" /></div>
          <div className="label-nome">📄 Nota Fiscal</div>
          {renderBotaoVideo(links.notafiscal)}
          <div className="box-resumo">{textos.notafiscal || "Módulo integrado para emissão rápida de notas fiscais diretamente dos serviços fechados."}</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><Landmark size={20} /></div>
          <div className="label-nome">📊 Patrimônio</div>
          {renderBotaoVideo(links.patrimonio)}
          <div className="box-resumo">{textos.patrimonio || "Gestão e controle de ferramentas, maquinários, elevadores e ativos da própria oficina."}</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><Truck size={20} /></div>
          <div className="label-nome">🤝 Fornecedores</div>
          {renderBotaoVideo(links.fornecedores)}
          <div className="box-resumo">{textos.fornecedores || "Catálogo de parceiros, autopeças e distribuidores para cotações rápidas e histórico de compras."}</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><History size={20} /></div>
          <div className="label-nome">📋 Histórico</div>
          {renderBotaoVideo(links.historico)}
          <div className="box-resumo">{textos.historico || "Linha do tempo auditável de tudo que acontece no sistema, garantindo segurança e transparência."}</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><CreditCard size={20} color="#ffc107" /></div>
          <div className="label-nome">💰 Meu Plano</div>
          {renderBotaoVideo(links.meuplano)}
          <div className="box-resumo">{textos.meuplano || "Gestão da sua assinatura Oficina IA, slots disponíveis, pagamento e upgrade de recursos."}</div>
        </div>

        {/* ==========================================
            SESSÃO 4: ESTRATÉGIA E EQUIPE
        ========================================== */}
        <div className="titulo-sessao"><div style={{ width: 4, height: 15, background: '#ff3131' }} /> 4. Equipe e Crescimento</div>

        <div className="item-biblioteca">
          <div className="icone-box"><UserPlus size={20} /></div>
          <div className="label-nome">👥 Equipe</div>
          {renderBotaoVideo(links.equipe)}
          <div className="box-resumo">{textos.equipe || "Controle de acessos, comissões e acompanhamento de produtividade por mecânico ou funcionário."}</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><Megaphone size={20} color="#ff3131" /></div>
          <div className="label-nome">📣 Marketing</div>
          {renderBotaoVideo(links.marketing)}
          <div className="box-resumo">{textos.marketing || "Ferramentas para envio de campanhas promocionais e reativação de clientes diretamente via WhatsApp."}</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><Rocket size={20} color="#00e5ff" /></div>
          <div className="label-nome">🚀 Estratégia</div>
          {renderBotaoVideo(links.estrategia)}
          <div className="box-resumo">{textos.estrategia || "Análises avançadas e Inteligência de Negócio (BI) para direcionar o crescimento do faturamento da sua oficina."}</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><HelpCircle size={20} /></div>
          <div className="label-nome">❓ Ajuda</div>
          {renderBotaoVideo(links.ajuda)}
          <div className="box-resumo">{textos.ajuda || "Central de suporte rápido para falar diretamente com nosso atendimento em caso de dúvidas."}</div>
        </div>

        {/* ==========================================
            SESSÃO 5: ESPECIALIDADES TÉCNICAS (17 ITENS)
        ========================================== */}
        <div className="titulo-sessao"><div style={{ width: 4, height: 15, background: '#ff3131' }} /> 5. Especialidades Técnicas</div>

        <div className="item-biblioteca">
          <div className="icone-box"><Wrench size={20} /></div>
          <div className="label-nome">🔧 Mecânica</div>
          {renderBotaoVideo(links.mecanica)}
          <div className="box-resumo">{textos.mecanica || "Lançamentos específicos para motor, suspensão, freios e manutenções em geral."}</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><Battery size={20} color="#22c55e" /></div>
          <div className="label-nome">🔋 Híbridos</div>
          {renderBotaoVideo(links.hibrido)}
          <div className="box-resumo">{textos.hibrido || "Procedimentos de segurança e checklists dedicados à manutenção de sistemas híbridos."}</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><Zap size={20} color="#00e5ff" /></div>
          <div className="label-nome">🔌 100% Elétricos</div>
          {renderBotaoVideo(links.eletrico)}
          <div className="box-resumo">{textos.eletrico || "Gestão e protocolos para veículos puramente elétricos (EV) e sistemas de alta voltagem."}</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><Bike size={20} /></div>
          <div className="label-nome">🏍️ Motos</div>
          {renderBotaoVideo(links.moto)}
          <div className="box-resumo">{textos.moto || "Fluxo de O.S. adaptado para motocicletas de baixa, média e alta cilindrada."}</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><Hammer size={20} /></div>
          <div className="label-nome">🚗 Funilaria</div>
          {renderBotaoVideo(links.funilaria)}
          <div className="box-resumo">{textos.funilaria || "Gestão de orçamentos complexos por peça, pintura e acompanhamento de veículos sinistrados."}</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><Activity size={20} /></div>
          <div className="label-nome">🧰 Amortecedor</div>
          {renderBotaoVideo(links.amortecedor)}
          <div className="box-resumo">{textos.amortecedor || "Controles específicos para suspensão, testes e recondicionamento de amortecedores."}</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><Cpu size={20} /></div>
          <div className="label-nome">🛠️ Injeção</div>
          {renderBotaoVideo(links.injecao)}
          <div className="box-resumo">{textos.injecao || "Módulo dedicado para diagnósticos avançados com scanner e limpeza de bicos injetores."}</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><Zap size={20} color="#ffc107" /></div>
          <div className="label-nome">⚡ Elétrica</div>
          {renderBotaoVideo(links.eletrica)}
          <div className="box-resumo">{textos.eletrica || "Gerenciamento de troca de baterias, alternadores, motores de arranque e diagnósticos de chicotes."}</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><MoveHorizontal size={20} /></div>
          <div className="label-nome">⚙️ Alinhamento</div>
          {renderBotaoVideo(links.alinhamento)}
          <div className="box-resumo">{textos.alinhamento || "Serviços de geometria 3D, balanceamento, cambagem e caster."}</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><Droplet size={20} color="#ff9800" /></div>
          <div className="label-nome">🛢️ Óleo</div>
          {renderBotaoVideo(links.oleo)}
          <div className="box-resumo">{textos.oleo || "Troca de óleo de motor e transmissão automática com checklists rápidos e etiquetas."}</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><ShieldCheck size={20} color="#4caf50" /></div>
          <div className="label-nome">🛡️ Revisão</div>
          {renderBotaoVideo(links.revisao)}
          <div className="box-resumo">{textos.revisao || "Pacotes de revisão preventiva baseados em quilometragem e manuais de fabricantes."}</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><Snowflake size={20} color="#03a9f4" /></div>
          <div className="label-nome">❄️ Ar-Cond.</div>
          {renderBotaoVideo(links.ar_condicionado)}
          <div className="box-resumo">{textos.ar_condicionado || "Manutenção, higienização, carga de gás e conserto de compressores do sistema de ar."}</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><Circle size={20} /></div>
          <div className="label-nome">🛞 Pneus</div>
          {renderBotaoVideo(links.pneus)}
          <div className="box-resumo">{textos.pneus || "Controle de estoque, vendas e montagem de pneus novos ou recapados."}</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><Scissors size={20} /></div>
          <div className="label-nome">🚗 Desmanche</div>
          {renderBotaoVideo(links.desmanche)}
          <div className="box-resumo">{textos.desmanche || "Gerenciamento e categorização de peças de reaproveitamento e baixas veiculares."}</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><Wind size={20} /></div>
          <div className="label-nome">🪛 Escapamento</div>
          {renderBotaoVideo(links.escapamento)}
          <div className="box-resumo">{textos.escapamento || "Soldas, trocas de catalisadores, abafadores e tubulações de exaustão."}</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><CloudRain size={20} color="#00e5ff" /></div>
          <div className="label-nome">🚿 Lava Jato</div>
          {renderBotaoVideo(links.lavajato)}
          <div className="box-resumo">{textos.lavajato || "Controle de lavagem simples, lavagem completa, higienização interna e serviços rápidos."}</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><Sparkles size={20} color="#a855f7" /></div>
          <div className="label-nome">✨ Estética</div>
          {renderBotaoVideo(links.estetica)}
          <div className="box-resumo">{textos.estetica || "Detalhamento premium, polimento, espelhamento, vitrificação e cuidados de estética automotiva."}</div>
        </div>

        {/* ==========================================
            SESSÃO 6: INTELIGÊNCIA E SUPORTE ADMIN
        ========================================== */}
        <div className="titulo-sessao"><div style={{ width: 4, height: 15, background: '#ff3131' }} /> 6. Inteligência e Suporte Admin</div>

        <div className="item-biblioteca">
          <div className="icone-box"><Brain size={20} color="#ff3131" /></div>
          <div className="label-nome">👨‍🔧 Copiloto IA</div>
          {renderBotaoVideo(links.copiloto)}
          <div className="box-resumo">{textos.copiloto || "Inteligência Artificial que auxilia no diagnóstico avançado e fornece acesso rápido a esquemas técnicos."}</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><Briefcase size={20} /></div>
          <div className="label-nome">👩‍💼 Secretária</div>
          {renderBotaoVideo(links.secretaria)}
          <div className="box-resumo">{textos.secretaria || "Automação para atendimento ao cliente, resposta a orçamentos e agendamentos pelo WhatsApp."}</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><Shield size={20} color="#ffc107" /></div>
          <div className="label-nome">👔 Administrador</div>
          {renderBotaoVideo(links.administrador)}
          <div className="box-resumo">{textos.administrador || "Painel de controle macro para donos de oficina que gerenciam métricas consolidadas ou redes de franquias."}</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><Calculator size={20} /></div>
          <div className="label-nome">🧮 Contador</div>
          {renderBotaoVideo(links.contador)}
          <div className="box-resumo">{textos.contador || "Acesso restrito e exportação de relatórios focados estritamente na contabilidade e fiscalidade do negócio."}</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><ShoppingCart size={20} color="#ffc107" /></div>
          <div className="label-nome">📦 Mercado Livre</div>
          {renderBotaoVideo(links.mercadolivre)}
          <div className="box-resumo">{textos.mercadolivre || "Integração para pesquisa ágil de peças, facilitando cotações e repasse de preços para o cliente."}</div>
        </div>

      </div>
    </div>
  );
}