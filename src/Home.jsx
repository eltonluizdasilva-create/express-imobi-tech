import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-blue-500 selection:text-white">

      {/* NAVEGAÇÃO */}
      <nav className="flex justify-between items-center px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-lg shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            E
          </div>
          <span className="text-xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
            EXPRESS <span className="text-blue-500">AI</span>
          </span>
        </div>

        {/* MENU CENTRAL */}
        <div className="hidden md:flex gap-8 text-sm font-semibold text-gray-400">
          <button onClick={() => window.scrollTo(0, 0)} className="text-blue-400 cursor-default">Início</button>
          <button onClick={() => navigate('/servicos')} className="hover:text-blue-400 transition-colors cursor-pointer">Nossos Serviços</button>
          <button onClick={() => navigate('/sobre')} className="hover:text-blue-400 transition-colors cursor-pointer">Sobre Nós</button>
        </div>

        <div className="flex gap-4">
          {/* BOTÃO CORRIGIDO PARA ABRIR O LOGIN DO ADMIN */}
          <button
            onClick={() => navigate('/admin')}
            className="px-5 py-2 text-sm font-bold text-gray-300 hover:text-white transition-colors"
          >
            Login
          </button>
          <button
            onClick={() => navigate('/cadastro')}
            className="px-5 py-2 text-sm font-bold bg-white text-black rounded-full hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
          >
            Começar Agora
          </button>
        </div>
      </nav>

      {/* HERO SECTION (CABEÇALHO PRINCIPAL) */}
      <header className="relative pt-20 pb-32 overflow-hidden flex flex-col items-center justify-center text-center px-4">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold mb-8 uppercase tracking-widest">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          Agência de Tecnologia e Automação
        </div>

        <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight max-w-4xl z-10">
          Escale o seu negócio com <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600">
            Inteligência Artificial
          </span>
        </h1>

        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mb-10 z-10">
          A Express AI desenvolve sistemas SaaS de alta performance, automações de vendas e estratégias de tráfego inteligente para transformar empresas comuns em líderes de mercado.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 z-10">
          <button
            onClick={() => document.getElementById('solucoes').scrollIntoView({ behavior: 'smooth' })}
            className="px-8 py-4 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-500 transition-all shadow-[0_0_30px_rgba(37,99,235,0.4)] transform hover:scale-105"
          >
            Explorar Soluções
          </button>
          <button
            onClick={() => window.open('https://wa.me/5534991439845?text=Olá, quero saber mais sobre a Express AI', '_blank')}
            className="px-8 py-4 bg-[#111] border border-[#333] text-white font-bold rounded-full hover:bg-[#222] transition-all"
          >
            Falar com Consultor
          </button>
        </div>
      </header>

      {/* PRODUTO ESTRELA: OFICINA IA */}
      <section id="solucoes" className="py-24 px-4 bg-gradient-to-b from-[#050505] to-[#0a0a0a] border-t border-[#111]">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-blue-500 font-bold uppercase tracking-widest text-sm">Produto Estrela</span>
          </div>

          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-black mb-6">
                Oficina <span className="text-[#FF0033]">IA</span>
              </h2>
              <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                O primeiro sistema ERP para oficinas mecânicas do Brasil movido a Inteligência Artificial. Diga adeus ao papel e aos orçamentos amadores. Transforme a sua oficina em uma concessionária digital.
              </p>

              <ul className="space-y-4 mb-10">
                <li className="flex items-center gap-3 text-gray-300">
                  <span className="text-green-500 text-xl">✓</span> IA que lê o painel do veículo e extrai o KM.
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <span className="text-green-500 text-xl">✓</span> Captação de Leads e orçamentos via foto e texto.
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <span className="text-green-500 text-xl">✓</span> Portal exclusivo para o cliente acompanhar o serviço.
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <span className="text-green-500 text-xl">✓</span> Cobrança via PIX integrada ao caixa financeiro.
                </li>
              </ul>

              <button
                onClick={() => navigate('/cadastro')}
                className="px-8 py-4 bg-[#FF0033] text-white font-bold rounded-lg hover:bg-red-700 transition-all shadow-[0_0_20px_rgba(255,0,51,0.3)]"
              >
                TESTAR EXPRESS AUTO TECH GRÁTIS POR 15 DIAS
              </button>
            </div>

            {/* Mockup / Representação do Sistema */}
            <div className="relative rounded-2xl overflow-hidden border border-[#333] shadow-2xl shadow-blue-900/20 bg-[#111] p-6 transform rotate-2 hover:rotate-0 transition-all duration-500">
              <div className="flex gap-2 mb-4 border-b border-[#222] pb-4">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-black rounded border border-[#222]">
                  <div className="font-mono text-white">QWE-1234 — Civic 2019</div>
                  <div className="px-2 py-1 bg-green-900/50 text-green-400 text-xs font-bold rounded">PAGO</div>
                </div>
                <div className="flex justify-between items-center p-4 bg-black rounded border border-[#222]">
                  <div className="font-mono text-white">XYZ-9876 — Gol 2015</div>
                  <div className="px-2 py-1 bg-red-900/50 text-red-400 text-xs font-bold rounded">PENDENTE</div>
                </div>
                <div className="p-4 bg-black rounded border border-[#222] border-dashed text-center text-blue-500 font-bold text-sm">
                  + Importar Leads com IA
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* OUTROS SERVIÇOS EXPRESS AI */}
      <section className="py-24 px-4 bg-[#050505]">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-black mb-4">O que mais fazemos</h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-16">
            Nós não apenas criamos softwares, nós construímos ecossistemas digitais completos para alavancar as suas vendas locais.
          </p>

          <div className="grid md:grid-cols-3 gap-8 text-left">
            <div className="bg-[#111] p-8 rounded-2xl border border-[#222] hover:border-blue-500 transition-colors group">
              <div className="w-14 h-14 bg-blue-900/30 flex items-center justify-center rounded-xl text-3xl mb-6 group-hover:scale-110 transition-transform">
                📍
              </div>
              <h3 className="text-xl font-bold mb-3">Google Meu Negócio</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Dominamos as pesquisas locais. Otimizamos o seu perfil para que a sua empresa seja a primeira a aparecer quando o cliente pesquisar no Google Maps.
              </p>
            </div>

            <div className="bg-[#111] p-8 rounded-2xl border border-[#222] hover:border-purple-500 transition-colors group">
              <div className="w-14 h-14 bg-purple-900/30 flex items-center justify-center rounded-xl text-3xl mb-6 group-hover:scale-110 transition-transform">
                🎯
              </div>
              <h3 className="text-xl font-bold mb-3">Tráfego Pago</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Gestão inteligente de anúncios no Google Ads e Meta Ads. Colocamos a sua marca diretamente à frente de quem já quer comprar.
              </p>
            </div>

            <div className="bg-[#111] p-8 rounded-2xl border border-[#222] hover:border-green-500 transition-colors group">
              <div className="w-14 h-14 bg-green-900/30 flex items-center justify-center rounded-xl text-3xl mb-6 group-hover:scale-110 transition-transform">
                🌐
              </div>
              <h3 className="text-xl font-bold mb-3">Sites e Landing Pages</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Criamos páginas de alta conversão. Design moderno, ultrarrápido e projetado com foco total em transformar visitantes em clientes reais.
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/servicos')}
            className="mt-12 px-8 py-3 border border-blue-500 text-blue-400 font-bold rounded-full hover:bg-blue-900/20 transition-all"
          >
            Ver todos os serviços em detalhes
          </button>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24 px-4 relative overflow-hidden text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505] to-blue-950/20"></div>
        <div className="relative z-10 max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black mb-6">Pronto para digitalizar a sua empresa?</h2>
          <p className="text-gray-300 text-lg mb-10">
            Seja para adotar o Oficina IA ou para escalar as suas vendas com as nossas estratégias de tráfego, a Express AI é a sua parceira tecnológica.
          </p>
          <button
            onClick={() => window.open('https://wa.me/5534991439845?text=Olá,%20quero%20agendar%20uma%20consultoria%20com%20a%20Express%20AI', '_blank')}
            className="px-10 py-5 bg-white text-black font-extrabold text-lg rounded-full hover:bg-gray-200 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] transform hover:scale-105"
          >
            AGENDE UMA CONSULTORIA GRATUITA
          </button>
        </div>
      </section>

      {/* RODAPÉ */}
      <footer className="bg-[#000] border-t border-[#111] py-12 px-4 text-center md:text-left">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4 justify-center md:justify-start">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-xs">
                E
              </div>
              <span className="font-extrabold tracking-wider">EXPRESS AI</span>
            </div>
            <p className="text-gray-500 text-sm max-w-sm mx-auto md:mx-0">
              Transformando negócios físicos com inteligência artificial, automação e visão estratégica digital em Araguari e região.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-white">Soluções</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><button onClick={() => document.getElementById('solucoes').scrollIntoView({ behavior: 'smooth' })} className="hover:text-blue-400">Oficina IA (SaaS)</button></li>
              <li><button onClick={() => navigate('/servicos')} className="hover:text-blue-400">Gestão de Tráfego</button></li>
              <li><button onClick={() => navigate('/servicos')} className="hover:text-blue-400">Google Meu Negócio</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-white">Contato</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>Araguari, MG</li>
              <li>WhatsApp: (34) 99143-9845</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-[#222] mt-12 pt-8 text-center text-gray-600 text-xs">
          © {new Date().getFullYear()} Express AI Automações. Todos os direitos reservados.
        </div>
      </footer>

    </div>
  );
}