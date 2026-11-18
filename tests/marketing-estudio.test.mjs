/** Estúdio de Posts — lib pura (prompt, limites, canvas helpers). */
import {
  LIMITES, RODAPE_ILUSTRATIVO, AVISO_CREDITO, FUNDOS, MODOS, CAMPOS_PERMITIDOS,
  sanitizarEntradaEstudio, montarPromptEstudio, interpretarEstudio,
  roteiroEmTexto, trafegoEmTexto, quebrarLinhas,
} from '../src/lib/marketing/estudio.js';
import {
  FORMATOS, medidas, formatarWhatsApp, textoRodape, nomeArquivo, DESENHOS_FUNDO, VERDE,
} from '../src/lib/marketing/geradorArteCanvas.js';

let falhas = 0;
const ok = (n, c, e = '') => { console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${e ? ' — ' + e : ''}`); if (!c) falhas += 1; };

/* ---------- constantes ---------- */
ok('limite headline 45', LIMITES.headline === 45);
ok('limite bullet 28', LIMITES.bullet === 28 && LIMITES.bullets === 3);
ok('4 fundos desenhados', FUNDOS.length === 4 && DESENHOS_FUNDO.length === 4);
ok('2 modos', MODOS.length === 2 && MODOS[0].key === 'imovel' && MODOS[1].key === 'conceitual');
ok('rodapé ilustrativo exato', RODAPE_ILUSTRATIVO === 'Imagem meramente ilustrativa • Condições sujeitas à análise');
ok('aviso de crédito', AVISO_CREDITO.includes('análise do banco'));

/* ---------- LGPD / lista branca ---------- */
const sujo = {
  modo: 'conceitual', tema: 'Minha Casa Minha Vida', bairro: 'Santa Mônica', cidade: 'Uberlândia',
  nome: 'João da Silva', telefone: '34999998888', cpf: '123.456.789-01', email: 'j@x.com',
  vantagens: ['Entrada facilitada', 'Subsídio até 55 mil', '', 42],
};
const limpo = sanitizarEntradaEstudio(sujo);
ok('nome descartado', !('nome' in limpo));
ok('telefone descartado', !('telefone' in limpo));
ok('cpf descartado', !('cpf' in limpo));
ok('email descartado', !('email' in limpo));
ok('só campos permitidos', Object.keys(limpo).every((k) => CAMPOS_PERMITIDOS.includes(k)), Object.keys(limpo).join());
ok('vantagens limitadas a 3', limpo.vantagens.length === 3);
ok('vantagens viram texto', limpo.vantagens.every((v) => typeof v === 'string'));
ok('modo normalizado', sanitizarEntradaEstudio({ modo: 'xyz' }).modo === 'imovel');
ok('tom inválido vira profissional', sanitizarEntradaEstudio({ tom: 'irônico' }).tom === 'profissional');

/* ---------- prompt ---------- */
const promptImovel = montarPromptEstudio({
  modo: 'imovel', titulo: 'Apto 302 Santa Mônica', bairro: 'Santa Mônica', cidade: 'Uberlândia',
  metragem: 92, quartos: 3, valor: 450000, vantagens: ['Varanda gourmet', '2 vagas'],
});
ok('prompt NÃO tem nome', !promptImovel.includes('João'));
ok('prompt NÃO tem telefone', !/34999998888/.test(promptImovel));
ok('prompt traz o imóvel', promptImovel.includes('Apto 302 Santa Mônica'));
ok('prompt traz valor formatado', promptImovel.includes('450.000'));
ok('prompt cita o limite de 45', promptImovel.includes('no máximo 45 caracteres'));
ok('prompt cita 3 bullets de 28', promptImovel.includes('exatamente 3') && promptImovel.includes('no máximo 28'));
ok('prompt exige JSON', promptImovel.includes('JSON válido') && promptImovel.includes('"pacoteTrafegoPago"'));
ok('prompt pede 3 variações', promptImovel.includes('3 variações'));

const promptConceito = montarPromptEstudio({ modo: 'conceitual', tema: 'MCMV', bairro: 'Santa Mônica', subsidio: 'até 55 mil' });
ok('prompt conceitual cita MCMV', promptConceito.includes('MCMV'));
ok('prompt conceitual avisa o rodapé', promptConceito.includes('meramente ilustrativa'));

/* ---------- interpretação + clamp ---------- */
const resposta = '```json\n' + JSON.stringify({
  headlineArte: 'Realize o sonho da casa própria com subsídio de até R$ 55 mil',
  bulletsArte: ['Entrada facilitada e parcelas que cabem no bolso', 'Subsídio de até 55 mil', 'Documentação sem burocracia', 'Quarto item que deve ser cortado'],
  legendaInstagramFacebook: 'Texto da legenda com #hashtags',
  roteiroTikTokReels: { gancho: 'Você sabia que...', apresentacao: 'Mostre a fachada', cta: 'Chame no WhatsApp' },
  pacoteTrafegoPago: [
    { titulo: 'Casa própria', texto: 'Texto A', publico: 'Famílias 25-40', objetivo: 'conversão' },
    { titulo: 'MCMV', texto: 'Texto B', publico: 'Renda até 5 mil', objetivo: 'alcance' },
    { titulo: 'Subsídio', texto: 'Texto C', publico: 'Primeiro imóvel', objetivo: 'engajamento' },
    { titulo: 'Extra', texto: 'Texto D', publico: 'x', objetivo: 'y' },
  ],
}) + '\n```';
const p = interpretarEstudio(resposta);
ok('JSON com cerca parseado', p !== null);
ok('headline clampada em 45', p.headlineArte.length <= 45, `${p.headlineArte.length} chars`);
ok('bullets limitados a 3', p.bulletsArte.length === 3);
ok('cada bullet ≤ 28', p.bulletsArte.every((b) => b.length <= 28), p.bulletsArte.map((b) => b.length).join('/'));
ok('legenda preservada', p.legendaInstagramFacebook.includes('#hashtags'));
ok('roteiro tem 3 partes', Boolean(p.roteiroTikTokReels.gancho && p.roteiroTikTokReels.apresentacao && p.roteiroTikTokReels.cta));
ok('tráfego limitado a 3', p.pacoteTrafegoPago.length === 3);
ok('JSON inválido devolve null', interpretarEstudio('não consegui') === null);
ok('roteiroEmTexto nomeia as 3 partes', ['GANCHO', 'APRESENTAÇÃO', 'CTA'].every((k) => roteiroEmTexto(p.roteiroTikTokReels).includes(k)));
ok('trafegoEmTexto numera variações', trafegoEmTexto(p.pacoteTrafegoPago).includes('VARIAÇÃO 1'));

