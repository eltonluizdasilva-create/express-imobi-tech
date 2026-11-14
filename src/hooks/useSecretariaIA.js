import { useAgentesIA } from './useAgentesIA';

/**
 * useSecretariaIA (Facade / Legado Compatível)
 * Redireciona as chamadas de IA da Secretária para o novo 'Segundo Cérebro' central (useAgentesIA),
 * mantendo a compatibilidade com os componentes visuais antigos sem duplicar código.
 */
export function useSecretariaIA() {
    const { chamarAgente, loadingIA } = useAgentesIA();

    /**
     * Método legado consumido pela interface que redireciona
     * a requisição para a persona 'secretaria' dentro do novo HUB.
     */
    const processarMensagemSecretaria = async (userMessage, historico = []) => {
        return await chamarAgente('secretaria', userMessage, historico);
    };

    return {
        processarMensagemSecretaria,
        processandoIA: loadingIA
    };
}
