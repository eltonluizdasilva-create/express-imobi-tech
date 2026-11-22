export const MAX_FOTOS_IMOVEL = 7;

export function adicionarFotosImovel(fotosAtuais, fotosNovas) {
  const atuais = Array.isArray(fotosAtuais) ? fotosAtuais.slice(0, MAX_FOTOS_IMOVEL) : [];
  const novas = Array.isArray(fotosNovas) ? fotosNovas : [];
  const vagas = Math.max(0, MAX_FOTOS_IMOVEL - atuais.length);
  return [...atuais, ...novas.slice(0, vagas)];
}
