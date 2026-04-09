import React, { useState } from "react";
import { ShoppingCart, Search, Mic, MessageCircle, Star, Box, Image as ImageIcon } from "lucide-react";

const STYLES = {
    input: 'bg-zinc-950 border-2 border-zinc-800 focus:border-[#FFE600] text-zinc-100 p-5 rounded-2xl outline-none w-full transition-all font-mono text-base shadow-inner'
};

export default function MercadoLivre() {
    const MEU_ID_AFILIADO = "1mecatronica";
    const [searchTerm, setSearchTerm] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [resultados, setResultados] = useState([]);
    const [sortByPreco, setSortByPreco] = useState(false);

    const IMAGENS_ESTAVEIS = [
        "https://images.tcdn.com.br/img/img_prod/697730/disco_de_freio_dianteiro_vent_fremax_bd5288_uno_palio_siena_1513_1_20200803154133.jpg",
        "https://images.tcdn.com.br/img/img_prod/697730/amortecedor_dianteiro_monroe_334437mm_uno_vivace_1167_1_20190806144558.jpg",
        "https://images.tcdn.com.br/img/img_prod/697730/pastilha_de_freio_dianteira_cobreq_n132_uno_mille_palio_fiorino_1523_1_20200803154448.jpg",
        "https://images.tcdn.com.br/img/img_prod/697730/filtro_de_oleo_mann_filter_w610_8_uno_palio_punto_fiat_500_1549_1_20200803155705.jpg"
    ];

    const handleSearch = () => {
        if (!searchTerm.trim()) return;
        setIsSearching(true);

        // Simula o tempo de busca perfeito para o vídeo (rápido, mas realista)
        setTimeout(() => {
            const marcas = ["Original", "Bosch", "Cofap", "Magneti Marelli", "Nakata", "TRW"];

            const novosResultados = Array.from({ length: 12 }, (_, i) => {
                return {
                    id: i + 1,
                    titulo: `${searchTerm.toUpperCase()} - ${marcas[i % marcas.length]}`,
                    preco: (45 + Math.random() * 300).toFixed(2),
                    frete: i % 2 === 0 ? "FULL" : "Grátis",
                    avaliacao: (4.3 + Math.random() * 0.6).toFixed(1),
                    img: IMAGENS_ESTAVEIS[i % IMAGENS_ESTAVEIS.length]
                };
            });
            setResultados(novosResultados);
            setIsSearching(false);
        }, 800);
    };

    // Link limpo: abre a busca exata no Mercado Livre com sua tag
    const gerarLinkML = () => {
        const query = searchTerm.trim().replace(/\s+/g, '-').toLowerCase();
        return `https://lista.mercadolivre.com.br/${query}?af_id=${MEU_ID_AFILIADO}`;
    };

    // Atualize também o botão de WhatsApp
    const handleWhatsAppShare = (produto) => {
        const link = gerarLinkML();
        const precoFormatado = produto.preco.replace('.', ',');
        const mensagem = `🚀 *COTAÇÃO EXPRESS AUTO TECH*\n\nPeça: *${produto.titulo}*\n💰 Valor Médio: *R$ ${precoFormatado}*\n\n🛒 Confira todas as opções e compre com segurança no Mercado Livre:\n${link}`;
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(mensagem)}`, '_blank');
    };

    const toggleMic = () => {
        const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!Recognition) return alert("Microfone não suportado.");
        const rec = new Recognition();
        rec.lang = 'pt-BR';
        if (isListening) { rec.stop(); setIsListening(false); }
        else {
            setIsListening(true); rec.start();
            rec.onresult = (e) => {
                setSearchTerm(e.results[0][0].transcript);
                setTimeout(() => handleSearch(), 500);
            };
            rec.onend = () => setIsListening(false);
        }
    };

    return (
        <div className="bg-black min-h-screen text-zinc-100 p-4 md:p-8">
            <div className="max-w-6xl mx-auto">

                {/* HEADER */}
                <div className="bg-[#FFE600] rounded-[2.5rem] p-8 mb-10 shadow-[0_20px_50px_rgba(255,230,0,0.2)] flex flex-col md:flex-row items-center justify-between gap-6 border-b-8 border-yellow-600">
                    <div className="flex items-center gap-6">
                        <div className="p-5 bg-black rounded-3xl shadow-xl"><ShoppingCart className="text-[#FFE600]" size={40} /></div>
                        <div>
                            <h1 className="text-4xl font-black text-[#2d3277] uppercase italic leading-none">Mercado Livre</h1>
                            <p className="text-yellow-800 font-bold uppercase tracking-[0.2em] text-[10px] mt-1">Simulação de Catálogo</p>
                        </div>
                    </div>
                </div>

                {/* BUSCA E FILTROS */}
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8 mb-10 shadow-2xl backdrop-blur-md">
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                placeholder="Digite a peça real para buscar no Mercado Livre..."
                                className={STYLES.input}
                            />
                            <button onClick={toggleMic} className={`absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-xl transition-all ${isListening ? 'bg-red-600 animate-pulse' : 'bg-zinc-800 text-yellow-500'}`}>
                                <Mic size={20} />
                            </button>
                        </div>
                        <button onClick={handleSearch} disabled={isSearching} className="py-5 px-10 bg-[#FFE600] text-[#2d3277] font-black uppercase rounded-2xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-50">
                            {isSearching ? 'Buscando...' : 'Buscar Peças'}
                        </button>
                    </div>

                    <button
                        onClick={() => setSortByPreco(!sortByPreco)}
                        className={`flex items-center gap-2 py-3 px-6 rounded-xl font-black text-[10px] uppercase border transition-all ${sortByPreco ? 'bg-yellow-500 border-yellow-500 text-black shadow-lg' : 'border-zinc-800 text-zinc-500'}`}
                    >
                        <Box size={14} />
                        {sortByPreco ? '⚡ FILTRANDO: MENOR PREÇO PRIMEIRO' : 'ORDENAR POR MENOR PREÇO'}
                    </button>
                </div>

                {/* GRID DE RESULTADOS */}
                {resultados.length > 0 && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-5 duration-700">
                        {[...resultados].sort((a, b) => sortByPreco ? a.preco - b.preco : 0).map((produto) => (
                            <div key={produto.id} className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden hover:border-yellow-500/50 transition-all flex flex-col group">

                                <div className="h-40 bg-white flex flex-col items-center justify-center relative border-b border-zinc-800 overflow-hidden">
                                    {produto.img ? (
                                        <img src={produto.img} alt={produto.titulo} className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-500" />
                                    ) : (
                                        <ImageIcon size={40} className="text-zinc-300" />
                                    )}

                                    <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1 border border-white/10">
                                        <Star size={10} className="text-yellow-500 fill-yellow-500" />
                                        <span className="text-[10px] font-bold text-white">{produto.avaliacao}</span>
                                    </div>
                                    <div className="absolute top-3 right-3 bg-green-500 text-white text-[8px] font-black px-2 py-1 rounded shadow-lg">
                                        {produto.frete}
                                    </div>
                                </div>

                                <div className="p-6 flex flex-col flex-1">
                                    <h3 className="text-zinc-300 font-bold text-[10px] mb-4 uppercase leading-tight line-clamp-2" title={produto.titulo}>{produto.titulo}</h3>
                                    <div className="mt-auto">
                                        <div className="mb-4">
                                            <span className="text-[10px] text-zinc-500 font-bold mr-1">R$</span>
                                            <span className="text-2xl font-black text-white font-mono">{produto.preco}</span>
                                        </div>
                                        <div className="grid gap-2">
                                            <button onClick={() => window.open(gerarLinkML(), '_blank')} className="w-full py-3 bg-[#FFE600] text-[#2d3277] font-black uppercase text-[9px] rounded-xl hover:bg-yellow-400 transition-all active:scale-95 shadow-md">
                                                Ver no ML (Comprar)
                                            </button>
                                            <button onClick={() => handleWhatsAppShare(produto)} className="w-full py-3 bg-zinc-800 text-zinc-400 font-black uppercase text-[9px] rounded-xl border border-zinc-700 hover:bg-green-600 hover:text-white hover:border-green-600 transition-all">
                                                Enviar Cliente
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}