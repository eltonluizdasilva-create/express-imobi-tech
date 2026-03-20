import React from 'react';

const AbaEstrategia = () => {
    return (
        <div style={{ padding: '20px', color: '#ddd', maxWidth: '800px', margin: '0 auto' }}>

            {/* CABEÇALHO */}
            <div style={{ background: 'linear-gradient(145deg, #111, #0a0a0a)', border: '1px solid #ffcc00', borderRadius: '15px', padding: '25px', marginBottom: '25px' }}>
                <h2 style={{ color: '#ffcc00', marginTop: 0 }}>🛠️ Oficina IA: O Seu Guia de Alta Performance</h2>
                <p style={{ fontSize: '15px', lineHeight: '1.6' }}>
                    Este guia não é apenas um manual - é a <strong>estratégia para transformar sua oficina na mais confiável da região</strong>.
                    Use o software para proteger seu trabalho e fidelizar seus clientes.
                </p>
            </div>

            {/* SEÇÃO 1: FIDELIZAÇÃO */}
            <div style={{ background: '#111', borderLeft: '4px solid #ff3333', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
                <h3 style={{ color: '#ff3333', marginTop: 0 }}>🔴 O Segredo da Fidelização: Valor de Revenda</h3>
                <p><em>O maior medo de quem tem um carro é perder dinheiro na hora da venda.</em></p>
                <ul style={{ lineHeight: '1.8' }}>
                    <li><strong>O Prontuário de Ouro:</strong> Quando você registra tudo no sistema, entrega ao cliente uma "Certidão de Nascimento" do carro.</li>
                    <li><strong>Ativo do Veículo:</strong> O histórico acompanha o carro, não apenas o dono. Se o cliente vender o veículo, o Prontuário é o maior argumento de venda.</li>
                    <li><strong>Máquina de Novos Clientes:</strong> O novo dono, ao ver o histórico digital impecável, terá interesse em continuar sendo seu cliente.</li>
                    <li><strong>Troca de Titularidade:</strong> Atualize os dados do novo proprietário e gere uma nova senha. O carro continua na base e você ganha um novo cliente.</li>
                </ul>
            </div>

            {/* SEÇÃO 2: SEGURANÇA E PÚBLICO FEMININO */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                <div style={{ background: '#111', border: '1px solid #333', borderRadius: '8px', padding: '20px' }}>
                    <h3 style={{ color: '#00E676', marginTop: 0 }}>🛡️ Segurança na Palma da Mão</h3>
                    <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
                        <li><strong>App do Cliente:</strong> Acompanhamento pelo celular.</li>
                        <li><strong>Acesso Seguro:</strong> Placa + Senha garantem privacidade.</li>
                        <li><strong>Evolução em Tempo Real:</strong> Elimina a ansiedade e as ligações constantes.</li>
                    </ul>
                </div>

                <div style={{ background: '#111', border: '1px solid #333', borderRadius: '8px', padding: '20px' }}>
                    <h3 style={{ color: '#ff3399', marginTop: 0 }}>👩‍🔧 Foco: Público Feminino</h3>
                    <p style={{ fontSize: '13px', color: '#888' }}>Mulheres decidem 80% das compras das famílias.</p>
                    <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
                        <li><strong>Transparência Total:</strong> Fotos e laudos removem o medo de ser enganada.</li>
                        <li><strong>Fidelidade Imbatível:</strong> Segurança e transparência geram clientes para a vida toda.</li>
                    </ul>
                </div>
            </div>

            {/* SEÇÃO 3: FOTOS E DADOS */}
            <div style={{ background: '#111', borderLeft: '4px solid #3b82f6', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
                <h3 style={{ color: '#3b82f6', marginTop: 0 }}>📸 Fotos & 💰 Dados (Sua Proteção)</h3>
                <p><strong>Fotos:</strong> Registre problemas externos na chegada. Tire foto da peça velha ao lado da nova (prova de serviço e seguro jurídico).</p>
                <p><strong>Dados:</strong> Cada pessoa é uma oportunidade. Cadastre sempre! Mesmo só para orçamento, ter o contato é o ativo mais valioso para marketing futuro.</p>
            </div>

            {/* SEÇÃO 4: PASSO A PASSO */}
            <div style={{ textAlign: 'center', marginTop: '40px' }}>
                <h3 style={{ color: '#ffcc00' }}>🚀 Passo a Passo para o Sucesso</h3>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap', margin: '20px 0 40px 0' }}>
                    <div style={{ background: '#222', padding: '15px', borderRadius: '10px', width: '150px' }}>
                        <h1 style={{ margin: 0, color: '#555' }}>1</h1>
                        <strong>Chegada</strong><br /><span style={{ fontSize: '12px' }}>Tire fotos do estado. Proteja-se.</span>
                    </div>
                    <div style={{ background: '#222', padding: '15px', borderRadius: '10px', width: '150px' }}>
                        <h1 style={{ margin: 0, color: '#555' }}>2</h1>
                        <strong>Cadastro</strong><br /><span style={{ fontSize: '12px' }}>Pegue os dados. Dados são lucro.</span>
                    </div>
                    <div style={{ background: '#222', padding: '15px', borderRadius: '10px', width: '150px' }}>
                        <h1 style={{ margin: 0, color: '#555' }}>3</h1>
                        <strong>Acompanhar</strong><br /><span style={{ fontSize: '12px' }}>Gere a senha pro cliente seguir no App.</span>
                    </div>
                    <div style={{ background: '#222', padding: '15px', borderRadius: '10px', width: '150px' }}>
                        <h1 style={{ margin: 0, color: '#555' }}>4</h1>
                        <strong>Prontuário</strong><br /><span style={{ fontSize: '12px' }}>Entregue o histórico seguro.</span>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default AbaEstrategia;