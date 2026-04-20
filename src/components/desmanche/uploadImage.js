import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../../lib/firebase';

export const uploadImage = async (file, oficinaId, prefix = 'desmanche') => {
  if (!file) return null;
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
  const path = `oficinas/${oficinaId}/${prefix}/${timestamp}_${safeName}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return url;
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