// src/components/imobi/DueDiligenceMatricula.jsx
import React, { useState, useRef } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  FileText,
  UploadCloud,
  CheckCircle2,
  Clock,
  Sparkles,
  Copy,
  Check,
  MessageCircle,
  FileSearch,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronUp,
  Scale,
  Building2,
  Info,
} from 'lucide-react';
import { processarDueDiligenceIA } from '../../agent/dueDiligencePrompt';

/**
 * Helper para extrair texto de arquivos PDF e TXT no navegador.
 */
async function extrairTextoDeArquivo(arquivo) {
  return new Promise((resolve) => {
    // Arquivos de texto puro
    if (arquivo.type.includes('text') || arquivo.name.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result || '');
      reader.onerror = () => resolve('');
      reader.readAsText(arquivo, 'utf-8');
      return;
    }

    // Arquivos PDF: lê como texto binário e extrai strings legíveis
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const conteudo = e.target?.result || '';
        // Extrai sequências textuais de streams do PDF ou texto plano
        // Filtra caracteres imprimíveis em português
        const matches = conteudo.match(/[\wÀ-ÿ0-9.,;:/\-()"\s]{4,}/g);
        if (matches && matches.length > 0) {
          const textoExtraido = matches
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
          resolve(textoExtraido.slice(0, 30000));
        } else {
          resolve(`[PDF carregado: ${arquivo.name} (${Math.round(arquivo.size / 1024)} KB) - cole o texto da matrícula abaixo se for digitalizada como imagem]`);
        }
      } catch {
        resolve(`[Documento carregado: ${arquivo.name}]`);
      }
    };
    reader.onerror = () => resolve('');
    reader.readAsBinaryString ? reader.readAsBinaryString(arquivo) : reader.readAsText(arquivo);
  });
}

