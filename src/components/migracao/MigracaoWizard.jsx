/**
 * MigracaoWizard.jsx — wizard de importação em 3 etapas (D-23.16)
 * ============================================================================
 * ETAPA 1  Origem (planilha, XML de portal, PDF com IA, texto colado) + régua
 * ETAPA 2  Pré-visualização com tag de temperatura editável e mensagem pronta
 * ETAPA 3  Conclusão com o que foi gravado e atalho para o CRM/Captação
 *
 * A aba é gratuita: nenhuma checagem de plano aqui. O que existe é a conta
 * (`oficinas/{id}`) e a confirmação do corretor antes de qualquer gravação.
 * ============================================================================
 */

import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Loader2, UploadCloud } from 'lucide-react';
import HeroAba from '../admin/HeroAba';
import BarraEtapas from './BarraEtapas';
import EtapaOrigem from './EtapaOrigem';
import PreviaImportacao from './PreviaImportacao';
import ConclusaoImportacao from './ConclusaoImportacao';
import ReguaTemperatura from './ReguaTemperatura';
import { normalizarLeads, parseCSV, parseTextoRapido } from '../../lib/importacao/planilha';
import { normalizarImoveisDeObjetos, parseXmlImoveis } from '../../lib/importacao/xmlImoveis';
import {
  LIMITE_BASE64_PDF,
  SISTEMA_EXTRACAO_PDF,
  interpretarPacoteIA,
  lerArquivoBase64,
  montarPromptExtracaoPdf,
} from '../../lib/importacao/iaPdf';
import { baixarFoto, comprimirParaWebp } from '../../lib/importacao/fotos';
import { enviarFotoWebp, salvarImovelImportado, salvarLeadImportado } from '../../lib/importacao/gravacao';
import { ORDEM_TEMPERATURA, mensagemPorTemperatura } from '../../lib/importacao/temperatura';
import { MAX_FOTOS_IMOVEL } from '../../lib/fotosImovel';
import { cabecalhosIA } from '../../lib/aiAuth';
import { BOTAO_PRIMARIO, BOTAO_SECUNDARIO, tons } from './estilo';

