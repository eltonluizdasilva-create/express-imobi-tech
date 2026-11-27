import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Lock, LoaderCircle } from 'lucide-react';
import CampoMoeda from '../ui/CampoMoeda';
import {
  FOTOS_EXEMPLO,
  AVISO_FOTO_EXEMPLO,
  ehFotoExemplo,
  temFotoExemplo,
} from '../../lib/fotosExemplo';
import {
  adicionarFotosImovel,
  bytesDaFoto,
  bytesDeFotos,
  limitarFotosAoOrcamento,
  MAX_FOTOS_IMOVEL,
  ORCAMENTO_FOTOS_BYTES,
} from '../../lib/fotosImovel';
import { snapshotMarcaImobiliaria } from '../../lib/configImobiliaria';
import { parseMoedaBR } from '../../hooks/useQuickActions';

const FORM_IMOVEL_INICIAL = {
  titulo: '',
  tipo: 'Apartamento',
  finalidade: 'Venda',
  padraoImovel: 'Médio Padrão',
  status: 'Ativo',
  publico: false,
  publicarPortais: true,
  bairro: '',
  quartos: '2',
  valor: '',
  fotos: [],
  fotoCapa: '',
  // Campos específicos: Loteamentos / Condomínios
  quadra: '',
  lote: '',
  metragemTerreno: '',
  // Campos específicos: Fazendas / Imóveis Rurais
  hectares: '',
  aptidaoRural: 'Dupla Aptidão (Lavoura e Pecuária)',
  benfeitorias: '',
  // Campos específicos: Locação (Lei 8.245/91)
  modalidadeGarantia: 'Seguro Fiança / CredPago',
  regrasLocacao: '',
};

