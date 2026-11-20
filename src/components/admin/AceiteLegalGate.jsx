/* eslint-disable react/prop-types */
import React, { useState } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ShieldCheck, ShieldAlert, Loader2, Lock } from 'lucide-react';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { ACEITES, VERSAO_ACEITE } from '../../lib/assistidos-legais';

/**
 * AceiteLegalGate — bloqueia a aba até o termo ser aceito uma vez.
 *
 * REGRA DE NEGÓCIO (2026-11-20): as abas "Minutas & Checklist" (`juridico_imobi`)
 * e "Simulador de Custos" (`contador`) só abrem depois de aceite explícito.
 * O aceite é gravado no documento da própria oficina:
 *
 *   oficinas/{id}.aceitesLegais = {
 *     minutasJuridicas:     <timestamp do servidor>,
 *     minutasJuridicasVersao: '2026-11-20',
 *     minutasJuridicasPor:  'email de quem aceitou'
 *   }
 *
 * Uso:
 *   <AceiteLegalGate chave="juridico_imobi" oficinaId={oficinaId}>
 *     ...conteúdo da aba...
 *   </AceiteLegalGate>
 *
 * Se `aceitesLegais.{chave}` existir na versão vigente, o conteúdo aparece
 * direto. Se existir em versão antiga, o termo volta a ser exigido (o texto
 * mudou — o consentimento antigo não cobre o novo).
 */
export default function AceiteLegalGate({ chave, oficinaId, children }) {
  const { dadosOficina, currentUser } = useAuth();
  const termo = ACEITES[chave];
  const [marcado, setMarcado] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const oficinaAtual = oficinaId || dadosOficina?.id || dadosOficina?.oficinaId || null;
  const registro = dadosOficina?.aceitesLegais || {};
  const aceitoEm = registro?.[termo?.chave];
  const versaoGravada = registro?.[`${termo?.chave}Versao`];
  const aceito = Boolean(aceitoEm) && versaoGravada === VERSAO_ACEITE;

  if (!termo) return children;
  if (aceito) return children;

  const registrarAceite = async () => {
    if (!marcado || !oficinaAtual || salvando) return;
    setSalvando(true);
    setErro('');
    try {
      await setDoc(
        doc(db, 'oficinas', oficinaAtual),
        {
          aceitesLegais: {
            [termo.chave]: serverTimestamp(),
            [`${termo.chave}Versao`]: VERSAO_ACEITE,
            [`${termo.chave}Por`]: currentUser?.email || '',
          },
        },
        { merge: true }
      );
    } catch (e) {
      setErro(
        e?.code === 'permission-denied'
          ? 'Sem permissão para registrar o aceite nesta organização. Peça ao dono da conta para abrir a aba primeiro.'
          : `Não foi possível registrar o aceite: ${e?.message || 'erro desconhecido'}`
      );
    } finally {
      setSalvando(false);
    }
  };

  const dataAceiteAnterior = aceitoEm?.toDate ? aceitoEm.toDate().toLocaleDateString('pt-BR') : null;

  return (
    <div className="mx-auto max-w-2xl space-y-5 rounded-3xl border border-amber-500/30 bg-[#020408] p-6 md:p-8">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-2.5">
          <Lock size={20} className="text-amber-400" />
        </div>
        <div className="space-y-1">
          <h2 className="text-sm font-black uppercase tracking-wider text-white">{termo.titulo}</h2>
          <p className="text-xs leading-relaxed text-slate-400">{termo.resumo}</p>
          {dataAceiteAnterior && !aceito && (
            <p className="text-[11px] font-bold text-amber-400">
              Aceite anterior de {dataAceiteAnterior} era da versão {versaoGravada || '—'}; o termo mudou.
            </p>
          )}
        </div>
      </div>

      <ul className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        {termo.itens.map((item) => (
          <li key={item} className="flex items-start gap-2 text-xs leading-relaxed text-slate-300">
            <ShieldCheck size={13} className="mt-0.5 shrink-0 text-emerald-400" />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <input
          type="checkbox"
          checked={marcado}
          onChange={(e) => setMarcado(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-emerald-500"
        />
        <span className="text-xs leading-relaxed text-slate-200">
          Li e aceito os termos acima. Entendo que o conteúdo desta aba é{' '}
          <strong className="text-white">rascunho/estimativa</strong> e que a revisão por{' '}
          <strong className="text-white">
            {chave === 'juridico_imobi' ? 'advogado (OAB)' : 'contador (CRC)'}
          </strong>{' '}
          é obrigatória antes de qualquer uso com cliente.
        </span>
      </label>

      {erro && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-[11px] text-rose-300">
          <ShieldAlert size={14} className="mt-0.5 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      <button
        type="button"
        onClick={registrarAceite}
        disabled={!marcado || !oficinaAtual || salvando}
        className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-wider transition ${
          !marcado || !oficinaAtual || salvando
            ? 'cursor-not-allowed bg-slate-800 text-slate-500'
            : 'cursor-pointer bg-emerald-500 text-white hover:bg-emerald-400'
        }`}
      >
        {salvando ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
        {salvando ? 'Registrando aceite…' : 'Aceitar e liberar a aba'}
      </button>

      <p className="text-[10px] leading-relaxed text-slate-500">
        O aceite fica registrado no documento da organização (timestamp do servidor + versão do termo +
        e-mail de quem aceitou). Versão vigente: {VERSAO_ACEITE}.
        {!oficinaAtual && ' Não foi possível identificar a organização desta sessão.'}
      </p>
    </div>
  );
}
