/* eslint-disable react/prop-types */
import React, { useCallback, useEffect, useMemo, useState } from 'react';

const TOUR_STORAGE_KEY = 'oficina_ia_tour_feito';
const TOUR_Z_INDEX = 10000000;

const PASSOS_TOUR = [
  // --- CONFIGURAÇÃO INICIAL ---
  {
    titulo: '1. O Cérebro (Ajustes) ⚙️',
    texto: `Aqui fica o centro de comando da Oficina IA. Configure a Identidade da sua IA e os links vitais; estes dados alimentam a inteligência que enviará informações precisas e profissionais aos seus clientes.`,
  },
  {
    titulo: '2. O Coração (Nova O.S.) 🚗',
    texto: `Sua máquina de vendas e relacionamento. Cadastre clientes e defina especialidades como Mecânica ou Elétrica. Envie diagnósticos, orçamentos e senhas de rastreio online. 
    
O diferencial? O botão EDITAR permite atualizar a O.S. a cada nova etapa, mantendo o histórico vivo sem abrir novos chamados.`,
  },

  // --- INTELIGÊNCIA ARTIFICIAL ---
  {
    titulo: '3. Copiloto 👨‍🔧',
    texto: `Seu apoio técnico de raciocínio rápido. Use para diagnósticos complexos e auxílio técnico direto no pátio.`,
  },
  {
    titulo: '4. Secretária 👩‍💼',
    texto: `Gerencie a comunicação e o follow-up. Automatize mensagens e garanta que nenhum cliente fique sem resposta.`,
  },
  {
    titulo: '5. Administrador 👔',
    texto: `A visão gerencial do dono. Acompanhe a saúde operacional e defina as metas de crescimento da oficina.`,
  },
  {
    titulo: '6. Assistente Fiscal 📋',
    texto: `Organização total de caixa e recibos. Tenha clareza financeira para tomadas de decisão seguras.`,
  },
  {
    titulo: '7. Mercado Livre 📦',
    texto: `Integração para busca e cotação de peças, agilizando o processo de compra e orçamento.`,
  },
  {
    titulo: '8. Retorno 📅',
    texto: `Fidelize seus clientes. Gerencie lembretes de revisões e retornos preventivos para manter o pátio sempre cheio.`,
  },
  {
    titulo: '9. Estratégia 🚀',
    texto: `Inteligência aplicada ao negócio. Analise dados para identificar oportunidades de expansão e lucro.`,
  },

  // --- GESTÃO ---
  {
    titulo: '10. Visão Geral 📊',
    texto: `Seu dashboard de indicadores (KPIs). O faturamento, o ticket médio e a performance da equipe em uma única tela.`,
  },
  {
    titulo: '11. Estoque 📦',
    texto: `Controle rigoroso de peças. Evite gargalos no serviço garantindo que os itens de alto giro nunca faltem.`,
  },
  {
    titulo: '12. Financeiro 💰',
    texto: `Controle de receitas e despesas. Utilize os BOTOES FLUTUANTES para lançamentos rápidos e gestão ágil do fluxo de caixa.`,
  },
  {
    titulo: '13. Clientes 👥',
    texto: `O seu centro de relacionamento. Centralize o histórico completo, preferências e dados de contato para um atendimento personalizado.`,
  },
  {
    titulo: '14. Tarefa 📋',
    texto: `Organize o fluxo de trabalho interno. Atribua responsabilidades e acompanhe o progresso de cada atividade da equipe.`,
  },
  {
    titulo: '15. Nota Fiscal 📄',
    texto: `Automatize sua burocracia. Emissão de notas e controle fiscal integrados para você focar no que importa: os carros.`,
  },
  {
    titulo: '16. Patrimônio 📊',
    texto: `Controle os ativos da sua oficina. Gerencie ferramentas, elevadores e equipamentos, acompanhando depreciação e manutenção.`,
  },
  {
    titulo: '17. Fornecedores 🤝',
    texto: `Gestão de parceiros e compras. Mantenha os melhores contatos e condições de negociação centralizados.`,
  },
  {
    titulo: '18. Histórico 📋',
    texto: `O banco de dados técnico da oficina. Consulte serviços passados para diagnósticos mais assertivos e garantia de qualidade.`,
  },
  {
    titulo: '19. Precificação 💰',
    texto: `Proteja sua margem de lucro. Calcule o preço ideal de serviços e peças com base nos seus custos reais.`,
  },

  // --- SISTEMA ---
  {
    titulo: '20. Meu Plano 💰',
    texto: `Gerencie sua assinatura e conheça novos recursos disponíveis para escalar sua operação.`,
  },
  {
    titulo: '21. Equipe 👥',
    texto: `Gestão de acesso e permissões. Defina quem pode ver ou editar cada módulo, garantindo segurança aos seus dados.`,
  },
  {
    titulo: '22. Marketing & Ajuda 📣',
    texto: `Promova sua oficina com ferramentas de marketing e, se precisar de apoio, nossa central de ajuda está a um clique para destravar seu uso.`,
  },
];

