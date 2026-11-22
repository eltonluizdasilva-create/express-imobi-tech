import React, { useState } from 'react';
import { WHATSAPP_SUPORTE } from './lib/contato';
import dadosPlanos from '../shared/planos.json';

const MAIN_COLOR = '#10b981';
const GREEN_MONEY = '#00E676';
const MASTER_COLOR = '#D4AF37';

// D-22.09 — esta lista NÃO tem preço próprio: tudo vem do catálogo
// compartilhado (shared/planos.json). O modal é legado (não está montado em
// nenhuma rota hoje), mas ficava com a tabela antiga de balcão (99/149/249/
// 449/799), o que confundiria qualquer leitura futura.
import {
  chaveCanonica,
  getPlano as getPlanoCatalogo,
  precoNoCiclo,
  rotuloUsuarios,
} from './lib/planos';

const VISUAL = {
  gratis: { cor: '#3b82f6', emoji: '🌱' },
  pro: { cor: GREEN_MONEY, emoji: '⭐' },
  plus: { cor: MASTER_COLOR, emoji: '🚀' },
};

const PLANOS = ['gratis', 'pro', 'plus']
  .map((key) => getPlanoCatalogo(key))
  .filter(Boolean)
  .map((plano) => ({
    key: plano.key,
    nome: String(plano.nome || '').toUpperCase(),
    preco: Number(plano.preco?.mensal || 0),
    precoAnual: Number(plano.preco?.anual ?? plano.preco?.mensal ?? 0),
    precoTexto: precoNoCiclo(plano, 'mensal'),
    cor: (VISUAL[plano.key] || VISUAL.pro).cor,
    emoji: (VISUAL[plano.key] || VISUAL.pro).emoji,
    destaque: plano.key === 'pro',
    // Assentos vêm do catálogo: Grátis/PRO = 1 usuário, PLUS = até 3 inclusos
    // (+R$ 19,90 por usuário extra). Nunca escrever o número na mão aqui.
    membrosLimite: rotuloUsuarios(plano.key),
    modulos: (plano.recursos || []).map((r) => r.texto),
  }));

const PRODUTOS_IA = ['esquadrao_ia', 'tom_autonomo', 'tom_imobiliaria']
  .map((key) => getPlanoCatalogo(key))
  .filter(Boolean);
const ADDON_VIDEO = (dadosPlanos.addons || []).find((addon) => addon.key === 'social_video');

const DESCONTO_ANUAL = (() => {
  const pro = PLANOS.find((p) => p.key === 'pro');
  if (!pro?.preco || !pro?.precoAnual) return 0;
  return Math.max(0, Math.round((1 - pro.precoAnual / pro.preco) * 100));
})();

