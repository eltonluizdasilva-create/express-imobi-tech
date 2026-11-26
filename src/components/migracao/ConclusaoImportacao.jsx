/**
 * ConclusaoImportacao.jsx — Etapa 3 do wizard (D-23.16).
 * Mostra o que foi gravado, o que falhou e leva direto para o CRM/Captação.
 */

import React from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, RefreshCw } from 'lucide-react';
import { BOTAO_PRIMARIO, tons } from './estilo';

export default function ConclusaoImportacao({ temaClaro = false, resultado, onIrPara, onRecomecar }) {
  const c = tons(temaClaro);
  const { leads = 0, imoveis = 0, fotos = 0, falhas = [] } = resultado || {};
  const total = leads + imoveis;

  return (
    <div className="space-y-4">
      <section
        className={`rounded-2xl border p-5 ${c.card}`}
        style={{ borderColor: total > 0 ? 'rgba(16,185,129,0.45)' : 'rgba(245,158,11,0.45)' }}
        aria-live="polite"
      >
        <div className="flex items-start gap-4">
          <span
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
              total > 0 ? 'bg-emerald-500/15 text-emerald-500' : 'bg-amber-500/15 text-amber-500'
            }`}
          >
            {total > 0 ? <CheckCircle2 size={26} /> : <AlertTriangle size={26} />}
          </span>

          <div className="min-w-0">
            <h2 className={`text-lg font-black uppercase tracking-tight ${c.titulo}`}>
              {total > 0 ? 'Importação concluída' : 'Nada foi gravado'}
            </h2>
            <p className={`mt-1 text-xs leading-relaxed ${c.texto}`}>
              {total > 0
                ? 'Os registros já estão nas abas de trabalho. A temperatura acompanha cada lead e a mensagem sugerida fica salva no cadastro.'
                : 'Confira as mensagens de erro abaixo e tente de novo. Nenhum registro parcial ficou no CRM.'}
            </p>
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-3 gap-2">
          {[
            { rotulo: 'Leads no CRM', valor: leads },
            { rotulo: 'Imóveis na Captação', valor: imoveis },
            { rotulo: 'Fotos no Storage', valor: fotos },
          ].map((item) => (
            <div key={item.rotulo} className={`rounded-xl border px-3 py-2.5 ${c.cardSuave}`}>
              <dt className={`text-[9px] font-black uppercase tracking-[0.18em] ${c.fraco}`}>{item.rotulo}</dt>
              <dd className={`mt-0.5 text-2xl font-black leading-none ${c.titulo}`}>{item.valor}</dd>
            </div>
          ))}
        </dl>

        {falhas.length ? (
          <div className={`mt-4 rounded-xl border px-3 py-2.5 ${c.cardSuave}`}>
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">
              {falhas.length} item(ns) com falha
            </p>
            <ul className={`mt-1 space-y-1 text-[11px] ${c.texto}`}>
              {falhas.slice(0, 12).map((falha) => (
                <li key={falha} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden="true" />
                  {falha}
                </li>
              ))}
            </ul>
            {falhas.length > 12 ? (
              <p className={`mt-1 text-[10px] ${c.fraco}`}>… e mais {falhas.length - 12} ocorrência(s).</p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2">
          {leads > 0 ? (
            <button type="button" onClick={() => onIrPara('funil_leads')} className={BOTAO_PRIMARIO}>
              Abrir o Funil CRM <ArrowRight size={15} />
            </button>
          ) : null}
          {imoveis > 0 ? (
            <button type="button" onClick={() => onIrPara('captacao_imobi')} className={BOTAO_PRIMARIO}>
              Abrir Captação &amp; Imóveis <ArrowRight size={15} />
            </button>
          ) : null}
          <button
            type="button"
            onClick={onRecomecar}
            className={`${BOTAO_PRIMARIO} !bg-none !shadow-none ${c.card} ${c.titulo} !border`}
          >
            <RefreshCw size={15} /> Importar outra base
          </button>
        </div>
      </section>

      <p className={`text-[11px] leading-relaxed ${c.fraco}`}>
        Segurança: a leitura do XML acontece no servidor (link do portal não abre no navegador por CORS) e as fotos
        são compactadas antes de subir. Nenhuma chave de portal ou de IA fica exposta no painel.
      </p>
    </div>
  );
}
