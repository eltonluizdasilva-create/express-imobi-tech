/**
 * SolicitacaoExclusaoDados.jsx — fluxo explícito de exclusão de dados (LGPD).
 * ============================================================================
 * Um único componente para os dois lados do produto (D-22.05):
 *
 *   contexto="portal" → visitante/cliente final. A imobiliária é a controladora
 *     dos dados; a Express Tech é operadora e encaminha o pedido.
 *   contexto="conta"  → titular da conta (imobiliária/corretor). Informa o que
 *     é apagado, o que pode ser retido por obrigação legal e como exportar
 *     antes de encerrar.
 *
 * O pedido é feito por e-mail com assunto fixo — o mesmo canal citado no rodapé
 * da Home, no painel, no portal e na Política de Privacidade. Nada é gravado no
 * navegador: exclusão não é formulário de coleta.
 *
 * Acessibilidade: `role="dialog"`, foco no primeiro botão ao abrir, Esc fecha e
 * o fundo escurecido também fecha por clique.
 * ============================================================================
 */
import React, { useEffect, useRef, useState } from 'react';
import { Copy, Lock, Mail, X } from 'lucide-react';
import { EMAIL_INSTITUCIONAL } from '../../lib/appUrl';
import { abrirPreferenciasCookies } from '../../lib/consentimentoCookies';

const ASSUNTO = 'LGPD - Exclusão de dados';

function montarCorpo({ contexto = 'portal', emailConta = '', nomeImobiliaria = '' }) {
  const linhas = [
    'Olá, equipe Express Tech.',
    '',
    'Solicito a exclusão dos meus dados pessoais, conforme a LGPD (Lei 13.709/2018).',
    '',
    `Contexto: ${contexto === 'conta' ? 'titular da conta na plataforma' : 'cliente/visitante do portal de imóveis'}.`,
  ];
  if (nomeImobiliaria) linhas.push(`Imobiliária envolvida: ${nomeImobiliaria}.`);
  if (emailConta) linhas.push(`E-mail da conta: ${emailConta}.`);
  linhas.push(
    '',
    'Dados a excluir: (descreva, por exemplo, cadastro completo, histórico de atendimento, dados de um imóvel ou de um contato).',
    'Nome completo:',
    'Telefone/e-mail usado no contato:',
    '',
    'Estou ciente de que registros que a lei obriga a manter (por exemplo, documento fiscal) podem ficar bloqueados pelo prazo legal.'
  );
  return linhas.join('\n');
}

export default function SolicitacaoExclusaoDados({
  aberto = false,
  onFechar = null,
  contexto = 'portal',
  emailConta = '',
  nomeImobiliaria = '',
}) {
  const primeiroBotaoRef = useRef(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!aberto) return undefined;
    const aoTeclar = (evento) => {
      if (evento.key === 'Escape' && typeof onFechar === 'function') onFechar();
    };
    document.addEventListener('keydown', aoTeclar);
    try {
      primeiroBotaoRef.current?.focus();
    } catch {
      /* ambiente sem foco programático */
    }
    return () => document.removeEventListener('keydown', aoTeclar);
  }, [aberto, onFechar]);

  if (!aberto) return null;

  const corpo = montarCorpo({ contexto, emailConta, nomeImobiliaria });
  const linkEmail = `mailto:${EMAIL_INSTITUCIONAL}?subject=${encodeURIComponent(ASSUNTO)}&body=${encodeURIComponent(corpo)}`;

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(`Para: ${EMAIL_INSTITUCIONAL}\nAssunto: ${ASSUNTO}\n\n${corpo}`);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      setCopiado(false);
    }
  };

  const ehConta = contexto === 'conta';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-exclusao-dados"
      onClick={(e) => { if (e.target === e.currentTarget && typeof onFechar === 'function') onFechar(); }}
      className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-700 bg-slate-950 p-6 text-left shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <h2 id="titulo-exclusao-dados" className="flex items-center gap-2 text-base font-black text-white">
            <Lock size={16} aria-hidden="true" className="text-[#10b981]" />
            Solicitar exclusão dos meus dados
          </h2>
          <button
            type="button"
            onClick={() => (typeof onFechar === 'function' ? onFechar() : null)}
            aria-label="Fechar a janela de exclusão de dados"
            className="cursor-pointer rounded-lg p-1 text-slate-400 transition hover:text-white"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {ehConta ? (
          <div className="mt-4 space-y-3 text-[12.5px] leading-relaxed text-slate-300">
            <p>
              O pedido apaga o cadastro da conta e os dados vinculados a ela: imóveis, leads, visitas,
              propostas, fotos e documentos enviados.
            </p>
            <p>
              Antes de pedir, exporte o que precisar guardar (carteira de imóveis e lista de leads). O
              encerramento não gera multa e a assinatura pode ser cancelada na tela Meu Plano.
            </p>
            <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-amber-200">
              Documento fiscal e registro de acesso podem ficar bloqueados pelo prazo legal, sem uso para
              outra finalidade.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3 text-[12.5px] leading-relaxed text-slate-300">
            <p>
              Os dados que você enviou neste portal pertencem ao atendimento da imobiliária responsável pelos
              imóveis — ela é a controladora. A Express Tech é operadora da plataforma.
            </p>
            <p>
              Você pode pedir a exclusão diretamente à imobiliária, pelo canal de atendimento dela, ou enviar
              o pedido para a Express Tech: nós identificamos a imobiliária e encaminhamos.
            </p>
            <p className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2">
              A plataforma não guarda cópia própria do seu contato além do registro feito no CRM da
              imobiliária.
            </p>
          </div>
        )}

        <div className="mt-4 rounded-xl border border-slate-800 bg-[#020408] p-3 text-[11.5px] leading-relaxed text-slate-400">
          <p className="font-bold text-slate-200">Como o pedido é atendido</p>
          <p className="mt-1">
            Envie o e-mail com o assunto <strong className="text-slate-200">{ASSUNTO}</strong> para{' '}
            <span className="text-slate-200">{EMAIL_INSTITUCIONAL}</span>, informando nome, contato usado no
            cadastro e o que deseja excluir. Confirmamos o recebimento e informamos o prazo de atendimento no
            primeiro retorno.
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <a
            ref={primeiroBotaoRef}
            href={linkEmail}
            className="inline-flex items-center gap-2 rounded-xl bg-[#10b981] px-4 py-2.5 text-[12px] font-black text-[#020408] transition hover:brightness-110"
          >
            <Mail size={14} aria-hidden="true" />
            Abrir e-mail de solicitação
          </a>
          <button
            type="button"
            onClick={copiar}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-[12px] font-bold text-slate-200 transition hover:border-[#10b981] hover:text-white"
          >
            <Copy size={14} aria-hidden="true" />
            {copiado ? 'Texto copiado' : 'Copiar texto do pedido'}
          </button>
          <button
            type="button"
            onClick={() => abrirPreferenciasCookies()}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-[12px] font-bold text-slate-200 transition hover:border-[#10b981] hover:text-white"
          >
            Preferências de cookies
          </button>
        </div>

        <p className="mt-3 text-[11px] text-slate-500">
          Detalhes dos seus direitos e dos prazos de guarda estão na Política de Privacidade.
        </p>
      </div>
    </div>
  );
}
