/* eslint-disable react/prop-types */
import React, { useState, useMemo } from 'react';
import {
  Megaphone,
  Sparkles,
  Copy,
  Check,
  MessageCircle,
  ExternalLink,
  Layers,
  Video,
  Image as ImageIcon,
  Target,
  Zap,
  Building2,
  Share2,
} from 'lucide-react';

const CRIATIVOS_PRONTOS_IMOBI = [
  {
    id: 'criativo_comparativo',
    categoria: 'Venda • Financiamento',
    formato: 'Imagem Única ou Carrossel (1080x1350)',
    titulo: 'Comparativo: Aluguel vs. Parcela do Próprio Imóvel',
    headlineArte: 'Paga R$ 2.500 de aluguel? Conheça este 2 Quartos com entrada parcelada e use seu FGTS!',
    ganchoVisual: 'Divida a imagem ao meio: lado esquerdo "Dinheiro indo embora no aluguel" vs. lado direito "Chave do seu apartamento próprio com varanda".',
    segmentacaoMeta: 'Raio de 5 km a 12 km do imóvel • Idade 24 a 52 anos • Interesses: Financiamento imobiliário, Primeiro imóvel, Mudança.',
    ctaBotao: 'Enviar mensagem pelo WhatsApp',
  },
  {
    id: 'criativo_tour_pov',
    categoria: 'Venda & Alto Padrão',
    formato: 'Reels / Stories Vertical (9:16)',
    titulo: 'Tour POV: "O que esse valor compra hoje no bairro?"',
    headlineArte: 'Você não vai acreditar na área gourmet deste imóvel disponível hoje!',
    ganchoVisual: 'Nos primeiros 3 segundos, abra a porta principal mostrando a integração da sala com a varanda iluminada + legenda grande no topo.',
    segmentacaoMeta: 'Público aberto na cidade ou bairros nobres • Posicionamento: Reels do Instagram e Stories • Objetivo: Engajamento com Mensagens.',
    ctaBotao: 'Enviar mensagem pelo WhatsApp',
  },
  {
    id: 'criativo_locacao_rapida',
    categoria: 'Aluguel / Locação',
    formato: 'Carrossel de 5 Fotos Reais (1:1 ou 4:5)',
    titulo: 'Locação Ágil: "Mude em até 48h Sem Burocracia"',
    headlineArte: 'Procurando aluguel rápido e sem dor de cabeça? Veja este imóvel pronto para morar!',
    ganchoVisual: 'Foto 1: Fachada/Sala com selo "ALUGUEL DISPONÍVEL" • Foto 2: Cozinha planejada • Foto 3: Suíte • Foto 4: Condomínio • Foto 5: Valor do pacote + Chamada WhatsApp.',
    segmentacaoMeta: 'Raio de 6 km ao redor do imóvel • Pessoas que moram ou estiveram recentemente na localização • Idade 21 a 55 anos.',
    ctaBotao: 'Agendar Visita no WhatsApp',
  },
  {
    id: 'criativo_oportunidade_investidor',
    categoria: 'Venda • Oportunidade / ROI',
    formato: 'Card Estático de Impacto + Foto Real',
    titulo: 'Oportunidade Abaixo da Avaliação / Alta Rentabilidade',
    headlineArte: 'OPORTUNIDADE ÚNICA: Imóvel com valor abaixo da média do m² na região!',
    ganchoVisual: 'Destaque a metragem, número de vagas e um badge verde esmeralda com "Documentação 100% OK • Aceita Proposta".',
    segmentacaoMeta: 'Compradores e investidores locais • Direcionamento direto para atendimento consultivo no WhatsApp do corretor.',
    ctaBotao: 'Receber Ficha Técnica no WhatsApp',
  },
];

