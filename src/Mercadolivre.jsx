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

    // FUNÇÃO REAL: Consumindo a API Oficial do Mercado Livre
    const handleSearch = async () => {
        if (!searchTerm.trim()) return;
        setIsSearching(true);

        try {
            // Faz a requisição para a API pública do ML buscando 12 itens
            const response = await fetch(`https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(searchTerm)}&limit=12`);
            const data = await response.json();

            if (data.results && data.results.length > 0) {
                const produtosMapeados = data.results.map(item => {
                    // Melhora a qualidade da imagem trocando o sufixo -I por -O (Original) e força HTTPS
                    let imagemAltaQualidade = item.thumbnail.replace('http://', 'https://');
                    imagemAltaQualidade = imagemAltaQualidade.replace('-I.jpg', '-O.jpg');

                    return {
                        id: item.id,
                        titulo: item.title,
                        preco: item.price,
                        frete: item.shipping?.free_shipping ? "Grátis" : "Consultar",
                        avaliacao: (4.0 + Math.random() * 1.0).toFixed(1), // API básica não traz review, mantemos mock
                        img: imagemAltaQualidade,
                        permalink: item.permalink // Link real do anúncio
                    };
                });
                setResultados(produtosMapeados);
            } else {
                setResultados([]);
                alert("Nenhuma peça encontrada para esta busca.");
            }
        } catch (error) {
            console.error("Erro ao buscar na API do Mercado Livre:", error);
            alert("Erro de conexão com o Mercado Livre.");
        } finally {
            setIsSearching(false);
        }
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

    // LINK DIRETO: Pega o permalink do anúncio real e anexa sua tag de afiliado
    const gerarLinkML = (permalink) => {
        const separador = permalink.includes('?') ? '&' : '?';
        return `${permalink}${separador}af_id=${MEU_ID_AFILIADO}`;
    };

    const handleWhatsAppShare = (produto) => {
        const link = gerarLinkML(produto.permalink);
        const precoFormatado = produto.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
        const mensagem = `🚀 *COTAÇÃO EXPRESS AUTO TECH*\n\nPeça: *${produto.titulo}*\n💰 Valor: *R$ ${precoFormatado}*\n\n🛒 Acesse o anúncio direto no Mercado Livre:\n${link}`;
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(mensagem)}`, '_blank');
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
                            <p className="text-yellow-800 font-bold uppercase tracking-[0.2em] text-[10px] mt-1">Integração Oficial API</p>
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
                                            <span className="text-2xl font-black text-white font-mono">{produto.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="grid gap-2">
                                            <button onClick={() => window.open(gerarLinkML(produto.permalink), '_blank')} className="w-full py-3 bg-[#FFE600] text-[#2d3277] font-black uppercase text-[9px] rounded-xl hover:bg-yellow-400 transition-all active:scale-95 shadow-md">
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