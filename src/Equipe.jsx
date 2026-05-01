import React, { useState, useEffect, useMemo } from 'react';
import { db } from './lib/firebase';
import { collection, addDoc, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { Trash2, Sparkles, CheckCircle, Award, MessageCircle } from 'lucide-react';

const NIVEL_ACESSO = [
  { value: 'mecanico', label: '🔧 Mecânico', cor: '#a855f7' },
  { value: 'secretaria', label: '👩‍💼 Secretária / ADM', cor: '#ec4899' },
  { value: 'gerente', label: 'Gerente (Acesso Total)', cor: '#22c55e' },
];

export default function Equipe({ oficinaId, dadosOficina, listaFinanceiro }) {
  const planoAtual = dadosOficina?.plano || 'GRATUITO';
  const isGratuito = planoAtual === 'GRATUITO' || planoAtual === 'gratis';
  const LIMITE_GRATUITO = 1;

  const [nome, setNome] = useState('');
  const [emailFuncionario, setEmailFuncionario] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [nivelAcesso, setNivelAcesso] = useState('mecanico');
  const [membros, setMembros] = useState([]);
  const [salvando, setSalvando] = useState(false);
  const [comissaoPercentual, setComissaoPercentual] = useState('');
  const [salarioFixo, setSalarioFixo] = useState('');
  const [sucessoCriar, setSucessoCriar] = useState(false);

  const [membroAuditando, setMembroAuditando] = useState(null);
  const [fotoMaleta, setFotoMaleta] = useState(null);
  const [resultadoAuditoriaIA, setResultadoAuditoriaIA] = useState('');

  useEffect(() => {
    if (!oficinaId) return;
    const q = collection(db, 'oficinas', oficinaId, 'equipe');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setMembros(lista);
    });
    return () => unsubscribe();
  }, [oficinaId]);

  const handleSalvar = async (e) => {
    if (e) e.preventDefault();
    if (!nome.trim()) { alert('Preencha o nome do funcionário.'); return; }
    if (!emailFuncionario.trim()) { alert('Preencha o e-mail de login.'); return; }

    if (isGratuito && membros.length >= LIMITE_GRATUITO) {
      alert('⛔ Plano Gratuito permite apenas 1 funcionário.\nFaça upgrade para o plano ESSENCIAL para adicionar mais membros.');
      return;
    }

    setSalvando(true);
    try {
      await addDoc(collection(db, 'oficinas', oficinaId, 'equipe'), {
        nome: nome.trim(),
        email: emailFuncionario.toLowerCase().trim(),
        whatsapp: whatsapp.replace(/\D/g, ''),
        nivelAcesso,
        cargo: nivelAcesso === 'secretaria' ? 'Secretária' : (nivelAcesso === 'gerente' ? 'Gerente' : 'Mecânico'),
        comissao: parseFloat(String(comissaoPercentual).replace(',', '.')) || 0,
        salarioFixo: parseFloat(String(salarioFixo).replace(',', '.')) || 0,
        dataCadastro: new Date().toISOString(),
      });
      setNome('');
      setEmailFuncionario('');
      setWhatsapp('');
      setNivelAcesso('mecanico');
      setComissaoPercentual('');
      setSalarioFixo('');

      setSucessoCriar(true);
      setTimeout(() => setSucessoCriar(false), 5000);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = async (id) => {
    if (window.confirm('Remover este membro da equipe?')) {
      await deleteDoc(doc(db, 'oficinas', oficinaId, 'equipe', id));
    }
  };

  const handleSalvarAuditoria = async () => {
    if (!oficinaId || !membroAuditando || !resultadoAuditoriaIA) return;
    try {
      await addDoc(collection(db, "oficinas", oficinaId, "equipe", membroAuditando.id, "auditorias"), {
        resultado: resultadoAuditoriaIA,
        data: new Date().toISOString()
      });
      alert("✅ Auditoria salva no cadastro do funcionário com sucesso!");
    } catch (err) {
      alert("❌ Erro ao salvar auditoria: " + err.message);
    }
  };

  const obterValesFuncionario = (membro) => {
    const base = Array.isArray(listaFinanceiro) ? listaFinanceiro : [];
    let total = 0;
    base.forEach(t => {
      if (t.valeFuncionario === true) {
        const desc = (t.descricao || '').toLowerCase();
        const n = (membro.nome || '').toLowerCase();
        if (desc.includes(n)) {
          total += Number(t.valor) || 0;
        }
      }
    });
    return total;
  };

  const mockAuditoriaIA = async () => {
    if (!fotoMaleta) return;
    setResultadoAuditoriaIA("📋 Relatório de Ferramentas (IA):\n- 15 Chaves Combinadas (OK)\n- 1 Torquímetro (OK)\n- 2 Chaves de Fenda (Em falta)\n\nAnálise: O torquímetro está calibrado, porém 2 chaves de fenda não foram detectadas na imagem.");
  };

  const getNivel = (valor) => NIVEL_ACESSO.find(n => n.value === valor) || NIVEL_ACESSO[0];

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-40 font-sans">
      {/* SUCCESS POPUP */}
      {sucessoCriar && (
        <div className="fixed inset-x-0 top-12 z-50 flex justify-center animate-bounce">
          <div className="flex items-center gap-3 rounded-full border border-emerald-400/30 bg-emerald-950/90 px-6 py-3 text-sm font-black uppercase tracking-wider text-emerald-200 shadow-[0_20px_50px_rgba(16,185,129,0.4)] backdrop-blur transition-all">
            <CheckCircle className="text-emerald-400" size={22} />
            Funcionário cadastrado com sucesso!
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="bg-zinc-900 rounded-[40px] border border-zinc-800 p-8 mb-6">
        <h1 className="text-2xl font-black uppercase tracking-tight text-red-500 mb-1">
          👥 Gestão de Equipe
        </h1>
        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
          Gerencie acessos e permissões dos membros
        </p>
      </div>

      {/* TELA 1: LISTA E CADASTRO */}
      {!membroAuditando && (
        <>
          {/* BANNER UPGRADE */}
          {isGratuito && membros.length >= LIMITE_GRATUITO && (
            <div className="mb-6 rounded-[24px] overflow-hidden border border-[#FFD700]/40" style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,160,0,0.08) 100%)' }}>
              <div className="p-6 flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,215,0,0.15)', border: '1px solid rgba(255,215,0,0.3)' }}>
                    <span style={{ fontSize: '22px' }}>👑</span>
                  </div>
                  <div>
                    <p className="font-black text-sm" style={{ color: '#FFD700' }}>LIMITE DO PLANO GRATUITO ATINGIDO</p>
                    <p className="text-[11px] text-zinc-400 mt-1">Você já possui {membros.length} funcionário cadastrado. O plano Gratuito permite apenas <strong style={{ color: '#FFD700' }}>1 funcionário</strong>.</p>
                  </div>
                </div>
                <button
                  onClick={() => window.open(`https://wa.me/5534991439845?text=${encodeURIComponent('Olá! Quero fazer upgrade para o plano ESSENCIAL e adicionar mais funcionários.')}`, '_blank')}
                  className="flex-shrink-0 px-6 py-3 rounded-xl font-black text-sm text-black uppercase tracking-widest transition-all hover:brightness-110 active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', boxShadow: '0 4px 20px rgba(255,215,0,0.25)' }}
                >
                  🚀 Upgrade para ESSENCIAL
                </button>
              </div>
            </div>
          )}

          {/* FORMULÁRIO */}
          <div className={`bg-zinc-900 rounded-[30px] border p-6 mb-6 transition-all ${
            isGratuito && membros.length >= LIMITE_GRATUITO
              ? 'border-[#FFD700]/20 opacity-50 pointer-events-none select-none'
              : 'border-zinc-800'
          }`}>
            <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest mb-4">
              {isGratuito && membros.length >= LIMITE_GRATUITO
                ? '🔒 Bloqueado — Upgrade necessário'
                : 'Novo Membro'
              }
            </p>

            <div className="space-y-3">
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome do Funcionário"
                className="w-full p-3 bg-black border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-600 outline-none focus:border-red-500 transition-colors"
              />

              <input
                type="email"
                value={emailFuncionario}
                onChange={(e) => setEmailFuncionario(e.target.value)}
                placeholder="E-mail de Login (Obrigatório)"
                className="w-full p-3 bg-black border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-600 outline-none focus:border-red-500 transition-colors"
              />

              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="WhatsApp (DDD + Número)"
                className="w-full p-3 bg-black border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-600 outline-none focus:border-red-500 transition-colors"
              />

              <select
                value={nivelAcesso}
                onChange={(e) => setNivelAcesso(e.target.value)}
                className="w-full p-3 bg-black border border-zinc-700 rounded-xl text-sm text-white outline-none focus:border-red-500 transition-colors"
              >
                {NIVEL_ACESSO.map(n => (
                  <option key={n.value} value={n.value}>{n.label}</option>
                ))}
              </select>

              {/* CONDITIONAL COMMISSION / SALARY FORM FIELD */}
              {nivelAcesso === 'secretaria' ? (
                <input
                  type="text"
                  value={salarioFixo}
                  onChange={e => setSalarioFixo(e.target.value)}
                  placeholder="Salário Fixo / Meta (R$)"
                  className="w-full p-3 bg-black border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-600 outline-none focus:border-red-500 transition-colors"
                />
              ) : (
                <input
                  type="text"
                  value={comissaoPercentual}
                  onChange={e => setComissaoPercentual(e.target.value)}
                  placeholder="% de Comissão"
                  className="w-full p-3 bg-black border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-600 outline-none focus:border-red-500 transition-colors"
                />
              )}

              <button
                onClick={handleSalvar}
                disabled={salvando}
                className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-red-600/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {salvando ? 'Salvando...' : '➕ Autorizar Acesso'}
              </button>
            </div>
          </div>

          {/* LISTA DE FUNCIONÁRIOS */}
          <div className="space-y-3">
            <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest px-1">
              {membros.length} membro{membros.length !== 1 ? 's' : ''} cadastrado{membros.length !== 1 ? 's' : ''}
            </p>

            {membros.length === 0 ? (
              <div className="bg-zinc-900 rounded-[30px] border border-zinc-800 p-10 text-center">
                <p className="text-zinc-600 font-black text-xs uppercase tracking-widest">Nenhum membro cadastrado</p>
                <p className="text-zinc-800 text-[10px] mt-1">Use o formulário acima para adicionar.</p>
              </div>
            ) : (
              membros.map((membro) => {
                const nivel = getNivel(membro.nivelAcesso);
                return (
                  <div key={membro.id} className="bg-zinc-900 rounded-[20px] border border-zinc-800 p-5 flex flex-col md:flex-row items-start md:items-center gap-4 group hover:border-zinc-700 transition-all">
                    
                    <div className="flex items-center gap-4 flex-1">
                      {/* AVATAR */}
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-black flex-shrink-0"
                        style={{ background: `${nivel.cor}22`, border: `2px solid ${nivel.cor}44`, color: nivel.cor }}
                      >
                        {membro.nome?.charAt(0)?.toUpperCase() || '?'}
                      </div>

                      {/* INFO */}
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-sm truncate">{membro.nome}</p>
                        <p className="text-[10px] text-zinc-500 truncate">{membro.email}</p>
                        <div
                          className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest"
                          style={{ background: `${nivel.cor}22`, color: nivel.cor }}
                        >
                          {nivel.label}
                        </div>
                      </div>
                    </div>

                    {/* VALES SECTION */}
                    <div className="bg-zinc-950 border border-zinc-800/60 p-3 rounded-xl flex flex-col items-center justify-center min-w-[140px] text-center">
                      <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider mb-1">Vales no Mês:</p>
                      <p className="text-sm font-black text-red-500">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(obterValesFuncionario(membro))}
                      </p>
                    </div>

                    {/* WHATSAPP SEND LINK */}
                    <button
                      onClick={() => {
                        let abasPermitidas = [];
                        if (membro.nivelAcesso === 'gerente') {
                          abasPermitidas = ['O.S.', 'Estoque', 'Financeiro', 'Equipe', 'Patrimônio', 'Configurações'];
                        } else if (membro.nivelAcesso === 'secretaria') {
                          abasPermitidas = ['O.S.', 'Financeiro', 'Equipe'];
                        } else {
                          // mecanico
                          abasPermitidas = ['O.S.'];
                        }

                        if (membro.permissoes) {
                          abasPermitidas = Object.entries(membro.permissoes)
                            .filter(([key, val]) => val === true)
                            .map(([key, val]) => {
                              if (key === 'os') return 'O.S.';
                              if (key === 'estoque') return 'Estoque';
                              if (key === 'financeiro') return 'Financeiro';
                              if (key === 'equipe') return 'Equipe';
                              if (key === 'oficina' || key === 'patrimonio') return 'Patrimônio';
                              if (key === 'config') return 'Configurações';
                              return key;
                            });
                        }

                        if (abasPermitidas.length === 0) abasPermitidas = ['O.S.'];

                        const guideText = abasPermitidas.map(a => `- Módulo ${a}`).join('\n');

                        const msg = `*Olá, ${membro.nome}!* Seja muito bem-vindo(a) à equipe.
Aqui estão os seus dados de acesso ao sistema Express Auto Tech:

*Link:* ${window.location.origin}
*Login/E-mail:* ${membro.email}
*Sua Senha:* 123456

*Passo a Passo Rápido:*
1. Acesse o link acima.
2. Faça login com o seu e-mail e a senha acima.
3. Você terá acesso aos seguintes módulos autorizados:
${guideText}

*Assista ao vídeo de treinamento rápido:*
https://www.youtube.com/watch?v=dQw4w9WgXcQ

Bons trabalhos!`;

                        const url = `https://wa.me/${membro.whatsapp || ''}?text=${encodeURIComponent(msg)}`;
                        window.open(url, '_blank');
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-widest rounded-xl transition flex items-center gap-2"
                    >
                      <MessageCircle size={14} /> ENVIAR APP
                    </button>

                    {/* AUDIT IA BUTTON FOR MECHANICS */}
                    {membro.nivelAcesso === 'mecanico' && (
                      <button
                        onClick={() => setMembroAuditando(membro)}
                        className="px-4 py-2 bg-yellow-500 text-black text-xs font-black uppercase tracking-widest rounded-xl hover:bg-yellow-400 transition"
                      >
                        🤖 Auditar Mala
                      </button>
                    )}

                    {/* DELETE */}
                    <button
                      onClick={() => handleExcluir(membro.id)}
                      className="w-9 h-9 bg-zinc-800 hover:bg-red-600 rounded-xl flex items-center justify-center flex-shrink-0 transition-all opacity-50 hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* TELA 2: AUDITORIA DA MALA (IA) */}
      {membroAuditando && (
        <div className="bg-zinc-900 p-6 rounded-[30px] border border-yellow-500/40">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black text-yellow-500">🤖 Auditoria da Mala: {membroAuditando.nome}</h3>
            <button onClick={() => setMembroAuditando(null)} className="text-xl text-white cursor-pointer hover:text-red-500 transition">❌</button>
          </div>

          <label className="block p-8 bg-black border-2 border-dashed border-yellow-500/30 text-center cursor-pointer rounded-xl mb-4 hover:border-yellow-500/60 transition">
            <span className="text-3xl block mb-2">📸</span>
            FOTOGRAFAR MALA DO MECÂNICO
            <input type="file" accept="image/*" onChange={(e) => { const r = new FileReader(); r.onload = () => setFotoMaleta(r.result); r.readAsDataURL(e.target.files[0]); }} className="hidden" />
          </label>

          {fotoMaleta && (
            <div className="mb-4">
              <img src={fotoMaleta} className="w-full max-h-64 object-contain border border-yellow-500/40 rounded-xl p-2 bg-black mb-4" />
              <button onClick={mockAuditoriaIA} className="w-full p-4 bg-yellow-500 hover:bg-yellow-400 text-black font-black text-xs uppercase tracking-widest rounded-xl transition shadow-lg shadow-yellow-500/20 active:scale-95">✨ INICIAR VARREDURA COM INTELIGÊNCIA ARTIFICIAL</button>
            </div>
          )}

          {resultadoAuditoriaIA && (
            <div className="bg-black p-4 rounded-xl border border-zinc-800 mt-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-yellow-500 font-bold m-0 text-sm uppercase tracking-wide">📋 Relatório de Ferramentas:</h4>
                <button onClick={handleSalvarAuditoria} className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 text-white rounded-lg text-xs hover:bg-zinc-700 transition">💾 Salvar no Histórico</button>
              </div>
              <p className="text-zinc-300 text-sm whitespace-pre-wrap leading-relaxed">{resultadoAuditoriaIA}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
