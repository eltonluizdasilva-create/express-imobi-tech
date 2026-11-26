/**
 * MigracaoDados.jsx — ponto de entrada da aba `migracao` (D-23.16).
 * ============================================================================
 * A aba deixou de ser exclusiva de plano pago e virou o wizard de importação
 * em 3 etapas. Este arquivo apenas repassa as props do painel — nenhuma regra
 * de plano, nenhum banner de bloqueio, nenhum modal de ativação.
 * ============================================================================
 */

import React from 'react';
import MigracaoWizard from './migracao/MigracaoWizard';

export default function MigracaoDados(props) {
  return <MigracaoWizard {...props} />;
}
