import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Servicos() {
  const navigate = useNavigate();

  // Faz a página rolar para o topo ao carregar
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
        
        {/* MENU CENTRAL ATUALIZADO COM "SOBRE NÓS" */}
        <div className="hidden md:flex gap-8 text-sm font-semibold text-gray-400">
          <button onClick={() => navigate('/')} className="hover:text-blue-400 transition-colors cursor-pointer">Início</button>
          <button onClick={() => window.scrollTo(0,0)} className="text-blue-400 cursor-default">Serviços</button>
          <button onClick={() => navigate('/sobre')} className="hover:text-blue-400 transition-colors cursor-pointer">Sobre Nós</button>
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

      {/* CABEÇALHO DA PÁGINA */}
      <header className="pt-20 pb-16 text-center px-4 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none"></div>
        <h1 className="text-4xl md:text-6xl font-black mb-6 relative z-10">
          Nossos <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">Serviços</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto relative z-10">
          Soluções de engenharia de automação e marketing digital desenhadas para empresas que querem escalar de forma inteligente e previsível.
        </p>
      </header>

      {/* LISTA DETALHADA DE SERVIÇOS */}
      <section className="py-12 px-4 max-w-5xl mx-auto">
        <div className="flex flex-col gap-12">
          
          {/* Serviço 1: Automação e IA */}
          <div className="bg-[#111] border border-[#222] p-8 md:p-12 rounded-2xl flex flex-col md:flex-row gap-8 items-center hover:border-blue-500/50 transition-colors">
            <div className="md:w-1/3 flex justify-center">
              <div className="w-32 h-32 bg-blue-900/20 rounded-full flex items-center justify-center text-6xl shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                🤖
              </div>
            </div>
            <div className="md:w-2/3">
              <h2 className="text-2xl font-bold mb-4 text-white">Consultoria em Inteligência Artificial e Automação</h2>
              <p className="text-gray-400 leading-relaxed mb-6">
                Implementamos robôs de atendimento, automação de processos internos e criamos fluxos que funcionam 24 horas por dia. O seu negócio não pode depender apenas do esforço humano para crescer. Desenvolvemos sistemas sob medida (como o Oficina IA) para o seu setor.
              </p>
              <ul className="text-sm font-semibold text-blue-400 space-y-2">
                <li>✓ Atendimento Automático de Leads</li>
                <li>✓ Sistemas SaaS Customizados</li>
                <li>✓ Integração de APIs e ChatGPT</li>
              </ul>
            </div>
          </div>

          {/* Serviço 2: Tráfego Pago */}
          <div className="bg-[#111] border border-[#222] p-8 md:p-12 rounded-2xl flex flex-col md:flex-row-reverse gap-8 items-center hover:border-green-500/50 transition-colors">
            <div className="md:w-1/3 flex justify-center">
              <div className="w-32 h-32 bg-green-900/20 rounded-full flex items-center justify-center text-6xl shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                📈
              </div>
            </div>
            <div className="md:w-2/3">
              <h2 className="text-2xl font-bold mb-4 text-white">Gestão de Tráfego Pago (Ads)</h2>
              <p className="text-gray-400 leading-relaxed mb-6">
                Pare de depender de indicações. Nós criamos, otimizamos e gerimos campanhas de anúncios de alta conversão no Google Ads, Facebook Ads e Instagram. Focamos em trazer o cliente que já tem o cartão de crédito na mão, pronto para comprar o seu serviço.
              </p>
              <ul className="text-sm font-semibold text-green-400 space-y-2">
                <li>✓ Campanhas de Pesquisa (Google)</li>
                <li>✓ Anúncios em Redes Sociais (Meta Ads)</li>
                <li>✓ Remarketing e Perseguição Digital</li>
              </ul>
            </div>
          </div>

          {/* Serviço 3: Google Meu Negócio */}
          <div className="bg-[#111] border border-[#222] p-8 md:p-12 rounded-2xl flex flex-col md:flex-row gap-8 items-center hover:border-yellow-500/50 transition-colors">
            <div className="md:w-1/3 flex justify-center">
              <div className="w-32 h-32 bg-yellow-900/20 rounded-full flex items-center justify-center text-6xl shadow-[0_0_30px_rgba(234,179,8,0.2)]">
                📍
              </div>
            </div>
            <div className="md:w-2/3">
              <h2 className="text-2xl font-bold mb-4 text-white">Otimização de Google Meu Negócio</h2>
              <p className="text-gray-400 leading-relaxed mb-6">
                Ser o primeiro a aparecer quando alguém pesquisa "oficina perto de mim" ou "serviço na minha cidade" vale ouro. Nós assumimos o perfil da sua empresa, aplicamos técnicas de SEO local e garantimos que o seu negócio domine o mapa da sua região.
              </p>
              <ul className="text-sm font-semibold text-yellow-400 space-y-2">
                <li>✓ Posicionamento no Top 3 do Google Maps</li>
                <li>✓ Gestão de Avaliações (Reviews)</li>
                <li>✓ Atualização Constante de Perfil</li>
              </ul>
            </div>
          </div>

          {/* Serviço 4: Criação de Sites */}
          <div className="bg-[#111] border border-[#222] p-8 md:p-12 rounded-2xl flex flex-col md:flex-row-reverse gap-8 items-center hover:border-purple-500/50 transition-colors">
            <div className="md:w-1/3 flex justify-center">
              <div className="w-32 h-32 bg-purple-900/20 rounded-full flex items-center justify-center text-6xl shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                💻
              </div>
            </div>
            <div className="md:w-2/3">
              <h2 className="text-2xl font-bold mb-4 text-white">Criação de Sites e Landing Pages</h2>
              <p className="text-gray-400 leading-relaxed mb-6">
                A sua vitrine na internet não pode parecer amadora. Desenvolvemos sites ultrarrápidos, com design de ponta e focados inteiramente em converter o visitante em um lead qualificado (assim como o site que você está navegando agora).
              </p>
              <ul className="text-sm font-semibold text-purple-400 space-y-2">
                <li>✓ Landing Pages para Vendas</li>
                <li>✓ Design Responsivo (Mobile First)</li>
                <li>✓ Alta Velocidade e SEO Otimizado</li>
              </ul>
            </div>
          </div>

        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-20 px-4 text-center mt-12">
        <h2 className="text-3xl font-black mb-6">Pronto para dar o próximo passo?</h2>
        <button 
          onClick={() => window.open('https://wa.me/5534991439845?text=Olá, tenho interesse nos serviços da Express AI', '_blank')}
          className="px-10 py-4 bg-white text-black font-extrabold rounded-full hover:bg-gray-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]"
        >
          SOLICITAR ORÇAMENTO
        </button>
      </section>

      {/* RODAPÉ */}
      <footer className="bg-[#000] border-t border-[#111] py-8 text-center text-gray-600 text-sm mt-10">
        © {new Date().getFullYear()} Express AI Automações - Araguari, MG. Todos os direitos reservados.
      </footer>

    </div>
  );
}