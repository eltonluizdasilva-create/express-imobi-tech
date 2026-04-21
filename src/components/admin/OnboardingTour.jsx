/* eslint-disable react/prop-types */
import React, { useCallback, useEffect, useMemo, useState } from 'react';

const TOUR_STORAGE_KEY = 'oficina_ia_tour_feito';
const TOUR_Z_INDEX = 10000000;

// Lista completa atualizada com todas as abas do novo ecossistema
const PASSOS_TOUR = [
  {
    titulo: 'Passo 1: Foco em Ajustes (O Cérebro) ⚙️',
    texto: 'Cadastre os dados da sua empresa uma única vez e tenha recibos personalizados e chaves PIX integradas. Transforme cada atendimento em uma entrega profissional que reforça a confiança da sua marca.',
  },
  {
    titulo: 'Passo 2: Foco na Nova O.S. (O Coração) 🚗',
    texto: 'Este é o coração do app. Ao gerar uma O.S., você cria uma central de controle onde pode editar serviços, mandar mensagens, anexar fotos e gerar uma senha para o cliente acompanhar tudo online.',
  },
  {
    titulo: 'Passo 3: Tour pelas Abas (Passeio Funcional) 🛠️',
    texto: 'Agora você tem uma visão geral da plataforma. Vamos percorrer IA, Gestão, Sistema e Indicadores para você dominar cada recurso do seu novo ecossistema de trabalho.',
  },
  // ==========================================
  // 🧠 INTELIGÊNCIA ARTIFICIAL
  // ==========================================
  {
    titulo: '👨‍🔧 Copiloto - Seu Assistente',
    texto: 'Aqui você consegue um diagnóstico rápido para qualquer problema. A IA analisa a situação e oferece soluções práticas. Use sempre que tiver dúvida no pátio!',
  },
  {
    titulo: '👩‍💼 Secretária - Comunicação',
    texto: 'Deixe a IA gerenciar sua comunicação com clientes. Templates automáticos, mensagens em massa e acompanhamento de conversas - tudo organizado.',
  },
  {
    titulo: '👔 Administrador - Metas e Objetivos',
    texto: 'Defina metas para sua oficina e acompanhe o progresso em tempo real. Conhecer seus números é o primeiro passo para crescer!',
  },
  {
    titulo: '📋 Assist. Fiscal - Caixa e Recibos',
    texto: 'Gerencie suas finanças com inteligência. Recibos, cupons e relatórios de caixa organizados para trazer clareza para o seu negócio.',
  },
  {
    titulo: '📦 Compras - Reposição Inteligente',
    texto: 'A IA ajuda você a gerenciar pedidos com fornecedores e cotações, buscando sempre o melhor custo-benefício e evitando a falta de peças.',
  },
  {
    titulo: '📅 Retorno - Fidelização Ativa',
    texto: 'Automatize o pós-venda. O sistema gerencia retornos, lembra o cliente de revisões futuras e ajuda a manter a agenda da oficina sempre cheia.',
  },
  {
    titulo: '🚀 Estratégia - Crescimento',
    texto: 'Insights gerados por IA para alavancar sua oficina. Descubra tendências, identifique gargalos operacionais e encontre oportunidades ocultas.',
  },
  {
    titulo: '💰 Precificação - Proteja sua Margem',
    texto: 'Calcule o preço ideal para serviços e peças com segurança. A IA ajuda a garantir orçamentos precisos para você nunca deixar dinheiro na mesa.',
  },
  // ==========================================
  // 📋 GESTÃO
  // ==========================================
  {
    titulo: '📊 Visão Geral - O Painel',
    texto: 'Um dashboard completo com os indicadores vitais da sua oficina. Monitore faturamento, O.S. abertas e produtividade em um único lugar.',
  },
  {
    titulo: '📦 Estoque - Controle Absoluto',
    texto: 'Organize seu inventário e reduza desperdícios. Controle a disponibilidade de peças para evitar que os mecânicos fiquem parados esperando material.',
  },
  {
    titulo: '📊 Financeiro - A Saúde do Negócio',
    texto: 'Acompanhe todas as receitas e despesas. Entenda exatamente a movimentação do seu caixa no dia a dia com relatórios claros.',
  },
  {
    titulo: '🏗️ Desmanche - Gestão de Lotes',
    texto: 'Controle completo para operações de desmanche. Gerencie a entrada de veículos, catalogação de peças e a rentabilidade de cada sucata.',
  },
  {
    titulo: '👥 Clientes - Sua Base de Ouro',
    texto: 'Cadastro detalhado, preferências e informações de contato. Mantenha os dados dos seus clientes sempre atualizados para um atendimento VIP.',
  },
  {
    titulo: '📋 Tarefa - Ritmo do Pátio',
    texto: 'Distribua serviços, defina prioridades e acompanhe a execução das tarefas da equipe para manter a produtividade da oficina em alta.',
  },
  {
    titulo: '📄 Nota Fiscal - Sem Burocracia',
    texto: 'Módulo dedicado para a emissão de notas fiscais, integrado ao seu faturamento para manter a operação legalizada sem dor de cabeça.',
  },
  {
    titulo: '📊 Patrimônio - Seus Ativos',
    texto: 'Gerencie ferramentas, elevadores e equipamentos de diagnóstico. Tenha o controle do que pertence à oficina e o status de manutenção de cada item.',
  },
  {
    titulo: '🤝 Fornecedores - Parceiros',
    texto: 'Centralize contatos e condições de pagamento dos seus parceiros de autopeças e serviços terceirizados.',
  },
  {
    titulo: '📋 Histórico - Memória da Oficina',
    texto: 'Acesse rapidamente qualquer Ordem de Serviço ou veículo que já passou pela sua oficina. O arquivo digital completo da sua operação.',
  },
  // ==========================================
  // ⚙️ SISTEMA
  // ==========================================
  {
    titulo: '💰 Meu Plano - Sua Assinatura',
    texto: 'Consulte seu plano ativo, verifique benefícios e acompanhe o status da sua assinatura da Oficina IA sempre que precisar.',
  },
  {
    titulo: '⚙️ Ajustes - Configurações',
    texto: 'Personalize o sistema com as informações da sua oficina, horários de funcionamento e preferências operacionais.',
  },
  {
    titulo: '👥 Equipe - Permissões',
    texto: 'Cadastre colaboradores e controle exatamente o que cada um pode ver ou editar dentro do sistema. Segurança total para os seus dados.',
  },
  {
    titulo: '📣 Marketing - Destaque sua Marca',
    texto: 'Ferramentas e campanhas para alavancar o nome da sua oficina, atrair novos clientes e profissionalizar a presença digital do seu negócio.',
  },
  {
    titulo: '❓ Ajuda - Suporte e Manuais',
    texto: 'Surgiu alguma dúvida? Esta área concentra tutoriais, manuais e o caminho direto para falar com nosso suporte técnico.',
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
          width: 'min(92vw, 560px)',
          background: '#0f172a',
          color: '#f8fafc',
          border: '2px solid #ff2d55',
          borderRadius: 18,
          boxShadow: '0 28px 90px rgba(0, 0, 0, 0.45)',
          padding: 24,
        }}
      >
        <div style={{ marginBottom: 18 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#fb7185',
              marginBottom: 10,
            }}
          >
            Passo {passoAtual + 1} de {totalPassos}
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

        {/* Alterado para div para evitar erros se o texto for muito complexo */}
        <div
          style={{
            margin: 0,
            fontSize: 16,
            lineHeight: 1.7,
            color: '#e5e7eb',
          }}
        >
          {passo.texto}
        </div>

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
              border: '1px solid #475569',
              borderRadius: 10,
              background: 'transparent',
              color: '#cbd5e1',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 700,
              padding: '10px 16px',
            }}
          >
            Fechar
          </button>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={onAnterior}
              disabled={passoAtual === 0}
              style={{
                border: '1px solid #334155',
                borderRadius: 10,
                background: passoAtual === 0 ? '#1e293b' : '#111827',
                color: passoAtual === 0 ? '#64748b' : '#e5e7eb',
                cursor: passoAtual === 0 ? 'not-allowed' : 'pointer',
                fontSize: 14,
                fontWeight: 700,
                padding: '10px 16px',
              }}
            >
              Anterior
            </button>

            <button
              type="button"
              onClick={onProximo}
              style={{
                border: 'none',
                borderRadius: 10,
                background: '#22c55e',
                color: '#052e16',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 800,
                padding: '10px 16px',
              }}
            >
              {ultimoPasso ? 'Finalizar' : 'Próximo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(function OnboardingTour({
  setMostrarOnboarding,
  modalBemVindoAberto = false,
}) {
  const [aberto, setAberto] = useState(false);
  const [passoAtual, setPassoAtual] = useState(0);

  const passos = useMemo(() => PASSOS_TOUR, []);

  // Lógica de abertura inicial corrigida e simplificada
  useEffect(() => {
    const tourJaFoiFeito = localStorage.getItem(TOUR_STORAGE_KEY) === 'true';

    // Só tenta abrir automaticamente se não foi feito e não tem outro modal bloqueando
    if (!tourJaFoiFeito && !modalBemVindoAberto) {
      setAberto(true);
    } else if (modalBemVindoAberto) {
      // Se o modal de boas vindas aparecer, garantimos que o tour esconde
      setAberto(false);
    }
  }, [modalBemVindoAberto]);

  const fecharTour = useCallback(() => {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    setAberto(false);

    if (typeof setMostrarOnboarding === 'function') {
      setMostrarOnboarding(false);
    }
  }, [setMostrarOnboarding]);

  const reiniciarTour = useCallback(() => {
    localStorage.removeItem(TOUR_STORAGE_KEY);
    setPassoAtual(0);
    setAberto(true); // Força a reabertura imediata
  }, []);

  const irParaAnterior = useCallback(() => {
    setPassoAtual((p) => Math.max(0, p - 1));
  }, []);

  const irParaProximo = useCallback(() => {
    setPassoAtual((p) => {
      if (p >= passos.length - 1) return p;
      return p + 1;
    });
  }, [passos.length]);

  const avancarOuFinalizar = useCallback(() => {
    if (passoAtual >= passos.length - 1) {
      fecharTour();
    } else {
      irParaProximo();
    }
  }, [fecharTour, irParaProximo, passoAtual, passos.length]);

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

      {/* Botão sempre visível para rever o tour */}
      <button
        type="button"
        onClick={reiniciarTour}
        style={{
          position: 'fixed',
          right: 20,
          bottom: 20,
          zIndex: TOUR_Z_INDEX - 1,
          border: '1px solid #ff2d55',
          borderRadius: 999,
          background: '#0f172a',
          color: '#ff2d55',
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