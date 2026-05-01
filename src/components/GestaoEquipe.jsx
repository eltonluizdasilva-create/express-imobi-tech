import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { Sparkles, CheckCircle, Award } from 'lucide-react';

export default function GestaoEquipe({
    abaAtiva, papelLogado, membroAuditando, MAIN_COLOR = '#a855f7', GREEN_MONEY = '#22c55e',
    novoUsuarioNome, setNovoUsuarioNome, novoUsuarioCargo, setNovoUsuarioCargo,
    novoUsuarioEmail, setNovoUsuarioEmail, novoUsuarioSenha, setNovoUsuarioSenha,
    permissoesNovoUsuario, setPermissoesNovoUsuario, setNovoUsuarioFoto, novoUsuarioFoto,
    handleCriarFuncionario, salvandoUsuario, listaUsuarios, deletarFuncionario,
    enviarAppFuncionario, enviarTrabalhoParaFuncionario, listaCarros,
    setMembroAuditando, salvarPermissoes, fecharAuditoria, fotoMaleta, setFotoMaleta,
    auditarMaleta, resultadoAuditoriaIA,
    oficinaId, listaFinanceiro
}) {
    const [usuariosLocais, setUsuariosLocais] = useState([]);
    const [comissaoPercentual, setComissaoPercentual] = useState('');
    const [salarioFixo, setSalarioFixo] = useState('');
    const [sucessoCriar, setSucessoCriar] = useState(false);

    useEffect(() => {
        if (!oficinaId) return;
        const q = collection(db, 'oficinas', oficinaId, 'equipe');
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setUsuariosLocais(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsubscribe();
    }, [oficinaId]);

    const usersToRender = useMemo(() => {
        const u = Array.isArray(listaUsuarios) ? listaUsuarios : [];
        if (u.length > 0) return u;
        return usuariosLocais;
    }, [listaUsuarios, usuariosLocais]);

    const handleSalvarWrapper = async (e) => {
        if (e) e.preventDefault();
        if (handleCriarFuncionario) {
            await handleCriarFuncionario();
        }
        if (oficinaId) {
            try {
                await addDoc(collection(db, "oficinas", oficinaId, "equipe"), {
                    nome: (novoUsuarioNome || '').trim(),
                    cargo: novoUsuarioCargo || 'Mecânico',
                    email: (novoUsuarioEmail || '').toLowerCase().trim(),
                    senha: novoUsuarioSenha,
                    permissoes: permissoesNovoUsuario || {},
                    foto: novoUsuarioFoto || null,
                    comissao: parseFloat(String(comissaoPercentual).replace(',', '.')) || 0,
                    salarioFixo: parseFloat(String(salarioFixo).replace(',', '.')) || 0,
                    dataCadastro: new Date().toISOString()
                });

                setComissaoPercentual('');
                setSalarioFixo('');
                setSucessoCriar(true);
                setTimeout(() => setSucessoCriar(false), 5000);
            } catch (err) {
                console.error(err);
            }
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

    const obterValesFuncionario = (usuario) => {
        const base = Array.isArray(listaFinanceiro) ? listaFinanceiro : [];
        let total = 0;
        base.forEach(t => {
            if (t.valeFuncionario === true) {
                const desc = (t.descricao || '').toLowerCase();
                const nome = (usuario.nome || '').toLowerCase();
                if (desc.includes(nome)) {
                    total += Number(t.valor) || 0;
                }
            }
        });
        return total;
    };

    if (abaAtiva !== 'equipe') return null;

    return (
        <div style={{ color: '#fff', maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
            {/* SUCCESS BANNER FOR CREATING EMPLOYEE */}
            {sucessoCriar && (
                <div style={{ background: '#064e3b', border: `1px solid ${GREEN_MONEY}`, padding: '15px', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CheckCircle style={{ color: GREEN_MONEY }} size={24} />
                    <span style={{ fontWeight: 'bold', fontSize: '13px' }}>Funcionário adicionado com sucesso ao controle de equipe!</span>
                </div>
            )}

            {/* TELA 1: LISTA E CADASTRO DE FUNCIONÁRIOS */}
            {(papelLogado === 'dono' || papelLogado === 'master') && !membroAuditando && (
                <div>
                    <h2 style={{ color: MAIN_COLOR, marginBottom: '10px', fontSize: '24px', fontWeight: 'bold' }}>Controle de Equipe & Acessos</h2>
                    
                    <div style={{ background: '#111', padding: '24px', marginBottom: '30px', borderRadius: '16px', border: '1px solid #333' }}>
                        <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#aaa', fontWeight: 'bold', letterSpacing: '1px' }}>CADASTRAR NOVO FUNCIONÁRIO</h3>
                        
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
                            <input type="text" value={novoUsuarioNome} onChange={e => setNovoUsuarioNome(e.target.value)} placeholder="Nome do Funcionário" style={{ flex: 1, minWidth: '200px', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '8px', outline: 'none' }} />
                            
                            <select value={novoUsuarioCargo} onChange={(e) => setNovoUsuarioCargo(e.target.value)} style={{ flex: 1, minWidth: '200px', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: GREEN_MONEY, fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer', outline: 'none' }}>
                                <option value="Mecânico">🔧 Mecânico</option>
                                <option value="Secretária">👩‍💼 Secretária / ADM</option>
                                <option value="Estoque/Peças">📦 Responsável por Estoque / Peças</option>
                            </select>
                        </div>

                        {/* CONDITIONAL COMMISSION / SALARY FORM FIELD */}
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
                            {novoUsuarioCargo === 'Secretária' ? (
                                <input
                                    type="text"
                                    value={salarioFixo}
                                    onChange={e => setSalarioFixo(e.target.value)}
                                    placeholder="Salário Fixo / Meta (R$)"
                                    style={{ flex: 1, minWidth: '200px', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '8px', outline: 'none' }}
                                />
                            ) : (
                                <input
                                    type="text"
                                    value={comissaoPercentual}
                                    onChange={e => setComissaoPercentual(e.target.value)}
                                    placeholder="% de Comissão"
                                    style={{ flex: 1, minWidth: '200px', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '8px', outline: 'none' }}
                                />
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
                            <input type="email" value={novoUsuarioEmail} onChange={e => setNovoUsuarioEmail(e.target.value)} placeholder="E-mail de Login do Funcionário" style={{ flex: 1, minWidth: '200px', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '8px', outline: 'none' }} />
                            <input type="password" value={novoUsuarioSenha} onChange={e => setNovoUsuarioSenha(e.target.value)} placeholder="Crie uma Senha (minimo 6 letras/números)" style={{ flex: 1, minWidth: '200px', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '8px', outline: 'none' }} />
                        </div>
                        
                        <p style={{ fontSize: '11px', color: '#888', marginBottom: '8px', fontWeight: 'bold', textTransform: 'uppercase' }}>QUAIS ABAS ESTE FUNCIONÁRIO PODE VER E EDITAR?</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px', marginBottom: '15px' }}>
                            {[{ key: 'os', label: '📝 O.S.' }, { key: 'estoque', label: '📦 Estoque' }, { key: 'financeiro', label: '💰 Financeiro' }, { key: 'equipe', label: '👥 Equipe' }, { key: 'oficina', label: '🏢 Patrimônio' }, { key: 'config', label: '⚙️ Configurações' }].map(item => (
                                <button key={item.key} onClick={() => setPermissoesNovoUsuario(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                                    style={{ padding: '10px', background: permissoesNovoUsuario && permissoesNovoUsuario[item.key] ? GREEN_MONEY : '#222', color: permissoesNovoUsuario && permissoesNovoUsuario[item.key] ? 'black' : '#aaa', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer', transition: 'all 0.2s' }}>
                                    {item.label} {permissoesNovoUsuario && permissoesNovoUsuario[item.key] ? '✅' : ''}
                                </button>
                            ))}
                        </div>
                        
                        <label style={{ display: 'block', padding: '12px', background: '#222', textAlign: 'center', cursor: 'pointer', borderRadius: '8px', marginBottom: '15px', fontSize: '12px' }}>
                            📸 ADICIONAR FOTO DE PERFIL (Opcional)
                            <input type="file" id="fotoEquipeInput" accept="image/*" onChange={(e) => { const r = new FileReader(); r.onload = () => setNovoUsuarioFoto(r.result); r.readAsDataURL(e.target.files[0]); }} style={{ display: 'none' }} />
                        </label>
                        {novoUsuarioFoto && <img src={novoUsuarioFoto} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '50%', margin: '0 auto 15px', display: 'block' }} />}
                        
                        <button onClick={handleSalvarWrapper} disabled={salvandoUsuario} style={{ width: '100%', padding: '15px', background: salvandoUsuario ? '#333' : MAIN_COLOR, color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'black', cursor: 'pointer', fontSize: '13px', textTransform: 'uppercase', tracking: '1px', transition: 'all 0.3s' }}>
                            {salvandoUsuario ? 'SALVANDO...' : '➕ SALVAR FUNCIONÁRIO E GERAR ACESSO'}
                        </button>
                    </div>

                    <h3 style={{ color: MAIN_COLOR, marginBottom: '15px', fontSize: '18px', fontWeight: 'bold' }}>Funcionários Cadastrados</h3>
                    {usersToRender.length === 0 ? (
                        <p style={{ color: '#555', textAlign: 'center', padding: '20px' }}>Nenhum funcionário cadastrado ainda.</p>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                            {usersToRender.map(usuario => (
                                <div key={usuario.id} style={{ background: '#111', padding: '20px', borderRadius: '16px', textAlign: 'center', border: '1px solid #333', position: 'relative' }}>
                                    <button onClick={() => deletarFuncionario && deletarFuncionario(usuario.id)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', color: MAIN_COLOR, border: 'none', fontSize: '14px', cursor: 'pointer' }}>❌</button>
                                    
                                    {usuario.foto ? <img src={usuario.foto} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '50%', margin: '0 auto 10px' }} /> : <div style={{ fontSize: '40px', marginBottom: '10px' }}>{usuario.cargo === 'Secretária' ? '👩‍💼' : usuario.cargo === 'Estoque/Peças' ? '📦' : '👨‍🔧'}</div>}
                                    
                                    <h4 style={{ margin: '0 0 2px 0', fontSize: '16px', fontWeight: 'bold' }}>{usuario.nome}</h4>
                                    <p style={{ margin: '0 0 5px 0', color: GREEN_MONEY, fontSize: '12px', fontWeight: 'bold' }}>{usuario.cargo || 'Funcionário'}</p>
                                    <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '11px' }}>Login: {usuario.email}</p>

                                    {/* VALES SECTION */}
                                    <div style={{ background: '#0a0a0a', border: '1px solid #222', padding: '8px', borderRadius: '10px', marginBottom: '15px' }}>
                                        <p style={{ fontSize: '10px', color: '#aaa', margin: '0 0 3px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total de Vales no Mês:</p>
                                        <p style={{ fontSize: '16px', color: '#ef4444', fontWeight: 'black' }}>
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(obterValesFuncionario(usuario))}
                                        </p>
                                    </div>

                                    <button onClick={() => {
                                        if (enviarAppFuncionario) {
                                            enviarAppFuncionario(usuario);
                                        } else {
                                            const text = `Olá, ${usuario.nome}! Seja bem-vindo(a) à equipe da nossa oficina. Aqui está o seu link de acesso para começar: ${window.location.origin}`;
                                            const url = `https://wa.me/${usuario.telefone || ''}?text=${encodeURIComponent(text)}`;
                                            window.open(url, '_blank');
                                        }
                                    }} style={{ width: '100%', padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px' }}>📲 ENVIAR APP E SENHA (ZAP)</button>
                                    
                                    <div style={{ background: '#0a0a0a', padding: '10px', borderRadius: '8px', border: '1px solid #222', marginBottom: '10px' }}>
                                        <p style={{ fontSize: '10px', color: '#888', margin: '0 0 5px 0' }}>DESPACHAR TAREFA (O.S.):</p>
                                        <select onChange={(e) => enviarTrabalhoParaFuncionario && enviarTrabalhoParaFuncionario(usuario, e.target.value, e)} style={{ width: '100%', padding: '8px', background: '#222', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', outline: 'none' }}>
                                            <option value="">Selecione o veiculo...</option>
                                            {Array.isArray(listaCarros) && listaCarros.map(os => <option key={os.id} value={os.id}>{os.placa} - {os.modelo}</option>)}
                                        </select>
                                    </div>

                                    {usuario.cargo === 'Mecânico' && (
                                        <button onClick={() => setMembroAuditando(usuario)} style={{ width: '100%', padding: '10px', background: '#D4AF37', color: 'black', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer', marginBottom: '10px' }}>🤖 AUDITAR MALA (IA)</button>
                                    )}

                                    <div style={{ borderTop: '1px solid #333', paddingTop: '10px' }}>
                                        <p style={{ fontSize: '10px', color: '#888', margin: '0 0 8px 0' }}>PERMISSÕES ATIVAS:</p>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', justifyContent: 'center' }}>
                                            {[{ key: 'os', label: 'OS' }, { key: 'estoque', label: 'Estoque' }, { key: 'financeiro', label: 'Finanças' }, { key: 'equipe', label: 'Equipe' }, { key: 'oficina', label: 'Patrimônio' }].map(item => {
                                                const ativo = usuario.permissoes?.[item.key] || false;
                                                return <button key={item.key} onClick={() => salvarPermissoes && salvarPermissoes(usuario.id, { ...usuario.permissoes, [item.key]: !ativo })} style={{ padding: '4px 8px', background: ativo ? GREEN_MONEY : '#222', color: ativo ? 'black' : '#666', border: 'none', borderRadius: '4px', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer' }}>{item.label}</button>;
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TELA 2: AUDITORIA DA MALA (IA) */}
            {membroAuditando && (
                <div style={{ background: '#111', padding: '24px', borderRadius: '16px', border: `2px solid #D4AF37` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: '0 0 20px 0', color: '#D4AF37', fontWeight: 'bold', fontSize: '18px' }}>🤖 Auditoria da Mala: {membroAuditando.nome}</h3>
                        <button onClick={fecharAuditoria} style={{ background: 'transparent', color: 'white', border: 'none', fontSize: '24px', cursor: 'pointer' }}>❌</button>
                    </div>

                    <label style={{ display: 'block', padding: '30px', background: '#0a0a0a', border: '2px dashed #D4AF37', textAlign: 'center', cursor: 'pointer', borderRadius: '12px', marginBottom: '15px' }}>
                        <span style={{ fontSize: '30px', display: 'block', marginBottom: '10px' }}>📸</span>
                        FOTOGRAFAR MALA DO MECÂNICO
                        <input type="file" accept="image/*" capture="environment" onChange={(e) => { const r = new FileReader(); r.onload = () => setFotoMaleta(r.result); r.readAsDataURL(e.target.files[0]); }} style={{ display: 'none' }} />
                    </label>

                    {fotoMaleta && (
                        <div style={{ marginBottom: '15px' }}>
                            <img src={fotoMaleta} style={{ width: '100%', maxHeight: '250px', objectFit: 'contain', borderRadius: '12px', border: `2px solid #D4AF37` }} />
                            <button onClick={auditarMaleta} style={{ width: '100%', padding: '15px', background: '#D4AF37', color: 'black', border: 'none', fontWeight: 'bold', cursor: 'pointer', borderRadius: '8px', marginTop: '15px' }}>✨ INICIAR VARREDURA COM INTELIGÊNCIA ARTIFICIAL</button>
                        </div>
                    )}

                    {resultadoAuditoriaIA && (
                        <div style={{ background: '#000', padding: '15px', borderRadius: '8px', border: '1px solid #333', marginTop: '15px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <h4 style={{ color: '#D4AF37', margin: 0, fontWeight: 'bold' }}>📋 Relatório de Ferramentas:</h4>
                                <button onClick={handleSalvarAuditoria} style={{ background: '#222', border: '1px solid #444', color: '#fff', borderRadius: '6px', fontSize: '11px', padding: '6px 12px', cursor: 'pointer', fontWeight: 'bold' }}>💾 Salvar Auditoria no Histórico</button>
                            </div>
                            <p style={{ color: '#ddd', fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{resultadoAuditoriaIA}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}