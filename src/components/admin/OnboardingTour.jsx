/* eslint-disable react/prop-types */
import React, { useCallback, useEffect, useMemo, useState } from 'react';

const TOUR_STORAGE_KEY = 'oficina_ia_tour_feito';
const TOUR_Z_INDEX = 10000000;

// Lista completa atualizada com todas as abas do novo ecossistema
const PASSOS_TOUR = [

  {
    titulo: '🚀 1. O Portal do Cliente: Seu Diferencial!',
    texto: 'O fim das ligações chatas e clientes toda hora na sua porta! Envie fotos, status e orçamentos direto para o celular do cliente. Ele acompanha tudo online e você valoriza sua mão de obra.',
  },
  {
    titulo: '📅 2. Retorno: O Dinheiro que Volta',
    texto: 'Chega de oficina vazia! Nossa IA monitora revisões, trocas de óleo, baterias e muito mais, avisando quando é hora de trazer o cliente de volta. Agenda cheia de forma automática.',
  },
  {
    titulo: '📝 3. Checklist Digital: Sua Proteção',
    texto: 'Evite prejuízos e reclamações. Registre fotos e o estado do veículo na entrada. É a prova real que profissionaliza o recebimento e protege seu bolso contra problemas que já estavam lá.',
  },
  {
    titulo: '🔑 4. Portal do Cliente Exclusivo',
    texto: 'Seu cliente recebe uma senha para acompanhar o status, fotos e laudos em tempo real. Menos cobrança no seu ouvido e muito mais autoridade para sua marca.',
  },
  {
    titulo: '📈 5. Termômetro de Lucro',
    texto: 'Pare de trabalhar de graça! Saiba exatamente qual serviço te dá lucro real e qual está apenas ocupando espaço no elevador. Tome decisões baseadas em números e não em achismo.',
  },
  {
    titulo: '📦 6. Estoque: Onde está seu Dinheiro?',
    texto: 'Peça parada é prejuízo. Saiba exatamente o que você tem, evite compras em duplicidade e garanta que nenhuma peça saia da oficina sem ser cobrada na O.S.',
  },
  {
    titulo: '✅ 7. Aprovação em 1 Clique (WhatsApp)',
    texto: 'Agilidade é lucro. O cliente recebe o orçamento pelo WhatsApp e aprova com um toque. O carro não fica parado e o pátio gira muito mais rápido.',
  },
  {
    titulo: '⛓️ 8. Peças Pendentes: Fim do Gargalo',
    texto: 'Monitore o que trava sua produtividade. Saiba quais carros estão parados esperando peças e cobre seus fornecedores com dados reais. Elimine o tempo ocioso.',
  },
  {
    titulo: '🎯 9. Tudo à Mão: Atalhos Inteligentes',
    texto: 'Nossos botões flutuantes conectam tarefas, financeiro e clientes. Tudo fácil de acessar! Tire dúvidas ou faça compras sem sair da tela onde você está trabalhando.',
  },
  {
    titulo: '🎁 10. Liberdade: Comece Totalmente Grátis',
    texto: 'Teste o Premium por 15 dias. Depois, você decide: faça o upgrade ou continue usando nossas diversas ferramentas gratuitas para sempre. Você tem o controle do seu crescimento.',
  },
  {
    titulo: '🧠 Passo 1: O Cérebro (Ajustes) ⚙️',
    texto: 'Hora de dar vida ao sistema! Cadastre sua logo, chave PIX e dados. Isso ativa seus recibos profissionais e o Portal do Cliente. É aqui que sua oficina vira elite.',
  },
  {
    titulo: '🚗 Passo 2: O Coração (Ordem de Serviço)',
    texto: 'Tudo começa aqui. Abra O.S. completas com fotos e peças. Gerencie sua equipe e mantenha o cliente informado em tempo real com transparência total.',
  },
  {
    titulo: '❓ Passo 3: Dúvidas e Suporte ⚡',
    texto: 'Nunca fique travado! Use a aba Ajuda para tutoriais e conte com os botões flutuantes para navegar rápido. Estamos aqui para fazer sua oficina decolar!',
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

  const reiniciarTour = useCallback(() => {
    localStorage.removeItem(TOUR_STORAGE_KEY);
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
          zIndex: 10000000,
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