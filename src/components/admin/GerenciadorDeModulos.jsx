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

    // ── Switch de renderização ────────────────────────────────────────────────
    switch (abaAtiva) {

        // DASHBOARD
        case 'dashboard':
            return <modulos.Dashboard {...propsDashboard} />;

        // TRIAGEM / NOVA O.S.

        case 'os':
            return (
                <div className="flex flex-col w-full gap-8">
                    {/* A Busca e Formulário no topo */}
                    <modulos.OSModulo {...propsOS} />

                    {/* A Lista de Cards logo abaixo */}
                    <modulos.ListaOS {...propsListaOS} />
                </div>
            );

        // LISTA DE O.S.
        case 'lista':
            return <modulos.ListaOS {...propsListaOS} />;

        // ── MÓDULOS TÉCNICOS ──────────────────────────────────────────────────

        case 'mecanica':
            return <modulos.Mecanica {...propsComuns} osParaEditar={osParaEditar} onCancelar={onCancelar} />;

        case 'hibrido':
            return <modulos.HibridoEV {...propsComuns} osParaEditar={osParaEditar} onCancelar={onCancelar} />;

        case 'eletrico':
            return <modulos.VeiculoEletrico {...propsComuns} osParaEditar={osParaEditar} onCancelar={onCancelar} />;

        case 'moto':
            return <modulos.MotoModulo {...propsComuns} osParaEditar={osParaEditar} onCancelar={onCancelar} />;

        case 'funilaria':
            return <modulos.FunilariaModulo {...propsComuns} osParaEditar={osParaEditar} onCancelar={onCancelar} />;

        case 'amortecedor':
            return <modulos.AmortecedorModulo {...propsComuns} osParaEditar={osParaEditar} onCancelar={onCancelar} />;

        case 'injecao':
            return <modulos.InjecaoModulo {...propsComuns} osParaEditar={osParaEditar} onCancelar={onCancelar} />;

        case 'eletrica':
            return (
                <modulos.EletricaModulo
                    {...propsComuns}
                    osParaEditar={osParaEditar}
                    onCancelar={onCancelar}
                    subAbaEletrica={subAbaEletrica}
                    setSubAbaEletrica={setSubAbaEletrica}
                />
            );

        case 'oleo':
            return <modulos.OleoModulo {...propsComuns} osParaEditar={osParaEditar} onCancelar={onCancelar} />;

        case 'alinhamento':
            return (
                <modulos.AlinhamentoModulo
                    {...propsComuns}
                    osParaEditar={osParaEditar}
                    onCancelar={onCancelar}
                    servicosAlinhamento={servicosAlinhamento}
                    setServicosAlinhamento={setServicosAlinhamento}
                    extrasAlinhamento={extrasAlinhamento}
                    setExtrasAlinhamento={setExtrasAlinhamento}
                    estadoPneus={estadoPneus}
                    setEstadoPneus={setEstadoPneus}
                />
            );

        case 'revisao':
            return <modulos.RevisaoModulo {...propsComuns} osParaEditar={osParaEditar} onCancelar={onCancelar} />;

        case 'ar_condicionado':
            return <modulos.ArCondicionado {...propsComuns} osParaEditar={osParaEditar} onCancelar={onCancelar} />;

        case 'pneus':
            return (
                <modulos.PneusModulo
                    {...propsComuns}
                    osParaEditar={osParaEditar}
                    onCancelar={onCancelar}
                    estadoPneus={estadoPneus}
                    setEstadoPneus={setEstadoPneus}
                />
            );

        case 'escapamento':
            return <modulos.Escapamento {...propsComuns} osParaEditar={osParaEditar} onCancelar={onCancelar} />;

        case 'estetica':
            return <modulos.Estetica {...propsComuns} osParaEditar={osParaEditar} onCancelar={onCancelar} />;

        case 'lavajato':
            return <modulos.LavaJato {...propsComuns} osParaEditar={osParaEditar} onCancelar={onCancelar} />;

        case 'desmanche':
            // Desmanche está em Gestão — precisa passar db explicitamente
            return <modulos.Desmanche {...propsComuns} db={db} />;

        // ── MÓDULOS IA ────────────────────────────────────────────────────────

        case 'copiloto':
            return <modulos.CopilotoModulo {...propsComuns} />;

        case 'secretaria':
            return <modulos.Secretaria {...propsComuns} listaCarros={listaCarros} />;

        case 'administrador':
            return <modulos.Administrador {...propsComuns} />;

        case 'contador':
            return <modulos.Contador {...propsComuns} listaFinanceiro={listaFinanceiro} />;

        // ── GESTÃO ────────────────────────────────────────────────────────────

        case 'financeiro':
            return <modulos.Financeiro {...propsComuns} listaFinanceiro={listaFinanceiro} />;

        case 'estoque':
            return <modulos.Estoque {...propsComuns} listaEstoque={listaEstoque} />;

        case 'clientes':
        case 'leads':
            return <modulos.LeadsPage {...propsComuns} />;

        case 'historico':
            return <modulos.Historico {...propsComuns} listaCarros={listaCarros} />;

        case 'retorno':
            return <modulos.GestaoRetorno {...propsComuns} listaCarros={listaCarros} />;

        case 'patrimonio':
            return <modulos.OficinaPatrimonio {...propsComuns} />;

        case 'fornecedores':
            return <modulos.Fornecedores {...propsComuns} />;

        case 'equipe':
            return <modulos.Equipe {...propsComuns} />;

        case 'marketing':
            return <modulos.MarketingModulo {...propsComuns} listaCarros={listaCarros} />;

        case 'estrategia':
            return <modulos.AbaEstrategia {...propsComuns} />;

        case 'precificacao':
            return <modulos.Precificacao {...propsComuns} />;

        case 'tarefa':
            return <modulos.TarefaTab {...propsComuns} />;

        case 'notafiscal':
            return <modulos.NotaFiscal {...propsComuns} />;

        case 'mercadolivre':
        case 'mercado_livre':
            return <modulos.MercadoLivre buscaMercado={buscaMercado} />;

        // ── SISTEMA ───────────────────────────────────────────────────────────

        case 'ajuda':
            return <modulos.Ajuda {...propsComuns} />;

        case 'config':
            return (
                <modulos.ConfiguracoesPage
                    {...propsComuns}
                    tema={tema}
                    toggleTema={toggleTema}
                    dadosOficina={dadosOficina}
                />
            );

        case 'meuplano':
            return (
                <modulos.ModuloMeuPlano
                    {...propsComuns}
                    dataFimTrial={dataFimTrial}
                    isTrial={isTrial}
                    verificarLicenca={verificarLicenca}
                />
            );

        case 'master':
            return <modulos.MasterPanel {...propsComuns} />;

        default:
            return (
                <div className="flex items-center justify-center p-12 text-zinc-500 text-sm">
                    Módulo <strong className="mx-1 text-zinc-300">"{abaAtiva}"</strong> não encontrado.
                </div>
            );
    }
}
