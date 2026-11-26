/**
 * EtapaOrigem.jsx — Etapa 1 do wizard de Migração (D-23.16)
 * ============================================================================
 * Quatro origens, cada uma com o seu painel:
 *   • Planilha .xlsx/.xls/.csv (leads/clientes)
 *   • Link XML de portal/CRM (imóveis + fotos)
 *   • PDF com extração por IA (fichas, relatórios e listas)
 *   • Texto rápido / colar lista (Ctrl+V)
 * Abaixo, sempre visível, o quadro da régua de temperatura.
 * ============================================================================
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  ClipboardPaste,
  FileScan,
  Globe,
  Link2,
  Loader2,
  Table2,
  UploadCloud,
  X,
} from 'lucide-react';
import ReguaTemperatura from './ReguaTemperatura';
import { BOTAO_PRIMARIO, BOTAO_SECUNDARIO, tons } from './estilo';

const ORIGENS = [
  {
    id: 'planilha',
    titulo: 'Planilha',
    formatos: '.xlsx · .xls · .csv',
    destino: 'Leads / Clientes',
    descricao: 'Colunas do seu jeito: o sistema reconhece nome, telefone, bairro, interesse, orçamento e data.',
    icone: Table2,
    cor: '#10b981',
  },
  {
    id: 'xml',
    titulo: 'Link XML de portal',
    formatos: 'VRSync · ZAP · VivaReal · OLX',
    destino: 'Imóveis + Fotos',
    descricao: 'Lê o feed do portal e importa os imóveis com foto 1 como capa.',
    icone: Link2,
    cor: '#0ea5e9',
  },
  {
    id: 'pdf',
    titulo: 'Documento PDF com IA',
    formatos: '.pdf',
    destino: 'Leads + Imóveis',
    descricao: 'Fichas de captação, relatórios e listas: a IA extrai os campos e você confere antes de gravar.',
    icone: FileScan,
    cor: '#8b5cf6',
  },
  {
    id: 'texto',
    titulo: 'Texto rápido / Colar lista',
    formatos: 'Ctrl + V',
    destino: 'Leads / Clientes',
    descricao: 'Contatos do WhatsApp ou do bloco de notas, um por linha — com data quando existir.',
    icone: ClipboardPaste,
    cor: '#f59e0b',
  },
];

function CartaoOrigem({ item, ativo, onSelecionar, temaClaro }) {
  const c = tons(temaClaro);
  const Icone = item.icone;

  return (
    <button
      type="button"
      onClick={() => onSelecionar(item.id)}
      aria-pressed={ativo}
      className={`group relative flex h-full flex-col rounded-2xl border p-4 text-left transition ${
        ativo ? c.cardAtivo : `${c.card} hover:-translate-y-0.5`
      }`}
    >
      <span
        className="flex h-10 w-10 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${item.cor}22`, color: item.cor }}
      >
        <Icone size={20} />
      </span>

      <span className={`mt-3 text-sm font-black uppercase tracking-wide ${c.titulo}`}>{item.titulo}</span>
      <span className="mt-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: item.cor }}>
        {item.formatos}
      </span>
      <span className={`mt-2 text-[11px] leading-snug ${c.fraco}`}>{item.descricao}</span>

      <span
        className={`mt-3 inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${c.cardSuave} ${c.texto}`}
      >
        {item.destino}
      </span>

      {ativo ? (
        <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-black text-white">
          ✓
        </span>
      ) : null}
    </button>
  );
}

function Avisos({ temaClaro, avisos, erro, onFecharErro }) {
  const c = tons(temaClaro);
  if (!erro && !avisos?.length) return null;

  return (
    <div className="space-y-2">
      {erro ? (
        <div
          role="alert"
          className={`flex items-start gap-2 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-[11px] leading-relaxed text-rose-600`}
        >
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span className="flex-1">{erro}</span>
          {onFecharErro ? (
            <button type="button" onClick={onFecharErro} aria-label="Fechar aviso de erro">
              <X size={13} />
            </button>
          ) : null}
        </div>
      ) : null}

      {avisos?.length ? (
        <ul className={`space-y-1 rounded-2xl border px-4 py-3 text-[11px] ${c.card} ${c.texto}`}>
          {avisos.map((aviso) => (
            <li key={aviso} className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden="true" />
              {aviso}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function PainelPlanilha({ temaClaro, onLerPlanilha, carregando }) {
  const c = tons(temaClaro);
  const [arrastando, setArrastando] = useState(false);

  return (
    <div
      className={`rounded-2xl border-2 border-dashed p-5 transition ${
        arrastando ? 'border-emerald-500 bg-emerald-500/5' : c.card
      }`}
      onDragOver={(evento) => {
        evento.preventDefault();
        setArrastando(true);
      }}
      onDragLeave={() => setArrastando(false)}
      onDrop={(evento) => {
        evento.preventDefault();
        setArrastando(false);
        const arquivo = evento.dataTransfer?.files?.[0];
        if (arquivo) onLerPlanilha(arquivo);
      }}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <UploadCloud size={26} className="text-emerald-500" />
        <p className={`text-sm font-black ${c.titulo}`}>Arraste a planilha ou escolha o arquivo</p>
        <p className={`max-w-lg text-[11px] leading-snug ${c.fraco}`}>
          Aceita <strong>.xlsx</strong>, <strong>.xls</strong> e <strong>.csv</strong>. A primeira aba é lida e a
          primeira linha pode ser o cabeçalho — cada coluna é reconhecida pelo nome.
        </p>

        <label className={`${BOTAO_PRIMARIO} mt-1`}>
          {carregando ? <Loader2 size={15} className="animate-spin" /> : <Table2 size={15} />}
          {carregando ? 'Lendo planilha…' : 'Escolher planilha'}
          <input
            type="file"
            accept=".xlsx,.xls,.csv,text/csv"
            className="hidden"
            disabled={carregando}
            onChange={(evento) => {
              const arquivo = evento.target.files?.[0];
              evento.target.value = '';
              if (arquivo) onLerPlanilha(arquivo);
            }}
          />
        </label>

        <p className={`text-[10px] leading-snug ${c.fraco}`}>
          Reconhece: nome, telefone/celular/whatsapp, e-mail, bairro, cidade, interesse, orçamento, status, data do
          contato, observações e corretor.
        </p>
      </div>
    </div>
  );
}

function PainelXml({ temaClaro, onImportarXmlLink, onLerXmlArquivo, carregando }) {
  const c = tons(temaClaro);
  const [link, setLink] = useState('');
  const [xmlColado, setXmlColado] = useState('');

  return (
    <div className={`space-y-3 rounded-2xl border p-4 ${c.card}`}>
      <form
        className="space-y-2"
        onSubmit={(evento) => {
          evento.preventDefault();
          const url = link.trim();
          if (url) onImportarXmlLink(url);
        }}
      >
        <label htmlFor="link-xml" className={`block text-[10px] font-black uppercase tracking-widest ${c.fraco}`}>
          Link do XML (feed do portal ou do seu CRM)
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="link-xml"
            type="url"
            inputMode="url"
            placeholder="https://www.zapimoveis.com.br/xml/....xml"
            value={link}
            onChange={(evento) => setLink(evento.target.value)}
            className={`min-w-0 flex-1 rounded-xl border px-3 py-2.5 text-xs ${c.input}`}
          />
          <button type="submit" disabled={!link.trim() || carregando} className={BOTAO_PRIMARIO}>
            {carregando ? <Loader2 size={15} className="animate-spin" /> : <Globe size={15} />}
            Importar do link
          </button>
        </div>
        <p className={`text-[10px] leading-snug ${c.fraco}`}>
          O servidor busca o link e valida o XML (o navegador não consegue por CORS). Depois cada foto é baixada,
          compactada em WebP e vinculada ao imóvel.
        </p>
      </form>

      <details className={`rounded-xl border px-3 py-2 ${c.cardSuave}`}>
        <summary className={`cursor-pointer text-[10px] font-black uppercase tracking-widest ${c.texto}`}>
          O portal bloqueou o link? Cole o XML ou envie o arquivo
        </summary>

        <div className="mt-2 space-y-2">
          <textarea
            value={xmlColado}
            onChange={(evento) => setXmlColado(evento.target.value)}
            rows={5}
            placeholder="<?xml version=&quot;1.0&quot;?><Imoveis><Imovel>…</Imovel></Imoveis>"
            className={`w-full rounded-xl border px-3 py-2 font-mono text-[11px] ${c.input}`}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!xmlColado.trim() || carregando}
              onClick={() => onLerXmlArquivo(xmlColado, 'xml colado')}
              className={BOTAO_PRIMARIO}
            >
              <Link2 size={15} /> Ler XML colado
            </button>
            <label className={`${BOTAO_SECUNDARIO} ${c.card} ${c.texto}`}>
              <UploadCloud size={14} /> Enviar arquivo .xml
              <input
                type="file"
                accept=".xml,text/xml,application/xml"
                className="hidden"
                disabled={carregando}
                onChange={async (evento) => {
                  const arquivo = evento.target.files?.[0];
                  evento.target.value = '';
                  if (!arquivo) return;
                  const conteudo = await arquivo.text();
                  onLerXmlArquivo(conteudo, arquivo.name);
                }}
              />
            </label>
          </div>
        </div>
      </details>
    </div>
  );
}

function PainelPdf({ temaClaro, onExtrairPdf, carregando }) {
  const c = tons(temaClaro);

  return (
    <div className={`space-y-2 rounded-2xl border p-4 ${c.card}`}>
      <p className={`text-sm font-black ${c.titulo}`}>Ficha de captação, relatório ou lista em PDF</p>
      <p className={`text-[11px] leading-snug ${c.fraco}`}>
        A IA lê o documento e devolve leads e imóveis em JSON. Você confere tudo na próxima etapa — nada é gravado
        sem a sua confirmação. Limite de ~2 MB por PDF (o proxy aceita 3 MB em base64).
      </p>

      <label className={`${BOTAO_PRIMARIO} mt-1`}>
        {carregando ? <Loader2 size={15} className="animate-spin" /> : <FileScan size={15} />}
        {carregando ? 'Lendo PDF com IA…' : 'Escolher PDF'}
        <input
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          disabled={carregando}
          onChange={(evento) => {
            const arquivo = evento.target.files?.[0];
            evento.target.value = '';
            if (arquivo) onExtrairPdf(arquivo);
          }}
        />
      </label>

      <p className={`text-[10px] leading-snug ${c.fraco}`}>
        A chamada passa pelo proxy autenticado <code>/api/ai</code>: nenhuma chave de IA fica no navegador.
      </p>
    </div>
  );
}

function PainelTexto({ temaClaro, onInterpretarTexto, carregando }) {
  const c = tons(temaClaro);
  const [texto, setTexto] = useState('');

  return (
    <div className={`space-y-2 rounded-2xl border p-4 ${c.card}`}>
      <label htmlFor="lista-colada" className={`block text-sm font-black ${c.titulo}`}>
        Cole a lista de contatos
      </label>
      <p className={`text-[11px] leading-snug ${c.fraco}`}>
        Um contato por linha. Formatos aceitos: <strong>Nome; (34) 99999-8888; Bairro; Apartamento 2q</strong> ou
        <strong> Nome - 34 99999-8888 - Proposta</strong>. Exportação de conversa do WhatsApp também funciona — a data
        da mensagem vira a data do contato.
      </p>

      <textarea
        id="lista-colada"
        value={texto}
        onChange={(evento) => setTexto(evento.target.value)}
        rows={7}
        placeholder={'João Silva; (34) 99999-8888; Santa Mônica; Apartamento 2 quartos até 350 mil\nMaria Souza - 34 98888-7777 - Proposta - Centro'}
        className={`w-full rounded-xl border px-3 py-2 text-xs leading-relaxed ${c.input}`}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={`text-[10px] ${c.fraco}`}>
          {texto.trim() ? `${texto.split(/\r?\n/).filter((linha) => linha.trim()).length} linha(s)` : 'Ctrl+V para colar'}
        </span>
        <button
          type="button"
          disabled={!texto.trim() || carregando}
          onClick={() => onInterpretarTexto(texto)}
          className={BOTAO_PRIMARIO}
        >
          {carregando ? <Loader2 size={15} className="animate-spin" /> : <ClipboardPaste size={15} />}
          Interpretar lista
        </button>
      </div>
    </div>
  );
}

function ResumoLote({ temaClaro, leads, imoveis, onContinuar, onLimparLote }) {
  const c = tons(temaClaro);
  const leadsSelecionados = leads.filter((lead) => lead.selecionado).length;
  const imoveisSelecionados = imoveis.filter((imovel) => imovel.selecionado).length;
  const total = leadsSelecionados + imoveisSelecionados;
  const fotos = imoveis.reduce(
    (acc, imovel) => acc + (imovel.fotos || []).length + (imovel.fotosManuais || []).length,
    0,
  );

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 ${c.card}`}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
        <span className={c.texto}>
          <strong className={c.titulo}>{leads.length}</strong> lead(s) lido(s) ·{' '}
          <strong className={c.titulo}>{leadsSelecionados}</strong> marcado(s)
        </span>
        <span className={c.texto}>
          <strong className={c.titulo}>{imoveis.length}</strong> imóvel(is) ·{' '}
          <strong className={c.titulo}>{fotos}</strong> foto(s)
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {leads.length || imoveis.length ? (
          <button type="button" onClick={onLimparLote} className={`${BOTAO_SECUNDARIO} ${c.card} ${c.texto}`}>
            <X size={13} /> Limpar lote
          </button>
        ) : null}
        <button type="button" onClick={onContinuar} disabled={total === 0} className={BOTAO_PRIMARIO}>
          Continuar para pré-visualização <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}

export default function EtapaOrigem({
  temaClaro = false,
  origem = 'planilha',
  onMudarOrigem,
  carregando = false,
  rotuloCarregando = '',
  erro = '',
  avisos = [],
  leads = [],
  imoveis = [],
  onLerPlanilha,
  onImportarXmlLink,
  onLerXmlArquivo,
  onExtrairPdf,
  onInterpretarTexto,
  onContinuar,
  onLimparLote,
  onFecharErro,
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ORIGENS.map((item) => (
          <CartaoOrigem
            key={item.id}
            item={item}
            ativo={origem === item.id}
            temaClaro={temaClaro}
            onSelecionar={onMudarOrigem}
          />
        ))}
      </div>

      {carregando && rotuloCarregando ? (
        <p className="flex items-center gap-2 text-[11px] font-bold" aria-live="polite">
          <Loader2 size={13} className="animate-spin text-emerald-500" /> {rotuloCarregando}
        </p>
      ) : null}

      {origem === 'planilha' ? (
        <PainelPlanilha temaClaro={temaClaro} onLerPlanilha={onLerPlanilha} carregando={carregando} />
      ) : null}

      {origem === 'xml' ? (
        <PainelXml
          temaClaro={temaClaro}
          onImportarXmlLink={onImportarXmlLink}
          onLerXmlArquivo={onLerXmlArquivo}
          carregando={carregando}
        />
      ) : null}

      {origem === 'pdf' ? (
        <PainelPdf temaClaro={temaClaro} onExtrairPdf={onExtrairPdf} carregando={carregando} />
      ) : null}

      {origem === 'texto' ? (
        <PainelTexto temaClaro={temaClaro} onInterpretarTexto={onInterpretarTexto} carregando={carregando} />
      ) : null}

      <Avisos temaClaro={temaClaro} avisos={avisos} erro={erro} onFecharErro={onFecharErro} />

      <ReguaTemperatura temaClaro={temaClaro} />

      <ResumoLote
        temaClaro={temaClaro}
        leads={leads}
        imoveis={imoveis}
        onContinuar={onContinuar}
        onLimparLote={onLimparLote}
      />
    </div>
  );
}
