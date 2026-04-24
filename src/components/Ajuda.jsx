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
  .label-nome { width: 170px; font-size: 13px; font-weight: 800; color: #fff; text-transform: uppercase; margin-top: 14px; }
  
  .botao-video { 
    background: #151515; border: 1px solid #222; border-radius: 8px; color: #888;
    padding: 10px 15px; font-size: 11px; font-weight: 700; text-decoration: none;
    display: flex; align-items: center; gap: 8px; min-width: 140px; justify-content: center;
    transition: 0.2s;
    margin-top: 5px;
  }
  .botao-video.ativo:hover { background: #ff3131; color: white; border-color: #ff3131; }
  .botao-video.inativo { opacity: 0.4; pointer-events: none; }
  
  .box-resumo { 
    background: #080808; border: 1px solid #151515; border-radius: 10px; 
    padding: 12px 18px; color: #777; font-size: 12px; flex: 1 1 300px; line-height: 1.5; 
    width: 100%; max-width: 100%; box-sizing: border-box;
  }
  .titulo-sessao { color: #ff3131; font-size: 14px; font-weight: 900; margin: 40px 0 15px; display: flex; align-items: center; gap: 10px; text-transform: uppercase; letter-spacing: 1px; }

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

            </p>
          </div>

        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' }}>
          <Info size={20} color="#ff3131" />
          <h2 style={{ fontSize: '18px', fontWeight: '900', margin: 0 }}>BIBLIOTECA DE VÍDEOS E RESUMOS</h2>
        </div>

        {/* ==========================================
            FERRAMENTA GRÁTIS OFICINA IA
        ========================================== */}
        {/* ==========================================
            FERRAMENTA GRÁTIS: SUA OFICINA ORGANIZADA
        ========================================== */}
        <div style={{
          background: 'linear-gradient(145deg, rgba(255,215,0,0.06) 0%, rgba(255,160,0,0.04) 50%, #0a0a0a 100%)',
          borderRadius: '24px',
          border: '1px solid rgba(255,215,0,0.25)',
          padding: '30px',
          marginBottom: '50px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 0 30px rgba(255,215,0,0.05)'
        }}>
          <h3 style={{
            color: '#FFD700', margin: '0 0 10px 0', fontSize: '24px', fontWeight: '900',
            textShadow: '0 0 30px rgba(255,215,0,0.4)', letterSpacing: '-0.5px'
          }}>
            🎁 Ferramenta Grátis: Sua Oficina Organizada
          </h3>
          <p style={{ color: '#aaa', fontSize: '14px', lineHeight: '1.6', margin: '0 0 25px 0', fontWeight: '500' }}>
            Acesso vitalício para organizar sua oficina. Você decide quando crescer.
          </p>

          {/* SEÇÃO 1: O QUE VOCÊ LEVA */}
          <div style={{ marginBottom: '32px' }}>
            <p style={{
              color: '#FFD700', fontSize: '12px', fontWeight: '900',
              textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '2px',
              display: 'flex', alignItems: 'center', gap: '10px'
            }}>
              <span style={{ height: '1px', flex: 1, background: 'linear-gradient(90deg, rgba(255,215,0,0.3), transparent)' }}></span>
              🛠️ O que você leva sem custo (Para Sempre)
              <span style={{ height: '1px', flex: 1, background: 'linear-gradient(-90deg, rgba(255,215,0,0.3), transparent)' }}></span>
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              {[
                { icon: '👥', label: 'Clientes', desc: 'Cadastro e gestão ilimitada da sua base de contatos. Tenha o histórico de quem frequenta sua oficina sempre à mão.' },
                { icon: '💰', label: 'Financeiro', desc: 'Controle total de entradas e saídas. Organize seu fluxo de caixa e pare de perder dinheiro por falta de anotação.' },
                { icon: '📊', label: 'Visão Geral', desc: 'Um dashboard intuitivo para você acompanhar a saúde e a produtividade da sua oficina em tempo real.' },
                { icon: '📋', label: 'Tarefa', desc: 'Organize o dia a dia da sua equipe, distribuindo atividades e acompanhando o que precisa ser feito.' },
                { icon: '📊', label: 'Patrimônio', desc: 'Faça o inventário das suas ferramentas, elevadores e equipamentos. Proteja os ativos da sua empresa.' },
                { icon: '🤝', label: 'Fornecedores', desc: 'Tenha sua lista de parceiros e autopeças organizada para cotações rápidas e eficientes.' },
                { icon: '📋', label: 'Histórico', desc: 'Auditoria completa de tudo o que acontece no sistema para garantir total segurança e transparência.' },
              ].map(item => (
                <div key={item.label} style={{
                  background: 'rgba(255,255,255,0.02)',
                  backdropFilter: 'blur(10px)',
                  padding: '16px',
                  borderRadius: '16px',
                  border: '1px solid rgba(255,255,255,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px', height: '32px', background: 'rgba(255,215,0,0.1)',
                      borderRadius: '10px', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '16px'
                    }}>
                      {item.icon}
                    </div>
                    <span style={{ color: '#fff', fontSize: '13px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {item.label}
                    </span>
                  </div>
                  <p style={{ color: '#777', fontSize: '11px', margin: 0, lineHeight: '1.6', fontWeight: '500' }}>
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* SEÇÃO 2: BENEFÍCIOS E LIBERDADE */}
          <div>
            <p style={{
              color: '#FFD700', fontSize: '12px', fontWeight: '900',
              textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '2px',
              display: 'flex', alignItems: 'center', gap: '10px'
            }}>
              <span style={{ height: '1px', flex: 1, background: 'linear-gradient(90deg, rgba(255,215,0,0.3), transparent)' }}></span>
              🚀 Benefícios e Liberdade
              <span style={{ height: '1px', flex: 1, background: 'linear-gradient(-90deg, rgba(255,215,0,0.3), transparent)' }}></span>
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(34,197,94,0.02))',
                padding: '16px', borderRadius: '16px', border: '1px solid rgba(34,197,94,0.15)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '16px' }}>📍</span>
                  <span style={{ color: '#4ade80', fontSize: '13px', fontWeight: '900', textTransform: 'uppercase' }}>1 O.S. / mês</span>
                </div>
                <p style={{ color: '#666', fontSize: '11px', margin: 0, lineHeight: '1.5', fontWeight: '500' }}>
                  Perfeito para quem está começando ou quer testar o fluxo de orçamentos e recibos profissionais.
                </p>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, rgba(168,85,247,0.08), rgba(168,85,247,0.02))',
                padding: '16px', borderRadius: '16px', border: '1px solid rgba(168,85,247,0.15)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '16px' }}>🧠</span>
                  <span style={{ color: '#c084fc', fontSize: '13px', fontWeight: '900', textTransform: 'uppercase' }}>15 Dias de Trial</span>
                </div>
                <p style={{ color: '#666', fontSize: '11px', margin: 0, lineHeight: '1.5', fontWeight: '500' }}>
                  Experimente todas as ferramentas avançadas e nossa Inteligência Artificial por 15 dias sem compromisso.
                </p>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))',
                padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '16px' }}>🔓</span>
                  <span style={{ color: '#eee', fontSize: '13px', fontWeight: '900', textTransform: 'uppercase' }}>Sem Bloqueios</span>
                </div>
                <p style={{ color: '#666', fontSize: '11px', margin: 0, lineHeight: '1.5', fontWeight: '500' }}>
                  Suas abas de gestão (Ajustes, Equipe, Marketing e Ajuda) nunca exibem cadeado. O sistema é seu, a liberdade também.
                </p>
              </div>
            </div>
          </div>
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
          <div className="icone-box"><Calculator size={20} color="#00E676" /></div>
          <div className="label-nome">💰 PRECIFICAÇÃO</div>
          {renderBotaoVideo(links.precificacao)}
          <div className="box-resumo">{textos.precificacao || "👉 Pare de pagar para trabalhar! Use esta aba para saber exatamente quanto cobrar. Configure custos fixos e o sistema calcula automaticamente sua HORA TÉCNICA. Gere orçamentos e envie direto no WhatsApp do cliente."}</div>
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
          <div className="label-nome">📋 Assistente Fiscal</div>
          {renderBotaoVideo(links.contador)}
          <div className="box-resumo">{textos.contador || "Suporte fiscal e organização de caixa, recibos e leitura financeira. Atua como apoio ao seu contador profissional, não como substituto."}</div>
        </div>

        <div className="item-biblioteca">
          <div className="icone-box"><ShoppingCart size={20} color="#ffc107" /></div>
          <div className="label-nome">📦 Compras</div>
          {renderBotaoVideo(links.mercadolivre)}
          <div className="box-resumo">{textos.mercadolivre || "Integração para pesquisa ágil de peças, facilitando cotações e repasse de preços para o cliente."}</div>
        </div>

      </div>
    </div>
  );
}