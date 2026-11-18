/** Portais — XML, token, parser de lead e extrator de e-mail (puro). */
import {
  PORTAIS, ORIGEM_POR_PORTAL, escapeXml, sanitizarTexto, normalizarTelefone, numeroOuZero,
  tipoParaPortal, normalizarImovelParaPortal, imovelPublicavel, gerarXmlImoveis, resumoFeed,
  validarToken, gerarTokenPortal, detectarPortal, interpretarLeadPortal, leadPortalValido,
  leadParaFirestore, extrairLeadDeEmail, urlFeedXml, urlWebhook,
} from '../src/lib/portais.js';

let falhas = 0;
const ok = (n, c, e = '') => { console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${e ? ' — ' + e : ''}`); if (!c) falhas += 1; };

/* ------------------------------- XML ------------------------------------- */
ok('escapa &', escapeXml('Casa & Sobrado') === 'Casa &amp; Sobrado');
ok('escapa < >', escapeXml('<b>x</b>') === '&lt;b&gt;x&lt;/b&gt;');
ok('escapa aspas', escapeXml('a "b" \'c\'') === 'a &quot;b&quot; &apos;c&apos;');
ok('escapa nulo', escapeXml(null) === '');
ok('sanitiza tags do html', sanitizarTexto('<p>Oi</p>') === 'Oi');
ok('sanitiza espaços', sanitizarTexto('  a   b  ') === 'a b');
ok('telefone 11 dígitos ganha 55', normalizarTelefone('(34) 99999-8888') === '5534999998888', normalizarTelefone('(34) 99999-8888'));
ok('telefone curto é rejeitado', normalizarTelefone('1234') === '');
ok('numeroOuZero com moeda', numeroOuZero('R$ 450.000,00') === 450000, String(numeroOuZero('R$ 450.000,00')));
ok('numeroOuZero inválido', numeroOuZero('abc') === 0);

ok('tipo apartamento', tipoParaPortal('Apartamento') === 'Apartamento');
ok('tipo lote vira Terreno', tipoParaPortal('Lote') === 'Terreno');
ok('tipo desconhecido vira Outros', tipoParaPortal('Iate') === 'Outros');

const imovel = {
  id: 'doc1', codigo: 'AP302', titulo: 'Apto 302 <Santa Mônica>', tipo: 'Apartamento',
  finalidade: 'Venda', padraoImovel: 'Médio Padrão', bairro: 'Santa Mônica', cidade: 'Uberlândia',
  uf: 'mg', quartos: 3, banheiros: 2, vagas: 2, metragemTerreno: 92, valor: '450000',
  descricao: 'Varanda & churrasqueira', fotos: ['https://cdn.x/f1.jpg', 'data:image/png;base64,xx', 'https://cdn.x/f2.jpg'],
  status: 'Ativo', publicarPortais: true,
};
const norm = normalizarImovelParaPortal(imovel, {});
ok('normaliza codigo', norm.codigo === 'AP302');
ok('UF em maiúscula', norm.uf === 'MG');
ok('preço numérico', norm.preco === 450000);
ok('fotos só http(s)', norm.fotos.length === 2, norm.fotos.join(', '));
ok('descarta data URL', !norm.fotos.some((f) => f.startsWith('data:')));
ok('tipoOferta venda = 1', norm.tipoOferta === '1');
const aluguel = normalizarImovelParaPortal({ ...imovel, finalidade: 'Aluguel' }, {});
ok('tipoOferta aluguel = 2', aluguel.tipoOferta === '2' && aluguel.ehAluguel);

ok('publicável: ativo', imovelPublicavel(imovel));
ok('não publicável: inativo', !imovelPublicavel({ ...imovel, status: 'Inativo' }));
ok('não publicável: flag false', !imovelPublicavel({ ...imovel, publicarPortais: false }));
ok('não publicável: sem valor', !imovelPublicavel({ ...imovel, valor: 0 }));
ok('não publicável: sem título', !imovelPublicavel({ ...imovel, titulo: '' }));

const xml = gerarXmlImoveis(
  [imovel, { ...imovel, codigo: 'CASA1', titulo: 'Casa', status: 'Inativo' }],
  { oficina: { nomeOficina: 'Imobiliária Teste', creci: 'MG 12345' }, dataAtualizacao: '2026-11-18' },
);
ok('XML tem declaração', xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
ok('XML abre e fecha Carga', xml.includes('<Carga>') && xml.trimEnd().endsWith('</Carga>'));
ok('XML traz a imobiliária', xml.includes('<NomeImobiliaria>Imobiliária Teste</NomeImobiliaria>'));
ok('XML traz CRECI', xml.includes('<CRECI>MG 12345</CRECI>'));
ok('XML só com publicáveis', xml.includes('AP302') && !xml.includes('CASA1'), String((xml.match(/<Imovel>/g) || []).length));
ok('XML total correto', xml.includes('<Imoveis total="1">'), xml.match(/<Imoveis total="\d+">/)?.[0]);
// sanitizarTexto remove tags do título (<Santa Mônica> some), então o teste de
// escape usa um caractere que NÃO é tag: o "&" do título.
// O feed não tem tag de título: quando não há descrição, o título vira descrição.
const semDescricao = { ...imovel, titulo: 'Casa & Sobrado', descricao: '' };
const xmlComAmpersand = gerarXmlImoveis([semDescricao], { oficina: { nomeOficina: 'X' } });
ok('XML escapa & na descrição', xmlComAmpersand.includes('<Descricao>Casa &amp; Sobrado</Descricao>'),
   xmlComAmpersand.match(/<Descricao>[^<]*<\/Descricao>/)?.[0] || 'não achou');
ok('XML não deixa tag crua do usuário', !xml.includes('<Santa Mônica>'));
ok('XML escapa descrição', xml.includes('Varanda &amp; churrasqueira'));
ok('XML traz preço', xml.includes('<PrecoVenda>450000.00</PrecoVenda>'));
ok('XML traz quartos', xml.includes('<QtdQuartos>3</QtdQuartos>'));
ok('XML traz fotos', (xml.match(/<FotoURL>/g) || []).length === 2);
ok('XML marca foto principal', xml.includes('<FotoPrincipal>1</FotoPrincipal>'));
ok('XML traz DataAtualizacao', xml.includes('<DataAtualizacao>2026-11-18</DataAtualizacao>'));
ok('XML não tem tags vazias de preço de aluguel', !xml.includes('<PrecoAluguel>'));

const vazio = gerarXmlImoveis([], { oficina: { nomeOficina: 'X' } });
ok('XML vazio continua válido', vazio.includes('<Imoveis total="0">') && vazio.trimEnd().endsWith('</Carga>'));

const resumo = resumoFeed([imovel, { status: 'Inativo' }, { publicarPortais: false }]);
ok('resumoFeed conta', resumo.total === 3 && resumo.publicaveis === 1 && resumo.ocultos === 2, JSON.stringify(resumo));

/* ------------------------------- token ----------------------------------- */
ok('token válido', validarToken('abc123', 'abc123'));
ok('token diferente', !validarToken('abc124', 'abc123'));
ok('token vazio', !validarToken('', '') && !validarToken('a', ''));
ok('token com tamanho diferente', !validarToken('abc', 'abcd'));
const t1 = gerarTokenPortal(() => 0.5);
ok('token gerado tem 32 hex', /^[0-9a-f]{32}$/.test(t1), t1);
ok('tokens aleatórios diferentes', gerarTokenPortal() !== gerarTokenPortal());

/* ------------------------------- leads ----------------------------------- */
ok('detecta ZAP pelo body', detectarPortal({ body: { source: 'zap' } }) === 'zap');
ok('detecta OLX pelo texto', detectarPortal({ body: { texto: 'lead vindo da OLX' } }) === 'olx');
ok('detecta implícito no corpo', detectarPortal({ body: { description: 'Contato vivareal' } }) === 'zap');
ok('fallback genérico', detectarPortal({ body: { nome: 'x' } }) === 'generico');

const zap = interpretarLeadPortal({
  name: 'João Souza', phone: '(34) 99999-8888', email: 'JOAO@X.COM',
  message: '<b>Quero visitar</b>', propertyCode: 'AP302',
}, { portal: 'zap' });
ok('ZAP: nome', zap.nome === 'João Souza');
ok('ZAP: telefone normalizado', zap.telefone === '5534999998888');
ok('ZAP: email minúsculo', zap.email === 'joao@x.com');
ok('ZAP: mensagem sem tags', zap.mensagem === 'Quero visitar');
ok('ZAP: código do imóvel', zap.imovelCodigo === 'AP302');
ok('ZAP: origem', zap.origem === 'Portal ZAP/VivaReal');

const olx = interpretarLeadPortal({ lead: { nome: 'Maria', celular: '34988887777', mensagem: 'oi' } }, { portal: 'olx' });
ok('OLX: payload aninhado', olx.nome === 'Maria' && olx.telefone === '5534988887777', olx.telefone);
ok('OLX: origem', olx.origem === 'Portal OLX');

const chaves = interpretarLeadPortal({ nome: 'Ana', telefone: '34977776666', codigoImovel: 'C-99' }, { portal: 'chavesnamao' });
ok('Chaves na Mão: campos em PT', chaves.nome === 'Ana' && chaves.imovelCodigo === 'C-99');
ok('Chaves na Mão: origem', chaves.origem === 'Portal Chaves na Mão');

ok('lead válido com telefone', leadPortalValido(zap));
ok('lead inválido sem contato', !leadPortalValido({ nome: 'X', telefone: '', email: '' }));
ok('lead inválido sem nome', !leadPortalValido({ nome: '', telefone: '5534999998888' }));

const fs = leadParaFirestore(zap, { imovelId: 'doc1' });
ok('Firestore: estágio Novo Lead', fs.estagio === 'Novo Lead');
ok('Firestore: origem do portal', fs.origem === 'Portal ZAP/VivaReal');
ok('Firestore: imóvel vinculado', fs.imovelId === 'doc1');
ok('Firestore: observação com código', fs.observacoes.includes('AP302'));
ok('Firestore: campos do CRM', ['nome', 'telefone', 'interesse', 'bairro', 'orcamento'].every((k) => k in fs));

/* ---------------------------- extrator e-mail ---------------------------- */
const email = extrairLeadDeEmail(`
Novo contato do portal
Nome: Maria Souza
Telefone: (34) 99999-8888
E-mail: maria@exemplo.com
Código do imóvel: AP302
Mensagem: Gostaria de agendar uma visita.
`);
ok('e-mail: nome', email.nome === 'Maria Souza', email.nome);
ok('e-mail: telefone', email.telefone === '5534999998888', email.telefone);
ok('e-mail: email', email.email === 'maria@exemplo.com');
ok('e-mail: código', email.imovelCodigo === 'AP302', email.imovelCodigo);
ok('e-mail: válido', email.valido);

const semRotulo = extrairLeadDeEmail('Fulano de Tal quer falar, telefone 34 98888-7777, sobre o imóvel REF-1234');
ok('e-mail sem rótulo: acha telefone', semRotulo.telefone === '5534988887777', semRotulo.telefone);
ok('e-mail sem rótulo: acha referência', semRotulo.imovelCodigo.includes('REF') || semRotulo.imovelCodigo.includes('1234'), semRotulo.imovelCodigo);
ok('e-mail vazio não é válido', !extrairLeadDeEmail('').valido);

/* --------------------------------- URLs ---------------------------------- */
ok('url do feed', urlFeedXml('https://x.vercel.app/', 'abc123') === 'https://x.vercel.app/api/xml-portais?oficinaId=abc123');
ok('url do webhook', urlWebhook('https://x.vercel.app', 'abc123', 'tok') === 'https://x.vercel.app/api/webhook-portais?oficinaId=abc123&token=tok');
ok('urls codificam caracteres', urlFeedXml('https://x', 'a b').includes('a%20b'));
ok('5 portais + genérico mapeados', PORTAIS.length >= 5 && Boolean(ORIGEM_POR_PORTAL.olx) && Boolean(ORIGEM_POR_PORTAL.chavesnamao));

console.log(`\n${falhas === 0 ? 'TODOS OS TESTES PASSARAM' : falhas + ' FALHA(S)'}`);
process.exit(falhas === 0 ? 0 : 1);
