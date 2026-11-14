import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Sobre() {
  const navigate = useNavigate();

  // Rola para o topo ao abrir a página
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-blue-500 selection:text-white">

      {/* NAVEGAÇÃO */}
      <nav className="flex justify-between items-center px-8 py-6 max-w-7xl mx-auto">
        <div
          onClick={() => navigate('/')}
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-lg shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            E
          </div>
          <span className="text-xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
            EXPRESS <span className="text-blue-500">AI</span>
          </span>
        </div>

        {/* MENU CENTRAL */}
        <div className="hidden md:flex gap-8 text-sm font-semibold text-gray-400">
          <button onClick={() => navigate('/')} className="hover:text-blue-400 transition-colors cursor-pointer">Início</button>
          <button onClick={() => navigate('/servicos')} className="hover:text-blue-400 transition-colors cursor-pointer">Serviços</button>
          <button className="text-blue-400 cursor-default">Sobre Nós</button>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => window.open('https://wa.me/5534991439845?text=Olá, quero agendar uma consultoria com a Express AI', '_blank')}
            className="px-5 py-2 text-sm font-bold bg-white text-black rounded-full hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
          >
            Falar no WhatsApp
          </button>
        </div>
      </nav>

      {/* CABEÇALHO */}
      <header className="pt-20 pb-16 text-center px-4 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
        <h1 className="text-4xl md:text-6xl font-black mb-6 relative z-10">
          Quem Somos
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto relative z-10 leading-relaxed">
          A ponte entre a engenharia de precisão e a revolução da inteligência artificial aplicada aos negócios locais.
        </p>
      </header>

      {/* SECÇÃO DO FUNDADOR (COM A FOTO PROFISSIONAL) */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto bg-[#111] border border-[#222] rounded-3xl p-8 md:p-12 flex flex-col md:flex-row gap-12 items-center relative overflow-hidden">

          {/* Efeito de fundo */}
          <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-blue-900/10 to-transparent pointer-events-none"></div>

          {/* LADO DA FOTO */}
          <div className="md:w-2/5 relative z-10">
            {/* Círculo decorativo atrás da foto */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full blur-2xl opacity-20 transform scale-110"></div>

            {/* A FOTO PROFISSIONAL AQUI */}
            <div className="relative rounded-2xl overflow-hidden border-2 border-[#333] shadow-2xl shadow-blue-500/20 aspect-[4/5]">
              <img
                src="/foto-perfil.jpg"
                alt="Foto do Fundador da Express AI"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.parentNode.innerHTML = '<div class="flex items-center justify-center h-full bg-[#0a0a0a] text-gray-500 font-bold p-4 text-center">Coloque sua foto em /public/foto-perfil.jpg</div>';
                }}
              />
            </div>
          </div>

          {/* LADO DO TEXTO (A HISTÓRIA) */}
          <div className="md:w-3/5 relative z-10 space-y-6">
            <div>
              <h3 className="text-blue-500 font-bold uppercase tracking-widest text-sm mb-2">O Fundador</h3>
              <h2 className="text-3xl md:text-4xl font-black mb-4">Elton [Seu Sobrenome]</h2>
              <p className="text-xl text-gray-300 font-medium">
                Engenheiro de Controle e Automação & Especialista em IA
              </p>
            </div>

            <div className="space-y-4 text-gray-400 leading-relaxed">
              <p>
                "Durante anos na engenharia, aprendi que a eficiência não é um acidente; ela é projetada. Eu via empresas físicas lutarem com processos manuais, papelada e marketing ineficiente, enquanto a tecnologia avançava a passos largos."
              </p>
              <p>
                "Fundei a <strong>Express AI</strong> com uma missão clara: pegar a precisão da automação industrial e a potência da Inteligência Artificial e trazê-las para o mundo dos negócios locais."
              </p>
              <p>
                "Não somos apenas uma agência de marketing. Somos engenheiros de crescimento. Criamos sistemas (como o Express Auto Tech) e estratégias de tráfego que funcionam com a previsibilidade de uma máquina bem lubrificada."
              </p>
            </div>

            <div className="pt-4">
              <button
                onClick={() => window.open('https://wa.me/5534991439845?text=Olá, Elton. Li sua história no site e gostaria de conversar.', '_blank')}
                className="px-8 py-3 border border-white/20 text-white font-bold rounded-full hover:bg-white hover:text-black transition-all"
              >
                Conversar diretamente comigo
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* VALORES DA EMPRESA */}
      <section className="py-20 px-4 max-w-5xl mx-auto text-center">
        <h2 className="text-3xl font-black mb-12">Nosso DNA</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-[#0a0a0a] p-8 rounded-2xl border border-[#222]">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-xl font-bold mb-2">Velocidade</h3>
            <p className="text-gray-500 text-sm">O mercado não espera. Implementamos soluções rápidas que geram resultado nas primeiras semanas.</p>
          </div>
          <div className="bg-[#0a0a0a] p-8 rounded-2xl border border-[#222]">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-bold mb-2">Precisão</h3>
            <p className="text-gray-500 text-sm">Não usamos "achismos". Nossas estratégias de tráfego e sistemas são baseados em dados reais.</p>
          </div>
          <div className="bg-[#0a0a0a] p-8 rounded-2xl border border-[#222]">
            <div className="text-4xl mb-4">🤝</div>
            <h3 className="text-xl font-bold mb-2">Parceria</h3>
            <p className="text-gray-500 text-sm">Não vendemos e sumimos. Acompanhamos o crescimento do seu negócio de perto.</p>
          </div>
        </div>
      </section>

      {/* RODAPÉ */}
      <footer className="bg-[#000] border-t border-[#111] py-8 text-center text-gray-600 text-sm">
        © {new Date().getFullYear()} Express AI Automações. Todos os direitos reservados.
      </footer>

    </div>
  );
}