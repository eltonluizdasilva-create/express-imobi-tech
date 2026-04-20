/* eslint-disable react/prop-types */
import React, { useCallback, useEffect, useMemo, useState } from 'react';

const TOUR_STORAGE_KEY = 'oficina_ia_tour_feito';
const TOUR_Z_INDEX = 10000000;

const PASSOS_TOUR = [
  {
    titulo: '1. O Cerebro (Ajustes)',
    texto:
      'Aqui fica o centro de comando da Oficina IA. Configure a base do sistema e entenda que este passo e o ponto de partida da sua operacao.',
  },
  {
    titulo: '2. O Coracao (Nova O.S.)',
    texto:
      'Nesta etapa voce cria a nova ordem de servico, organiza atendimento e pode preparar a experiencia do cliente com senha e acompanhamento.',
  },
  {
    titulo: '3. Passeio pelas Abas',
    texto:
      'Agora voce tem uma visao geral da plataforma. Vamos percorrer IA, gestao, sistema e indicadores para entender o fluxo completo.',
  },
  {
    titulo: '4. Copiloto',
    texto:
      'Use o Copiloto para apoio tecnico, raciocinio rapido e ajuda no diagnostico durante o atendimento.',
  },
  {
    titulo: '5. Secretaria',
    texto:
      'A Secretaria ajuda na comunicacao com clientes, mensagens, follow-up e rotina comercial com mais consistencia.',
  },
  {
    titulo: '6. Administrador',
    texto:
      'No Administrador voce acompanha visao gerencial, metas e a saude operacional da oficina.',
  },
  {
    titulo: '7. Contador',
    texto:
      'O Contador organiza caixa, recibos e leitura financeira para voce ter mais clareza sobre o negocio.',
  },
  {
    titulo: '8. Estoque',
    texto:
      'Controle pecas, reposicao e disponibilidade para reduzir perda de tempo e gargalos no servico.',
  },
  {
    titulo: '9. Financeiro',
    texto:
      'Aqui voce acompanha receitas, despesas e a movimentacao financeira do dia a dia.',
  },
  {
    titulo: '10. Precificacao',
    texto:
      'Use esta area para montar precos com seguranca e proteger a margem da oficina.',
  },
  {
    titulo: '11. Meu Plano',
    texto:
      'Consulte assinatura, beneficios e status do seu plano sempre que precisar.',
  },
  {
    titulo: '12. Equipe',
    texto:
      'Gerencie colaboradores, acessos e responsabilidades para manter a operacao organizada.',
  },
  {
    titulo: '13. Ajuda',
    texto:
      'Quando surgir qualquer duvida, esta area concentra suporte, orientacoes e caminhos para destravar o uso.',
  },
  {
    titulo: '14. Faturamento',
    texto:
      'Este passo mostra a leitura do faturamento e ajuda voce a acompanhar desempenho e resultado da oficina.',
  },
  {
    titulo: '15. Patio',
    texto:
      'Fechamos no patio para enxergar fluxo, ocupacao e ritmo real da operacao no dia a dia.',
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
              {ultimoPasso ? 'Finalizar' : 'Proximo'}
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
  const [tourConcluido, setTourConcluido] = useState(() => !!localStorage.getItem(TOUR_STORAGE_KEY));
  const [aberto, setAberto] = useState(false);
  const [passoAtual, setPassoAtual] = useState(0);

  console.log('ESTADO ATUAL:', { aberto, passoAtual, tourConcluido, modalBemVindoAberto });

  const passos = useMemo(() => PASSOS_TOUR, []);

  useEffect(() => {
    // Removemos a trava do modal de boas-vindas
    if (!tourConcluido) {
      setPassoAtual(0);
      setAberto(true);
      return;
    }

    if (modalBemVindoAberto) {
      setAberto(false);
    }
  }, [tourConcluido, modalBemVindoAberto]);

  const fecharTour = useCallback(() => {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    setTourConcluido(true);
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
    setAberto(!modalBemVindoAberto);
  }, [modalBemVindoAberto]);

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
          right: 20,
          bottom: 20,
          zIndex: TOUR_Z_INDEX,
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