/* ---------- quebra de linha do canvas ---------- */
const linhas = quebrarLinhas('Apartamento com 3 quartos no Santa Mônica', 18, 2);
ok('quebra respeita maxLinhas', linhas.length <= 2, JSON.stringify(linhas));
ok('quebra não corta palavra ao meio', linhas.every((l) => !l.endsWith(' ')));
ok('quebra adiciona reticências quando corta', linhas[linhas.length - 1].endsWith('…') || linhas.join(' ').length >= 30);
ok('texto curto em 1 linha', quebrarLinhas('Oi', 20, 3).length === 1);

/* ---------- canvas helpers ---------- */
ok('feed 1080x1080', FORMATOS.feed.w === 1080 && FORMATOS.feed.h === 1080);
ok('story 1080x1920', FORMATOS.story.w === 1080 && FORMATOS.story.h === 1920);
ok('medidas do feed', medidas('feed').w === 1080 && medidas('feed').headlineSize > 0);
ok('medidas do story mais altas', medidas('story').h > medidas('feed').h);
ok('whatsapp 13 dígitos formatado', formatarWhatsApp('5534991439845').startsWith('+55 (34)'), formatarWhatsApp('5534991439845'));
ok('whatsapp 11 dígitos formatado', formatarWhatsApp('34991439845') === '(34) 99143-9845', formatarWhatsApp('34991439845'));
ok('rodapé vazio no imóvel real', textoRodape('imovel') === '');
ok('rodapé presente no conceitual', textoRodape('conceitual') === RODAPE_ILUSTRATIVO);
ok('nome do arquivo identifica modo/formato', nomeArquivo('feed', 'conceitual').startsWith('post-conceito-feed-'));
ok('verde da marca', VERDE === '#10b981');

console.log(`\n${falhas === 0 ? 'TODOS OS TESTES PASSARAM' : falhas + ' FALHA(S)'}`);
process.exit(falhas === 0 ? 0 : 1);
