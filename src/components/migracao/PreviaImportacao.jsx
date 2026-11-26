/**
 * PreviaImportacao.jsx — Etapa 2 do wizard (D-23.16)
 * ============================================================================
 * Nada é gravado antes de o corretor ver o que vai entrar:
 *   • leads em tabela (PreviaLeads), com tag editável e mensagem pronta;
 *   • imóveis em cartões, com capa, fotos do feed e anexo manual até 7.
 * ============================================================================
 */

import React from 'react';
import { Check, ImagePlus, Trash2, X } from 'lucide-react';
import PreviaLeads from './PreviaLeads';
import { MAX_FOTOS_IMOVEL } from '../../lib/fotosImovel';
import { tons } from './estilo';

const moeda = (valor) =>
  Number(valor) > 0
    ? Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
    : 'valor não informado';

function Galeria({ imovel, temaClaro, onRemoverFotoManual }) {
  const c = tons(temaClaro);
  const doFeed = (imovel.fotos || []).map((url, indice) => ({
    tipo: 'url',
    chave: `feed-${indice}`,
    url,
    indiceFeed: indice,
  }));
  const manuais = (imovel.fotosManuais || []).map((foto, indice) => ({
    tipo: 'arquivo',
    chave: `manual-${indice}`,
    preview: foto.preview,
    indice,
  }));
  const fotos = [...doFeed, ...manuais].slice(0, MAX_FOTOS_IMOVEL);

  return (
    <div className="flex flex-wrap gap-1.5">
      {fotos.length === 0 ? (
        <p className={`text-[11px] ${c.fraco}`}>
          Sem foto neste imóvel — anexe abaixo (até {MAX_FOTOS_IMOVEL}, WebP 1280px).
        </p>
      ) : null}

      {fotos.map((foto, indice) => (
        <div key={foto.chave} className={`relative h-16 w-20 overflow-hidden rounded-lg border ${c.cardSuave}`}>
          {foto.tipo === 'url' ? (
            <img
              src={foto.url}
              alt={`Foto ${indice + 1} do imóvel ${imovel.titulo}`}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : foto.preview ? (
            <img
              src={foto.preview}
              alt={`Foto anexada ${indice + 1} do imóvel ${imovel.titulo}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className={`flex h-full w-full items-center justify-center text-[9px] font-bold ${c.fraco}`}>
              WebP
            </span>
          )}

          {indice === 0 ? (
            <span className="absolute left-0 top-0 rounded-br-lg bg-emerald-500 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-white">
              Capa
            </span>
          ) : null}

          {foto.tipo === 'arquivo' ? (
            <button
              type="button"
              onClick={() => onRemoverFotoManual(imovel.id, foto.indice)}
              className="absolute right-0 top-0 rounded-bl-lg bg-black/70 p-1 text-white transition hover:bg-rose-600"
              aria-label={`Remover foto anexada ${indice + 1}`}
            >
              <X size={10} />
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function CartaoImovel({
  imovel,
  temaClaro,
  onAlternarSelecao,
  onRemover,
  onAnexarFotos,
  onRemoverFotoManual,
}) {
  const c = tons(temaClaro);
  const totalFotos = (imovel.fotos || []).length + (imovel.fotosManuais || []).length;
  const vagas = Math.max(0, MAX_FOTOS_IMOVEL - totalFotos);

  return (
    <article className={`rounded-2xl border p-4 ${c.card} ${imovel.selecionado ? '' : 'opacity-60'}`}>
      <header className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => onAlternarSelecao(imovel.id)}
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${
            imovel.selecionado ? 'border-emerald-500 bg-emerald-500 text-white' : c.input
          }`}
          aria-label={`${imovel.selecionado ? 'Desmarcar' : 'Marcar'} imóvel ${imovel.titulo}`}
        >
          {imovel.selecionado ? <Check size={12} /> : null}
        </button>

        <div className="min-w-0 flex-1">
          <h4 className={`truncate text-sm font-black ${c.titulo}`} title={imovel.titulo}>
            {imovel.titulo}
          </h4>
          <p className={`text-[11px] ${c.fraco}`}>
            {[imovel.codigo ? `Cód. ${imovel.codigo}` : '', imovel.tipo, imovel.finalidade]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onRemover(imovel.id)}
          className={`rounded-lg p-1.5 transition hover:bg-rose-500/10 hover:text-rose-500 ${c.fraco}`}
          aria-label={`Remover imóvel ${imovel.titulo} da importação`}
        >
          <Trash2 size={14} />
        </button>
      </header>

      <div className="mt-3">
        <Galeria imovel={imovel} temaClaro={temaClaro} onRemoverFotoManual={onRemoverFotoManual} />
      </div>

      <dl className={`mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] ${c.texto}`}>
        <div>
          <dt className="sr-only">Valor</dt>
          <dd className="font-black">{moeda(imovel.valor)}</dd>
        </div>
        <div>
          <dt className="sr-only">Localização</dt>
          <dd>{[imovel.bairro, imovel.cidade, imovel.uf].filter(Boolean).join(' · ') || 'sem bairro'}</dd>
        </div>
        <div>
          <dt className="sr-only">Quartos, banheiros e vagas</dt>
          <dd>
            {imovel.quartos || '—'} quartos · {imovel.banheiros || '—'} banh. · {imovel.vagas || '—'} vagas
          </dd>
        </div>
        <div>
          <dt className="sr-only">Área</dt>
          <dd>{imovel.area ? `${imovel.area} m²` : 'área não informada'}</dd>
        </div>
      </dl>

      {imovel.avisos?.length ? (
        <p className="mt-2 text-[10px] font-bold uppercase tracking-wide text-amber-600">
          {imovel.avisos.join(' · ')}
        </p>
      ) : null}

      <label
        className={`mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed px-3 py-2 text-[10px] font-bold uppercase tracking-wide transition ${c.cardSuave} ${c.texto} ${
          vagas === 0 ? 'pointer-events-none opacity-40' : 'hover:border-emerald-500'
        }`}
      >
        <ImagePlus size={13} />
        {vagas === 0
          ? `Limite de ${MAX_FOTOS_IMOVEL} fotos atingido`
          : `Anexar fotos (${vagas} vaga${vagas === 1 ? '' : 's'})`}
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(evento) => {
            onAnexarFotos(imovel.id, evento.target.files);
            evento.target.value = '';
          }}
        />
      </label>
    </article>
  );
}

export default function PreviaImportacao({
  temaClaro = false,
  leads = [],
  imoveis = [],
  avisos = [],
  onAlternarTemperatura,
  onAlternarSelecaoLead,
  onSelecionarTodosLeads,
  onRemoverLead,
  onAlternarSelecaoImovel,
  onRemoverImovel,
  onAnexarFotos,
  onRemoverFotoManual,
  onCopiar,
  copiadoId,
}) {
  const c = tons(temaClaro);
  const totalFotos = imoveis.reduce(
    (acc, imovel) => acc + (imovel.fotos || []).length + (imovel.fotosManuais || []).length,
    0,
  );

  return (
    <div className="space-y-4">
      {avisos.length ? (
        <ul className={`space-y-1 rounded-2xl border px-4 py-3 text-[11px] ${c.card} ${c.texto}`}>
          {avisos.map((aviso) => (
            <li key={aviso} className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden="true" />
              {aviso}
            </li>
          ))}
        </ul>
      ) : null}

      {leads.length ? (
        <PreviaLeads
          temaClaro={temaClaro}
          leads={leads}
          onAlternarTemperatura={onAlternarTemperatura}
          onAlternarSelecaoLead={onAlternarSelecaoLead}
          onSelecionarTodosLeads={onSelecionarTodosLeads}
          onRemoverLead={onRemoverLead}
          onCopiar={onCopiar}
          copiadoId={copiadoId}
        />
      ) : null}

      {imoveis.length ? (
        <section aria-label="Imóveis da importação">
          <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
            <h3 className={`text-sm font-black uppercase tracking-wide ${c.titulo}`}>
              Imóveis para Captação &amp; Imóveis{' '}
              <span className={`text-[11px] font-bold ${c.fraco}`}>({imoveis.length})</span>
            </h3>
            <p className={`text-[11px] ${c.fraco}`}>
              {totalFotos} foto(s) no lote · Foto 1 é a capa · até {MAX_FOTOS_IMOVEL} por imóvel em WebP 1280px / 0.80
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {imoveis.map((imovel) => (
              <CartaoImovel
                key={imovel.id}
                imovel={imovel}
                temaClaro={temaClaro}
                onAlternarSelecao={onAlternarSelecaoImovel}
                onRemover={onRemoverImovel}
                onAnexarFotos={onAnexarFotos}
                onRemoverFotoManual={onRemoverFotoManual}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

