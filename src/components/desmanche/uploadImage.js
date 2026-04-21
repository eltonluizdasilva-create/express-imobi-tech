import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../../lib/firebase';
import imageCompression from 'browser-image-compression';

/**
 * Reduz fotos de 5MB para ~200KB.
 * Vital para o limite de 0.5GB do seu Plano Gratuito.
 */
const comprimirArquivo = async (file) => {
  const options = {
    maxSizeMB: 0.2,          // Máximo de 200KB
    maxWidthOrHeight: 1080,  // Resolução Full HD
    useWebWorker: true,
    fileType: 'image/jpeg'   // JPEG é mais leve
  };

  try {
    return await imageCompression(file, options);
  } catch (error) {
    console.error("Erro na compressão, enviando original:", error);
    return file;
  }
};

export const uploadImage = async (file, oficinaId, prefix = 'desmanche') => {
  if (!file) return null;

  // Realiza a compactação antes do upload
  const arquivoCompactado = await comprimirArquivo(file);

  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
  const path = `oficinas/${oficinaId}/${prefix}/${timestamp}_${safeName}`;
  const storageRef = ref(storage, path);

  try {
    await uploadBytes(storageRef, arquivoCompactado);
    const url = await getDownloadURL(storageRef);
    return url;
  } catch (error) {
    console.error("Erro no upload do Firebase:", error);
    return null;
  }
};

export const uploadImages = async (files, oficinaId, prefix = 'desmanche') => {
  if (!files || files.length === 0) return [];
  const urls = await Promise.all(
    files.map(file => uploadImage(file, oficinaId, prefix))
  );
  return urls.filter(Boolean);
};

export const deleteImage = async (url) => {
  try {
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
    return true;
  } catch (e) {
    console.warn('Erro ao deletar imagem:', e);
    return false;
  }
};