function TourModal({ aberto, passoAtual, totalPassos, passo, onAnterior, onProximo, onFechar }) {
  if (!aberto || !passo) return null;

  const ultimoPasso = passoAtual === totalPassos - 1;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: TOUR_Z_INDEX,
        background: 'rgba(0, 0, 0, 0.72)',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-modal-titulo"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: TOUR_Z_INDEX,
          width: 'min(92vw, 480px)',
          background: '#18181b', // Fundo escuro premium
          color: '#ffffff',
          border: '2px solid #ec4899', // Bordas rosa
          borderRadius: '12px', // Cantos arredondados conforme pedido
          boxShadow: '0 20px 60px rgba(236, 72, 153, 0.4)', // Sombra elegante rosa
          padding: '32px',
        }}
      >
        <div style={{ marginBottom: 18 }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: '800',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#ec4899',
              marginBottom: '12px',
            }}
          >
            {passoAtual + 1} / {totalPassos}
          </div>

          <h2
            id="tour-modal-titulo"
            style={{
              margin: 0,
              fontSize: 24,
              lineHeight: 1.2,
              color: '#ffffff',
            }}
          >
            {passo.titulo}
          </h2>
        </div>

        <p
          style={{
            margin: 0,
            fontSize: 16,
            lineHeight: 1.7,
            color: '#e5e7eb',
          }}
        >
          {passo.texto}
        </p>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            marginTop: 24,
          }}
        >
          <button
            type="button"
            onClick={onFechar}
            style={{
              border: 'none',
              background: 'transparent',
              color: '#666',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'uppercase',
            }}
          >
            Pular Tour
          </button>

          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={onAnterior}
              disabled={passoAtual === 0}
              style={{
                border: 'none',
                background: 'transparent',
                color: passoAtual === 0 ? '#333' : '#94a3b8', // Texto Cinza Claro
                cursor: passoAtual === 0 ? 'default' : 'pointer',
                fontSize: '14px',
                fontWeight: '700',
              }}
            >
              Anterior
            </button>

            <button
              type="button"
              onClick={onProximo}
              style={{
                border: 'none',
                borderRadius: '8px',
                background: '#10b981', // Verde Robusto
                color: '#ffffff',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '800',
                padding: '12px 24px',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.2s',
              }}
            >
              {ultimoPasso ? 'Concluir' : 'Próximo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(function OnboardingTour({
  setAbaAtiva,
  setMostrarOnboarding,
  modalBemVindoAberto
}) {
  if (modalBemVindoAberto) return null; // Trava lógica: Espera o modal de Ramos fechar

  const [tourConcluido, setTourConcluido] = useState(() => !!localStorage.getItem(TOUR_STORAGE_KEY));
  const [aberto, setAberto] = useState(false);
  const [passoAtual, setPassoAtual] = useState(0);

  console.log('ESTADO ATUAL:', { aberto, passoAtual, tourConcluido });

  const passos = useMemo(() => PASSOS_TOUR, []);

  useEffect(() => {
    if (!tourConcluido) {
      setPassoAtual(0);
      setAberto(true);
    }
  }, [tourConcluido]);

  const fecharTour = useCallback(() => {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    setTourConcluido(true);
    setAberto(false);

    if (typeof setAbaAtiva === 'function') {
      setAbaAtiva('dashboard');
    }

    if (typeof setMostrarOnboarding === 'function') {
      setMostrarOnboarding(false);
    }
  }, [setAbaAtiva, setMostrarOnboarding]);

  const irParaAnterior = useCallback(() => {
    setPassoAtual((p) => Math.max(0, p - 1));
  }, []);

  const irParaProximo = useCallback(() => {
    setPassoAtual((p) => {
      if (p >= passos.length - 1) {
        return p;
      }

      return p + 1;
    });
  }, [passos.length]);

  const avancarOuFinalizar = useCallback(() => {
    if (passoAtual >= passos.length - 1) {
      fecharTour();
      return;
    }

    irParaProximo();
  }, [fecharTour, irParaProximo, passoAtual, passos.length]);

  const reiniciarTour = useCallback(() => {
    localStorage.removeItem(TOUR_STORAGE_KEY);
    setTourConcluido(false);
    setPassoAtual(0);
    setAberto(true);
  }, []);

  return (
    <>
      <TourModal
        aberto={aberto}
        passoAtual={passoAtual}
        totalPassos={passos.length}
        passo={passos[passoAtual]}
        onAnterior={irParaAnterior}
        onProximo={avancarOuFinalizar}
        onFechar={fecharTour}
      />

      <button
        type="button"
        onClick={reiniciarTour}
        style={{
          position: 'fixed',
          left: '50%',
          bottom: 20,
          transform: 'translateX(-50%)',
          zIndex: TOUR_Z_INDEX,
          border: '1px solid #ec4899', // Voltando para o rosa do tema
          borderRadius: 999,
          background: '#18181b', // Fundo escuro premium
          color: '#ec4899',
          cursor: 'pointer',
          fontSize: 12,
          fontWeight: 700,
          padding: '10px 16px',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.28)',
        }}
      >
        Rever passo a passo
      </button>
    </>
  );
});
