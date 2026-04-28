/**
 * GerenciadorDeModulos.jsx
 *
 * Responsabilidade única: receber `abaAtiva` e renderizar o módulo correto.
 * Toda lógica de estado e autenticação permanece no AdminNovo.jsx.
 *
 * CORREÇÕES APLICADAS:
 * 1. Removido o bloco `propsOS` duplicado e incompleto (não tinha modulosOperacionais nem irParaNovaOS).
 *    Mantido apenas o bloco completo com todas as props necessárias para o OSModulo funcionar.
 * 2. No case 'lista': substituído `propsListaOS` (variável inexistente) por `propsComuns`
 *    acrescido das props específicas que o ListaOS precisa.
 */

import React from 'react';
import { db } from '../../lib/firebase';

export default function GerenciadorDeModulos(props) {
    const {
        abaAtiva,
        setAbaAtiva,
        setupConcluido,
        dadosOSGlobal,
        setDadosOSGlobal,
        modulos,
        // Dados
        listaCarros,
        listaFinanceiro,
        listaEstoque,
        config,
        dadosOficina,
        oficinaId,
        papelLogado,
        permissoesLogado,
        dataFimTrial,
        isTrial,
        // Callbacks de O.S.
        handleSalvarOS,
        salvandoOS,
        salvo,
        onSalvo,
        osEmEdicao,
        osParaEditar,
        onCancelar,
        iniciarEdicao,
        deletarOS,
        enviarWhatsApp,
        abrirWhatsApp,
        abrirMercado,
        buscarDadosPorPlaca,
        handleOSCriada,
        // Formulário triagem
        nomeCliente, setNomeCliente,
        placa, setPlaca,
        telefone, setTelefone,
        modelo, setModelo,
        senhaPortal, setSenhaPortal,
        ouvirCampo, campoOuvindo,
        normalizarPlaca,
        formatarMoeda,
        // Mercado
        buscaMercado,
        // Sub-estados de módulos
        servicosAlinhamento, setServicosAlinhamento,
        extrasAlinhamento, setExtrasAlinhamento,
        estadoPneus, setEstadoPneus,
        subAbaEletrica, setSubAbaEletrica,
        tema, toggleTema,
        modulosOperacionais,
        irParaNovaOS,
        verificarLicenca,
        t = { bg: '#000' },
    } = props;

    // ── Props comuns repassadas a todos os módulos de serviço ─────────────────
    const propsComuns = {
        oficinaId,
        dadosOS: dadosOSGlobal,
        setDadosOS: setDadosOSGlobal,
        config,
        listaCarros,
        papelLogado,
        permissoesLogado,
        dadosOficina,
        abrirWhatsApp,
        formatarMoeda,
        normalizarPlaca,
        t,
        tema,
    };

    // ── Props do módulo de O.S. (triagem) — bloco ÚNICO e completo ────────────
    // CORREÇÃO 1: havia dois blocos `propsOS`. O primeiro não tinha `modulosOperacionais`
    // nem `irParaNovaOS`, fazendo os botões de setor sumirem e os campos ficarem vazios.
    // Mantido apenas este bloco completo.
    const propsOS = {
        ...propsComuns,
        handleSalvarOS,
        salvandoOS,
        salvo,
        onSalvo,
        handleOSCriada,
        // Dados do cliente e veículo (essencial para preencher os campos)
        nomeCliente, setNomeCliente,
        placa, setPlaca,
        telefone, setTelefone,
        modelo, setModelo,
        senhaPortal, setSenhaPortal,
        ouvirCampo, campoOuvindo,
        buscarDadosPorPlaca,
        // Lista de módulos (essencial para aparecer "Serviços" e "Estética")
        modulosOperacionais,
        irParaNovaOS,
        // Limite de O.S. para plano GRATUITO
        listaCarros,
        setAbaAtiva,
    };

    // ── Props do módulo Lista de O.S. ─────────────────────────────────────────
    // CORREÇÃO 2: `propsListaOS` nunca foi declarada no arquivo, causando erro silencioso.
    // Agora usa propsComuns + props específicas que o ListaOS precisa.
    const propsListaOS = {
        ...propsComuns,
        listaCarros,
        iniciarEdicao,
        deletarOS,
        enviarWhatsApp,
        abrirMercado,
        irParaNovaOS,
    };

    // ── Props do Dashboard ────────────────────────────────────────────────────
    const propsDashboard = {
        ...propsComuns,
        listaFinanceiro,
        listaEstoque,
        tema,
        toggleTema,
        setAbaAtiva,
        irParaNovaOS,
        modulosOperacionais,
    };

    // ── Renderização Dinâmica ────────────────────────────────────────────────
    return (
        <main className="flex-1 overflow-y-auto p-4 relative" style={{ background: t.bg, transition: 'background 0.3s' }}>
            {(() => {
                // Renderiza a aba ativa. A lógica de redirecionamento agora fica no AdminNovo.jsx.
                const moduloParaRenderizar = abaAtiva;

                
                // Busca dinâmica no mapa de componentes (modulos é o MODULOS_MAP do AdminNovo)
                const ComponenteDinamico = modulos[moduloParaRenderizar];

                if (ComponenteDinamico) {
                    return (
                        <div className="animate-fade-in">
                            <ComponenteDinamico
                                {...props} // Passa todas as props (incluindo oficinaId, abaAtiva, etc.)
                                // Passa flag para abrir o modal de onboarding automaticamente
                                modoOnboarding={!setupConcluido}
                                // Props agrupadas para compatibilidade legada se necessário
                                {...propsComuns}
                                // Props específicas que alguns componentes esperavam diretamente
                                osParaEditar={osParaEditar}
                                onCancelar={onCancelar}
                                subAbaEletrica={subAbaEletrica}
                                setSubAbaEletrica={setSubAbaEletrica}
                                servicosAlinhamento={servicosAlinhamento}
                                setServicosAlinhamento={setServicosAlinhamento}
                                extrasAlinhamento={extrasAlinhamento}
                                setExtrasAlinhamento={setExtrasAlinhamento}
                                estadoPneus={estadoPneus}
                                setEstadoPneus={setEstadoPneus}
                            />
                        </div>
                    );
                }

                // Fallback de segurança para abas que "somem" ou não registradas
                console.error(`Erro: O módulo "${abaAtiva}" não foi encontrado no MODULOS_MAP.`);
                return (
                    <div className="flex flex-col items-center justify-center h-full border-2 border-dashed border-neutral-900 rounded-3xl p-12">
                        <div className="bg-red-500/10 p-4 rounded-full mb-4">
                            <span className="text-4xl">⚠️</span>
                        </div>
                        <p className="text-red-600 font-black uppercase italic tracking-widest text-center">
                            Módulo [ {abaAtiva} ] não registrado ou em manutenção
                        </p>
                        <p className="text-neutral-500 text-xs mt-2 mb-6">
                            Verifique se o componente está importado e mapeado no AdminNovo.jsx
                        </p>
                        <button
                            onClick={() => setAbaAtiva('dashboard')}
                            className="bg-white text-black px-8 py-3 rounded-full font-black uppercase tracking-tighter hover:scale-105 transition-all shadow-lg"
                        >
                            Retornar à Base
                        </button>
                    </div>
                );
            })()}
        </main>
    );
}

