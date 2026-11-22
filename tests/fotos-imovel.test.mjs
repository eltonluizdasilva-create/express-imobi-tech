import assert from 'node:assert/strict';
import { adicionarFotosImovel, MAX_FOTOS_IMOVEL } from '../src/lib/fotosImovel.js';

const atuais = Array.from({ length: 6 }, (_, index) => `atual-${index + 1}`);
const novas = Array.from({ length: 4 }, (_, index) => `nova-${index + 1}`);

assert.equal(MAX_FOTOS_IMOVEL, 7);
assert.deepEqual(adicionarFotosImovel(atuais, novas), [
  ...atuais,
  'nova-1',
]);
assert.deepEqual(
  adicionarFotosImovel([...atuais, 'atual-7', 'legada-extra'], novas),
  [...atuais, 'atual-7'],
);
assert.deepEqual(adicionarFotosImovel(null, novas), novas.slice(0, MAX_FOTOS_IMOVEL));
assert.deepEqual(adicionarFotosImovel(atuais, null), atuais);

console.log('PASS  limite de 7 fotos e preservação da ordem');
