/**
 * tests/importacao-xml.test.mjs — feeds XML de portais e fotos (D-23.16)
 * Execução: node --test tests/importacao-xml.test.mjs
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  coletarFotos,
  detectarFormatoPortal,
  localizarBlocos,
  normalizarImoveisDeObjetos,
  parseXmlImoveis,
} from '../src/lib/importacao/xmlImoveis.js';
import { MAX_FOTOS_IMOVEL } from '../src/lib/fotosImovel.js';

const FOTOS = Array.from({ length: 9 }, (_, indice) => `https://cdn.exemplo.com/fotos/${indice + 1}.jpg`);

const VRSYNC = `<?xml version="1.0" encoding="UTF-8"?>
<Carga xmlns="http://www.vrsync.com.br/schema">
  <Imoveis>
    <Imovel>
      <CodigoImovel>AP001</CodigoImovel>
      <TipoImovel>Apartamento</TipoImovel>
      <Finalidade>Venda</Finalidade>
      <Bairro>Santa Mônica</Bairro>
      <Cidade>Uberlândia</Cidade>
      <UF>MG</UF>
      <PrecoVenda>450.000,00</PrecoVenda>
      <Quartos>3</Quartos>
      <Banheiros>2</Banheiros>
      <Vagas>2</Vagas>
      <AreaUtil>78</AreaUtil>
      <Descricao><![CDATA[Apto reformado &amp; pronto para morar]]></Descricao>
      <Fotos>
        ${FOTOS.map((url) => `<Foto>${url}</Foto>`).join('\n        ')}
      </Fotos>
    </Imovel>
    <Imovel>
      <CodigoImovel>CA002</CodigoImovel>
      <TituloImovel>Casa no Centro</TituloImovel>
      <TipoImovel>Casa</TipoImovel>
      <Finalidade>Aluguel</Finalidade>
      <Bairro>Centro</Bairro>
      <Valor>2.500,00</Valor>
      <Fotos>
        <Foto url="https://cdn.exemplo.com/fotos/casa.jpg" />
      </Fotos>
    </Imovel>
  </Imoveis>
</Carga>`;

test('feed VRSync é reconhecido e vira dois imóveis', () => {
  const pacote = parseXmlImoveis(VRSYNC);
  assert.equal(pacote.formato, 'VRSync');
  assert.equal(pacote.imoveis.length, 2);

  const [apartamento, casa] = pacote.imoveis;

  assert.equal(apartamento.codigo, 'AP001');
  assert.equal(apartamento.tipo, 'Apartamento');
  assert.equal(apartamento.finalidade, 'Venda');
  assert.equal(apartamento.bairro, 'Santa Mônica');
  assert.equal(apartamento.uf, 'MG');
  assert.equal(apartamento.valor, 450000);
  assert.equal(apartamento.quartos, 3);
  assert.equal(apartamento.banheiros, 2);
  assert.equal(apartamento.vagas, 2);
  assert.equal(apartamento.area, 78);
  assert.ok(apartamento.descricao.includes('Apto reformado'));

  assert.equal(casa.titulo, 'Casa no Centro');
  assert.equal(casa.finalidade, 'Locação');
  assert.equal(casa.valor, 2500);
  assert.equal(casa.fotos.length, 1);
  assert.ok(casa.fotos[0].endsWith('casa.jpg'));
});

test('no máximo 7 fotos por imóvel e a Foto 1 é a capa', () => {
  const pacote = parseXmlImoveis(VRSYNC);
  const apartamento = pacote.imoveis[0];

  assert.equal(MAX_FOTOS_IMOVEL, 7);
  assert.equal(apartamento.fotos.length, 7);
  assert.equal(apartamento.fotoCapa, apartamento.fotos[0]);
  assert.ok(apartamento.fotoCapa.endsWith('/1.jpg'));
  assert.ok(apartamento.fotos[6].endsWith('/7.jpg'));
  assert.equal(apartamento.fotos.includes(FOTOS[7]), false);
});

test('fotos em atributo, CDATA e URL repetida não duplicam', () => {
  const bloco = `
    <Imovel>
      <Foto url="https://cdn.exemplo.com/a.jpg" />
      <MediaURL><![CDATA[https://cdn.exemplo.com/b.jpg]]></MediaURL>
      <Foto>https://cdn.exemplo.com/a.jpg</Foto>
      <Foto>//cdn.exemplo.com/c.jpg</Foto>
    </Imovel>`;

  assert.deepEqual(coletarFotos(bloco), [
    'https://cdn.exemplo.com/a.jpg',
    'https://cdn.exemplo.com/b.jpg',
    'https://cdn.exemplo.com/c.jpg',
  ]);
});

test('ZAP/VivaReal/OLX são identificados pelo conteúdo do feed', () => {
  assert.equal(detectarFormatoPortal('<Listing><ListingID>1</ListingID></Listing>'), 'ZAP');
  assert.equal(detectarFormatoPortal('<Carga fonte="VivaReal"><Listing/></Carga>'), 'VivaReal');
  assert.equal(detectarFormatoPortal('<Anuncios origem="OLX"><Anuncio/></Anuncios>'), 'OLX');
  assert.equal(detectarFormatoPortal('<qualquer>sem imóvel</qualquer>'), 'Desconhecido');
});

test('XML inválido devolve aviso em vez de quebrar', () => {
  assert.equal(parseXmlImoveis('').imoveis.length, 0);
  assert.equal(parseXmlImoveis('texto solto').imoveis.length, 0);
  const vazio = parseXmlImoveis('<?xml version="1.0"?><Carga><Imoveis/></Carga>');
  assert.equal(vazio.imoveis.length, 0);
  assert.ok(vazio.avisos[0].includes('Nenhum bloco'));
});

test('imóvel sem foto entra com aviso, sem perder valor', () => {
  const pacote = parseXmlImoveis(`
    <Imoveis>
      <Imovel>
        <CodigoImovel>TE001</CodigoImovel>
        <TipoImovel>Terreno</TipoImovel>
        <Bairro>Jardim Europa</Bairro>
        <Preco>120.000,00</Preco>
      </Imovel>
    </Imoveis>`);

  assert.equal(pacote.imoveis.length, 1);
  assert.equal(pacote.imoveis[0].totalFotos, 0);
  assert.equal(pacote.imoveis[0].valor, 120000);
  assert.ok(pacote.imoveis[0].avisos.includes('sem fotos no feed'));
  assert.ok(pacote.avisos.some((aviso) => aviso.includes('sem foto')));
});

test('imóveis devolvidos pela IA usam o mesmo formato', () => {
  const pacote = normalizarImoveisDeObjetos([
    {
      codigo: 'IA-1',
      tipo: 'Casa',
      finalidade: 'Venda',
      bairro: 'Tibery',
      valor: 'R$ 620.000,00',
      quartos: '4',
      area: '210 m²',
      fotos: [{ url: 'https://cdn.exemplo.com/ia1.jpg' }, 'https://cdn.exemplo.com/ia2.jpg'],
    },
  ]);

  assert.equal(pacote.formato, 'PDF/IA');
  assert.equal(pacote.imoveis.length, 1);
  assert.equal(pacote.imoveis[0].valor, 620000);
  assert.equal(pacote.imoveis[0].quartos, 4);
  assert.equal(pacote.imoveis[0].area, 210);
  assert.equal(pacote.imoveis[0].totalFotos, 2);
  assert.equal(pacote.imoveis[0].fotoCapa, 'https://cdn.exemplo.com/ia1.jpg');
});

test('blocos de imóvel são localizados mesmo com raiz diferente', () => {
  const blocos = localizarBlocos('<Property><Title>Casa</Title><Price>100</Price><MediaURL>x.jpg</MediaURL></Property>');
  assert.equal(blocos.length, 1);
});