export default function ModalUpgrade({ aberto, onFechar, planoAtual = 'essencial', whatsapp = WHATSAPP_SUPORTE }) {
    const [ciclo, setCiclo] = useState('mensal');

    if (!aberto) return null;
    const planoAtualTexto = String(planoAtual || '').trim().toLowerCase();
    const planoAtualKey = planoAtualTexto === 'essencial' ? 'gratis' : chaveCanonica(planoAtualTexto);

    const enviarWhatsApp = (plano) => {
        const valor = ciclo === 'anual' ? plano.precoAnual * 12 : plano.preco;
        const msg = encodeURIComponent(
            `🛠️ *SOLICITAÇÃO DE UPGRADE - EXPRESS IMOBI TECH*\n\n` +
            `Olá! Quero mudar meu plano para: *${plano.nome}*\n` +
            `💰 *Valor:* R$ ${valor.toLocaleString('pt-BR')}${ciclo === 'mensal' ? '/mês' : '/ano'}\n` +
            `📋 *Ciclo:* ${ciclo.toUpperCase()}\n\n` +
            `Pode me enviar os dados para pagamento?`
        );
        window.open(`https://wa.me/${whatsapp}?text=${msg}`, '_blank');
    };
    const enviarWhatsAppOferta = (nome, preco) => {
        const msg = encodeURIComponent(
            `Olá! Quero falar sobre *${nome}* do Express Imobi Tech (${preco}). ` +
            'Pode me enviar os detalhes e condições de contratação?',
        );
        window.open(`https://wa.me/${whatsapp}?text=${msg}`, '_blank');
    };

    return (
        <div onClick={onFechar} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 200000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', overflowY: 'auto' }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: '#0d0d0d', border: `1px solid ${MASTER_COLOR}33`, borderRadius: '24px', width: '100%', maxWidth: '1350px', padding: '45px 30px', position: 'relative', boxShadow: '0 10px 100px rgba(0,0,0,0.8)' }}>

                <button onClick={onFechar} style={{ position: 'absolute', top: '20px', right: '25px', background: 'transparent', border: 'none', color: '#444', fontSize: '28px', cursor: 'pointer' }}>✕</button>

                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{ fontSize: '45px', marginBottom: '10px' }}>🚀</div>
                    <h2 style={{ color: 'white', margin: '0 0 8px 0', fontSize: '28px', fontWeight: '900', letterSpacing: '1px' }}>
                        EXPANDA SUA <span style={{ color: MAIN_COLOR }}>Express Imobi Tech</span>
                    </h2>
                    <p style={{ color: '#666', fontSize: '15px', margin: 0 }}>Selecione o plano ideal para a escala atual da sua empresa.</p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '35px' }}>
                    <div style={{ background: '#111', borderRadius: '35px', border: '1px solid #222', display: 'flex', padding: '6px' }}>
                        {['mensal', 'anual'].map((c) => (
                            <button key={c} onClick={() => setCiclo(c)} style={{ padding: '12px 35px', borderRadius: '30px', border: 'none', background: ciclo === c ? GREEN_MONEY : 'transparent', color: ciclo === c ? 'black' : '#888', fontWeight: '900', cursor: 'pointer', fontSize: '14px', position: 'relative', transition: '0.3s' }}>
                                {c.toUpperCase()}
                                {c === 'anual' && DESCONTO_ANUAL > 0 && <span style={{ position: 'absolute', top: '-12px', right: '-10px', background: MAIN_COLOR, color: 'white', fontSize: '9px', padding: '3px 7px', borderRadius: '10px', fontWeight: '900' }}>-{DESCONTO_ANUAL}% OFF</span>}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '18px', marginBottom: '35px' }}>
                    {PLANOS.map((plano) => {
                        const valorExibido = ciclo === 'anual' ? plano.precoAnual : plano.preco;
                        const isAtivo = planoAtualKey === plano.key;
                        return (
                            <div key={plano.key} style={{ background: plano.destaque ? '#050a05' : '#111', border: `2px solid ${isAtivo ? plano.cor : '#1a1a1a'}`, borderRadius: '20px', padding: '25px 18px', display: 'flex', flexDirection: 'column', position: 'relative', transition: '0.3s' }}>
                                {isAtivo && <span style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: '#FFFFFF', color: '#000000', fontSize: '10px', fontWeight: '900', padding: '5px 15px', borderRadius: '15px', whiteSpace: 'nowrap', boxShadow: '0 4px 15px rgba(0,0,0,0.6)', border: '1px solid #ddd', zIndex: 10 }}>SEU PLANO ATUAL</span>}
                                <p style={{ color: plano.cor, fontWeight: '900', fontSize: '13px', margin: '0 0 6px 0', textAlign: 'center' }}>{plano.emoji} {plano.nome}</p>
                                <p style={{ color: 'white', fontWeight: '900', fontSize: '26px', margin: '0 0 12px 0', textAlign: 'center' }}>R$ {valorExibido.toLocaleString('pt-BR')}<span style={{ fontSize: '12px', color: '#555', fontWeight: 'normal' }}>{ciclo === 'mensal' ? '/mês' : '/mês no anual'}</span></p>
                                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '12px', marginBottom: '20px', textAlign: 'center', border: '1px solid #1a1a1a' }}>
                                    <p style={{ color: '#555', fontSize: '9px', fontWeight: 'bold', margin: '0 0 3px 0', textTransform: 'uppercase' }}>Usuários inclusos</p>
                                    <p style={{ color: plano.cor, fontSize: '13px', fontWeight: '900', margin: 0 }}>{plano.membrosLimite}</p>
                                </div>
                                <ul style={{ padding: 0, margin: '0 0 25px 0', listStyle: 'none', flex: 1 }}>
                                    {plano.modulos.map((mod, i) => (
                                        <li key={i} style={{ color: '#888', fontSize: '10px', marginBottom: '8px', display: 'flex', gap: '8px', lineHeight: '1.3' }}><span style={{ color: plano.cor, fontWeight: 'bold' }}>✓</span>{mod}</li>
                                    ))}
                                </ul>
                                <button onClick={() => !isAtivo && enviarWhatsApp(plano)} style={{ width: '100%', padding: '14px', background: isAtivo ? 'transparent' : plano.cor, color: isAtivo ? plano.cor : (plano.key === 'gratis' ? 'white' : 'black'), border: `1px solid ${isAtivo ? plano.cor : 'transparent'}`, borderRadius: '12px', fontWeight: '900', fontSize: '12px', cursor: 'pointer' }}>
                                    {isAtivo ? 'PLANO ATIVO' : 'CONTRATAR UPGRADE'}
                                </button>
                            </div>
                        );
                    })}
                </div>

                <section style={{ marginBottom: '35px' }}>
                    <h3 style={{ color: 'white', textAlign: 'center', fontSize: '17px', margin: '0 0 16px' }}>
                        Produtos de IA e add-on
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '14px' }}>
                        {PRODUTOS_IA.map((produto) => (
                            <article key={produto.key} style={{ background: '#111', border: '1px solid #222', borderRadius: '16px', padding: '18px', display: 'flex', flexDirection: 'column' }}>
                                <h4 style={{ color: 'white', fontSize: '13px', margin: '0 0 8px' }}>{produto.nome}</h4>
                                <p style={{ color: GREEN_MONEY, fontWeight: '900', margin: '0 0 8px' }}>
                                    {precoNoCiclo(produto, 'mensal')}{produto.periodo || '/mês'}
                                </p>
                                <p style={{ color: '#888', fontSize: '11px', lineHeight: 1.5, margin: '0 0 10px' }}>{produto.subtitulo}</p>
                                {produto.setup && <p style={{ color: '#aaa', fontSize: '10px', margin: '0 0 10px' }}>{produto.setup}</p>}
                                <ul style={{ color: '#888', fontSize: '10px', lineHeight: 1.5, paddingLeft: '16px', margin: '0 0 14px', flex: 1 }}>
                                    {(produto.recursos || [])
                                        .filter((recurso) => produto.key !== 'esquadrao_ia' || !/foto/i.test(recurso.texto))
                                        .map((recurso) => <li key={recurso.texto}>{recurso.texto}</li>)}
                                </ul>
                                <button
                                    type="button"
                                    onClick={() => enviarWhatsAppOferta(produto.nome, `${precoNoCiclo(produto, 'mensal')}${produto.periodo || '/mês'}`)}
                                    style={{ width: '100%', padding: '11px', background: '#222', color: 'white', border: '1px solid #333', borderRadius: '10px', fontWeight: '900', fontSize: '10px', cursor: 'pointer' }}
                                >
                                    {produto.cta || 'FALAR SOBRE O PRODUTO'}
                                </button>
                            </article>
                        ))}
                        {ADDON_VIDEO && (
                            <article key={ADDON_VIDEO.key} style={{ background: '#111', border: '1px solid #222', borderRadius: '16px', padding: '18px', display: 'flex', flexDirection: 'column' }}>
                                <h4 style={{ color: 'white', fontSize: '13px', margin: '0 0 8px' }}>{ADDON_VIDEO.nome}</h4>
                                <p style={{ color: '#888', fontSize: '11px', lineHeight: 1.5, margin: '0 0 14px' }}>{ADDON_VIDEO.subtitulo}</p>
                                <div style={{ display: 'grid', gap: '8px', marginTop: 'auto' }}>
                                    {(ADDON_VIDEO.opcoes || []).map((opcao) => (
                                        <button
                                            key={opcao.videos}
                                            type="button"
                                            onClick={() => enviarWhatsAppOferta(`${ADDON_VIDEO.nome} (${opcao.videos} vídeos/mês)`, opcao.label)}
                                            style={{ width: '100%', padding: '11px', background: '#222', color: 'white', border: '1px solid #333', borderRadius: '10px', fontWeight: '900', fontSize: '10px', cursor: 'pointer' }}
                                        >
                                            {opcao.videos} vídeos/mês · {opcao.label}
                                        </button>
                                    ))}
                                </div>
                            </article>
                        )}
                    </div>
                </section>

                <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '12px', padding: '18px', textAlign: 'center' }}>
                    <p style={{ color: '#555', fontSize: '11px', margin: '0 0 12px 0' }}>*Ativação via WhatsApp após confirmação do upgrade.</p>
                    <button onClick={onFechar} style={{ background: 'transparent', color: '#444', border: '1px solid #222', borderRadius: '10px', padding: '10px 25px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Continuar no painel atual</button>
                </div>
            </div>
        </div>
    );
}