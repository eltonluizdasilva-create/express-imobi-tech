/* eslint-disable react/prop-types */
import React, { useCallback, useEffect, useMemo, useState } from 'react';

const TOUR_STORAGE_KEY = 'oficina_ia_tour_feito';
const TOUR_Z_INDEX = 10000000;

// Lista completa atualizada com todas as abas do novo ecossistema
const PASSOS_TOUR = [
  {
    titulo: '🚀 1. O Portal do Cliente: Seu Diferencial!',
    texto: 'O fim das ligações chatas! Envie fotos e orçamentos direto para o celular do cliente. Ele acompanha tudo online e você valoriza sua mão de obra.',
  },
  {
    titulo: '📅 2. Retorno: O Dinheiro que Volta',
    texto: 'Nossa IA monitora revisões e avisa quando é hora de trazer o cliente de volta. Agenda cheia de forma automática.',
  },
  {
    titulo: '💼 3. Gestão Profissional (Assinantes)',
    texto: 'Ao assinar um plano, você libera o controle total de Clientes, Financeiro e Estoque. Tudo o que sua oficina precisa para sair do amadorismo e lucrar mais.',
  },
  {
    titulo: '🤖 4. Inteligência Artificial',
    texto: 'Copiloto, Assistente Fiscal e muito mais. Use o poder da IA para diagnosticar defeitos e gerenciar burocracias em segundos.',
  },
  {
    titulo: '💳 5. Planos e Slots',
    texto: 'Escolha quantas abas operacionais sua oficina precisa. Você paga apenas pelo que usa e tem todas as ferramentas de gestão inclusas nos planos pagos.',
  }
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

    </>
  );
});