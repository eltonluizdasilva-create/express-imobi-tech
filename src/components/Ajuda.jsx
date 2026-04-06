import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Video, MessageCircle, ExternalLink, Play } from 'lucide-react';

const MANUAL_CSS = `
  details[open] .chevron-ajuda {
    transform: rotate(180deg) !important;
  }
  details > summary::-webkit-details-marker {
    display: none;
  }
`;

const MANUAL_ITENS = [
  {
    categoria: '⚙️ Mecânica',
    sessoes: [
      {
        titulo: 'Como criar uma nova Ordem de Serviço?',
        resposta: 'Clique no botão "+ Nova O.S." no topo da tela. Preencha os dados do cliente, veículo e serviço. Adicione fotos se necessário. Clique em salvar para registrar a O.S. no sistema.',
        video: 'Criando sua primeira O.S.',
      },
      {
        titulo: 'Como adicionar fotos e laudos?',
        resposta: 'Na tela da O.S., use o botão de câmera para anexar fotos do veículo. Você pode adicionar legendas e diagnósticos. O laudo é gerado automaticamente e pode ser enviado ao cliente.',
        video: 'Fotos e Laudos',
      },
      {
        titulo: 'Como funciona o checklist de serviços?',
        resposta: 'Use o checklist para marcar os serviços realizados. Cada item marcado aparece no laudo final. Você pode personalizar os itens em Ajustes.',
        video: 'Checklist de Serviços',
      },
    ],
  },
  {
    categoria: '🚗 Lataria & Pintura',
    sessoes: [
      {
        titulo: 'Como registrar um serviço de funilaria?',
        resposta: 'Acesse a aba Funilaria, clique em "Novo Serviço". Preencha o tipo de reparo, peças envolvidas e valore. O sistema gera um laudo detalhado.',
        video: 'Serviços de Funilaria',
      },
      {
        titulo: 'Como enviar laudos ao cliente?',
        resposta: 'Na O.S. da funilaria, clique em "Compartilhar Laudo". Um link é gerado e enviado via WhatsApp. O cliente acompanha o andamento pelo navegador.',
        video: 'Enviando Laudos',
      },
    ],
  },
  {
    categoria: '🛢️ Óleo & Lubrificação',
    sessoes: [
      {
        titulo: 'Como registrar uma troca de óleo?',
        resposta: 'Vá em Óleo, preencha o veículo, óleo utilizado, filtro e kilometragem. O sistema salva automaticamente no histórico do cliente.',
        video: 'Troca de Óleo',
      },
      {
        titulo: 'Como acompanhar histórico de trocas?',
        resposta: 'O histórico aparece automaticamente na tela do cliente. Você também pode consultar em Leads > veículo específico.',
        video: 'Histórico do Veículo',
      },
    ],
  },
  {
    categoria: '💰 Gestão & Financeiro',
    sessoes: [
      {
        titulo: 'Como funciona o módulo de Financeiro?',
        resposta: 'Registre entradas (pagamentos recebidos) e despesas (pecas, salários, contas). O sistema calcula automaticamente o lucro do período.',
        video: 'Financeiro em 5 Minutos',
      },
      {
        titulo: 'Como cadastrar peças no estoque?',
        resposta: 'Vá em Estoque, clique em "+ Nova Peça". Preencha nome, código, quantidade e valor. O estoque é atualizado após cada O.S.',
        video: 'Gestão de Estoque',
      },
      {
        titulo: 'Como funciona o módulo de Leads?',
        resposta: 'Gerencie potenciais clientes em Leads. Adicione com nome, telefone e interesse. Acompanhe o status de cada um e converta em cliente.',
        video: 'Gerenciando Leads',
      },
    ],
  },
  {
    categoria: '🤖 Inteligência Artificial',
    sessoes: [
      {
        titulo: 'Como usar o Copiloto IA?',
        resposta: 'O Copiloto analisa fotos do veículo e sugere defeitos. Clique no ícone 🧠 na O.S. para acionar. Ele gera textos profissionais para laudos.',
        video: 'Usando a IA do Copiloto',
      },
      {
        titulo: 'Como usar a Secretária IA?',
        resposta: 'A Secretária IA responde mensagens automaticamente no WhatsApp. Configure palavras-chave em Ajustes > IA para ativar.',
        video: 'Secretária IA',
      },
      {
        titulo: 'O Administrador IA gera insights?',
        resposta: 'Sim! O Administrador analisa padrões de serviços, indica horários de pico e sugere ações. Abra a aba para ver os insights atualizados.',
        video: 'Insights com IA',
      },
    ],
  },
  {
    categoria: '📱 Uso Geral',
    sessoes: [
      {
        titulo: 'Posso usar no celular?',
        resposta: 'Sim! O sistema é responsivo e funciona perfeitamente em smartphones e tablets. Abra no navegador do seu celular.',
        video: 'Versão Mobile',
      },
      {
        titulo: 'Como exportar relatórios?',
        resposta: 'Em Financeiro, use o botão "Exportar". Escolha o período e o formato. O download inicia automaticamente.',
        video: 'Exportando Relatórios',
      },
    ],
  },
];

