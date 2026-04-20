// ✅ EXEMPLO DE ESTRUTURA - Adicione esses data-tour aos seus botões

export function MenuAbas() {
    return (
        <div id="menu-navegacao" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* ===== INTELIGÊNCIA ARTIFICIAL ===== */}
            <div className="secao-ia">
                <h3 style={{ color: '#FFE600' }}>🤖 INTELIGÊNCIA ARTIFICIAL</h3>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                        id="tour-botao-ajustes"  {/* ← Importante para Passo 1 */}
                        data-tour="copiloto"      {/* ← Para o tour das abas */}
                        className="botao-aba"
                    >
                        🤖 Copiloto
                    </button>

                    <button
                        data-tour="secretaria"
                        className="botao-aba"
                    >
                        📞 Secretária
                    </button>

                    <button
                        data-tour="administrador"
                        className="botao-aba"
                    >
                        📊 Administrador
                    </button>

                    <button
                        data-tour="contador"
                        className="botao-aba"
                    >
                        💰 Contador
                    </button>
                </div>
            </div>

            {/* ===== GESTÃO ===== */}
            <div className="secao-gestao">
                <h3 style={{ color: '#a855f7' }}>📊 GESTÃO</h3>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                        data-tour="estoque"
                        className="botao-aba"
                    >
                        📦 Estoque
                    </button>

                    <button
                        data-tour="financeiro"
                        className="botao-aba"
                    >
                        💳 Financeiro
                    </button>

                    <button
                        data-tour="precificacao"
                        className="botao-aba"
                    >
                        🎯 Precificação
                    </button>
                </div>
            </div>

            {/* ===== SISTEMA ===== */}
            <div className="secao-sistema">
                <h3 style={{ color: '#38bdf8' }}>⚙️ SISTEMA</h3>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                        data-tour="meuPlano"
                        className="botao-aba"
                    >
                        📅 Meu Plano
                    </button>

                    <button
                        data-tour="equipe"
                        className="botao-aba"
                    >
                        👥 Equipe
                    </button>

                    <button
                        data-tour="ajuda"
                        className="botao-aba"
                    >
                        ❓ Ajuda
                    </button>
                </div>
            </div>

            {/* ===== BOTÃO NOVA O.S. ===== */}
            <button
                id="tour-botao-nova-os"  {/* ← Importante para Passo 2 */}
                style={{
                    padding: '16px 32px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#FF0000',
                    border: '2px solid #FF0000',
                    borderRadius: '8px',
                    background: 'transparent',
                    cursor: 'pointer',
                    marginTop: '20px'
                }}
            >
                📝 NOVA ORDEM DE SERVIÇO
            </button>

        </div>
    );
}

// ===================================
// CSS RECOMENDADO (se não tiver)
// ===================================

const estilos = `
  .botao-aba {
    padding: 10px 16px;
    fontSize: 14px;
    fontWeight: 600;
    color: #fff;
    border: 1.5px solid #10b981;
    borderRadius: 8px;
    background: transparent;
    cursor: pointer;
    transition: all 0.2s;
  }

  .botao-aba:hover {
    background: #10b981;
    transform: scale(1.05);
  }

  .secao-ia h3,
  .secao-gestao h3,
  .secao-sistema h3 {
    marginBottom: 12px;
    fontSize: 14px;
    fontWeight: 600;
    textTransform: uppercase;
    letterSpacing: 0.5px;
  }
`;

// ===================================
// VERIFICAÇÃO DE ELEMENTOS
// ===================================

export function verificarElementosTour() {
    const elementos = [
        { id: 'tour-botao-ajustes', nome: 'Botão Ajustes' },
        { id: 'tour-botao-nova-os', nome: 'Botão Nova O.S.' },
        { id: 'menu-navegacao', nome: 'Menu Navegação' },
        { 'data-tour': 'copiloto', nome: 'Aba Copiloto' },
        { 'data-tour': 'secretaria', nome: 'Aba Secretária' },
        { 'data-tour': 'administrador', nome: 'Aba Administrador' },
        { 'data-tour': 'contador', nome: 'Aba Contador' },
        { 'data-tour': 'estoque', nome: 'Aba Estoque' },
        { 'data-tour': 'financeiro', nome: 'Aba Financeiro' },
        { 'data-tour': 'precificacao', nome: 'Aba Precificação' },
        { 'data-tour': 'meuPlano', nome: 'Aba Meu Plano' },
        { 'data-tour': 'equipe', nome: 'Aba Equipe' },
        { 'data-tour': 'ajuda', nome: 'Aba Ajuda' },
    ];

    console.log('🔍 Verificando elementos do tour...\n');

    elementos.forEach(el => {
        if (el.id) {
            const elemento = document.getElementById(el.id);
            console.log(`${elemento ? '✅' : '❌'} ${el.nome}: #${el.id}`);
        } else {
            const elemento = document.querySelector(`[data-tour="${el['data-tour']}"]`);
            console.log(`${elemento ? '✅' : '❌'} ${el.nome}: data-tour="${el['data-tour']}"`);
        }
    });
}

// Execute no console para verificar:
// verificarElementosTour();