export default function AbaMarketing({ config = {}, listaImoveis = [] }) {
  // Estados do Gerador Rápido de Copies Persuasivas (Venda e Aluguel)
  const [finalidade, setFinalidade] = useState('Venda');
  const [tipoImovel, setTipoImovel] = useState('Apartamento');
  const [bairro, setBairro] = useState('Jardins');
  const [valorCondicao, setValorCondicao] = useState('R$ 490.000 (Aceita Financiamento e FGTS)');
  const [destaques, setDestaques] = useState('3 quartos sendo 1 suíte, varanda gourmet com churrasqueira e 2 vagas de garagem');
  const [publicoAlvo, setPublicoAlvo] = useState('Famílias que buscam segurança, lazer completo e localização estratégica');

  // Estados de Direcionamento de Tráfego Direto para o WhatsApp do Corretor
  const [whatsappCorretor, setWhatsappCorretor] = useState(
    () => String(config?.whatsapp || config?.telefone || '5511999998888').replace(/\D/g, '') || '5511999998888'
  );
  const [origemCampanha, setOrigemCampanha] = useState('Instagram & Facebook Ads');
  const [copiadoId, setCopiadoId] = useState('');

  const copiarTexto = (id, texto) => {
    if (!texto) return;
    navigator.clipboard?.writeText(texto);
    setCopiadoId(id);
    setTimeout(() => setCopiadoId(''), 2500);
  };

  // Preenche automaticamente os campos ao clicar em um imóvel já cadastrado na Captação
  const preencherComImovelCaptado = (imovel) => {
    if (!imovel) return;
    setFinalidade(imovel.finalidade || 'Venda');
    setTipoImovel(imovel.tipo || 'Apartamento');
    setBairro(imovel.bairro || 'Região Nobre');
    const valFormatado = Number(imovel.valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
    setValorCondicao(
      imovel.finalidade === 'Locação'
        ? `${valFormatado}/mês (Locação facilitada)`
        : `${valFormatado} (Aceita Financiamento)`
    );
    setDestaques(
      `${imovel.titulo || imovel.tipo} com ${imovel.quartos || 2} quartos, excelente iluminação natural e acabamento impecável`
    );
  };

  // Link de Tráfego Direto para o WhatsApp do Corretor (Click-to-WhatsApp)
  const linkTrafegoWhatsApp = useMemo(() => {
    const foneLimpo = String(whatsappCorretor || '').replace(/\D/g, '');
    const saudacao = `Olá! Vi o anúncio de ${finalidade.toLowerCase()} do ${tipoImovel} em ${bairro} (${origemCampanha}) e gostaria de receber as fotos, condições (${valorCondicao}) e agendar uma visita!`;
    return {
      foneLimpo,
      mensagem: saudacao,
      urlCompleta: foneLimpo
        ? `https://wa.me/${foneLimpo}?text=${encodeURIComponent(saudacao)}`
        : `https://api.whatsapp.com/send?text=${encodeURIComponent(saudacao)}`,
    };
  }, [whatsappCorretor, finalidade, tipoImovel, bairro, origemCampanha, valorCondicao]);

  // 3 Geradores Rápidos de Copies Persuasivas (AIDA, Reels/Stories e Oportunidade Direta)
  const copiesGeradas = useMemo(() => {
    const isAluguel = /alug|loca/i.test(finalidade);
    const acaoVerbo = isAluguel ? 'morar de aluguel sem burocracia' : 'conquistar o seu novo imóvel';

    return [
      {
        id: 'copy_aida',
        estilo: '1. Copy Persuasiva AIDA (Ideal p/ Feed Instagram & Facebook)',
        objetivo: `${finalidade} • Alta Qualificação`,
        texto:
          `🏡✨ Procurando ${tipoImovel.toLowerCase()} para ${finalidade.toLowerCase()} em ${bairro || 'localização privilegiada'}?\n\n` +
          `Imagine ${acaoVerbo} em um espaço pensado para ${publicoAlvo.toLowerCase()}:\n` +
          `✅ ${destaques}\n` +
          `📍 Localização estratégica em ${bairro}, perto de tudo o que sua rotina precisa.\n` +
          `💰 Condição especial: ${valorCondicao}\n\n` +
          `📲 Clique no botão de WhatsApp abaixo ou acesse o link para receber o vídeo completo e agendar sua visita ainda esta semana!\n` +
          `👉 Atendimento direto no WhatsApp: ${linkTrafegoWhatsApp.urlCompleta}`,
      },
      {
        id: 'copy_reels',
        estilo: '2. Roteiro & Copy para Reels / Stories (Gancho de 3 Segundos)',
        objetivo: `${finalidade} • Vídeo Curto Viral`,
        texto:
          `🎥 [GANCHO NOS PRIMEIROS 3s]: "Se você busca ${tipoImovel.toLowerCase()} para ${finalidade.toLowerCase()} em ${bairro}, pare de rolar o feed agora!"\n\n` +
          `🔥 Olha o que este imóvel entrega:\n` +
          `• ${destaques}\n` +
          `• Condição: ${valorCondicao}\n\n` +
          `⚡ Unidades com esse padrão em ${bairro} costumam sair muito rápido!\n` +
          `💬 Toque em "Enviar mensagem pelo WhatsApp" aqui embaixo que eu te envio a ficha completa em 1 minuto!\n` +
          `🔗 Link direto: ${linkTrafegoWhatsApp.urlCompleta}`,
      },
      {
        id: 'copy_direta',
        estilo: '3. Copy Direta de Oportunidade & Tráfego p/ WhatsApp',
        objetivo: `${finalidade} • Conversão Imediata`,
        texto:
          `🚨 OPORTUNIDADE DE ${finalidade.toUpperCase()} EM ${(bairro || 'DESTAQUE').toUpperCase()}!\n\n` +
          `🏢 Imóvel: ${tipoImovel} — ${destaques}.\n` +
          `💎Valor / Condição: ${valorCondicao}.\n` +
          `🎯 Ideal para: ${publicoAlvo}.\n\n` +
          `Fale diretamente comigo no WhatsApp sem intermediários e receba todas as informações e simulação personalizada agora mesmo:\n` +
          `📲 ${linkTrafegoWhatsApp.urlCompleta}`,
      },
    ];
  }, [finalidade, tipoImovel, bairro, valorCondicao, destaques, publicoAlvo, linkTrafegoWhatsApp.urlCompleta]);

  const imoveisCaptadosRecentes = useMemo(
    () => (Array.isArray(listaImoveis) ? listaImoveis.slice(0, 4) : []),
    [listaImoveis]
  );

  return (
    <div style={{ backgroundColor: '#020408' }} className="space-y-6 text-slate-100 font-sans">
      {/* ═══════════════════════════════════════════════════════════════════════
          1. CABEÇALHO PLG — ATRAÇÃO DE LEADS TODOS OS DIAS
         ═══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10b981]/15 border border-[#10b981]/30 text-[#10b981] text-xs font-extrabold uppercase tracking-wider">
              <Sparkles size={14} /> Meta Ads & Criativos • Liberado Sem Restrições
            </div>
            <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight uppercase">
              ADS & <span style={{ color: '#10b981' }}>CAPTAÇÃO DE TRÁFEGO</span>
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Gerador de copies persuasivas para venda e aluguel, sugestões de criativos prontos e direcionamento de tráfego direto para o WhatsApp do corretor.
            </p>
          </div>

          <div className="bg-[#020408] border border-[#10b981]/40 rounded-2xl p-4 space-y-2 min-w-[260px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase text-slate-200 flex items-center gap-1.5">
                <Megaphone size={15} className="text-[#10b981]" /> Status da Ferramenta
              </span>
              <span
                style={{ backgroundColor: '#10b981' }}
                className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase text-white"
              >
                100% LIBERADO
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Copies ilimitadas + Gerador de Link Click-to-WhatsApp liberados no Modo Grátis e PRO.
            </p>
          </div>
        </div>

        {/* Atalho: Preencher automaticamente com um imóvel já cadastrado na Captação */}
        {imoveisCaptadosRecentes.length > 0 && (
          <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <Building2 size={14} className="text-[#10b981]" /> Usar imóvel da sua Captação:
            </span>
            {(imoveisCaptadosRecentes || [])?.map((imv) => (
              <button
                key={imv.id || imv.codigo}
                type="button"
                onClick={() => preencherComImovelCaptado(imv)}
                className="px-3 py-1 rounded-xl bg-[#020408] border border-slate-800 hover:border-[#10b981] text-xs font-bold text-slate-200 hover:text-[#10b981] transition cursor-pointer"
              >
                🏠 {imv.titulo || imv.tipo} ({imv.bairro || 'Ver'})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          2. GERADOR RÁPIDO DE COPIES PERSUASIVAS + LINK DIRETO WHATSAPP
         ═══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna Esquerda: Configuração do Anúncio e Link de Tráfego Direto */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Zap size={19} className="text-[#10b981]" />
              1. Configurar Imóvel & Tráfego WhatsApp
            </h2>
            <p className="text-xs text-slate-400">
              Personalize os dados abaixo para gerar instantaneamente os textos persuasivos e o link de destino da campanha.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                Finalidade do Anúncio
              </label>
              <select
                value={finalidade}
                onChange={(e) => setFinalidade(e.target.value)}
                className="w-full bg-[#020408] border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white font-bold"
              >
                <option value="Venda">Venda de Imóvel</option>
                <option value="Aluguel">Aluguel / Locação</option>
                <option value="Lançamento na Planta">Lançamento na Planta</option>
                <option value="Investimento">Oportunidade / Investidor</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                Tipo de Imóvel
              </label>
              <select
                value={tipoImovel}
                onChange={(e) => setTipoImovel(e.target.value)}
                className="w-full bg-[#020408] border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white font-bold"
              >
                <option value="Apartamento">Apartamento</option>
                <option value="Casa em Condomínio">Casa em Condomínio</option>
                <option value="Casa / Sobrado">Casa / Sobrado</option>
                <option value="Cobertura">Cobertura</option>
                <option value="Terreno / Lote">Terreno / Lote</option>
                <option value="Imóvel Comercial">Imóvel Comercial</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                Bairro / Região em Destaque
              </label>
              <input
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
                placeholder="Ex: Jardins, Centro, Zona Sul"
                className="w-full bg-[#020408] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-[#10b981] mb-1">
                Valor ou Condição Comercial
              </label>
              <input
                value={valorCondicao}
                onChange={(e) => setValorCondicao(e.target.value)}
                placeholder="Ex: R$ 490.000 ou Aluguel R$ 2.800"
                className="w-full bg-[#020408] border border-[#10b981]/60 rounded-xl px-3.5 py-2.5 text-sm text-white font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
              Principais Diferenciais do Imóvel (Gatilhos de Desejo)
            </label>
            <textarea
              rows={2}
              value={destaques}
              onChange={(e) => setDestaques(e.target.value)}
              placeholder="Ex: 3 quartos sendo 1 suíte, varanda gourmet, 2 vagas, aceita FGTS..."
              className="w-full bg-[#020408] border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
              Perfil do Comprador / Inquilino Ideal
            </label>
            <input
              value={publicoAlvo}
              onChange={(e) => setPublicoAlvo(e.target.value)}
              placeholder="Ex: Famílias que buscam segurança e lazer completo"
              className="w-full bg-[#020408] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
            />
          </div>

          {/* Card de Direcionamento de Tráfego Direto para o WhatsApp do Corretor */}
          <div className="bg-[#020408] border border-[#10b981]/50 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase text-[#10b981] flex items-center gap-1.5">
                <MessageCircle size={15} /> Link de Tráfego Direto p/ WhatsApp do Corretor
              </span>
              <span className="text-[10px] font-bold text-slate-400">Click-to-WhatsApp</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Seu WhatsApp (com DDD)
                </label>
                <input
                  value={whatsappCorretor}
                  onChange={(e) => setWhatsappCorretor(e.target.value)}
                  placeholder="5511999998888"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Origem Rastreada na Mensagem
                </label>
                <select
                  value={origemCampanha}
                  onChange={(e) => setOrigemCampanha(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                >
                  <option value="Instagram & Facebook Ads">Instagram & Facebook Ads</option>
                  <option value="Reels / Stories Patrocinado">Reels / Stories Patrocinado</option>
                  <option value="Link da Bio / Catálogo">Link da Bio / Catálogo</option>
                </select>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 text-[11px] text-slate-300 font-mono break-all">
              {linkTrafegoWhatsApp.urlCompleta}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => copiarTexto('link_zap_ads', linkTrafegoWhatsApp.urlCompleta)}
                style={{ backgroundColor: '#10b981' }}
                className="flex-1 py-2 px-3 rounded-xl text-white font-black text-xs flex items-center justify-center gap-1.5 hover:opacity-90 transition cursor-pointer"
              >
                {copiadoId === 'link_zap_ads' ? <Check size={14} /> : <Copy size={14} />}
                {copiadoId === 'link_zap_ads' ? 'Link Copiado!' : 'Copiar Link p/ Meta Ads'}
              </button>
              <button
                type="button"
                onClick={() => window.open(linkTrafegoWhatsApp.urlCompleta, '_blank')}
                className="py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-[#10b981] text-xs font-bold text-slate-200 flex items-center gap-1.5 transition cursor-pointer"
              >
                <ExternalLink size={14} className="text-[#10b981]" /> Testar no Zap
              </button>
            </div>
          </div>
        </div>

        {/* Coluna Direita: As 3 Copies Persuasivas Prontas para Copiar e Publicar */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Sparkles size={19} className="text-[#10b981]" />
                  2. Gerador Instantâneo de Copies Persuasivas (Venda & Aluguel)
                </h2>
                <p className="text-xs text-slate-400">
                  Escolha o formato abaixo, copie o texto persuasivo com 1 clique e cole no Gerenciador de Anúncios ou post do Instagram.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#10b981]/15 border border-[#10b981]/30 text-[#10b981] text-[11px] font-extrabold">
                3 Fórmulas de Alta Conversão
              </span>
            </div>

            <div className="space-y-4">
              {(copiesGeradas || [])?.map((item) => {
                const isCopiado = copiadoId === item.id;
                return (
                  <div
                    key={item.id}
                    className="bg-[#020408] border border-slate-800 hover:border-[#10b981]/50 rounded-2xl p-4 space-y-3 transition"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-xs font-black text-white block">{item.estilo}</span>
                        <span className="text-[11px] text-[#10b981] font-bold">{item.objetivo}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => copiarTexto(item.id, item.texto)}
                          style={{ backgroundColor: '#10b981' }}
                          className="px-3.5 py-1.5 rounded-xl text-white text-xs font-extrabold flex items-center gap-1.5 hover:opacity-90 transition cursor-pointer"
                        >
                          {isCopiado ? <Check size={14} /> : <Copy size={14} />}
                          {isCopiado ? 'Copy Copiada!' : 'Copiar Copy'}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            window.open(
                              `https://api.whatsapp.com/send?text=${encodeURIComponent(item.texto)}`,
                              '_blank'
                            )
                          }
                          className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-[#10b981] text-xs font-bold text-slate-200 flex items-center gap-1 cursor-pointer transition"
                        >
                          <Share2 size={13} className="text-[#10b981]" /> Enviar no Zap
                        </button>
                      </div>
                    </div>

                    <pre className="bg-slate-900/80 border border-slate-800/90 rounded-xl p-3.5 text-xs text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
                      {item.texto}
                    </pre>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          3. BIBLIOTECA DE SUGESTÕES DE CRIATIVOS PRONTOS (REELS, CARROSSEL E FEED)
         ═══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Layers size={19} className="text-[#10b981]" />
              3. Sugestões de Criativos Prontos & Segmentação para Corretores
            </h2>
            <p className="text-xs text-slate-400">
              Modelos visuais testados no mercado imobiliário para você gravar pelo telemóvel ou montar artes rápidas com foco em geração de leads no WhatsApp.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-[#10b981]/15 border border-[#10b981]/30 text-[#10b981] text-xs font-extrabold">
            100% Liberado no Modo Grátis
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(CRIATIVOS_PRONTOS_IMOBI || [])?.map((criativo) => {
            const isCopiado = copiadoId === criativo.id;
            const resumoCriativo =
              `🎨 *BRIEFING DE CRIATIVO IMOBILIÁRIO — ${criativo.titulo}*\n` +
              `📐 Formato: ${criativo.formato}\n` +
              `🏷️ Headline na Arte: "${criativo.headlineArte}"\n` +
              `🎬 Direção Visual: ${criativo.ganchoVisual}\n` +
              `🎯 Público Sugerido no Meta Ads: ${criativo.segmentacaoMeta}\n` +
              `📲 Botão CTA: ${criativo.ctaBotao} -> ${linkTrafegoWhatsApp.urlCompleta}`;

            return (
              <div
                key={criativo.id}
                className="bg-[#020408] border border-slate-800 hover:border-[#10b981]/60 rounded-2xl p-5 flex flex-col justify-between space-y-4 transition"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-[#10b981]/15 border border-[#10b981]/30 text-[#10b981] text-[10px] font-extrabold uppercase">
                      {criativo.categoria}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      {/Reels/i.test(criativo.formato) ? (
                        <Video size={13} className="text-[#10b981]" />
                      ) : (
                        <ImageIcon size={13} className="text-[#10b981]" />
                      )}
                      {criativo.formato}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-white">{criativo.titulo}</h3>

                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-1">
                    <span className="text-[10px] font-extrabold uppercase text-[#10b981] block">
                      Texto em Destaque na Arte (Headline):
                    </span>
                    <p className="text-xs font-bold text-white">&ldquo;{criativo.headlineArte}&rdquo;</p>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    <strong className="text-white">Como montar o criativo:</strong> {criativo.ganchoVisual}
                  </p>

                  <p className="text-[11px] text-slate-400 flex items-start gap-1.5">
                    <Target size={14} className="text-[#10b981] shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-slate-200">Segmentação Meta Ads:</strong> {criativo.segmentacaoMeta}
                    </span>
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-[#10b981] font-bold">
                    CTA: {criativo.ctaBotao}
                  </span>
                  <button
                    type="button"
                    onClick={() => copiarTexto(criativo.id, resumoCriativo)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-[#10b981]/50 hover:bg-[#10b981] text-xs font-extrabold text-[#10b981] hover:text-white flex items-center gap-1.5 transition cursor-pointer"
                  >
                    {isCopiado ? <Check size={13} /> : <Copy size={13} />}
                    {isCopiado ? 'Briefing Copiado!' : 'Copiar Modelo de Criativo'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
