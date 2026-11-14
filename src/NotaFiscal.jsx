/* eslint-disable react/prop-types */
import React, { useState, useEffect, useMemo } from 'react';
import { db } from './lib/firebase';
import SeletorUF from './components/ui/SeletorUF';
import { collection, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import {
  termometroLocador, ibsCbsLocadorPF, compararPfHolding, demonstrativoAnual,
  baixarDemonstrativo, validarCib, formatarCib, ALIQUOTA_LOCADOR_PF,
  REDUTOR_SOCIAL_IMOVEL, LIMITES_LOCADOR_PF,
} from './lib/fiscal';
import {
  FileText,
  Thermometer,
  Download,
  Zap,
  CheckCircle2,
  Send,
  Printer,
  Code2,
  ArrowRight,
  ShieldCheck,
  Building2,
  RefreshCw,
  Landmark,
  HelpCircle,
  Sparkles,
  Wallet,
} from 'lucide-react';

const fmtBRL = (v) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const NOTAS_EXEMPLO_INICIAIS = [
  {
    id: 'nf_demo_1',
    numeroNfse: '2026084',
    chaveAcessoADN: '35261148921045000199560000000020260841928374650',
    modalidade: 'Locação com Repasse (Split)',
    clienteNome: 'Carlos Eduardo Mendes (Locatário) / Prop: Roberto Almeida',
    clienteDoc: '142.859.300-12',
    clienteWhatsapp: '5511999998888',
    imovelRef: 'IMB-4092 • Apto Jardins 110m²',
    valorBrutoOperacao: 4500,
    valorRepasseProprietario: 4050,
    taxaAdmPerc: 10,
    baseCalculoTributavel: 450,
    aliquotaIssAtual: 3.0,
    valorIssAtual: 13.5,
    aliquotaIbsCbsEfetiva: 13.25,
    valorIbsEstimado: 39.83,
    valorCbsEstimado: 19.8,
    statusADN: 'Emitida Automaticamente (Webhook Financeiro → ADN)',
    dataEmissao: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'nf_demo_2',
    numeroNfse: '2026085',
    chaveAcessoADN: '35261148921045000199560000000020260859834710293',
    modalidade: 'Comissão de Corretagem / Venda',
    clienteNome: 'Construtora Horizonte & Comprador Marcos Silva',
    clienteDoc: '28.451.902/0001-84',
    clienteWhatsapp: '5511988887777',
    imovelRef: 'IMB-8120 • Cobertura Duplex Vila Nova',
    valorBrutoOperacao: 51000,
    valorRepasseProprietario: 15300,
    taxaAdmPerc: 70,
    baseCalculoTributavel: 35700,
    aliquotaIssAtual: 3.0,
    valorIssAtual: 1071,
    aliquotaIbsCbsEfetiva: 13.25,
    valorIbsEstimado: 3159.45,
    valorCbsEstimado: 1570.8,
    statusADN: 'Autorizada no Emissor Nacional ADN',
    dataEmissao: new Date().toISOString(),
  },
];

export default function NotaFiscal({
  config = {},
  imobiliariaId: imobiliariaIdProp,
  oficinaId: oficinaIdProp,
  dadosIniciais = {},
  listaFinanceiro = [],
}) {
  const imobiliariaId = useMemo(() => {
    if (imobiliariaIdProp) return imobiliariaIdProp;
    if (oficinaIdProp) return oficinaIdProp;
    try {
      return localStorage.getItem('imobiliariaId') || localStorage.getItem('oficinaId') || '';
    } catch {
      return '';
    }
  }, [imobiliariaIdProp, oficinaIdProp]);

  // Controle de Automação Webhook (Financeiro -> ADN Nacional)
  const [automacaoAtiva, setAutomacaoAtiva] = useState(true);
  const [envioZapAutomatico, setEnvioZapAutomatico] = useState(true);
  const [regimeTributario, setRegimeTributario] = useState('Simples Nacional (Anexo III) + Transição IBS/CBS');

  // Campos de Simulação e Emissão Unificada (NFS-e Nacional + Recibo de Repasse)
  const [modalidade, setModalidade] = useState('Locação com Repasse (Split)');
  const [clienteNome, setClienteNome] = useState(dadosIniciais?.cliente || '');
  const [clienteDoc, setClienteDoc] = useState('');
  const [clienteWhatsapp, setClienteWhatsapp] = useState(dadosIniciais?.telefone || '');
  const [proprietarioNome, setProprietarioNome] = useState('');
  const [imovelRef, setImovelRef] = useState(dadosIniciais?.codigoImovel || '');
  const [cib, setCib] = useState('');
  const [proprietarioDoc, setProprietarioDoc] = useState('');
  const [qtdImoveisLocador, setQtdImoveisLocador] = useState('1');
  const [receitaAnualLocador, setReceitaAnualLocador] = useState('');
  const [valorBruto, setValorBruto] = useState('4500');
  const [percentualTaxaImobiliaria, setPercentualTaxaImobiliaria] = useState('10');
  const [aliquotaIss, setAliquotaIss] = useState('3.0');
  const [aliquotaPadraoIbsCbs, setAliquotaPadraoIbsCbs] = useState('26.5');

  const [notasEmitidas, setNotasEmitidas] = useState(() => {
    try {
      const salvas = JSON.parse(localStorage.getItem('notas_fiscais_imobi_auto') || '[]');
      return Array.isArray(salvas) && salvas.length > 0
        ? [...salvas, ...NOTAS_EXEMPLO_INICIAIS]
        : NOTAS_EXEMPLO_INICIAIS;
    } catch {
      return NOTAS_EXEMPLO_INICIAIS;
    }
  });

  const [notaSelecionadaPreview, setNotaSelecionadaPreview] = useState(null);
  const [mostrarPayloadADN, setMostrarPayloadADN] = useState(false);
  const [statusMensagem, setStatusMensagem] = useState('');
  const [emitindo, setEmitindo] = useState(false);

  // Sincroniza com Firestore se houver imobiliariaId
  useEffect(() => {
    if (!imobiliariaId) return undefined;
    const refNotas = collection(db, 'oficinas', imobiliariaId, 'notas_fiscais_imobi');
    const unsub = onSnapshot(
      refNotas,
      (snap) => {
        if (!snap || snap.empty) return;
        const docsDB = (snap?.docs || [])?.map((d) => ({ id: d.id, ...d.data() })) || [];
        setNotasEmitidas((prev) => {
          const locaisAuto = (() => {
            try {
              return JSON.parse(localStorage.getItem('notas_fiscais_imobi_auto') || '[]');
            } catch {
              return [];
            }
          })();
          const combinadas = [...docsDB, ...(Array.isArray(locaisAuto) ? locaisAuto : []), ...(prev || [])];
          const vistas = new Set();
          return combinadas.filter((item) => {
            const k = item?.chaveAcessoADN || item?.id;
            if (!k || vistas.has(k)) return false;
            vistas.add(k);
            return true;
          });
        });
      },
      (err) => console.warn('Aviso listener notas_fiscais_imobi:', err.message)
    );
    return () => unsub();
  }, [imobiliariaId]);

  // Ajusta percentual padrão ao trocar entre Locação (taxa adm 10%) e Venda (comissão imobiliária 100% ou 70% após split corretor)
  const alternarModalidade = (novaMod) => {
    setModalidade(novaMod);
    if (novaMod === 'Locação com Repasse (Split)') {
      setPercentualTaxaImobiliaria('10');
      if (!valorBruto || Number(valorBruto) > 20000) setValorBruto('4500');
    } else if (novaMod === 'Comissão de Corretagem / Venda') {
      setPercentualTaxaImobiliaria('70');
      if (!valorBruto || Number(valorBruto) < 5000) setValorBruto('36000');
    } else {
      setPercentualTaxaImobiliaria('100');
      setValorBruto('1500');
    }
  };

  // Motor de Cálculo Fiscal Unificado (Split de Repasse + ISS Atual + Reforma Tributária IBS/CBS LC 214/2025)
  const calculoFiscal = useMemo(() => {
    const bruto = Math.max(0, Number(String(valorBruto).replace(',', '.')) || 0);
    const taxaPerc = Math.min(100, Math.max(0, Number(String(percentualTaxaImobiliaria).replace(',', '.')) || 0));
    const baseTributavel = +(bruto * (taxaPerc / 100)).toFixed(2);
    const valorRepasse = +(bruto - baseTributavel).toFixed(2);

    const issPerc = Math.max(0, Number(String(aliquotaIss).replace(',', '.')) || 3.0);
    const valorIss = +(baseTributavel * (issPerc / 100)).toFixed(2);

    // Reforma Tributária (LC 214/2025): Redutor de 50% para intermediação/administração imobiliária sobre alíquota padrão (ex: 26,5% -> 13,25%)
    const aliqReferencia = Math.max(0, Number(String(aliquotaPadraoIbsCbs).replace(',', '.')) || 26.5);
    const redutorReformaPerc = 50; // Redução de 50% para serviços de intermediação e administração imobiliária
    const aliqEfetivaIbsCbs = +(aliqReferencia * (1 - redutorReformaPerc / 100)).toFixed(2);

    // Divisão proporcional estimada: 2/3 IBS (Estadual/Municipal) e 1/3 CBS (Federal)
    const valorIbs = +(baseTributavel * ((aliqEfetivaIbsCbs * 0.667) / 100)).toFixed(2);
    const valorCbs = +(baseTributavel * ((aliqEfetivaIbsCbs * 0.333) / 100)).toFixed(2);
    const totalIbsCbs = +(valorIbs + valorCbs).toFixed(2);

    // Na fase de transição (2026: 0,9% CBS + 0,1% IBS compensáveis), destacamos ambos no XML ADN
    const liquidoImobiliaria = +(baseTributavel - valorIss).toFixed(2);

    return {
      bruto,
      taxaPerc,
      baseTributavel,
      valorRepasse,
      issPerc,
      valorIss,
      aliqReferencia,
      redutorReformaPerc,
      aliqEfetivaIbsCbs,
      valorIbs,
      valorCbs,
      totalIbsCbs,
      liquidoImobiliaria,
    };
  }, [valorBruto, percentualTaxaImobiliaria, aliquotaIss, aliquotaPadraoIbsCbs]);

  // Payload JSON/XML estruturado segundo o leiaute técnico da DPS / NFS-e Padrão Nacional (ADN) + Grupos IBS/CBS
  const payloadADN = useMemo(() => {
    const nfRef = notaSelecionadaPreview || {
      numeroNfse: 'PREVIEW-ADN',
      chaveAcessoADN: '35261148921045000199560000000020269991234567890',
      modalidade,
      clienteNome: clienteNome || 'Tomador / Locatário Padrão',
      clienteDoc: clienteDoc || '000.000.000-00',
      imovelRef: imovelRef || 'IMB-0001',
      valorBrutoOperacao: calculoFiscal.bruto,
      valorRepasseProprietario: calculoFiscal.valorRepasse,
      baseCalculoTributavel: calculoFiscal.baseTributavel,
      aliquotaIssAtual: calculoFiscal.issPerc,
      valorIssAtual: calculoFiscal.valorIss,
      aliquotaIbsCbsEfetiva: calculoFiscal.aliqEfetivaIbsCbs,
      valorIbsEstimado: calculoFiscal.valorIbs,
      valorCbsEstimado: calculoFiscal.valorCbs,
    };

    return {
      padrao: 'ADN_NFSE_NACIONAL_v1.02_REFORMA_TRIBUTARIA',
      ambiente: '1 - Produção / Emissor Nacional',
      eventoOrigem: 'FINANCEIRO_LIQUIDACAO_WEBHOOK',
      dps: {
        cTribNac: '10.05.01',
        xDescServ: `${nfRef.modalidade} — Ref. Imóvel ${nfRef.imovelRef || 'Catálogo Imobiliário'}`,
        prestador: {
          nome: config?.nomeOficina || 'Express Imobi Tech Negócios Imobiliários',
          creci: config?.creci || 'CRECI-SP 045921-J',
          regimeApuracao: regimeTributario,
        },
        tomador: {
          nome: nfRef.clienteNome,
          documento: nfRef.clienteDoc,
        },
        valores: {
          vRecebimentoBruto: nfRef.valorBrutoOperacao,
          vRepasseTerceiroDeduzido: nfRef.valorRepasseProprietario,
          vBC_TaxaImobiliaria: nfRef.baseCalculoTributavel,
          issqn: {
            pAliqISS: nfRef.aliquotaIssAtual,
            vISS: nfRef.valorIssAtual,
          },
          reformaTributaria_IBSCBS: {
            cstIBSCBS: '200 - Alíquota Reduzida Regime Específico Imobiliário (LC 214/2025)',
            pRedutorImobiliario: '50.00%',
            pAliqEfetivaTotal: `${nfRef.aliquotaIbsCbsEfetiva}%`,
            vIBS_EstadualMunicipal: nfRef.valorIbsEstimado,
            vCBS_Federal: nfRef.valorCbsEstimado,
            splitPaymentAtivo: true,
          },
        },
      },
    };
  }, [notaSelecionadaPreview, modalidade, clienteNome, clienteDoc, imovelRef, calculoFiscal, config, regimeTributario]);
  /* --- Termometro fiscal do locador PF (LC 214/2025) --- */
  const [anoTermometro, setAnoTermometro] = useState(new Date().getFullYear());

  const demoAnual = useMemo(
    () => demonstrativoAnual(notasEmitidas, { ano: anoTermometro, cpf: proprietarioDoc || null }),
    [notasEmitidas, anoTermometro, proprietarioDoc],
  );

  const termometro = useMemo(() => termometroLocador({
    qtdImoveis: Number(qtdImoveisLocador) || demoAnual.total.imoveis,
    receitaAnual: Number(receitaAnualLocador) || demoAnual.total.aluguel,
  }), [qtdImoveisLocador, receitaAnualLocador, demoAnual]);

  const ibsLocador = useMemo(() => ibsCbsLocadorPF({
    aluguelMensal: termometro.receitaAnual / 12,
    imoveisResidenciais: Math.max(1, termometro.qtdImoveis || demoAnual.total.imoveis || 1),
    enquadrado: termometro.enquadrado,
  }), [termometro, demoAnual]);

  const comparativo = useMemo(
    () => compararPfHolding({ receitaAnual: termometro.receitaAnual }),
    [termometro.receitaAnual],
  );

  const dispararWhatsAppNota = (nota) => {
    const fone = String(nota?.clienteWhatsapp || '').replace(/\D/g, '');
    const msg =
      `📄 *NFS-e NACIONAL (ADN) & RECIBO DE REPASSE — EXPRESS IMOBI TECH*\n\n` +
      `✅ *Status:* ${nota.statusADN}\n` +
      `🔢 *Nº NFS-e:* ${nota.numeroNfse}\n` +
      `🔑 *Chave ADN:* ${nota.chaveAcessoADN}\n` +
      `🏠 *Operação:* ${nota.modalidade} (${nota.imovelRef || 'Imóvel'})\n\n` +
      `💰 *Valor Total Liquidado:* ${fmtBRL(nota.valorBrutoOperacao)}\n` +
      `🔄 *Repasse Líquido ao Proprietário/Parceiro (Não Tributável):* ${fmtBRL(nota.valorRepasseProprietario)}\n` +
      `📊 *Base Tributável da Imobiliária (Taxa/Comissão):* ${fmtBRL(nota.baseCalculoTributavel)}\n` +
      `🏛️ *ISS Apurado:* ${fmtBRL(nota.valorIssAtual)} | *IBS/CBS Reforma (Split):* ${fmtBRL((Number(nota.valorIbsEstimado) || 0) + (Number(nota.valorCbsEstimado) || 0))}\n\n` +
      `_Documento emitido automaticamente via integração Financeiro → Emissor Nacional NFS-e._`;

    const url = fone
      ? `https://api.whatsapp.com/send?phone=${fone}&text=${encodeURIComponent(msg)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const imprimirPDFUnificado = (nota) => {
    const janela = window.open('', '_blank', 'width=880,height=720');
    if (!janela) {
      alert('Permita pop-ups para visualizar e imprimir o PDF da NFS-e Nacional e Recibo de Repasse.');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <title>DANFSE Nacional + Recibo de Repasse — #${nota.numeroNfse}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #0f172a; margin: 24px; }
          .box { border: 2px solid #0f172a; border-radius: 10px; padding: 18px; margin-bottom: 20px; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #10b981; padding-bottom: 12px; margin-bottom: 14px; }
          .badge { background: #10b981; color: #fff; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: bold; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px; margin-bottom: 12px; }
          .valores { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
          .val-item strong { display: block; font-size: 15px; color: #047857; margin-top: 4px; }
          .chave { font-family: monospace; font-size: 12px; background: #f1f5f9; padding: 6px 10px; border-radius: 6px; margin-top: 6px; }
          .footer { font-size: 11px; color: #475569; margin-top: 12px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="box">
          <div class="header">
            <div>
              <h2 style="margin:0;">DANFSE — DOCUMENTO AUXILIAR DA NFS-e PADRÃO NACIONAL (ADN)</h2>
              <p style="margin:4px 0 0;font-size:12px;">${config?.nomeOficina || 'Express Imobi Tech'} • ${config?.creci || 'CRECI Ativo'} • Código Tributação Nacional: 10.05.01</p>
            </div>
            <div style="text-align:right;">
              <span class="badge">NFS-e Nº ${nota.numeroNfse}</span>
              <p style="margin:6px 0 0;font-size:11px;">Emissão: ${new Date(nota.dataEmissao || Date.now()).toLocaleString('pt-BR')}</p>
            </div>
          </div>
          <div class="chave"><strong>Chave de Acesso ADN (50 dígitos):</strong> ${nota.chaveAcessoADN}</div>
          <div class="grid" style="margin-top:14px;">
            <div><strong>Tomador / Cliente:</strong> ${nota.clienteNome || 'Não informado'}</div>
            <div><strong>CPF/CNPJ:</strong> ${nota.clienteDoc || 'Não informado'}</div>
            <div><strong>Modalidade Fiscal:</strong> ${nota.modalidade}</div>
            <div><strong>Imóvel / Referência:</strong> ${nota.imovelRef || 'Catálogo Imobiliário'}</div>
          </div>
          <div class="valores">
            <div class="val-item"><span>Valor Liquidado Bruto</span><strong>${fmtBRL(nota.valorBrutoOperacao)}</strong></div>
            <div class="val-item"><span>(-) Repasse ao Proprietário</span><strong>${fmtBRL(nota.valorRepasseProprietario)}</strong></div>
            <div class="val-item"><span>(=) Base Tributável (Taxa/Comissão)</span><strong>${fmtBRL(nota.baseCalculoTributavel)}</strong></div>
            <div class="val-item"><span>ISS (${nota.aliquotaIssAtual}%) / IBS+CBS Reforma</span><strong>${fmtBRL(nota.valorIssAtual)} / ${fmtBRL((Number(nota.valorIbsEstimado) || 0) + (Number(nota.valorCbsEstimado) || 0))}</strong></div>
          </div>
        </div>

        <div class="box">
          <div class="header">
            <div>
              <h3 style="margin:0;">RECIBO OFICIAL DE REPASSE IMOBILIÁRIO (SPLIT PAYMENT)</h3>
              <p style="margin:4px 0 0;font-size:12px;">Comprovante de Liquidação Financeira e Dedução de Repasse (Regra DIMOB / LC 214/2025)</p>
            </div>
            <span class="badge">REPASSE LÍQUIDO: ${fmtBRL(nota.valorRepasseProprietario)}</span>
          </div>
          <p style="font-size:13px;line-height:1.6;">
            Certificamos que do montante total liquidado de <strong>${fmtBRL(nota.valorBrutoOperacao)}</strong> referente a <strong>${nota.imovelRef || 'operação imobiliária'}</strong>,
            a importância de <strong>${fmtBRL(nota.valorRepasseProprietario)}</strong> constitui repasse financeiro ao proprietário/parceiro (não integrante da receita bruta própria da imobiliária),
            incidindo a tributação da NFS-e exclusivamente sobre a taxa de administração/corretagem de <strong>${fmtBRL(nota.baseCalculoTributavel)}</strong>.
          </p>
          <div class="footer">
            Gerado de forma 100% automatizada pelo Módulo Fiscal Unificado — Express Imobi Tech
          </div>
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `;
    janela.document.write(html);
    janela.document.close();
  };

  const emitirNotaUnificada = async (e, dadosForcados = null) => {
    if (e) e.preventDefault();
    setEmitindo(true);
    try {
      const origem = dadosForcados || {
        modalidade,
        clienteNome: clienteNome.trim() || 'Cliente / Locatário Imobiliário',
        clienteDoc: clienteDoc.trim() || '111.222.333-44',
        clienteWhatsapp: clienteWhatsapp.trim(),
        proprietarioNome: proprietarioNome.trim() || 'Proprietário Cadastrado',
        imovelRef: imovelRef.trim() || 'IMB-2026',
        cib: cib.replace(/\D/g, ''),
        proprietarioDoc: proprietarioDoc.replace(/\D/g, ''),
        valorBrutoOperacao: calculoFiscal.bruto,
        valorRepasseProprietario: calculoFiscal.valorRepasse,
        taxaAdmPerc: calculoFiscal.taxaPerc,
        baseCalculoTributavel: calculoFiscal.baseTributavel,
        aliquotaIssAtual: calculoFiscal.issPerc,
        valorIssAtual: calculoFiscal.valorIss,
        aliquotaIbsCbsEfetiva: calculoFiscal.aliqEfetivaIbsCbs,
        valorIbsEstimado: calculoFiscal.valorIbs,
        valorCbsEstimado: calculoFiscal.valorCbs,
      };

      const numeroGerado = String(Math.floor(2026100 + Math.random() * 899));
      const chaveADN = `352611489210450001995600000000${numeroGerado}${Math.floor(1000000000 + Math.random() * 8999999999)}`;

      const novaNota = {
        id: `nf_${Date.now()}`,
        numeroNfse: numeroGerado,
        chaveAcessoADN: chaveADN,
        ...origem,
        statusADN: 'Emitida Automaticamente (API ADN Nacional + Recibo de Repasse)',
        dataEmissao: new Date().toISOString(),
      };

      if (imobiliariaId) {
        await addDoc(collection(db, 'oficinas', imobiliariaId, 'notas_fiscais_imobi'), {
          ...novaNota,
          criadoEm: serverTimestamp(),
        }).catch(() => null);
      }

      setNotasEmitidas((prev) => {
        const atualizada = [novaNota, ...(Array.isArray(prev) ? prev : [])];
        try {
          localStorage.setItem('notas_fiscais_imobi_auto', JSON.stringify(atualizada.slice(0, 50)));
        } catch {
          // ignora quota
        }
        return atualizada;
      });

      setNotaSelecionadaPreview(novaNota);
      setStatusMensagem(
        `✅ NFS-e Nacional #${numeroGerado} + Recibo de Repasse (${fmtBRL(novaNota.valorRepasseProprietario)}) emitidos via API ADN!`
      );
      setTimeout(() => setStatusMensagem(''), 6000);
    } finally {
      setEmitindo(false);
    }
  };

  // Receitas do Financeiro disponíveis para liquidação/emissão em 1 clique
  const receitasFinanceiroRecentes = useMemo(() => {
    const base = Array.isArray(listaFinanceiro) ? listaFinanceiro : [];
    return base
      .filter((item) => item?.tipo !== 'saida' && item?.tipo !== 'despesa')
      .slice(0, 5);
  }, [listaFinanceiro]);

  return (
    <div style={{ backgroundColor: '#020408' }} className="space-y-6 text-slate-100 font-sans">
      <SeletorUF className="mb-5" />
      {/* ═══════════════════════════════════════════════════════════════════════
          1. CABEÇALHO EXECUTIVO & ARQUITETURA AUTOMATIZADA (ADN + IBS/CBS)
         ═══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10b981]/15 border border-[#10b981]/30 text-[#10b981] text-xs font-extrabold uppercase tracking-wider">
              <Sparkles size={14} /> Módulo Fiscal Avançado • Padrão Nacional NFS-e (ADN) + Reforma Tributária
            </div>
            <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight">
              REPASSES & <span style={{ color: '#10b981' }}>NOTA FISCAL UNIFICADA (IBS / CBS)</span>
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Fluxo 100% automatizado: assim que o aluguel ou a comissão é liquidado no <strong>Financeiro & VGV</strong>, o sistema deduz o repasse do proprietário (Split Payment), comunica-se via API com o <strong>Ambiente de Dados Nacional (ADN)</strong>, emite a <strong>NFS-e Nacional</strong> + <strong>Recibo de Repasse</strong> e envia o PDF no WhatsApp do cliente sem intervenção manual.
            </p>
          </div>

          {/* Controles do Webhook Automático */}
          <div className="bg-[#020408] border border-[#10b981]/40 rounded-2xl p-4 space-y-3 min-w-[280px]">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-extrabold uppercase text-slate-200 flex items-center gap-1.5">
                <Zap size={15} className="text-[#10b981]" /> Emissão Automática (Webhook)
              </span>
              <button
                type="button"
                onClick={() => setAutomacaoAtiva((v) => !v)}
                style={automacaoAtiva ? { backgroundColor: '#10b981' } : undefined}
                className={`px-3 py-1 rounded-full text-[11px] font-black uppercase transition cursor-pointer ${
                  automacaoAtiva ? 'text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {automacaoAtiva ? 'Ativo 24h' : 'Pausado'}
              </button>
            </div>
            <div className="flex items-center justify-between gap-3 text-xs text-slate-400">
              <span>Disparo PDF + WhatsApp na baixa:</span>
              <button
                type="button"
                onClick={() => setEnvioZapAutomatico((v) => !v)}
                className="text-[#10b981] font-bold hover:underline cursor-pointer"
              >
                {envioZapAutomatico ? '✓ Habilitado' : 'Desativado'}
              </button>
            </div>
            <div className="pt-1 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>Padrão Webservice:</span>
              <span className="text-[#10b981] font-bold">ADN Emissor Nacional (v1.02)</span>
            </div>
          </div>
        </div>

        {/* Pipeline Visual da Arquitetura Fiscal Automatizada */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
          {[
            {
              passo: '1. Gatilho no Financeiro',
              titulo: 'Liquidação de Comissão / Aluguel',
              desc: 'Baixa de PIX/Boleto no módulo Financeiro dispara evento automático sem digitação.',
              icone: Wallet,
            },
            {
              passo: '2. Motor Split & Reforma',
              titulo: 'Dedução do Repasse + IBS/CBS',
              desc: 'Separa o repasse do proprietário (isento na imobiliária) e aplica o redutor imobiliário de 50% (LC 214/2025).',
              icone: Landmark,
            },
            {
              passo: '3. Webservice Nacional ADN',
              titulo: 'Transmissão DPS → NFS-e',
              desc: 'Envio assíncrono mTLS/REST para a API do Emissor Nacional gerando chave de 50 dígitos.',
              icone: ShieldCheck,
            },
            {
              passo: '4. Entrega Transparente',
              titulo: 'DANFSE PDF + Recibo no Zap',
              desc: 'Envia a NFS-e ao inquilino/comprador e o Recibo de Repasse líquido ao proprietário.',
              icone: Send,
            },
          ]?.map((etapa) => {
            const Icone = etapa.icone;
            return (
              <div
                key={etapa.passo}
                className="bg-[#020408] border border-slate-800 hover:border-[#10b981]/60 rounded-2xl p-4 transition space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#10b981]">
                    {etapa.passo}
                  </span>
                  <Icone size={16} className="text-[#10b981]" />
                </div>
                <h3 className="text-sm font-black text-white">{etapa.titulo}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{etapa.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {statusMensagem && (
        <div className="bg-slate-900 border border-[#10b981] rounded-2xl px-5 py-3.5 flex items-center justify-between gap-3 text-sm font-bold text-[#10b981]">
          <span className="flex items-center gap-2">
            <CheckCircle2 size={18} /> {statusMensagem}
          </span>
          <button onClick={() => setStatusMensagem('')} className="text-slate-400 hover:text-white cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          2. SIMULADOR E EMISSOR AUTOMÁTICO (SPLIT DE REPASSE + ISS vs IBS/CBS)
         ═══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna Esquerda: Formulário de Liquidação / Regra de Repasse */}
        <form
          onSubmit={(e) => emitirNotaUnificada(e)}
          className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <FileText size={20} className="text-[#10b981]" />
                Emissão Unificada: NFS-e Nacional + Recibo de Repasse
              </h2>
              <p className="text-xs text-slate-400">
                Calcule o Split Imobiliário e emita a NFS-e no Padrão ADN com prévia da Reforma Tributária (IBS/CBS).
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMostrarPayloadADN((v) => !v)}
              className="px-3 py-1.5 rounded-xl bg-[#020408] border border-slate-700 hover:border-[#10b981] text-xs font-bold text-[#10b981] flex items-center gap-1.5 cursor-pointer"
            >
              <Code2 size={14} /> {mostrarPayloadADN ? 'Ocultar JSON ADN' : 'Ver Payload API ADN'}
            </button>
          </div>

          {/* Seletor de Modalidade Imobiliária */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              'Locação com Repasse (Split)',
              'Comissão de Corretagem / Venda',
              'Laudo de Vistoria / Assessoria',
            ]?.map((mod) => {
              const ativo = modalidade === mod;
              return (
                <button
                  key={mod}
                  type="button"
                  onClick={() => alternarModalidade(mod)}
                  style={ativo ? { backgroundColor: '#10b981', borderColor: '#10b981' } : undefined}
                  className={`px-3 py-2.5 rounded-xl text-xs font-extrabold border text-left transition cursor-pointer ${
                    ativo
                      ? 'text-white shadow-md shadow-[#10b981]/20'
                      : 'bg-[#020408] border-slate-800 text-slate-300 hover:border-[#10b981]'
                  }`}
                >
                  {mod}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                Tomador do Serviço (Locatário / Comprador / Construtora)
              </label>
              <input
                value={clienteNome}
                onChange={(e) => setClienteNome(e.target.value)}
                placeholder="Ex: Carlos Eduardo Mendes"
                className="w-full bg-[#020408] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                CPF ou CNPJ do Tomador
              </label>
              <input
                value={clienteDoc}
                onChange={(e) => setClienteDoc(e.target.value)}
                placeholder="000.000.000-00 ou 00.000.000/0001-00"
                className="w-full bg-[#020408] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                Proprietário / Parceiro (Destinatário do Repasse)
              </label>
              <input
                value={proprietarioNome}
                onChange={(e) => setProprietarioNome(e.target.value)}
                placeholder="Ex: Roberto Almeida (Proprietário)"
                className="w-full bg-[#020408] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                Código / Referência do Imóvel
              </label>
              <input
                value={imovelRef}
                onChange={(e) => setImovelRef(e.target.value)}
                placeholder="Ex: IMB-4092 • Apto Jardins"
                className="w-full bg-[#020408] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                CIB — Cadastro Imobiliário Brasileiro
              </label>
              <input
                value={cib}
                onChange={(e) => setCib(e.target.value)}
                placeholder="20 dígitos (código IBGE + sequencial)"
                className="w-full bg-[#020408] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono"
              />
              {cib ? (
                <p className={`mt-1 text-[10px] font-bold ${validarCib(cib).ok ? 'text-[#10b981]' : 'text-rose-400'}`}>
                  {validarCib(cib).ok ? `CIB válido · ${formatarCib(cib)}` : validarCib(cib).erro}
                </p>
              ) : (
                <p className="mt-1 text-[10px] text-slate-500">“CPF do imóvel”. Obrigatório para DIMOB e IBS/CBS.</p>
              )}
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                CPF/CNPJ do proprietário (locador)
              </label>
              <input
                value={proprietarioDoc}
                onChange={(e) => setProprietarioDoc(e.target.value)}
                placeholder="000.000.000-00"
                className="w-full bg-[#020408] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                WhatsApp p/ Envio Automático PDF
              </label>
              <input
                value={clienteWhatsapp}
                onChange={(e) => setClienteWhatsapp(e.target.value)}
                placeholder="Ex: 5511999998888"
                className="w-full bg-[#020408] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-bold uppercase text-[#10b981] mb-1">
                Valor Bruto Liquidado (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={valorBruto}
                onChange={(e) => setValorBruto(e.target.value)}
                className="w-full bg-[#020408] border border-[#10b981]/60 rounded-xl px-3 py-2 text-sm font-black text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                % Taxa/Comissão Imobiliária
              </label>
              <input
                type="number"
                step="0.5"
                value={percentualTaxaImobiliaria}
                onChange={(e) => setPercentualTaxaImobiliaria(e.target.value)}
                className="w-full bg-[#020408] border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                Alíquota ISS Atual (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={aliquotaIss}
                onChange={(e) => setAliquotaIss(e.target.value)}
                className="w-full bg-[#020408] border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                Ref. Padrão IBS+CBS (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={aliquotaPadraoIbsCbs}
                onChange={(e) => setAliquotaPadraoIbsCbs(e.target.value)}
                className="w-full bg-[#020408] border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
              />
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <HelpCircle size={14} className="text-[#10b981]" />
              <span>
                O repasse ao proprietário (<strong className="text-white">{fmtBRL(calculoFiscal.valorRepasse)}</strong>) é deduzido automaticamente da base da NFS-e.
              </span>
            </div>
            <button
              type="submit"
              disabled={emitindo}
              style={{ backgroundColor: '#10b981' }}
              className="px-6 py-3 rounded-xl text-white font-black text-xs uppercase tracking-wider hover:opacity-90 transition flex items-center gap-2 cursor-pointer shadow-lg shadow-[#10b981]/25"
            >
              <Zap size={16} />
              {emitindo ? 'Transmitindo ao ADN...' : 'Emitir NFS-e Nacional + Recibo de Repasse'}
            </button>
          </div>
        </form>

        {/* Coluna Direita: Painel Comparativo (Split + ISS Atual vs Reforma Tributária IBS/CBS) */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#10b981]">
                  Motor de Split & Reforma Tributária (LC 214/2025)
                </span>
                <h3 className="text-lg font-black text-white">Apuração Fiscal Instantânea</h3>
              </div>
              <Building2 size={22} className="text-[#10b981]" />
            </div>

            {/* Resumo do Split Payment */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-[#020408] border border-slate-800 rounded-2xl p-3.5">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Recebimento Bruto</span>
                <strong className="text-base font-black text-white mt-1 block">{fmtBRL(calculoFiscal.bruto)}</strong>
              </div>
              <div className="bg-[#020408] border border-slate-800 rounded-2xl p-3.5">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">(-) Repasse Isento</span>
                <strong className="text-base font-black text-slate-200 mt-1 block">
                  {fmtBRL(calculoFiscal.valorRepasse)}
                </strong>
              </div>
              <div className="bg-[#020408] border border-[#10b981]/60 rounded-2xl p-3.5">
                <span className="text-[10px] font-extrabold uppercase text-[#10b981] block">
                  (=) Base NFS-e ({calculoFiscal.taxaPerc}%)
                </span>
                <strong className="text-base font-black text-[#10b981] mt-1 block">
                  {fmtBRL(calculoFiscal.baseTributavel)}
                </strong>
              </div>
            </div>

            {/* Comparativo Sistema Atual (ISS) vs Reforma Tributária (IBS + CBS) */}
            <div className="space-y-3">
              <div className="bg-[#020408] border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-white">
                    1. Tributação Municipal Atual (ISS / Simples Anexo III)
                  </span>
                  <span className="text-xs font-black text-[#10b981]">{fmtBRL(calculoFiscal.valorIss)}</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Incidência de {calculoFiscal.issPerc}% estritamente sobre a taxa/comissão da imobiliária ({fmtBRL(calculoFiscal.baseTributavel)}). Receita líquida retida: <strong className="text-white">{fmtBRL(calculoFiscal.liquidoImobiliaria)}</strong>.
                </p>
              </div>

              <div className="bg-[#020408] border border-[#10b981]/40 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-[#10b981]">
                    2. Reforma Tributária (IBS + CBS • Redutor Imobiliário 50%)
                  </span>
                  <span className="text-xs font-black text-white">
                    Alíq. Efetiva: {calculoFiscal.aliqEfetivaIbsCbs}%
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                  <div className="bg-slate-900/90 rounded-xl p-2.5 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">IBS (Estadual / Municipal)</span>
                    <strong className="text-white font-black">{fmtBRL(calculoFiscal.valorIbs)}</strong>
                  </div>
                  <div className="bg-slate-900/90 rounded-xl p-2.5 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">CBS (União Federal)</span>
                    <strong className="text-white font-black">{fmtBRL(calculoFiscal.valorCbs)}</strong>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Preparado para o <strong>Split Payment Bancário (LC 214/2025)</strong>: o valor de repasse ao proprietário é segregado automaticamente na liquidação PIX/Boleto, impedindo bitributação sobre o aluguel/imóvel.
                </p>
              </div>
            </div>
          </div>

          {/* Atalho de Liquidações Recentes vindas do Financeiro */}
          {receitasFinanceiroRecentes.length > 0 && (
            <div className="border-t border-slate-800 pt-3 space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                ⚡ Receitas Liquidadas no Financeiro (Emitir em 1 Clique):
              </span>
              <div className="space-y-1.5">
                {(receitasFinanceiroRecentes || [])?.map((rec) => (
                  <div
                    key={rec.id || rec.descricao}
                    className="flex items-center justify-between bg-[#020408] border border-slate-800 rounded-xl px-3 py-2 text-xs"
                  >
                    <span className="text-slate-200 font-bold truncate max-w-[190px]">
                      {rec.descricao || 'Comissão Liquidada'} ({fmtBRL(rec.valor || rec.total)})
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        emitirNotaUnificada(null, {
                          modalidade: /loca|alug/i.test(rec.descricao)
                            ? 'Locação com Repasse (Split)'
                            : 'Comissão de Corretagem / Venda',
                          clienteNome: rec.descricao || 'Cliente Financeiro',
                          clienteDoc: 'Liquidado no Financeiro',
                          clienteWhatsapp: '',
                          imovelRef: 'Sincronizado do Financeiro',
                          valorBrutoOperacao: Number(rec.valor || rec.total) || 0,
                          valorRepasseProprietario: /loca|alug/i.test(rec.descricao)
                            ? (Number(rec.valor || rec.total) || 0) * 0.9
                            : 0,
                          taxaAdmPerc: /loca|alug/i.test(rec.descricao) ? 10 : 100,
                          baseCalculoTributavel: /loca|alug/i.test(rec.descricao)
                            ? (Number(rec.valor || rec.total) || 0) * 0.1
                            : Number(rec.valor || rec.total) || 0,
                          aliquotaIssAtual: 3.0,
                          valorIssAtual: +(
                            (/loca|alug/i.test(rec.descricao)
                              ? (Number(rec.valor || rec.total) || 0) * 0.1
                              : Number(rec.valor || rec.total) || 0) * 0.03
                          ).toFixed(2),
                          aliquotaIbsCbsEfetiva: 13.25,
                          valorIbsEstimado: +(
                            (/loca|alug/i.test(rec.descricao)
                              ? (Number(rec.valor || rec.total) || 0) * 0.1
                              : Number(rec.valor || rec.total) || 0) * 0.0885
                          ).toFixed(2),
                          valorCbsEstimado: +(
                            (/loca|alug/i.test(rec.descricao)
                              ? (Number(rec.valor || rec.total) || 0) * 0.1
                              : Number(rec.valor || rec.total) || 0) * 0.044
                          ).toFixed(2),
                        })
                      }
                      className="text-[#10b981] font-extrabold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      Emitir ADN <ArrowRight size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview do Payload Técnico ADN (JSON/XML Nacional + IBS/CBS) */}
      {mostrarPayloadADN && (
        <div className="bg-slate-900 border border-[#10b981]/50 rounded-3xl p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-[#10b981] uppercase tracking-wider flex items-center gap-2">
              <Code2 size={16} /> Payload Oficial DPS → Webservice Nacional NFS-e (ADN + Grupos IBS/CBS)
            </h3>
            <span className="text-xs text-slate-400">Schema compatível com Nota Técnica SEFIN Nacional</span>
          </div>
          <pre className="bg-[#020408] border border-slate-800 rounded-2xl p-4 text-xs text-emerald-400 overflow-x-auto font-mono leading-relaxed">
            {JSON.stringify(payloadADN, null, 2)}
          </pre>
        </div>
      )}

      {/* 2.5 TERMOMETRO FISCAL DO LOCADOR (PF) --- IBS/CBS + DIMOB/DIRPF */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#10b981]">
              LC 214/2025 - Regime especifico da locacao residencial
            </span>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Thermometer size={18} className="text-[#10b981]" /> Termometro Fiscal do Locador (Pessoa Fisica)
            </h2>
            <p className="text-xs text-slate-400 max-w-3xl">
              Soma os imoveis locados e a receita anual do CPF. Acima de {LIMITES_LOCADOR_PF.imoveis} imoveis com receita
              superior a {fmtBRL(LIMITES_LOCADOR_PF.receitaComImoveis)} - ou receita acima de {fmtBRL(LIMITES_LOCADOR_PF.receitaAbsoluta)} -
              o locador PF entra no regime regular do IBS/CBS.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={anoTermometro}
              onChange={(e) => setAnoTermometro(Number(e.target.value))}
              className="bg-[#020408] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
            >
              {[0, 1, 2].map((d) => {
                const a = new Date().getFullYear() - d;
                return <option key={a} value={a}>{a}</option>;
              })}
            </select>
            <button
              onClick={() => baixarDemonstrativo(demoAnual, 'DIMOB-DIRPF')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#020408] border border-[#10b981]/50 hover:border-[#10b981] text-[#10b981] font-extrabold text-[11px] uppercase tracking-wider transition"
            >
              <Download size={14} /> DIMOB / DIRPF
            </button>
            <button
              onClick={() => baixarDemonstrativo(demoAnual, 'e-Financeira')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#020408] border border-slate-700 hover:border-[#10b981] text-slate-300 font-extrabold text-[11px] uppercase tracking-wider transition"
            >
              <Download size={14} /> e-Financeira
            </button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
              Imoveis locados do CPF
            </label>
            <input
              value={qtdImoveisLocador}
              onChange={(e) => setQtdImoveisLocador(e.target.value)}
              inputMode="numeric"
              className="w-full bg-[#020408] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
              Receita anual projetada (R$)
            </label>
            <input
              value={receitaAnualLocador}
              onChange={(e) => setReceitaAnualLocador(e.target.value)}
              placeholder={'Calculado: ' + fmtBRL(demoAnual.total.aluguel)}
              inputMode="decimal"
              className="w-full bg-[#020408] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
            />
          </div>
          <div className="bg-[#020408] border border-slate-800 rounded-2xl p-3.5">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Notas no ano {anoTermometro}</span>
            <strong className="text-base font-black text-white mt-1 block">{demoAnual.total.qtd}</strong>
            <span className="text-[10px] text-slate-500">{demoAnual.total.imoveis} imovel(is) - {fmtBRL(demoAnual.total.aluguel)}</span>
          </div>
        </div>

        <div className={'rounded-2xl border p-4 ' + (
          termometro.enquadrado
            ? 'border-rose-500/40 bg-rose-500/10'
            : termometro.nivel === 'atencao'
              ? 'border-amber-500/40 bg-amber-500/10'
              : 'border-[#10b981]/40 bg-[#10b981]/10'
        )}>
          <p className="flex items-start gap-2 text-xs font-black text-white">
            <ShieldCheck size={15} className="mt-0.5 shrink-0" />
            {termometro.enquadrado
              ? 'ENQUADRADO no IBS/CBS'
              : termometro.nivel === 'atencao' ? 'Atencao: perto do limite' : 'Fora do regime regular'}
          </p>
          <p className="mt-1.5 text-[11px] leading-relaxed text-slate-300">{termometro.alerta}</p>
          {termometro.motivos.length > 0 && (
            <ul className="mt-2 list-inside list-disc text-[11px] text-slate-400">
              {termometro.motivos.map((m) => <li key={m}>{m}</li>)}
            </ul>
          )}
        </div>

        {termometro.enquadrado && (
          <div className="grid gap-3 md:grid-cols-3">
            <div className="bg-[#020408] border border-slate-800 rounded-2xl p-4">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Aliquota reduzida (70%)</span>
              <strong className="text-lg font-black text-white mt-1 block">{ALIQUOTA_LOCADOR_PF}%</strong>
              <span className="text-[10px] text-slate-500">de 26,5% cheio (IBS 17,7% + CBS 8,8%)</span>
            </div>
            <div className="bg-[#020408] border border-slate-800 rounded-2xl p-4">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Redutor social</span>
              <strong className="text-lg font-black text-white mt-1 block">{fmtBRL(REDUTOR_SOCIAL_IMOVEL)}/imovel</strong>
              <span className="text-[10px] text-slate-500">aplicado sobre o IBS/CBS do mes</span>
            </div>
            <div className="bg-[#020408] border border-slate-800 rounded-2xl p-4">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">IBS/CBS mensal estimado</span>
              <strong className="text-lg font-black text-[#10b981] mt-1 block">{fmtBRL(ibsLocador.devido)}</strong>
              <span className="text-[10px] text-slate-500">bruto {fmtBRL(ibsLocador.bruto)} - redutor {fmtBRL(ibsLocador.redutor)}</span>
            </div>
          </div>
        )}

        {termometro.enquadrado && (
          <div className="bg-[#020408] border border-slate-800 rounded-2xl p-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3">
              Comparativo anual: Pessoa Fisica x Holding Patrimonial
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                <thead className="text-slate-500 uppercase text-[9px] tracking-wider">
                  <tr>
                    <th className="pb-2">Item</th>
                    <th className="pb-2">Pessoa Fisica</th>
                    <th className="pb-2">Holding (Lucro Presumido)</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  <tr className="border-t border-slate-800">
                    <td className="py-1.5">IR / IRPJ + CSLL</td>
                    <td className="py-1.5">{fmtBRL(comparativo.pf.irpfAno)} <span className="text-slate-500">({comparativo.pf.aliquotaIrpf}% IRPF)</span></td>
                    <td className="py-1.5">{fmtBRL(comparativo.holding.irpj + comparativo.holding.adicional + comparativo.holding.csll)}</td>
                  </tr>
                  <tr className="border-t border-slate-800">
                    <td className="py-1.5">IBS/CBS</td>
                    <td className="py-1.5">{fmtBRL(comparativo.pf.ibsCbsAno)} <span className="text-slate-500">(reduzido)</span></td>
                    <td className="py-1.5">{fmtBRL(comparativo.holding.ibsCbs)} <span className="text-slate-500">(cheio)</span></td>
                  </tr>
                  <tr className="border-t border-slate-800 font-black text-white">
                    <td className="py-1.5">Carga total</td>
                    <td className="py-1.5">{fmtBRL(comparativo.pf.total)} - {comparativo.pf.cargaPct}%</td>
                    <td className="py-1.5">{fmtBRL(comparativo.holding.total)} - {comparativo.holding.cargaPct}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className={'mt-2 text-[11px] font-bold ' + (comparativo.vantagemHolding > 0 ? 'text-[#10b981]' : 'text-amber-300')}>
              {comparativo.vantagemHolding > 0
                ? 'Holding economiza ' + fmtBRL(comparativo.vantagemHolding) + '/ano nesta projecao.'
                : 'Pessoa fisica sai ' + fmtBRL(Math.abs(comparativo.vantagemHolding)) + '/ano melhor nesta projecao - a holding so compensa com planejamento sucessorio e patrimonio maior.'}
            </p>
            <p className="mt-1 text-[10px] text-slate-500">{comparativo.observacao}</p>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          3. HISTÓRICO DE NFS-e NACIONAIS & RECIBOS DE REPASSE EMITIDOS
         ═══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <RefreshCw size={18} className="text-[#10b981]" />
              Central de Notas Fiscais Emitidas (ADN) & Recibos de Repasse
            </h2>
            <p className="text-xs text-slate-400">
              Todas as liquidações feitas na aba Financeiro & VGV aparecem automaticamente aqui com DANFSE e Recibo de Repasse prontos.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-[#10b981]/15 border border-[#10b981]/30 text-[#10b981] text-xs font-extrabold">
            {(notasEmitidas || []).length} Documentos Fiscais Sincronizados
          </span>
        </div>

        <div className="space-y-3">
          {(notasEmitidas || [])?.map((nota) => (
            <div
              key={nota.id || nota.chaveAcessoADN}
              className="bg-[#020408] border border-slate-800 hover:border-[#10b981]/50 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition"
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-[#10b981] text-white text-[11px] font-black">
                    NFS-e #{nota.numeroNfse}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-xs font-bold text-[#10b981]">
                    {nota.modalidade}
                  </span>
                  <span className="text-xs text-slate-400">{nota.statusADN}</span>
                </div>
                <p className="text-sm font-bold text-white">
                  {nota.clienteNome} • <span className="text-slate-400 font-normal">{nota.imovelRef}</span>
                </p>
                <p className="text-[11px] font-mono text-slate-500">
                  Chave ADN: {nota.chaveAcessoADN}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="grid grid-cols-3 gap-3 bg-slate-900/90 border border-slate-800 rounded-xl px-3.5 py-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Bruto Liquidado</span>
                    <strong className="text-white">{fmtBRL(nota.valorBrutoOperacao)}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Repasse Deduzido</span>
                    <strong className="text-slate-300">{fmtBRL(nota.valorRepasseProprietario)}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#10b981] font-bold block">Base Tributável</span>
                    <strong className="text-[#10b981]">{fmtBRL(nota.baseCalculoTributavel)}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => imprimirPDFUnificado(nota)}
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-[#10b981] text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <Printer size={14} className="text-[#10b981]" /> PDF (DANFSE + Repasse)
                  </button>
                  <button
                    type="button"
                    onClick={() => dispararWhatsAppNota(nota)}
                    style={{ backgroundColor: '#10b981' }}
                    className="px-3.5 py-2 rounded-xl text-xs font-black text-white flex items-center gap-1.5 hover:opacity-90 cursor-pointer transition"
                  >
                    <Send size={14} /> Enviar Zap
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