export default function DueDiligenceMatricula() {
  const [secaoAberta, setSecaoAberta] = useState(true);
  const [arquivosCarregados, setArquivosCarregados] = useState([]);
  const [textoDocumentos, setTextoDocumentos] = useState('');
  const [informacoesAdicionais, setInformacoesAdicionais] = useState('');
  const [carregandoArquivos, setCarregandoArquivos] = useState(false);
  const [analisandoIA, setAnalisandoIA] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState('');
  const [copiado, setCopiado] = useState(false);
  const fileInputRef = useRef(null);

  // Manipulação de upload múltiplo
  const handleUploadArquivos = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setCarregandoArquivos(true);
    setErro('');

    try {
      const novosArquivos = [];
      let textosConcatenados = '';

      for (const file of files) {
        novosArquivos.push({
          name: file.name,
          size: file.size,
          type: file.type || 'application/pdf',
        });

        const textoDoArquivo = await extrairTextoDeArquivo(file);
        if (textoDoArquivo) {
          textosConcatenados += `\n\n--- DOCUMENTO: ${file.name} ---\n${textoDoArquivo}`;
        }
      }

      setArquivosCarregados((prev) => [...prev, ...novosArquivos]);
      setTextoDocumentos((prev) => (prev ? `${prev}${textosConcatenados}` : textosConcatenados.trim()));
    } catch (err) {
      setErro(`Falha ao ler arquivos: ${err.message}`);
    } finally {
      setCarregandoArquivos(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const limparArquivosETexto = () => {
    setArquivosCarregados([]);
    setTextoDocumentos('');
    setInformacoesAdicionais('');
    setResultado(null);
    setErro('');
  };

  const executarAnaliseIA = async () => {
    if (!textoDocumentos.trim()) {
      setErro('Insira ou faça upload do texto da matrícula, IPTU ou certidões para realizar a due diligence.');
      return;
    }

    setAnalisandoIA(true);
    setErro('');

    try {
      const dados = await processarDueDiligenceIA({
        textoDocumentos,
        informacoesAdicionais,
      });
      setResultado(dados);
    } catch (err) {
      setErro(err.message || 'Falha ao processar análise registral com IA.');
    } finally {
      setAnalisandoIA(false);
    }
  };

  const alternarStatusChecklist = (idx) => {
    if (!resultado || !resultado.checklistCertidoes) return;
    const novos = [...resultado.checklistCertidoes];
    const statusAtual = novos[idx].status;
    const proxStatus = statusAtual === 'PENDENTE' ? 'OK' : statusAtual === 'OK' ? 'ATENCAO' : 'PENDENTE';
    novos[idx].status = proxStatus;
    setResultado({ ...resultado, checklistCertidoes: novos });
  };

  // Monta o parecer textual formatado para cópia ou envio
  const gerarTextoParecer = () => {
    if (!resultado) return '';

    const linhas = [
      'PARECER REGISTRAL DE DUE DILIGENCE — EXPRESS IMOBI TECH',
      '========================================================',
      `STATUS DE SEGURANÇA: SEMÁFORO ${resultado.semaforo} (Score: ${resultado.scoreSeguranca}/100)`,
      '',
      'RESUMO EXECUTIVO:',
      resultado.resumoExecutivo,
      '',
    ];

    if (resultado.dadosIdentificados?.numeroMatricula) {
      linhas.push(
        'DADOS IDENTIFICADOS:',
        `• Matrícula: ${resultado.dadosIdentificados.numeroMatricula} — ${resultado.dadosIdentificados.cartorioRI || 'CRI Local'}`,
        `• Titulares Atuais: ${(resultado.dadosIdentificados.proprietariosAtuais || []).join(', ') || 'Conforme registro'}`,
        `• Área Matrícula: ${resultado.dadosIdentificados.areaMatricula || 'N/I'} | Área IPTU: ${resultado.dadosIdentificados.areaIPTU || 'N/I'}`,
        resultado.dadosIdentificados.divergenciaArea ? '⚠️ ALERTA: Há divergência entre área registrada e cadastro municipal!' : '• Áreas compatíveis.',
        ''
      );
    }

    if (resultado.alertasRisco && resultado.alertasRisco.length > 0) {
      linhas.push('APONTAMENTOS & RISCOS IDENTIFICADOS:');
      resultado.alertasRisco.forEach((alerta, i) => {
        linhas.push(`${i + 1}. [${alerta.nivel}] ${alerta.titulo}`);
        linhas.push(`   ${alerta.descricao}`);
        linhas.push(`   Base Legal: ${alerta.baseLegal}`);
      });
      linhas.push('');
    }

    if (resultado.checklistCertidoes && resultado.checklistCertidoes.length > 0) {
      linhas.push('CHECKLIST DE CERTIDÕES:');
      resultado.checklistCertidoes.forEach((item) => {
        const mark = item.status === 'OK' ? '[OK]' : item.status === 'ATENCAO' ? '[ATENÇÃO]' : '[PENDENTE]';
        linhas.push(`• ${mark} ${item.item}`);
        linhas.push(`  Ação: ${item.acaoRecomendada}`);
      });
      linhas.push('');
    }

    linhas.push(
      'RECOMENDAÇÃO CONCLUSIVA:',
      resultado.recomendacaoFinal,
      '',
      'Aviso legal: Este relatório possui caráter de inteligência registral e suporte negocial, não substituindo a análise formal de advogado especialista ou certidão atualizada expedida pelo Oficial de Registro de Imóveis.'
    );

    return linhas.join('\n');
  };

  const copiarParecer = () => {
    const texto = gerarTextoParecer();
    if (!texto) return;
    try {
      navigator.clipboard?.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {}
  };

  const enviarWhatsApp = () => {
    const texto = gerarTextoParecer();
    if (!texto) return;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="rounded-3xl border border-slate-800 bg-[#020408] p-5 md:p-6 shadow-2xl space-y-5">
      {/* ─── CABEÇALHO DO MÓDULO DE DUE DILIGENCE ───────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <FileSearch size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                Due Diligence & Raio-X de Matrícula
              </h2>
              <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-black uppercase text-emerald-400">
                Plano PLUS · IA Notarial
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Auditoria registral inteligente: analisa ônus reais, averbações, IPTU e CNDs para blindar a negociação imobiliária.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setSecaoAberta((prev) => !prev)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/90 hover:bg-slate-800 px-3.5 py-2 text-xs font-black text-slate-300 transition cursor-pointer"
        >
          <span>{secaoAberta ? 'Recuar Painel' : 'Abrir Painel'}</span>
          {secaoAberta ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {secaoAberta && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* ─── ÁREA DE UPLOAD MÚLTIPLO E ENTRADA DE TEXTO ──────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Box de Dropzone / Seleção de Arquivos */}
            <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-4 hover:border-emerald-500/50 transition">
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <UploadCloud size={20} className="text-emerald-400" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                    Upload de Documentos
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Carregue um ou vários arquivos em PDF ou texto (Matrícula, Espelho IPTU, CND Federal, CNDT, Certidões Cíveis).
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.txt,text/plain,application/pdf"
                  onChange={handleUploadArquivos}
                  className="hidden"
                  id="input-arquivos-due-diligence"
                />

                <label
                  htmlFor="input-arquivos-due-diligence"
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 px-4 py-3 text-xs font-black text-emerald-300 transition cursor-pointer text-center"
                >
                  <UploadCloud size={16} />
                  <span>{carregandoArquivos ? 'Carregando arquivos...' : 'Selecionar Matrícula e PDFs'}</span>
                </label>

                {arquivosCarregados.length > 0 && (
                  <div className="space-y-1.5 pt-2 max-h-36 overflow-y-auto pr-1">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">
                      Arquivos Adicionados ({arquivosCarregados.length}):
                    </span>
                    {arquivosCarregados.map((arq, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-[#04080d] px-2.5 py-1.5 text-[11px] text-slate-300"
                      >
                        <span className="truncate max-w-[200px]" title={arq.name}>
                          {arq.name}
                        </span>
                        <span className="text-[9px] text-slate-500 shrink-0">
                          {Math.round(arq.size / 1024)} KB
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {arquivosCarregados.length > 0 && (
                <button
                  type="button"
                  onClick={limparArquivosETexto}
                  className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-red-400 transition cursor-pointer self-start"
                >
                  <Trash2 size={12} /> Limpar todos os documentos
                </button>
              )}
            </div>

            {/* Box do Texto Extraído e Informações Adicionais */}
            <div className="lg:col-span-7 space-y-3">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                  <span>Texto da Matrícula e Certidões (extraído ou colado manualmente):</span>
                  <span className="text-[9px] text-slate-500 font-normal">Suporte a copiar/colar direto do PDF</span>
                </label>
                <textarea
                  rows={5}
                  value={textoDocumentos}
                  onChange={(e) => setTextoDocumentos(e.target.value)}
                  placeholder="Cole aqui o texto da Matrícula do Imóvel (Livro 2 - Registro Geral), R-1, AV-2, ônus, dados do IPTU e das partes, ou use o upload de arquivos ao lado..."
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-3.5 text-xs text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/40 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                  Observações Adicionais da Negociação (opcional):
                </label>
                <input
                  value={informacoesAdicionais}
                  onChange={(e) => setInformacoesAdicionais(e.target.value)}
                  placeholder="Ex: Pagamento com 30% de sinal e saldo via financiamento bancário Caixa; Vendedor alega que quitou a hipoteca mas não averbou..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Info size={13} className="text-emerald-400" /> Análise automática segundo Lei 6.015/73 e Código Civil.
                </span>

                <button
                  type="button"
                  onClick={executarAnaliseIA}
                  disabled={analisandoIA || !textoDocumentos.trim()}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 px-5 py-2.5 text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  {analisandoIA ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                  <span>{analisandoIA ? 'Analisando Matrícula com IA...' : 'Analisar Matrícula com IA'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Mensagem de Erro */}
          {erro && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3.5 text-xs text-red-300 flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0 text-red-400" />
              <span>{erro}</span>
            </div>
          )}

          {/* ─── PAINEL DE RESULTADOS DA DUE DILIGENCE ────────────────────────── */}
          {resultado && (
            <div className="mt-6 rounded-3xl border border-slate-800 bg-[#04080e] p-5 md:p-6 space-y-6 animate-in fade-in duration-300">
              {/* Topo do Diagnóstico: Semáforo e Score */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-800/90 bg-[#020408]">
                <div className="flex items-center gap-3.5">
                  {/* Semáforo Visual */}
                  <div className="flex items-center gap-1.5 p-2 rounded-2xl bg-slate-900 border border-slate-800">
                    <span
                      className={`h-4 w-4 rounded-full transition-all ${
                        resultado.semaforo === 'VERDE'
                          ? 'bg-emerald-500 shadow-[0_0_12px_#10b981] scale-110'
                          : 'bg-emerald-950 opacity-30'
                      }`}
                      title="Verde — Seguro"
                    />
                    <span
                      className={`h-4 w-4 rounded-full transition-all ${
                        resultado.semaforo === 'AMARELO'
                          ? 'bg-amber-500 shadow-[0_0_12px_#f59e0b] scale-110'
                          : 'bg-amber-950 opacity-30'
                      }`}
                      title="Amarelo — Apontamentos pendentes"
                    />
                    <span
                      className={`h-4 w-4 rounded-full transition-all ${
                        resultado.semaforo === 'VERMELHO'
                          ? 'bg-rose-500 shadow-[0_0_12px_#f43f5e] scale-110'
                          : 'bg-rose-950 opacity-30'
                      }`}
                      title="Vermelho — Alto risco / Impeditivo"
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase font-bold text-slate-400">Classificação Registral:</span>
                      <span
                        className={`text-sm font-black uppercase px-2.5 py-0.5 rounded-lg border ${
                          resultado.semaforo === 'VERDE'
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                            : resultado.semaforo === 'AMARELO'
                            ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                            : 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                        }`}
                      >
                        Semáforo {resultado.semaforo}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-0.5 block">
                      {resultado.semaforo === 'VERDE'
                        ? 'Imóvel regular e desimpedido para lavratura de escritura pública.'
                        : resultado.semaforo === 'AMARELO'
                        ? 'Existem pendências sanáveis que devem ser exigidas antes do fechamento.'
                        : 'Atenção máxima: apontamentos críticos impeditivos ou risco elevado de evicção.'}
                    </span>
                  </div>
                </div>

                {/* Score de Segurança */}
                <div className="flex items-center gap-3 self-stretch md:self-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Índice de Segurança</span>
                    <span className="text-2xl font-black text-white">{resultado.scoreSeguranca}/100</span>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                    {resultado.semaforo === 'VERDE' ? (
                      <ShieldCheck size={22} className="text-emerald-400" />
                    ) : resultado.semaforo === 'AMARELO' ? (
                      <Clock size={22} className="text-amber-400" />
                    ) : (
                      <ShieldAlert size={22} className="text-rose-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Resumo Executivo */}
              <div className="rounded-2xl border border-slate-800/90 bg-[#020408] p-4 space-y-1.5">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Sparkles size={14} /> Resumo Executivo para a Liderança Comercial
                </span>
                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                  {resultado.resumoExecutivo}
                </p>
              </div>

              {/* Dados Identificados da Matrícula vs IPTU */}
              {resultado.dadosIdentificados && (
                <div className="rounded-2xl border border-slate-800/90 bg-[#020408] p-4 space-y-3">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Building2 size={14} className="text-emerald-400" /> Dados Registrais Identificados
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Matrícula / Cartório</span>
                      <span className="font-bold text-white truncate block">
                        {resultado.dadosIdentificados.numeroMatricula || 'Nº não identificado'}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate block">
                        {resultado.dadosIdentificados.cartorioRI || 'CRI'}
                      </span>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Titulares Registrais</span>
                      <span className="font-bold text-white truncate block" title={(resultado.dadosIdentificados.proprietariosAtuais || []).join(', ')}>
                        {(resultado.dadosIdentificados.proprietariosAtuais || []).join(', ') || 'Conforme certidão'}
                      </span>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Área Matrícula vs IPTU</span>
                      <span className="font-bold text-white truncate block">
                        {resultado.dadosIdentificados.areaMatricula || 'N/I'} / {resultado.dadosIdentificados.areaIPTU || 'N/I'}
                      </span>
                      {resultado.dadosIdentificados.divergenciaArea && (
                        <span className="text-[10px] font-black text-amber-400 block mt-0.5">
                          ⚠️ Divergência detectada
                        </span>
                      )}
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Valor Venal IPTU</span>
                      <span className="font-bold text-white truncate block">
                        {resultado.dadosIdentificados.valorVenalIPTU || 'Não informado'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Cards de Apontamentos e Alertas de Risco */}
              {resultado.alertasRisco && resultado.alertasRisco.length > 0 && (
                <div className="space-y-3">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <AlertTriangle size={14} className="text-amber-400" />
                    Apontamentos e Alertas de Risco ({resultado.alertasRisco.length})
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {resultado.alertasRisco.map((alerta, idx) => {
                      const isCritico = alerta.nivel === 'CRITICO';
                      const isAlerta = alerta.nivel === 'ALERTA';

                      return (
                        <div
                          key={idx}
                          className={`rounded-2xl border p-4 space-y-2 flex flex-col justify-between ${
                            isCritico
                              ? 'border-rose-500/40 bg-rose-950/20 text-rose-200'
                              : isAlerta
                              ? 'border-amber-500/40 bg-amber-950/20 text-amber-200'
                              : 'border-slate-800 bg-[#020408] text-slate-300'
                          }`}
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${
                                  isCritico
                                    ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                                    : isAlerta
                                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                                    : 'bg-slate-800 border-slate-700 text-slate-400'
                                }`}
                              >
                                {alerta.nivel}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {alerta.baseLegal}
                              </span>
                            </div>
                            <h4 className="text-xs font-black text-white leading-snug">
                              {alerta.titulo}
                            </h4>
                            <p className="text-[11px] text-slate-300 leading-relaxed">
                              {alerta.descricao}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Checklist Interativo de Certidões */}
              {resultado.checklistCertidoes && resultado.checklistCertidoes.length > 0 && (
                <div className="rounded-2xl border border-slate-800/90 bg-[#020408] p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-emerald-400" />
                      Checklist Obrigatório de Certidões & Ações Notariais
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Clique no status para alternar
                    </span>
                  </div>

                  <div className="space-y-2">
                    {resultado.checklistCertidoes.map((item, idx) => {
                      const isOk = item.status === 'OK';
                      const isAtencao = item.status === 'ATENCAO';

                      return (
                        <div
                          key={idx}
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 rounded-xl border border-slate-800 bg-slate-950/70 p-3 hover:border-slate-700 transition"
                        >
                          <div className="space-y-0.5 min-w-0">
                            <h5 className="text-xs font-bold text-white truncate">
                              {item.item}
                            </h5>
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                              {item.acaoRecomendada}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => alternarStatusChecklist(idx)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border shrink-0 transition cursor-pointer ${
                              isOk
                                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
                                : isAtencao
                                ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 hover:bg-rose-500/25'
                                : 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
                            }`}
                          >
                            {isOk ? 'OK · Emitida' : isAtencao ? 'Atenção' : 'Pendente'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recomendação Conclusiva */}
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
                  Recomendação de Fechamento:
                </span>
                <p className="text-xs text-white leading-relaxed font-semibold">
                  {resultado.recomendacaoFinal}
                </p>
              </div>

              {/* Barra de Ações: Copiar e Enviar no WhatsApp */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
                <span className="text-[11px] text-slate-500">
                  Pronto para formalizar com a diretoria, cliente ou cartório de notas.
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={copiarParecer}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white px-3.5 py-2 transition cursor-pointer"
                  >
                    {copiado ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    <span>{copiado ? 'Parecer Copiado!' : 'Copiar Parecer & Checklist'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={enviarWhatsApp}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black uppercase tracking-wider px-4 py-2 transition cursor-pointer shadow-lg shadow-emerald-500/20"
                  >
                    <MessageCircle size={14} />
                    <span>Enviar Parecer no Zap</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