export default function ModalNovoImovel({
  aberto = false,
  onFechar,
  imobiliariaId,
  acessoProLiberado = false,
  totalImoveis = 0,
  config = {},
  dadosImobiliaria = {},
  onSucesso,
  onIrParaPlanos,
  setListaImoveis,
}) {
  const [formImovel, setFormImovel] = useState(FORM_IMOVEL_INICIAL);
  const [novaFotoInput, setNovaFotoInput] = useState('');
  const [avisoFotosImovel, setAvisoFotosImovel] = useState('');
  const [erroImovel, setErroImovel] = useState('');
  const [salvandoAcao, setSalvandoAcao] = useState(false);

  useEffect(() => {
    if (aberto) {
      setErroImovel('');
      setAvisoFotosImovel('');
    }
  }, [aberto]);

  if (!aberto) return null;

  const fecharModal = () => {
    onFechar?.();
  };

  const adicionarLinkFotoImovel = (urlDireta = null) => {
    const link = (urlDireta ?? novaFotoInput).trim();
    if (!link) return;
    const fotosAtuais = Array.isArray(formImovel.fotos) ? formImovel.fotos : [];
    if (fotosAtuais.includes(link)) return;
    if (fotosAtuais.length >= MAX_FOTOS_IMOVEL) {
      setAvisoFotosImovel(`O limite de ${MAX_FOTOS_IMOVEL} fotos por imóvel foi atingido.`);
      return;
    }

    setFormImovel((prev) => {
      const atuais = Array.isArray(prev.fotos) ? prev.fotos : [];
      if (atuais.includes(link)) return prev;
      const novas = adicionarFotosImovel(atuais, [link]);
      return {
        ...prev,
        fotos: novas,
        fotoCapa: atuais[0] || novas[0] || '',
      };
    });
    setAvisoFotosImovel('');
    if (!urlDireta) setNovaFotoInput('');
  };

  const lerFotoComprimida = (file, maxW = 900, qualidade = 0.78) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error || new Error('Falha ao ler o arquivo de imagem.'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('O arquivo selecionado não pôde ser decodificado como imagem.'));
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const scale = img.width > maxW ? maxW / img.width : 1;
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            const ctx2d = canvas.getContext('2d');
            if (!ctx2d) throw new Error('Não foi possível preparar a compressão da imagem.');
            ctx2d.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', qualidade));
          } catch (error) {
            reject(error);
          }
        };
        if (typeof reader.result !== 'string') {
          reject(new Error('O arquivo de imagem não foi lido corretamente.'));
          return;
        }
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });

  const handleUploadArquivosImovel = async (e) => {
    const input = e.currentTarget;
    const arquivos = Array.from(input.files || []);
    if (arquivos.length === 0) return;

    const fotosAtuais = Array.isArray(formImovel.fotos) ? formImovel.fotos : [];
    const vagas = Math.max(0, MAX_FOTOS_IMOVEL - fotosAtuais.length);
    if (vagas === 0) {
      setAvisoFotosImovel(`O limite de ${MAX_FOTOS_IMOVEL} fotos por imóvel foi atingido.`);
      input.value = '';
      return;
    }

    const selecionados = arquivos.slice(0, vagas);
    setAvisoFotosImovel(
      arquivos.length > vagas
        ? `Só cabem mais ${vagas} foto(s). As demais não foram adicionadas.`
        : '',
    );

    try {
      let restante = Math.max(0, ORCAMENTO_FOTOS_BYTES - bytesDeFotos(fotosAtuais));
      let descartadasPorPeso = 0;
      const fotosNovas = [];

      for (const arquivo of selecionados) {
        if (restante <= 0) {
          descartadasPorPeso += 1;
          continue;
        }
        let foto = await lerFotoComprimida(arquivo, 900, 0.78);
        if (bytesDaFoto(foto) > restante) foto = await lerFotoComprimida(arquivo, 720, 0.62);
        if (bytesDaFoto(foto) > restante) foto = await lerFotoComprimida(arquivo, 600, 0.5);
        if (bytesDaFoto(foto) > restante) {
          descartadasPorPeso += 1;
          continue;
        }
        restante -= bytesDaFoto(foto);
        fotosNovas.push(foto);
      }

      setFormImovel((prev) => {
        const atuais = Array.isArray(prev.fotos) ? prev.fotos : [];
        const novas = adicionarFotosImovel(atuais, fotosNovas);
        const adicionadas = novas.slice(atuais.length);
        return {
          ...prev,
          fotos: novas,
          fotoCapa: atuais[0] || adicionadas[0] || '',
        };
      });

      if (descartadasPorPeso > 0) {
        setAvisoFotosImovel(
          `${descartadasPorPeso} foto(s) ficaram fora: a ficha do imóvel tem limite de ~${Math.round(
            ORCAMENTO_FOTOS_BYTES / 1024,
          )} KB de fotos (documento de 1 MB no Firestore). Nas restantes, use o campo de link da imagem.`,
        );
      }
    } catch (error) {
      console.error('Erro ao comprimir fotos do imóvel:', error);
      setAvisoFotosImovel('Não foi possível processar as fotos selecionadas. Tente novamente.');
    } finally {
      input.value = '';
    }
  };

  const removerFotoGaleria = (urlParaRemover) => {
    setFormImovel((prev) => {
      const novas = (Array.isArray(prev.fotos) ? prev.fotos : []).filter((f) => f !== urlParaRemover);
      return {
        ...prev,
        fotos: novas,
        fotoCapa: novas[0] || '',
      };
    });
    setAvisoFotosImovel('');
  };

  const salvarImovelImobi = async (e) => {
    e?.preventDefault?.();
    if (salvandoAcao) return;

    const titulo = String(formImovel.titulo || '').trim();
    if (!titulo) {
      setErroImovel('Informe o título do imóvel para salvar.');
      return;
    }

    setSalvandoAcao(true);
    setErroImovel('');

    const fotosEscolhidas = Array.isArray(formImovel.fotos) ? formImovel.fotos : [];
    const listaFotos = limitarFotosAoOrcamento(fotosEscolhidas);
    const fotosDescartadas = fotosEscolhidas.length - listaFotos.length;
    const marca = snapshotMarcaImobiliaria(config, dadosImobiliaria);

    const novoImovel = {
      ...formImovel,
      titulo,
      fotos: listaFotos,
      fotoCapa: listaFotos[0] || '',
      publico: formImovel.publico === true,
      padraoImovel: formImovel.padraoImovel || 'Médio Padrão',
      valor: parseMoedaBR(formImovel.valor),
      codigo: `IMB-${Math.floor(1000 + Math.random() * 9000)}`,
      status: formImovel.status || 'Ativo',
      ...marca,
      whatsappCorretor: marca.imobiliariaWhatsapp || '',
      criadoEm: serverTimestamp(),
    };

    try {
      if (imobiliariaId) {
        await addDoc(collection(db, 'oficinas', imobiliariaId, 'imoveis_imobi'), novoImovel);
      } else if (setListaImoveis) {
        setListaImoveis((prev) => [{ id: `local_${Date.now()}`, ...novoImovel }, ...(prev || [])]);
      }
    } catch (err) {
      console.error('Erro ao captar imóvel:', err);
      const grandeDemais = /too large|1048576|6000000|invalid-argument|exceeds/i.test(
        `${err?.code || ''} ${err?.message || ''}`,
      );
      setErroImovel(
        grandeDemais
          ? 'A ficha do imóvel ficou maior que o limite do banco (1 MB). Remova 1 ou 2 fotos, ou cadastre-as por link, e salve de novo.'
          : `Não foi possível salvar o imóvel: ${err?.message || 'erro desconhecido'}. Tente novamente.`,
      );
      setSalvandoAcao(false);
      return;
    }

    // Documento gravado: fecha o modal JÁ e confirma na aba
    fecharModal(); // setModalNovoImovel(false)
    setSalvandoAcao(false);

    onSucesso?.(
      fotosDescartadas > 0
        ? `Imóvel salvo com sucesso! ${fotosDescartadas} foto(s) ficaram fora por causa do limite de 1 MB do documento.`
        : 'Imóvel salvo com sucesso! Ele já aparece na vitrine e no portal.',
    );

    setFormImovel(FORM_IMOVEL_INICIAL);
    setNovaFotoInput('');
    setAvisoFotosImovel('');
  };

  const limiteGratisAtingido = !acessoProLiberado && totalImoveis >= 5;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 overflow-y-auto">
      {limiteGratisAtingido ? (
        <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 w-full max-w-md space-y-4 my-8 text-center animate-in fade-in shadow-2xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Lock size={26} />
          </div>
          <h3 className="text-base font-black text-white">Limite do Plano Gratuito Atingido (5/5)</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Você já cadastrou os 5 imóveis inclusos no Plano Gratuito. Ative o plano PRO por apenas R$ 39,90/mês para cadastrar imóveis ilimitados e fotos em alta resolução.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={fecharModal}
              className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 text-xs font-bold hover:text-white cursor-pointer"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={() => {
                fecharModal();
                onIrParaPlanos?.();
              }}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs hover:bg-emerald-400 transition cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              Ver Planos PRO →
            </button>
          </div>
        </div>
      ) : (
        <form
          onSubmit={salvarImovelImobi}
          className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg space-y-4 my-8"
        >
          <div>
            <h3 className="text-lg font-black text-white">🏠 Captar Novo Imóvel (Multi-Nicho)</h3>
            <p className="text-xs text-slate-400">
              Os campos abaixo adaptam-se automaticamente para Imóvel Urbano, Loteamento, Fazenda/Rural ou Locação.
            </p>
          </div>

          <input
            required
            placeholder="Título (Ex: Apto Varanda Gourmet / Lote Condomínio / Fazenda 120 ha)"
            value={formImovel.titulo}
            onChange={(e) => setFormImovel({ ...formImovel, titulo: e.target.value })}
            className="w-full bg-[#020408] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Finalidade</label>
              <select
                value={formImovel.finalidade}
                onChange={(e) => setFormImovel({ ...formImovel, finalidade: e.target.value })}
                className="w-full bg-[#020408] border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white font-bold"
              >
                <option>Venda</option>
                <option>Locação</option>
                <option>Arrendamento Rural</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Nicho / Tipo de Imóvel</label>
              <select
                value={formImovel.tipo}
                onChange={(e) => setFormImovel({ ...formImovel, tipo: e.target.value })}
                className="w-full bg-[#020408] border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white font-bold"
              >
                <option>Apartamento</option>
                <option>Casa</option>
                <option>Cobertura</option>
                <option>Loteamento / Condomínio</option>
                <option>Terreno / Lote</option>
                <option>Fazenda / Imóvel Rural</option>
                <option>Chácara / Sítio</option>
                <option>Comercial</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase text-[#10b981] mb-1">
                Classificação por Padrão / Enquadramento
              </label>
              <select
                value={formImovel.padraoImovel}
                onChange={(e) => setFormImovel({ ...formImovel, padraoImovel: e.target.value })}
                className="w-full bg-[#020408] border border-[#10b981]/60 rounded-xl px-3 py-2.5 text-sm text-white font-bold"
              >
                <option value="Minha Casa, Minha Vida / Interesse Social">
                  Minha Casa, Minha Vida / Interesse Social
                </option>
                <option value="Médio Padrão">Médio Padrão</option>
                <option value="Alto Padrão / Luxo">Alto Padrão / Luxo</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Status na Vitrine Pública
              </label>
              <select
                value={formImovel.status}
                onChange={(e) => setFormImovel({ ...formImovel, status: e.target.value })}
                className="w-full bg-[#020408] border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white font-bold"
              >
                <option value="Ativo">Ativo / disponível</option>
                <option value="Reservado">Reservado / Em Proposta</option>
                <option value="Inativo">Inativo / Oculto</option>
              </select>
              <label className="mt-2 flex items-center gap-2 text-[10px] font-bold uppercase text-slate-400">
                <input
                  type="checkbox"
                  checked={formImovel.publico === true}
                  onChange={(e) => setFormImovel({ ...formImovel, publico: e.target.checked })}
                  className="h-3.5 w-3.5 accent-[#10b981]"
                />
                Publicar na vitrine pública e permitir link direto da Pólen
              </label>
              <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
                Ao publicar, o anúncio e suas fotos ficam acessíveis no portal público.
              </p>
              <label className="mt-2 flex items-center gap-2 text-[10px] font-bold uppercase text-slate-400">
                <input
                  type="checkbox"
                  checked={formImovel.publicarPortais !== false}
                  onChange={(e) => setFormImovel({ ...formImovel, publicarPortais: e.target.checked })}
                  className="h-3.5 w-3.5 accent-[#10b981]"
                />
                Publicar nos portais (ZAP/VivaReal/OLX)
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Bairro / Município / Região"
              value={formImovel.bairro}
              onChange={(e) => setFormImovel({ ...formImovel, bairro: e.target.value })}
              className="bg-[#020408] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
            />
            <CampoMoeda
              valor={formImovel.valor}
              onChange={(valorMascarado) => setFormImovel({ ...formImovel, valor: valorMascarado })}
              placeholder="R$ 0,00"
              className="bg-[#020408] border border-[#10b981]/60 rounded-xl px-3.5 py-2.5 text-sm text-white font-bold"
            />
          </div>

          {/* GALERIA DE FOTOS DO IMÓVEL */}
          <div className="bg-[#020408] border border-slate-800 rounded-2xl p-4 space-y-3">
            <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.08] px-3 py-2 text-[11px] leading-relaxed text-emerald-100">
              <strong className="font-black">Foto 1 (Principal — Fachada ou Entrada do Imóvel).</strong>{' '}
              Ela será a capa do portal. A Pólen deve priorizar essa foto, um resumo e o link direto na primeira apresentação;
              o envio da imagem como anexo depende de o canal WhatsApp oferecer suporte a mídia.
              As outras até 6 fotos ficam na vitrine ou são enviadas somente se o cliente pedir explicitamente.
            </p>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-extrabold uppercase text-[#10b981]">
                📷 Galeria de Fotos ({(formImovel.fotos || []).length}/{MAX_FOTOS_IMOVEL})
              </span>
              <label
                aria-disabled={(formImovel.fotos || []).length >= MAX_FOTOS_IMOVEL}
                className={`px-3 py-1 rounded-lg text-white text-[11px] font-black transition ${
                  (formImovel.fotos || []).length >= MAX_FOTOS_IMOVEL
                    ? 'bg-slate-700 cursor-not-allowed opacity-60'
                    : 'bg-[#10b981] cursor-pointer hover:opacity-90'
                }`}
              >
                + Enviar Fotos ({Math.max(0, MAX_FOTOS_IMOVEL - (formImovel.fotos || []).length)} restantes)
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={(formImovel.fotos || []).length >= MAX_FOTOS_IMOVEL}
                  onChange={handleUploadArquivosImovel}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex gap-2">
              <input
                value={novaFotoInput}
                onChange={(e) => setNovaFotoInput(e.target.value)}
                disabled={(formImovel.fotos || []).length >= MAX_FOTOS_IMOVEL}
                placeholder="Ou cole o link de uma foto (https://...)"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
              <button
                type="button"
                onClick={() => adicionarLinkFotoImovel()}
                disabled={(formImovel.fotos || []).length >= MAX_FOTOS_IMOVEL}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-[#10b981] text-xs font-extrabold text-white cursor-pointer transition"
              >
                Adicionar Link
              </button>
            </div>

            {/* Sugestões rápidas de fotos para teste imediato */}
            <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
              <span className="text-slate-400">Fotos ilustrativas (banco de imagens):</span>
              {[
                {
                  nome: '+ Apto Moderno',
                  url: FOTOS_EXEMPLO.apartamento,
                },
                {
                  nome: '+ Casa Condomínio',
                  url: FOTOS_EXEMPLO.casa,
                },
                {
                  nome: '+ Fazenda / Rural',
                  url: FOTOS_EXEMPLO.fazenda,
                },
              ]?.map((demo) => (
                <button
                  key={demo.nome}
                  type="button"
                  onClick={() => adicionarLinkFotoImovel(demo.url)}
                  disabled={(formImovel.fotos || []).length >= MAX_FOTOS_IMOVEL}
                  className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 hover:border-[#10b981] text-slate-300 hover:text-[#10b981] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {demo.nome}
                </button>
              ))}
            </div>

            {avisoFotosImovel && (
              <p role="status" className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-[10.5px] font-semibold text-amber-200">
                {avisoFotosImovel}
              </p>
            )}

            {temFotoExemplo(formImovel.fotos) && (
              <p role="note" className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[10.5px] font-semibold leading-relaxed text-amber-200">
                {AVISO_FOTO_EXEMPLO}
              </p>
            )}

            {/* A primeira miniatura é sempre a capa e a foto principal. */}
            {Array.isArray(formImovel.fotos) && formImovel.fotos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 pt-1">
                {(formImovel.fotos || [])?.map((fotoUrl, idx) => {
                  const isCapa = idx === 0;
                  const fotoDeExemplo = ehFotoExemplo(fotoUrl);
                  return (
                    <div
                      key={`${idx}_${fotoUrl.slice(0, 24)}`}
                      className={`relative rounded-xl overflow-hidden border-2 h-20 group ${
                        isCapa ? 'border-[#10b981]' : 'border-slate-800'
                      }`}
                    >
                      <img
                        src={fotoUrl}
                        alt={
                          fotoDeExemplo
                            ? `Foto ${idx + 1} de exemplo (banco de imagens) — não é o imóvel`
                            : `Foto ${idx + 1} do imóvel`
                        }
                        className="w-full h-full object-cover"
                      />
                      {fotoDeExemplo && (
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-amber-500 text-[8px] font-black uppercase text-amber-950">
                          Exemplo
                        </span>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => removerFotoGaleria(fotoUrl)}
                          aria-label={`Remover a foto ${idx + 1} da galeria`}
                          className="px-2 py-1 rounded bg-red-600 text-[9px] font-black text-white cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                      {isCapa && (
                        <span
                          style={{ backgroundColor: '#10b981' }}
                          className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase text-white"
                        >
                          ★ {idx === 0 ? 'FOTO 1 · CAPA' : `FOTO ${idx + 1}`}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <p className="text-[10px] text-slate-500">
              Peso das fotos nesta ficha: {(bytesDeFotos(formImovel.fotos) / 1024).toFixed(0)} KB de ~
              {Math.round(ORCAMENTO_FOTOS_BYTES / 1024)} KB (o documento do Firestore aceita 1 MB no total).
            </p>
          </div>

          {/* CAMPOS ESPECÍFICOS 1: LOTEAMENTOS / CONDOMÍNIOS */}
          {/lote|terreno/i.test(formImovel.tipo) && (
            <div className="bg-[#020408] border border-[#10b981]/50 rounded-2xl p-4 space-y-3">
              <span className="text-xs font-extrabold uppercase text-[#10b981] block">
                📐 Especificações de Loteamento / Condomínio
              </span>
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Quadra</label>
                  <input
                    placeholder="Ex: Qd. 14"
                    value={formImovel.quadra}
                    onChange={(e) => setFormImovel({ ...formImovel, quadra: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Lote</label>
                  <input
                    placeholder="Ex: Lote 08"
                    value={formImovel.lote}
                    onChange={(e) => setFormImovel({ ...formImovel, lote: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Metragem (m²)</label>
                  <input
                    placeholder="Ex: 360"
                    value={formImovel.metragemTerreno}
                    onChange={(e) => setFormImovel({ ...formImovel, metragemTerreno: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* CAMPOS ESPECÍFICOS 2: FAZENDAS / IMÓVEIS RURAIS */}
          {/fazenda|rural|ch[aá]cara|s[ií]tio/i.test(formImovel.tipo) && (
            <div className="bg-[#020408] border border-[#10b981]/50 rounded-2xl p-4 space-y-3">
              <span className="text-xs font-extrabold uppercase text-[#10b981] block">
                🌾 Especificações de Fazenda / Imóvel Rural
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Área Total (Hectares)</label>
                  <input
                    placeholder="Ex: 150 ha"
                    value={formImovel.hectares}
                    onChange={(e) => setFormImovel({ ...formImovel, hectares: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Aptidão Principal</label>
                  <select
                    value={formImovel.aptidaoRural}
                    onChange={(e) => setFormImovel({ ...formImovel, aptidaoRural: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option>Dupla Aptidão (Lavoura e Pecuária)</option>
                    <option>Lavoura / Grãos (Soja, Milho, Café)</option>
                    <option>Pecuária (Corte / Leite)</option>
                    <option>Lazer / Haras / Turismo</option>
                    <option>Reflorestamento / Eucalipto</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Benfeitorias e Recursos Hídricos
                </label>
                <input
                  placeholder="Ex: Casa sede, curral completo, represa, CAR e Georreferenciamento OK"
                  value={formImovel.benfeitorias}
                  onChange={(e) => setFormImovel({ ...formImovel, benfeitorias: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            </div>
          )}

          {/* CAMPOS ESPECÍFICOS 3: LOCAÇÃO */}
          {formImovel.finalidade === 'Locação' && (
            <div className="bg-[#020408] border border-[#10b981]/50 rounded-2xl p-4 space-y-3">
              <span className="text-xs font-extrabold uppercase text-[#10b981] block">
                🔑 Garantia e Regras de Locação (Lei do Inquilinato 8.245/91)
              </span>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Modalidade de Garantia Aceita (Art. 37)
                </label>
                <select
                  value={formImovel.modalidadeGarantia}
                  onChange={(e) => setFormImovel({ ...formImovel, modalidadeGarantia: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option>Seguro Fiança / CredPago</option>
                  <option>Caução (Até 3x o valor do aluguel)</option>
                  <option>Fiador com Imóvel Quitadado</option>
                  <option>Título de Capitalização</option>
                  <option>Locação Sem Garantia (Aluguel Antecipado — Art. 42)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Regras da Locação e Observações Contratuais
                </label>
                <input
                  placeholder="Ex: Aceita Pet, Contrato 30 meses com isenção de multa após 12 meses"
                  value={formImovel.regrasLocacao}
                  onChange={(e) => setFormImovel({ ...formImovel, regrasLocacao: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            </div>
          )}

          {erroImovel && (
            <p
              role="alert"
              className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-[11px] font-bold leading-relaxed text-rose-200"
            >
              {erroImovel}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={fecharModal}
              disabled={salvandoAcao}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvandoAcao}
              aria-busy={salvandoAcao}
              style={{ backgroundColor: '#10b981' }}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-white text-xs font-bold cursor-pointer disabled:cursor-wait disabled:opacity-60"
            >
              {salvandoAcao ? (
                <>
                  <LoaderCircle size={14} className="animate-spin" aria-hidden="true" /> Salvando…
                </>
              ) : (
                'Salvar Imóvel'
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
