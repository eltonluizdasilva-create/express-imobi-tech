import React, { useState } from "react";
import {
    ShoppingCart, Search, Mic, Link as LinkIcon,
    MessageCircle, ExternalLink, Star, Box
} from "lucide-react";

const STYLES = {
    input: 'bg-zinc-950 border-2 border-zinc-800 focus:border-yellow-500 text-zinc-100 p-5 rounded-2xl outline-none w-full transition-all font-mono text-base shadow-inner'
};

export default function MercadoLivre() {
    const [searchTerm, setSearchTerm] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [resultados, setResultados] = useState([]);

    // ==========================================
    // SUA TAG DE AFILIADO FICA FIXA AQUI!
    // Toda venda gerada por qualquer oficina do seu SaaS cai na sua conta.
    const MEU_ID_AFILIADO = "SEU_CODIGO_AQUI";
    // ==========================================

    // Simula a busca na API
    const handleSearch = () => {
        if (!searchTerm.trim()) return;
        setIsSearching(true);

        setTimeout(() => {
            setResultados([
                { id: 1, titulo: `${searchTerm} - Original Compatível`, preco: "189,90", frete: "Grátis", avaliacao: 4.8, img: "https://http2.mlstatic.com/D_NQ_NP_2X_735620-MLB48671408846_122021-F.webp" },
                { id: 2, titulo: `${searchTerm} - Kit Completo (1ª Linha)`, preco: "145,50", frete: "Chega amanhã", avaliacao: 4.5, img: "https://http2.mlstatic.com/D_NQ_NP_2X_813735-MLB45209772049_032021-F.webp" },
                { id: 3, titulo: `${searchTerm} - Marca Importada`, preco: "98,00", frete: "Grátis", avaliacao: 4.2, img: "https://http2.mlstatic.com/D_NQ_NP_2X_728632-MLB46681533038_072021-F.webp" }
            ]);
            setIsSearching(false);
        }, 1200);
    };

    // Microfone
    const toggleMic = () => {
        const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!Recognition) return alert("Microfone não suportado no seu navegador.");
        const rec = new Recognition();
        rec.lang = 'pt-BR';

        if (isListening) {
            rec.stop();
            setIsListening(false);
        } else {
            setIsListening(true);
            rec.start();
            rec.onresult = (e) => {
                const textoFalado = e.results[0][0].transcript;
                setSearchTerm(textoFalado);
                setTimeout(() => handleSearch(), 500);
            };
            rec.onend = () => setIsListening(false);
        }
    };

    // Envio pro WhatsApp (O Segredo da Venda pro Cliente)
    const handleWhatsAppShare = (produto) => {
        const termoFormatado = produto.titulo.replace(/\s+/g, '-').toLowerCase();

        // O Link é gerado automaticamente com a SUA tag.
        const linkMagico = `https://lista.mercadolivre.com.br/${termoFormatado}?af_id=${MEU_ID_AFILIADO}`;

        // Texto persuasivo pro mecânico mandar pro cliente
        const mensagem = `Fala chefe! 🚀 Já fiz a cotação e achei a peça ideal pro seu carro: *${produto.titulo}*.\n\nClica no link seguro abaixo, faz a compra no Mercado Livre e manda entregar direto aqui na oficina que a gente já deixa no jeito pra instalar:\n👉 ${linkMagico}`;

        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(mensagem)}`;
        window.open(url, '_blank');
    };

    return (
        <div className="bg-black min-h-screen text-zinc-100 p-4 md:p-8 pb-40">
            <div className="max-w-6xl mx-auto">

                {/* HEADER LIMPO (Foco na Ferramenta) */}
                <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-[2rem] p-8 mb-10 shadow-[0_0_40px_rgba(250,204,21,0.2)] flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6 text-center md:text-left">
                        <div className="p-5 bg-black/10 rounded-2xl backdrop-blur-sm hidden md:block">
                            <Box className="text-black" size={48} />
                        </div>
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black text-black uppercase tracking-tighter">Catálogo de Peças</h1>
                            <p className="text-yellow-900 font-bold mt-2 uppercase tracking-widest text-sm flex items-center gap-2 justify-center md:justify-start">
                                <Search size={16} /> Encontre peças originais para as Ordens de Serviço
                            </p>
                        </div>
                    </div>
                </div>

                {/* 🎙️ BARRA DE BUSCA */}
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-[2rem] p-8 mb-10 shadow-2xl relative">
                    <h2 className="text-yellow-500 font-black mb-4 uppercase text-xs tracking-widest flex items-center gap-2">
                        <Search size={16} /> Qual peça você precisa cotar?
                    </h2>

                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                placeholder="Ex: Pastilha de freio do Honda Civic 2020..."
                                className={STYLES.input + " pr-20"}
                            />
                            <button
                                onClick={toggleMic}
                                className={`absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-xl transition-all ${isListening ? 'bg-red-600 text-white animate-pulse' : 'bg-zinc-800 text-yellow-500 hover:bg-yellow-500 hover:text-black'}`}
                            >
                                <Mic size={20} />
                            </button>
                        </div>

                        <button
                            onClick={handleSearch}
                            disabled={!searchTerm.trim() || isSearching}
                            className="py-5 px-10 bg-yellow-500 hover:bg-yellow-400 text-black font-black text-lg uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {isSearching ? <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-black"></div> : 'Buscar Catálogo'}
                        </button>
                    </div>
                </div>

                {/* 🛍️ RESULTADOS (Vitrine com os DOIS Botões) */}
                {resultados.length > 0 && (
                    <div className="mb-12">
                        <h2 className="text-zinc-400 font-black mb-6 uppercase text-sm tracking-widest flex items-center gap-2 border-l-4 border-yellow-500 pl-4">
                            Cotações Encontradas
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {resultados.map((produto) => (
                                <div key={produto.id} className="bg-zinc-900 border border-zinc-800 rounded-[2rem] overflow-hidden hover:border-yellow-500/50 transition-all shadow-xl group flex flex-col">

                                    <div className="h-48 bg-zinc-800 relative flex items-center justify-center overflow-hidden">
                                        <img src={produto.img} alt={produto.titulo} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1">
                                            <Star size={12} className="text-yellow-500 fill-yellow-500" />
                                            <span className="text-xs font-bold text-white">{produto.avaliacao}</span>
                                        </div>
                                    </div>

                                    <div className="p-6 flex flex-col flex-1">
                                        <h3 className="text-white font-bold text-sm mb-4 leading-relaxed line-clamp-2">{produto.titulo}</h3>

                                        <div className="mt-auto flex flex-col gap-2">
                                            <span className="text-3xl font-black text-yellow-500 block mb-1">R$ {produto.preco}</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-green-500 bg-green-500/10 px-2 py-1 rounded-md mb-4 inline-block w-fit">
                                                {produto.frete}
                                            </span>

                                            {/* BOTÃO 1: COMPRAR AGORA (O dono da oficina compra direto, você ganha comissão) */}
                                            <button
                                                onClick={() => window.open(`https://lista.mercadolivre.com.br/${produto.titulo.replace(/\s+/g, '-').toLowerCase()}?af_id=${MEU_ID_AFILIADO}`, '_blank')}
                                                className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-black uppercase text-[10px] tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(250,204,21,0.2)]"
                                            >
                                                <ShoppingCart size={16} /> Comprar Agora (Oficina)
                                            </button>

                                            {/* BOTÃO 2: ENVIAR PARA O CLIENTE (O cliente compra pelo Zap, você ganha comissão) */}
                                            <button
                                                onClick={() => handleWhatsAppShare(produto)}
                                                className="w-full py-3 bg-zinc-800 hover:bg-green-600 text-white font-black uppercase text-[10px] tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 border border-green-600/30 hover:border-green-500 group"
                                            >
                                                <MessageCircle size={16} className="text-green-500 group-hover:text-white" /> Enviar p/ Cliente
                                            </button>
                                        </div>

                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* PARCEIROS (Estes são seus patrocinadores B2B) */}
                <div className="mt-16 pt-10 border-t border-zinc-800">
                    <h2 className="text-zinc-600 font-black mb-6 uppercase text-[10px] tracking-widest text-center">Fornecedores Homologados Express Auto Tech</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gradient-to-r from-blue-900 to-black border border-blue-800/50 rounded-3xl p-6 flex items-center justify-between group cursor-pointer hover:border-blue-500 transition-all relative overflow-hidden">
                            <div className="relative z-10">
                                <span className="bg-blue-600 text-white text-[8px] font-black uppercase px-2 py-1 rounded-sm mb-2 inline-block">Patrocinado</span>
                                <h3 className="text-white font-black text-xl italic uppercase">Distribuidora Autopeças Max</h3>
                                <p className="text-blue-300 text-xs mt-1">Compre direto da fábrica. Entrega em 2 horas.</p>
                            </div>
                            <ExternalLink size={24} className="text-blue-500 relative z-10 group-hover:scale-110 transition-transform" />
                        </div>

                        <div className="bg-gradient-to-r from-red-900 to-black border border-red-800/50 rounded-3xl p-6 flex items-center justify-between group cursor-pointer hover:border-red-500 transition-all relative overflow-hidden">
                            <div className="relative z-10">
                                <span className="bg-red-600 text-white text-[8px] font-black uppercase px-2 py-1 rounded-sm mb-2 inline-block">Patrocinado</span>
                                <h3 className="text-white font-black text-xl italic uppercase">Óleos Lubrificantes Pro</h3>
                                <p className="text-red-300 text-xs mt-1">Caixa fechada com 20% de desconto para oficinas.</p>
                            </div>
                            <ExternalLink size={24} className="text-red-500 relative z-10 group-hover:scale-110 transition-transform" />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}