const VIDEOS = [
  { titulo: 'Introdução ao Sistema', duracao: '3:45' },
  { titulo: 'Criando sua primeira O.S.', duracao: '5:12' },
  { titulo: 'Gerenciando Leads', duracao: '4:30' },
  { titulo: 'Financeiro e Fluxo de Caixa', duracao: '6:15' },
  { titulo: 'Usando a IA do Copiloto', duracao: '7:00' },
  { titulo: 'Configurando Módulos', duracao: '3:20' },
];

export default function Ajuda({ ajudaItens, tabColors = {} }) {
  const [videoOpen, setVideoOpen] = useState(null);
  const ajudaColor = tabColors?.ajuda || '#06b6d4';

  return (
    <div>
      <style>{MANUAL_CSS}</style>

      {/* ── HEADER ── */}
      <div style={{
        background: 'linear-gradient(145deg, #111, #1a1a1a)',
        padding: '28px', borderRadius: '16px',
        border: `1px solid ${ajudaColor}`,
        marginBottom: '20px',
        boxShadow: `0 8px 32px ${ajudaColor}18`,
        textAlign: 'center',
      }}>
        <div style={{
          width: '56px', height: '56px', borderRadius: '50%',
          background: `${ajudaColor}22`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 14px',
        }}>
          <HelpCircle size={28} color={ajudaColor} />
        </div>
        <h2 style={{ color: 'white', margin: '0 0 8px 0', fontSize: '20px', fontWeight: '900' }}>
          Central de Suporte
        </h2>
        <p style={{ color: '#888', margin: 0, fontSize: '13px', lineHeight: '1.6' }}>
          Encontre respostas rápidas, assista tutoriais em vídeo<br />ou fale com nossa equipe.
        </p>
      </div>

      {/* ── VÍDEOS ── */}
      <div style={{
        background: '#111', borderRadius: '16px',
        border: '1px solid #1e1e1e', marginBottom: '20px', overflow: 'hidden',
      }}>
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid #1e1e1e',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <Video size={18} color={ajudaColor} />
          <span style={{ color: 'white', fontSize: '13px', fontWeight: '800' }}>
            🎬 Tutoriais em Vídeo
          </span>
        </div>
        <div style={{ padding: '12px' }}>
          {VIDEOS.map((v, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '12px', borderRadius: '10px',
              background: videoOpen === i ? `${ajudaColor}10` : '#0a0a0a',
              marginBottom: '6px',
              cursor: 'pointer',
              border: videoOpen === i ? `1px solid ${ajudaColor}44` : '1px solid transparent',
              transition: 'all 0.15s',
            }}
              onClick={() => setVideoOpen(videoOpen === i ? null : i)}
            >
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: `${ajudaColor}22`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Play size={16} color={ajudaColor} fill={ajudaColor} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  color: videoOpen === i ? ajudaColor : 'white',
                  fontSize: '12px', fontWeight: '700', margin: 0,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {v.titulo}
                </p>
                <p style={{ color: '#555', fontSize: '10px', margin: '2px 0 0' }}>
                  {v.duracao}
                </p>
              </div>
              <ExternalLink size={14} color="#333" style={{ flexShrink: 0 }} />
            </div>
          ))}
        </div>
      </div>

      {/* ── MANUAL (ACCORDION) ── */}
      <div style={{
        background: '#111', borderRadius: '16px',
        border: `1px solid ${ajudaColor}33`, marginBottom: '20px', overflow: 'hidden',
      }}>
        <div style={{
          padding: '16px 20px', borderBottom: `1px solid ${ajudaColor}22`,
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <HelpCircle size={18} color={ajudaColor} />
          <span style={{ color: 'white', fontSize: '14px', fontWeight: '800' }}>
            📖 Manual de Uso Rápido
          </span>
        </div>
        <div style={{ padding: '12px' }}>
          {MANUAL_ITENS.map((cat, ci) => (
            <details key={ci} style={{ marginBottom: '8px' }}>
              <summary style={{
                padding: '12px 16px', cursor: 'pointer',
                background: '#0a0a0a', borderRadius: '10px',
                color: '#ccc', fontSize: '12px', fontWeight: '800',
                listStyle: 'none', display: 'flex', alignItems: 'center', gap: '8px',
                userSelect: 'none', border: '1px solid #1e1e1e',
              }}>
                <ChevronDown
                  size={14}
                  style={{ color: '#555', flexShrink: 0, transition: 'transform 0.2s' }}
                  className="chevron-ajuda"
                />
                {cat.categoria}
              </summary>
              <div style={{ padding: '8px 0 4px' }}>
                {cat.sessoes.map((sessao, si) => (
                  <details key={si} style={{ marginBottom: '4px' }}>
                    <summary style={{
                      padding: '10px 14px', cursor: 'pointer',
                      background: '#0d0d0d', borderRadius: '8px',
                      color: '#999', fontSize: '11px', fontWeight: '700',
                      listStyle: 'none',
                      userSelect: 'none',
                    }}>
                      <ChevronDown
                        size={12}
                        style={{ color: '#444', flexShrink: 0, marginRight: '6px', display: 'inline' }}
                        className="chevron-ajuda"
                      />
                      {sessao.titulo}
                    </summary>
                    <div style={{
                      padding: '12px 14px',
                      background: '#0a0a0a',
                      borderLeft: `2px solid ${ajudaColor}44`,
                      marginLeft: '12px',
                      borderRadius: '0 0 8px 8px',
                    }}>
                      <p style={{
                        color: '#888', fontSize: '11px', lineHeight: '1.7',
                        margin: '0 0 12px 0',
                      }}>
                        {sessao.resposta}
                      </p>
                      <a
                        href={`https://wa.me/5534991439845?text=${encodeURIComponent(`Olá! Quero assistir o vídeo: ${sessao.video}`)}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '6px',
                          padding: '8px 16px', borderRadius: '20px',
                          background: 'linear-gradient(135deg, #FF0033, #ff3366)',
                          color: 'white', fontSize: '11px', fontWeight: '800',
                          textDecoration: 'none',
                          boxShadow: '0 4px 12px #FF003344',
                        }}
                      >
                        <Play size={10} fill="white" />
                        Ver Vídeo: {sessao.video}
                      </a>
                    </div>
                  </details>
                ))}
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* ── SUPORTE ── */}
      <div style={{
        background: 'linear-gradient(145deg, #0d1f0d, #0a1a0a)',
        borderRadius: '16px',
        border: '1px solid #22c55e44',
        padding: '24px', textAlign: 'center',
        marginBottom: '20px',
      }}>
        <p style={{ color: '#555', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '14px' }}>
          Precisa de ajuda personalizada?
        </p>
        <a
          href="https://wa.me/5534991439845?text=Olá! Preciso de ajuda com o sistema Oficina IA."
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '14px 28px', borderRadius: '30px',
            background: '#22c55e', color: 'black',
            fontWeight: '900', fontSize: '13px',
            textDecoration: 'none',
            boxShadow: '0 4px 20px #22c55e44',
          }}
        >
          <MessageCircle size={18} />
          Falar com Suporte no WhatsApp
        </a>
        <p style={{ color: '#444', fontSize: '10px', marginTop: '12px' }}>
          Resposta em até 2 horas úteis
        </p>
      </div>
    </div>
  );
}
