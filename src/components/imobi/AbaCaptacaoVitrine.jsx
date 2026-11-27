import React, { useState } from 'react';
import { db } from '../../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { CheckCircle2, Plus, Home, Trash2 } from 'lucide-react';
import CaptacaoNicho from './CaptacaoNicho';
import { setCreditoPrefill } from '../../lib/credito/prefill';
import { ehFotoExemplo } from '../../lib/fotosExemplo';

export const obterEstiloTagPadrao = (padrao) => {
  const p = String(padrao || '').toLowerCase();
  if (p.includes('minha casa') || p.includes('social')) {
    return {
      label: 'Minha Casa, Minha Vida / Social',
      classes: 'bg-sky-500/15 text-sky-400 border border-sky-500/40',
    };
  }
  if (p.includes('alto') || p.includes('luxo')) {
    return {
      label: 'Alto Padrão / Luxo',
      classes: 'bg-amber-500/15 text-amber-400 border border-amber-500/40',
    };
  }
  return {
    label: padrao || 'Médio Padrão',
    classes: 'bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/40',
  };
};

export default function AbaCaptacaoVitrine({
  listaImoveis = [],
  setListaImoveis,
  acessoProLiberado = false,
  sucessoImovel = '',
  setSucessoImovel,
  imobiliariaId,
  dadosImobiliaria = {},
  setAbaAtiva,
  onNovoImovel,
  setModalNovoImovel,
  setPrestacaoFoco,
  setFormVisita,
  setModalNovaVisita,
  excluirRegistroImobi,
  fmtBRL,
}) {
  const [filtroNichoCaptacao, setFiltroNichoCaptacao] = useState('Todos');

  const abrirModalNovoImovel = () => {
    if (onNovoImovel) {
      onNovoImovel();
    } else if (setModalNovoImovel) {
      setModalNovoImovel(true);
    }
  };

  const formatarValor =
    fmtBRL ||
    ((v) =>
      Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));

  const alternarStatusVitrine = async (imv) => {
    const novoStatus =
      imv?.status === 'Ativo' || imv?.status === 'Disponível' ? 'Inativo' : 'Ativo';
    try {
      if (imobiliariaId && imv?.id && !String(imv.id).startsWith('local_')) {
        await updateDoc(doc(db, 'oficinas', imobiliariaId, 'imoveis_imobi', imv.id), {
          status: novoStatus,
        });
      } else if (setListaImoveis) {
        setListaImoveis((prev) =>
          (Array.isArray(prev) ? prev : [])?.map((item) =>
            item.id === imv.id ? { ...item, status: novoStatus } : item
          )
        );
      }
    } catch (err) {
      console.error('Erro ao atualizar status na vitrine:', err);
    }
  };

  const totalCadastrados = Array.isArray(listaImoveis) ? listaImoveis.length : 0;

  return (
    <div className="space-y-6">
      {!acessoProLiberado && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs">
          <div className="flex items-center gap-2 text-slate-200">
            <span className="font-extrabold text-emerald-400">⚡ Plano Gratuito:</span>
            <span>{totalCadastrados} de 5 imóveis cadastrados.</span>
          </div>
          {totalCadastrados >= 5 ? (
            <button
              type="button"
              onClick={() => setAbaAtiva?.('meuplano')}
              className="rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-3 py-1.5 text-[11px] font-black text-slate-950 shadow-md hover:brightness-110 transition cursor-pointer"
            >
              Desbloquear Imóveis Ilimitados no PRO (R$ 39,90) →
            </button>
          ) : (
            <span className="text-[11px] text-slate-400">
              Restam {Math.max(0, 5 - totalCadastrados)} vagas de imóveis grátis.
            </span>
          )}
        </div>
      )}

      {sucessoImovel && (
        <div
          role="status"
          className="flex items-start justify-between gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-xs font-bold text-emerald-200"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 size={14} aria-hidden="true" /> {sucessoImovel}
          </span>
          <button
            type="button"
            onClick={() => setSucessoImovel?.('')}
            className="shrink-0 rounded-lg border border-emerald-400/40 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-300 hover:bg-emerald-500/20 cursor-pointer"
          >
            Fechar
          </button>
        </div>
      )}

      <CaptacaoNicho
        dadosOficina={dadosImobiliaria}
        setAbaAtiva={setAbaAtiva}
        onAbrirPrestacao={(imovel) => {
          setPrestacaoFoco?.(imovel);
          setAbaAtiva?.('mapa_inteligencia');
        }}
      />

      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">
            🏠 GESTÃO & <span style={{ color: '#10b981' }}>VITRINE DE IMÓVEIS</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Cadastre o imóvel uma vez e ele já sai na vitrine e nos portais — sem digitar o mesmo dado duas vezes. Sua vitrine pública fica em <strong className="text-[#10b981]">/portal</strong>.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href="/portal?vitrine=1"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#020408] border border-[#10b981]/50 hover:border-[#10b981] text-[#10b981] font-extrabold text-xs transition"
          >
            🌐 Ver Vitrine Pública (Portal do Cliente)
          </a>
          <button
            type="button"
            onClick={abrirModalNovoImovel}
            style={{ backgroundColor: '#10b981' }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl hover:opacity-90 text-white font-bold text-sm cursor-pointer"
          >
            <Plus size={18} /> Cadastrar Novo Imóvel
          </button>
        </div>
      </div>

      {/* Filtro Rápido por Nicho e Padrão de Mercado */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'Todos', label: '🌐 Todos os Imóveis' },
          { id: 'MCMV', label: '🏡 Minha Casa, Minha Vida' },
          { id: 'Medio', label: '🏢 Médio Padrão' },
          { id: 'Alto', label: '💎 Alto Padrão / Luxo' },
          { id: 'Loteamento', label: '📐 Loteamentos & Condomínios' },
          { id: 'Rural', label: '🌾 Fazendas & Rurais' },
          { id: 'Locacao', label: '🔑 Locação' },
        ]?.map((abaNicho) => {
          const ativo = filtroNichoCaptacao === abaNicho.id;
          return (
            <button
              key={abaNicho.id}
              type="button"
              onClick={() => setFiltroNichoCaptacao(abaNicho.id)}
              style={ativo ? { backgroundColor: '#10b981', borderColor: '#10b981' } : undefined}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold border transition cursor-pointer ${
                ativo
                  ? 'text-white shadow-md shadow-[#10b981]/20'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-[#10b981]'
              }`}
            >
              {abaNicho.label}
            </button>
          );
        })}
      </div>

      {(listaImoveis || []).length === 0 ? (
        <div className="bg-slate-900/60 border border-dashed border-slate-700 rounded-2xl p-12 text-center">
          <Home size={40} className="mx-auto text-slate-500 mb-3" />
          <h3 className="text-lg font-bold text-white">Nenhum imóvel captado ainda</h3>
          <p className="text-sm text-slate-400 mt-1 mb-4">
            Cadastre apartamentos, lotes em condomínio, fazendas ou imóveis de locação com fotos para publicar na Vitrine Digital.
          </p>
          <button
            type="button"
            onClick={abrirModalNovoImovel}
            style={{ backgroundColor: '#10b981' }}
            className="px-4 py-2 rounded-xl text-white text-xs font-bold cursor-pointer"
          >
            + Captar Primeiro Imóvel
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(listaImoveis || [])
            .filter((imv) => {
              if (filtroNichoCaptacao === 'Todos') return true;
              if (filtroNichoCaptacao === 'MCMV') return /minha casa|social/i.test(imv?.padraoImovel || '');
              if (filtroNichoCaptacao === 'Medio') return /m[eé]dio/i.test(imv?.padraoImovel || 'Médio Padrão');
              if (filtroNichoCaptacao === 'Alto') return /alto|luxo/i.test(imv?.padraoImovel || '');
              if (filtroNichoCaptacao === 'Locacao') return imv?.finalidade === 'Locação';
              if (filtroNichoCaptacao === 'Loteamento') return /lote|terreno/i.test(imv?.tipo || '');
              if (filtroNichoCaptacao === 'Rural') return /fazenda|rural|ch[aá]cara|s[ií]tio/i.test(imv?.tipo || '');
              return true;
            })
            ?.map((imv) => {
              const isLote = /lote|terreno/i.test(imv?.tipo || '');
              const isRural = /fazenda|rural|ch[aá]cara|s[ií]tio/i.test(imv?.tipo || '');
              const isLocacao = imv?.finalidade === 'Locação';
              const tagPadrao = obterEstiloTagPadrao(imv?.padraoImovel);
              const fotosArr = Array.isArray(imv?.fotos) ? imv.fotos : [];
              const capaUrl = imv?.fotoCapa || fotosArr[0] || '';
              const capaDeExemplo = ehFotoExemplo(capaUrl);
              const isAtivoVitrine = !imv?.status || imv.status === 'Ativo' || imv.status === 'Disponível';

              return (
                <div
                  key={imv.id}
                  className="bg-slate-900 border border-slate-800 hover:border-[#10b981]/50 rounded-2xl overflow-hidden flex flex-col justify-between transition"
                >
                  <div>
                    {/* Capa Fotográfica do Card */}
                    {capaUrl ? (
                      <div className="relative h-44 w-full bg-[#020408] overflow-hidden border-b border-slate-800">
                        <img
                          src={capaUrl}
                          alt={
                            capaDeExemplo
                              ? `Imagem de exemplo (banco de imagens) — ${imv.titulo || 'imóvel'}`
                              : imv.titulo
                          }
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase backdrop-blur-md bg-[#020408]/85 ${tagPadrao.classes}`}>
                            {tagPadrao.label}
                          </span>
                          {capaDeExemplo && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase backdrop-blur-md bg-amber-500 text-amber-950">
                              Exemplo
                            </span>
                          )}
                        </div>
                        {fotosArr.length > 0 && (
                          <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/80 text-white text-[10px] font-bold">
                            📷 {fotosArr.length} foto(s)
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="px-5 pt-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${tagPadrao.classes}`}>
                          {tagPadrao.label}
                        </span>
                      </div>
                    )}

                    <div className="p-5 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#10b981]/15 text-[#10b981] font-bold">
                          {imv.codigo || 'IMÓVEL'} • {imv.finalidade}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => alternarStatusVitrine(imv)}
                            title="Alternar visibilidade na Vitrine Pública do Portal do Cliente"
                            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold cursor-pointer border ${
                              isAtivoVitrine
                                ? 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/40'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {isAtivoVitrine ? '🟢 Ativo na Vitrine' : '⚪ Oculto'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCreditoPrefill({
                                imovelId: imv.id,
                                imovelTitulo: imv.titulo,
                                valorImovel: imv.valor,
                                bairro: imv.bairro,
                              });
                              setAbaAtiva?.('credito');
                            }}
                            title="Simular financiamento deste imóvel"
                            className="px-2 py-0.5 rounded-md text-[10px] font-extrabold cursor-pointer border bg-slate-800 text-[#10b981] border-slate-700 hover:border-[#10b981]"
                          >
                            🏦 Simular
                          </button>
                          <button
                            type="button"
                            onClick={() => excluirRegistroImobi?.('imoveis_imobi', imv.id)}
                            className="text-slate-500 hover:text-emerald-400 cursor-pointer"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-white">{imv.titulo}</h3>
                      <p className="text-xs text-slate-400">
                        📍 {imv.bairro || 'Localização a definir'} • {imv.tipo}
                        {!isLote && !isRural && imv.quartos ? ` • ${imv.quartos} quartos` : ''}
                      </p>

                      {/* Detalhes específicos por Nicho */}
                      {isLote && (imv.quadra || imv.lote || imv.metragemTerreno) && (
                        <div className="bg-[#020408] border border-slate-800 rounded-xl p-2.5 text-[11px] text-slate-300 space-y-0.5">
                          <span className="text-[#10b981] font-extrabold block">📐 Dados do Loteamento / Condomínio:</span>
                          <span>
                            Quadra: <strong>{imv.quadra || '-'}</strong> • Lote: <strong>{imv.lote || '-'}</strong> • Área:{' '}
                            <strong>{imv.metragemTerreno ? `${imv.metragemTerreno} m²` : '-'}</strong>
                          </span>
                        </div>
                      )}

                      {isRural && (imv.hectares || imv.aptidaoRural || imv.benfeitorias) && (
                        <div className="bg-[#020408] border border-slate-800 rounded-xl p-2.5 text-[11px] text-slate-300 space-y-0.5">
                          <span className="text-[#10b981] font-extrabold block">🌾 Dados da Propriedade Rural:</span>
                          <span className="block">
                            Área: <strong>{imv.hectares ? `${imv.hectares} ha` : 'A consultar'}</strong> • Aptidão:{' '}
                            <strong>{imv.aptidaoRural || 'Mista'}</strong>
                          </span>
                          {imv.benfeitorias && (
                            <span className="block text-slate-400 truncate">Benfeitorias: {imv.benfeitorias}</span>
                          )}
                        </div>
                      )}

                      {isLocacao && (imv.modalidadeGarantia || imv.regrasLocacao) && (
                        <div className="bg-[#020408] border border-slate-800 rounded-xl p-2.5 text-[11px] text-slate-300 space-y-0.5">
                          <span className="text-[#10b981] font-extrabold block">🔑 Condições de Locação (Lei 8.245/91):</span>
                          <span className="block">
                            Garantia aceita: <strong>{imv.modalidadeGarantia || 'Seguro Fiança / Caução'}</strong>
                          </span>
                          {imv.regrasLocacao && (
                            <span className="block text-slate-400 truncate">Regras: {imv.regrasLocacao}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="px-5 pb-5 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <span style={{ color: '#10b981' }} className="text-lg font-black text-[#10b981]">
                      {formatarValor(imv.valor)}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setFormVisita?.((prev) => ({ ...prev, imovel: `${imv.codigo || ''} - ${imv.titulo}` }));
                        setModalNovaVisita?.(true);
                      }}
                      style={{ backgroundColor: '#10b981' }}
                      className="px-3 py-1.5 rounded-lg hover:opacity-90 text-white text-xs font-bold cursor-pointer"
                    >
                      📅 Marcar Visita
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
