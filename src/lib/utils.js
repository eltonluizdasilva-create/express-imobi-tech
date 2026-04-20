// Funções utilitárias globais do sistema

import imageCompression from 'browser-image-compression';

export const COMPRESSAO_FOTO = {
    maxWidth: 1280,
    maxHeight: 1280,
    quality: 0.7,
    fileType: 'image/webp'
};

export async function comprimirFoto(base64OrFile, qualidade = COMPRESSAO_FOTO.quality) {
    try {
        let file;
        
        // Aceita tanto base64 string quanto File/Blob
        if (base64OrFile instanceof File || base64OrFile instanceof Blob) {
            file = base64OrFile;
        } else {
            // Converte base64 para File
            const response = await fetch(base64OrFile);
            const blob = await response.blob();
            file = new File([blob], 'photo.jpg', { type: blob.type || 'image/jpeg' });
        }

        const options = {
            maxWidthOrHeight: COMPRESSAO_FOTO.maxWidth,
            useWebWorker: true,
            fileType: COMPRESSAO_FOTO.fileType,
            initialQuality: qualidade,
            alwaysKeepResolution: true
        };

        const compressedFile = await imageCompression(file, options);
        
        // Convertendo para base64
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(compressedFile);
        });
    } catch (error) {
        console.error('Erro na compressão:', error);
        // Fallback para método original se browser-image-compression falhar
        return comprimirFotoFallback(base64OrFile, qualidade);
    }
}

function comprimirFotoFallback(base64, qualidade = 0.7) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const max = 1280;
            const ratio = Math.min(max / img.width, max / img.height, 1);
            canvas.width = img.width * ratio;
            canvas.height = img.height * ratio;
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/webp', qualidade));
        };
        img.src = base64;
    });
}

/**
 * Remove traços, espaços e especiais - aceita "WWW-0000", "WWW 0000", "WWW0000" como a mesma placa
 */
export const normalizarPlaca = (v) => (v || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

/**
 * Formata valor em moeda brasileira (R$ 1.234,56)
 */
export const formatarMoeda = (valor) => {
    const num = parseFloat(valor) || 0;
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

/**
 * Classifica o status de retorno de uma OS baseado na data de vencimento
 * Retorna: 'vencido' | 'urgente' | 'aviso' | 'agendado' | 'ok'
 */
export const classificarRetorno = (os) => {
    if (os.statusRetorno === 'agendado') return 'agendado';
    if (!os.dataVencimento) return 'ok';
    const hoje = new Date();
    const venc = os.dataVencimento?.toDate ? os.dataVencimento.toDate() : new Date(os.dataVencimento);
    const diffDias = Math.ceil((venc - hoje) / (1000 * 60 * 60 * 24));
    if (diffDias < 0) return 'vencido';
    if (diffDias <= 7) return 'urgente';
    if (diffDias <= 15) return 'aviso';
    return 'ok';
};