export default function MigracaoWizard({
  dadosOficina = {},
  dadosImobiliaria = {},
  imobiliariaId,
  oficinaId,
  setAbaAtiva,
  tema = 'escuro',
  listaLeads = [],
  config = {},
}) {
  const temaClaro = tema === 'claro';
  const c = tons(temaClaro);

  const tenantId =
    imobiliariaId ||
    oficinaId ||
    dadosOficina?.oficinaId ||
    dadosOficina?.id ||
    dadosImobiliaria?.oficinaId ||
    dadosImobiliaria?.id ||
    '';
  const nomeImobiliaria = dadosOficina?.nome || dadosImobiliaria?.nome || config?.nome || '';
  const whatsappCorretor = config?.whatsapp || config?.telefone || '';

  const [etapa, setEtapa] = useState(1);
  const [origem, setOrigem] = useState('planilha');
  const [leads, setLeads] = useState([]);
  const [imoveis, setImoveis] = useState([]);
  const [avisos, setAvisos] = useState([]);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [rotuloCarregando, setRotuloCarregando] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [progresso, setProgresso] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [origemArquivo, setOrigemArquivo] = useState('');
  const [copiadoId, setCopiadoId] = useState('');

  const urlsPreview = useRef([]);
  const sequenciaLote = useRef(0);

  useEffect(
    () => () => {
      urlsPreview.current.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          /* navegador sem URL.createObjectURL */
        }
      });
      urlsPreview.current = [];
    },
    [],
  );

  const telefonesExistentes = (Array.isArray(listaLeads) ? listaLeads : [])
    .map((lead) => lead?.telefone)
    .filter(Boolean);

  const telefonesDoLote = () => leads.map((lead) => lead.telefone).filter(Boolean);

  /** Junta o lote novo ao que já estava na tela (planilha + XML, por exemplo). */
  function aplicarLote({ novosLeads = [], novosImoveis = [], novasAvisos = [], rotulo = '' }) {
    sequenciaLote.current += 1;
    const lote = sequenciaLote.current;

    if (novosLeads.length) {
      setLeads((prev) => [...prev, ...novosLeads.map((lead) => ({ ...lead, id: `${lead.id}-l${lote}` }))]);
    }
    if (novosImoveis.length) {
      setImoveis((prev) => [...prev, ...novosImoveis.map((imovel) => ({ ...imovel, id: `${imovel.id}-l${lote}` }))]);
    }
    if (novasAvisos.length) {
      setAvisos((prev) => [...prev, ...novasAvisos]);
    }
    if (rotulo) {
      setOrigemArquivo((prev) => (prev ? `${prev} + ${rotulo}` : rotulo));
    }
    setResultado(null);
  }

  async function lerPlanilha(arquivo) {
    if (!arquivo) return;
    setCarregando(true);
    setRotuloCarregando('Lendo a planilha…');
    setErro('');

    try {
      const nome = String(arquivo.name || '').toLowerCase();
      let linhas;

      if (nome.endsWith('.csv')) {
        const texto = await arquivo.text();
        try {
          const XLSX = await import('xlsx');
          const pasta = XLSX.read(texto, { type: 'string', cellDates: true });
          const aba = pasta.Sheets[pasta.SheetNames[0]];
          linhas = XLSX.utils.sheet_to_json(aba, { header: 1, raw: false, defval: '' });
        } catch {
          linhas = parseCSV(texto);
        }
      } else {
        const XLSX = await import('xlsx');
        const buffer = await arquivo.arrayBuffer();
        const pasta = XLSX.read(buffer, { type: 'array', cellDates: true });
        if (!pasta?.SheetNames?.length) throw new Error('A planilha não tem nenhuma aba legível.');
        const aba = pasta.Sheets[pasta.SheetNames[0]];
        linhas = XLSX.utils.sheet_to_json(aba, { header: 1, raw: false, defval: '' });
      }

      const pacote = normalizarLeads(linhas, {
        nomeImobiliaria,
        telefonesExistentes: [...telefonesExistentes, ...telefonesDoLote()],
        origemArquivo: arquivo.name,
      });

      if (!pacote.leads.length) {
        throw new Error('Nenhum contato encontrado. Confira se a planilha tem as colunas de nome e telefone.');
      }

      aplicarLote({ novosLeads: pacote.leads, novasAvisos: pacote.avisos, rotulo: arquivo.name });
    } catch (falha) {
      setErro(falha?.message || 'Falha ao ler a planilha.');
    } finally {
      setCarregando(false);
      setRotuloCarregando('');
    }
  }

  function processarXml(conteudo, rotulo) {
    const pacote = parseXmlImoveis(conteudo);
    if (!pacote.imoveis.length) {
      setAvisos((prev) => [...prev, ...pacote.avisos]);
      setErro('Nenhum imóvel reconhecido no XML. Confira se o link é o feed de imóveis do portal.');
      return;
    }
    aplicarLote({
      novosImoveis: pacote.imoveis,
      novasAvisos: [`Formato detectado: ${pacote.formato}.`, ...pacote.avisos],
      rotulo,
    });
  }

  function lerXmlArquivo(conteudo, rotulo = 'xml') {
    setErro('');
    if (!String(conteudo || '').trim()) {
      setErro('O conteúdo XML está vazio.');
      return;
    }
    processarXml(conteudo, rotulo);
  }

  async function importarXmlLink(url) {
    setCarregando(true);
    setRotuloCarregando('Buscando o XML do portal…');
    setErro('');

    try {
      let conteudo = '';
      let mensagemDoProxy = '';
      let resposta = null;

      try {
        resposta = await fetch('/api/importar-xml', {
          method: 'POST',
          headers: await cabecalhosIA(),
          body: JSON.stringify({ url }),
        });
      } catch {
        resposta = null;
      }

      if (resposta) {
        const corpo = await resposta.json().catch(() => ({}));
        if (resposta.ok && typeof corpo?.conteudo === 'string') {
          conteudo = corpo.conteudo;
        } else {
          mensagemDoProxy = corpo?.error || `Não foi possível abrir o link (HTTP ${resposta.status}).`;
        }
      }

      if (!conteudo) {
        // Feed com CORS liberado (ou ambiente sem o proxy): tenta direto.
        const direto = await fetch(url).catch(() => null);
        if (direto?.ok) {
          conteudo = await direto.text();
        } else {
          throw new Error(
            mensagemDoProxy ||
              'Não foi possível abrir o link. Se o portal exigir login, baixe o XML e envie o arquivo.',
          );
        }
      }

      processarXml(conteudo, url);
    } catch (falha) {
      setErro(falha?.message || 'Falha ao ler o link XML.');
    } finally {
      setCarregando(false);
      setRotuloCarregando('');
    }
  }

  function interpretarTexto(texto) {
    setErro('');
    const { registros, ignoradas } = parseTextoRapido(texto);

    if (!registros.length) {
      setErro('Nenhum contato reconhecido. Use uma linha por contato, com nome e telefone.');
      return;
    }

    const pacote = normalizarLeads(registros, {
      nomeImobiliaria,
      telefonesExistentes: [...telefonesExistentes, ...telefonesDoLote()],
      origemArquivo: 'lista colada',
    });

    const extras = ignoradas.length
      ? [`${ignoradas.length} linha(s) sem telefone/data foram ignoradas.`]
      : [];

    aplicarLote({
      novosLeads: pacote.leads,
      novasAvisos: [...pacote.avisos, ...extras],
      rotulo: 'lista colada',
    });
  }

  async function extrairPdf(arquivo) {
    if (!arquivo) return;
    setCarregando(true);
    setRotuloCarregando('Lendo o PDF com IA…');
    setErro('');

    try {
      const base64 = await lerArquivoBase64(arquivo);
      if (base64.length > LIMITE_BASE64_PDF) {
        throw new Error('PDF acima de ~2 MB. Divida o documento ou envie uma planilha com os dados.');
      }

      const resposta = await fetch('/api/ai', {
        method: 'POST',
        headers: await cabecalhosIA(),
        body: JSON.stringify({
          provider: 'gemini',
          systemPrompt: SISTEMA_EXTRACAO_PDF,
          prompt: montarPromptExtracaoPdf(arquivo.name),
          temperature: 0,
          maxTokens: 4096,
          arquivos: [{ mimeType: 'application/pdf', data: base64 }],
        }),
      });

      const corpo = await resposta.json().catch(() => ({}));
      if (!resposta.ok || !corpo?.text) {
        throw new Error(corpo?.error || `A IA não respondeu (HTTP ${resposta.status}).`);
      }

      const pacote = interpretarPacoteIA(corpo.text);
      if (!pacote) throw new Error('A IA não devolveu JSON válido. Tente outro PDF ou envie a planilha.');

      const loteLeads = normalizarLeads(pacote.leads, {
        nomeImobiliaria,
        telefonesExistentes: [...telefonesExistentes, ...telefonesDoLote()],
        origemArquivo: arquivo.name,
      });
      const loteImoveis = normalizarImoveisDeObjetos(pacote.imoveis);

      if (!loteLeads.leads.length && !loteImoveis.imoveis.length) {
        throw new Error('A IA não encontrou leads nem imóveis no documento.');
      }

      aplicarLote({
        novosLeads: loteLeads.leads,
        novosImoveis: loteImoveis.imoveis,
        novasAvisos: [...loteLeads.avisos, ...loteImoveis.avisos],
        rotulo: arquivo.name,
      });
    } catch (falha) {
      setErro(falha?.message || 'Falha na leitura do PDF.');
    } finally {
      setCarregando(false);
      setRotuloCarregando('');
    }
  }

  /* ------------------------------ EDIÇÃO NA PRÉVIA ---------------------- */

  function alternarTemperatura(id) {
    setLeads((prev) =>
      prev.map((lead) => {
        if (lead.id !== id) return lead;
        const atual = ORDEM_TEMPERATURA.indexOf(lead.temperatura);
        const proxima = ORDEM_TEMPERATURA[(atual + 1) % ORDEM_TEMPERATURA.length];
        const atualizado = { ...lead, temperatura: proxima, temperaturaOrigem: 'manual' };
        atualizado.mensagem = mensagemPorTemperatura(atualizado, { nomeImobiliaria });
        return atualizado;
      }),
    );
  }

  function alternarSelecaoLead(id) {
    setLeads((prev) => prev.map((lead) => (lead.id === id ? { ...lead, selecionado: !lead.selecionado } : lead)));
  }

  function selecionarTodosLeads(marcar) {
    setLeads((prev) => prev.map((lead) => (lead.valido ? { ...lead, selecionado: Boolean(marcar) } : lead)));
  }

  function removerLead(id) {
    setLeads((prev) => prev.filter((lead) => lead.id !== id));
  }

  function alternarSelecaoImovel(id) {
    setImoveis((prev) =>
      prev.map((imovel) => (imovel.id === id ? { ...imovel, selecionado: !imovel.selecionado } : imovel)),
    );
  }

  function removerImovel(id) {
    setImoveis((prev) => prev.filter((imovel) => imovel.id !== id));
  }

  async function anexarFotos(imovelId, arquivos) {
    const lista = Array.from(arquivos || []);
    if (!lista.length) return;

    const imovel = imoveis.find((item) => item.id === imovelId);
    if (!imovel) return;

    const usadas = (imovel.fotos || []).length + (imovel.fotosManuais || []).length;
    const vagas = Math.max(0, MAX_FOTOS_IMOVEL - usadas);
    if (vagas === 0) {
      setErro(`O imóvel ${imovel.titulo} já tem ${MAX_FOTOS_IMOVEL} fotos — o limite é por imóvel.`);
      return;
    }

    const selecionadas = lista.slice(0, vagas);
    const preparadas = [];

    for (const arquivo of selecionadas) {
      const comprimida = await comprimirParaWebp(arquivo);
      let preview = '';
      try {
        preview = URL.createObjectURL(comprimida || arquivo);
        urlsPreview.current.push(preview);
      } catch {
        preview = '';
      }
      preparadas.push({ arquivo: comprimida || arquivo, nome: arquivo.name, preview });
    }

    setImoveis((prev) =>
      prev.map((item) =>
        item.id === imovelId
          ? { ...item, fotosManuais: [...(item.fotosManuais || []), ...preparadas] }
          : item,
      ),
    );

    if (lista.length > vagas) {
      setErro(`Só cabiam ${vagas} foto(s) em ${imovel.titulo}. As demais não foram anexadas.`);
    }
  }

  function removerFotoManual(imovelId, indice) {
    setImoveis((prev) =>
      prev.map((item) => {
        if (item.id !== imovelId) return item;
        const manuais = [...(item.fotosManuais || [])];
        const [removida] = manuais.splice(indice, 1);
        if (removida?.preview) {
          try {
            URL.revokeObjectURL(removida.preview);
          } catch {
            /* sem suporte */
          }
        }
        return { ...item, fotosManuais: manuais };
      }),
    );
  }

  async function copiar(id, texto) {
    try {
      if (!navigator?.clipboard?.writeText) throw new Error('sem clipboard');
      await navigator.clipboard.writeText(texto || '');
    } catch {
      try {
        const area = document.createElement('textarea');
        area.value = texto || '';
        document.body.appendChild(area);
        area.select();
        document.execCommand('copy');
        document.body.removeChild(area);
      } catch {
        setErro('Não foi possível copiar a mensagem. Selecione o texto e copie manualmente.');
        return;
      }
    }
    setCopiadoId(id);
    setTimeout(() => setCopiadoId(''), 2000);
  }

  /** Fotos do imóvel: baixa do portal → WebP 1280/0.80 → Storage. */
  async function enviarFotosDoImovel(imovel) {
    const entradas = [
      ...(imovel.fotos || []).map((url) => ({ tipo: 'url', url })),
      ...(imovel.fotosManuais || []).map((foto) => ({ tipo: 'arquivo', arquivo: foto.arquivo })),
    ].slice(0, MAX_FOTOS_IMOVEL);

    const urls = [];

    for (let indice = 0; indice < entradas.length; indice += 1) {
      const entrada = entradas[indice];
      try {
        const arquivo = entrada.tipo === 'arquivo' ? entrada.arquivo : await baixarFoto(entrada.url);
        if (!arquivo) {
          // Portal bloqueou o download (CORS): mantém a URL original.
          if (entrada.url) urls.push(entrada.url);
          continue;
        }
        // Foto anexada pelo corretor já saiu compactada da seleção; a do feed
        // é baixada agora e passa pelo WebP 1280/0.80.
        const comprimida = entrada.tipo === 'arquivo' ? arquivo : await comprimirParaWebp(arquivo);
        const url = await enviarFotoWebp({
          imobiliariaId: tenantId,
          arquivo: comprimida || arquivo,
          codigo: imovel.codigo || imovel.titulo,
          indice,
        });
        if (url) urls.push(url);
      } catch {
        if (entrada.url) urls.push(entrada.url);
      }
    }

    return urls.slice(0, MAX_FOTOS_IMOVEL).filter(Boolean);
  }

  async function confirmarImportacao() {
    const leadsSelecionados = leads.filter((lead) => lead.selecionado && lead.valido);
    const imoveisSelecionados = imoveis.filter((imovel) => imovel.selecionado);

    if (!tenantId) {
      setErro('Conta sem identificador de imobiliária (oficinas/{id}). Recarregue o painel e tente de novo.');
      return;
    }
    if (!leadsSelecionados.length && !imoveisSelecionados.length) {
      setErro('Marque pelo menos um lead ou imóvel para gravar.');
      return;
    }

    setSalvando(true);
    setErro('');

    const resumo = { leads: 0, imoveis: 0, fotos: 0, falhas: [] };
    const total = leadsSelecionados.length + imoveisSelecionados.length;
    let feitos = 0;
    setProgresso({ atual: 0, total, rotulo: 'Gravando no CRM e na Captação…' });

    for (const lead of leadsSelecionados) {
      setProgresso({ atual: feitos, total, rotulo: `Lead ${lead.nome || lead.telefoneExibicao}` });
      try {
        await salvarLeadImportado({ imobiliariaId: tenantId, lead, origemArquivo });
        resumo.leads += 1;
      } catch (falha) {
        resumo.falhas.push(`Lead ${lead.nome || lead.telefoneExibicao}: ${falha?.message || 'falha ao gravar'}`);
      }
      feitos += 1;
      setProgresso({ atual: feitos, total, rotulo: 'Gravando…' });
    }

    for (const imovel of imoveisSelecionados) {
      setProgresso({ atual: feitos, total, rotulo: `Imóvel ${imovel.titulo}` });
      try {
        const urls = await enviarFotosDoImovel(imovel);
        await salvarImovelImportado({
          imobiliariaId: tenantId,
          imovel,
          urlsFotos: urls,
          whatsappCorretor,
          origemArquivo,
        });
        resumo.imoveis += 1;
        resumo.fotos += urls.length;
      } catch (falha) {
        resumo.falhas.push(`Imóvel ${imovel.titulo}: ${falha?.message || 'falha ao gravar'}`);
      }
      feitos += 1;
      setProgresso({ atual: feitos, total, rotulo: 'Gravando…' });
    }

    setResultado(resumo);
    setEtapa(3);
    setSalvando(false);
    setProgresso(null);
  }

  function recomecar() {
    urlsPreview.current.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        /* sem suporte */
      }
    });
    urlsPreview.current = [];
    setEtapa(1);
    setLeads([]);
    setImoveis([]);
    setAvisos([]);
    setErro('');
    setResultado(null);
    setOrigemArquivo('');
    setProgresso(null);
  }

  const leadsMarcados = leads.filter((lead) => lead.selecionado).length;
  const imoveisMarcados = imoveis.filter((imovel) => imovel.selecionado).length;
  const totalMarcado = leadsMarcados + imoveisMarcados;
  const percentual = progresso?.total ? Math.round((progresso.atual / progresso.total) * 100) : 0;

  return (
    <div className={`w-full animate-in fade-in duration-500 ${c.painel} p-4 md:p-8`}>
      <HeroAba
        icone={UploadCloud}
        titulo="Migração de"
        destaque="CRM"
        chip="IMPORTAÇÃO ASSISTIDA · 3 ETAPAS"
        subtitulo="Traga a carteira antiga em minutos: planilha, XML de portal, PDF ou lista colada. A régua classifica cada lead e a mensagem de WhatsApp já sai pronta."
        cor="#10b981"
        stats={[
          { label: 'Leads no lote', valor: leads.length, detalhe: `${leadsMarcados} marcados` },
          { label: 'Imóveis no lote', valor: imoveis.length, detalhe: `${imoveisMarcados} marcados` },
          { label: 'Acesso', valor: 'Grátis', detalhe: 'todos os planos' },
        ]}
      />

      <div className="mb-3 flex flex-wrap items-center gap-2 text-[9px] font-black uppercase tracking-widest">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-emerald-500">
          ✓ Sem bloqueio de plano
        </span>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${c.cardSuave} ${c.texto}`}>
          WebP · 1280 px · 0.80
        </span>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${c.cardSuave} ${c.texto}`}>
          Até {MAX_FOTOS_IMOVEL} fotos · Foto 1 é a capa
        </span>
      </div>

      <BarraEtapas
        etapa={etapa}
        temaClaro={temaClaro}
        habilitadas={[true, leads.length + imoveis.length > 0, Boolean(resultado)]}
        onIr={(destino) => setEtapa(destino)}
      />

      <div className="mt-4 space-y-4">
        {etapa === 1 ? (
          <EtapaOrigem
            temaClaro={temaClaro}
            origem={origem}
            onMudarOrigem={(nova) => {
              setOrigem(nova);
              setErro('');
            }}
            carregando={carregando}
            rotuloCarregando={rotuloCarregando}
            erro={erro}
            avisos={avisos}
            leads={leads}
            imoveis={imoveis}
            onLerPlanilha={lerPlanilha}
            onImportarXmlLink={importarXmlLink}
            onLerXmlArquivo={lerXmlArquivo}
            onExtrairPdf={extrairPdf}
            onInterpretarTexto={interpretarTexto}
            onContinuar={() => {
              setErro('');
              setEtapa(2);
            }}
            onLimparLote={recomecar}
            onFecharErro={() => setErro('')}
          />
        ) : null}

        {etapa === 2 ? (
          <>
            {erro ? (
              <div
                role="alert"
                className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-[11px] leading-relaxed text-rose-600"
              >
                {erro}
              </div>
            ) : null}

            {progresso ? (
              <div className={`rounded-2xl border p-3 ${c.card}`} aria-live="polite">
                <div className={`flex items-center justify-between gap-2 text-[11px] ${c.texto}`}>
                  <span className="truncate">{progresso.rotulo}</span>
                  <span className="shrink-0 font-bold">
                    {progresso.atual}/{progresso.total}
                  </span>
                </div>
                <div className={`mt-2 h-2 overflow-hidden rounded-full ${temaClaro ? 'bg-slate-200' : 'bg-white/10'}`}>
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
                    style={{ width: `${percentual}%` }}
                  />
                </div>
              </div>
            ) : null}

            <PreviaImportacao
              temaClaro={temaClaro}
              leads={leads}
              imoveis={imoveis}
              avisos={avisos}
              onAlternarTemperatura={alternarTemperatura}
              onAlternarSelecaoLead={alternarSelecaoLead}
              onSelecionarTodosLeads={selecionarTodosLeads}
              onRemoverLead={removerLead}
              onAlternarSelecaoImovel={alternarSelecaoImovel}
              onRemoverImovel={removerImovel}
              onAnexarFotos={anexarFotos}
              onRemoverFotoManual={removerFotoManual}
              onCopiar={copiar}
              copiadoId={copiadoId}
            />

            <ReguaTemperatura temaClaro={temaClaro} compacto />

            <div className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 ${c.card}`}>
              <button
                type="button"
                onClick={() => setEtapa(1)}
                disabled={salvando}
                className={`${BOTAO_SECUNDARIO} ${c.card} ${c.texto}`}
              >
                <ArrowLeft size={14} /> Voltar para a origem
              </button>

              <div className="flex flex-wrap items-center gap-3">
                <span className={`text-[11px] font-bold ${c.texto}`}>
                  {totalMarcado} de {leads.length + imoveis.length} selecionado(s)
                </span>
                <button
                  type="button"
                  onClick={confirmarImportacao}
                  disabled={salvando || totalMarcado === 0}
                  className={BOTAO_PRIMARIO}
                >
                  {salvando ? <Loader2 size={15} className="animate-spin" /> : null}
                  {salvando ? 'Gravando…' : `Confirmar e gravar (${totalMarcado})`}
                </button>
              </div>
            </div>

            <p className={`text-[10px] leading-relaxed ${c.fraco}`}>
              Nada é gravado antes deste clique. Leads entram em <strong>Funil CRM</strong> com a tag de temperatura e a
              mensagem sugerida; imóveis entram em <strong>Captação &amp; Imóveis</strong> com as fotos em WebP.
            </p>
          </>
        ) : null}

        {etapa === 3 ? (
          <ConclusaoImportacao
            temaClaro={temaClaro}
            resultado={resultado}
            onIrPara={(aba) => (typeof setAbaAtiva === 'function' ? setAbaAtiva(aba) : undefined)}
            onRecomecar={recomecar}
          />
        ) : null}
      </div>
    </div>
  );
}
