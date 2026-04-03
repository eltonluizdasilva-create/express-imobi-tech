import React from 'react';

export default function GestaoEquipe({
    abaAtiva, papelLogado, membroAuditando, MAIN_COLOR, GREEN_MONEY,
    novoUsuarioNome, setNovoUsuarioNome, novoUsuarioCargo, setNovoUsuarioCargo,
    novoUsuarioEmail, setNovoUsuarioEmail, novoUsuarioSenha, setNovoUsuarioSenha,
    permissoesNovoUsuario, setPermissoesNovoUsuario, setNovoUsuarioFoto, novoUsuarioFoto,
    handleCriarFuncionario, salvandoUsuario, listaUsuarios, deletarFuncionario,
    enviarAppFuncionario, enviarTrabalhoParaFuncionario, listaCarros,
    setMembroAuditando, salvarPermissoes, fecharAuditoria, fotoMaleta, setFotoMaleta,
    auditarMaleta, resultadoAuditoriaIA
}) {
    if (abaAtiva !== 'equipe') return null;

    return (
        <>
            {/* TELA 1: LISTA E CADASTRO DE FUNCIONÁRIOS */}
            {(papelLogado === 'dono' || papelLogado === 'master') && !membroAuditando && (
                <div>
                    <h2 style={{ color: MAIN_COLOR, marginBottom: '10px' }}>Controle de Equipe & Acessos</h2>
                    <div style={{ background: '#111', padding: '20px', marginBottom: '30px', borderRadius: '10px', border: '1px solid #333' }}>
                        <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#aaa' }}>CADASTRAR NOVO FUNCIONÁRIO</h3>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                            <input type="text" value={novoUsuarioNome} onChange={e => setNovoUsuarioNome(e.target.value)} placeholder="Nome do Funcionário" style={{ flex: 1, minWidth: '150px', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '5px' }} />
                            <select value={novoUsuarioCargo} onChange={(e) => setNovoUsuarioCargo(e.target.value)} style={{ flex: 1, minWidth: '150px', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: '#00E676', fontWeight: 'bold', borderRadius: '5px', cursor: 'pointer' }}>
                                <option value="Mecânico">🔧 Mecânico</option>
                                <option value="Secretária">👩‍💼 Secretária / ADM</option>
                                <option value="Estoque/Peças">📦 Responsável por Estoque / Peças</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
                            <input type="email" value={novoUsuarioEmail} onChange={e => setNovoUsuarioEmail(e.target.value)} placeholder="E-mail de Login do Funcionário" style={{ flex: 1, minWidth: '150px', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '5px' }} />
                            <input type="password" value={novoUsuarioSenha} onChange={e => setNovoUsuarioSenha(e.target.value)} placeholder="Crie uma Senha (minimo 6 letras/números)" style={{ flex: 1, minWidth: '150px', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '5px' }} />
                        </div>
                        <p style={{ fontSize: '12px', color: '#888', marginBottom: '5px', fontWeight: 'bold' }}>QUAIS ABAS ESTE FUNCIONÁRIO PODE VER E EDITAR?</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '8px', marginBottom: '15px' }}>
                            {[{ key: 'os', label: '📝 O.S.' }, { key: 'estoque', label: '📦 Estoque' }, { key: 'financeiro', label: '💰 Financeiro' }, { key: 'equipe', label: '👥 Equipe' }, { key: 'oficina', label: '🏢 Patrimônio' }, { key: 'config', label: '⚙️ Configurações' }].map(item => (
                                <button key={item.key} onClick={() => setPermissoesNovoUsuario(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                                    style={{ padding: '10px', background: permissoesNovoUsuario[item.key] ? GREEN_MONEY : '#222', color: permissoesNovoUsuario[item.key] ? 'black' : '#666', border: 'none', borderRadius: '5px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>
                                    {item.label} {permissoesNovoUsuario[item.key] ? '✅' : ''}
                                </button>
                            ))}
                        </div>
                        <label style={{ display: 'block', padding: '12px', background: '#222', textAlign: 'center', cursor: 'pointer', borderRadius: '5px', marginBottom: '15px', fontSize: '12px' }}>
                            📸 ADICIONAR FOTO DE PERFIL (Opcional)
                            <input type="file" id="fotoEquipeInput" accept="image/*" onChange={(e) => { const r = new FileReader(); r.onload = () => setNovoUsuarioFoto(r.result); r.readAsDataURL(e.target.files[0]); }} style={{ display: 'none' }} />
                        </label>
                        {novoUsuarioFoto && <img src={novoUsuarioFoto} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '50%', margin: '0 auto 15px', display: 'block' }} />}
                        <button onClick={handleCriarFuncionario} disabled={salvandoUsuario} style={{ width: '100%', padding: '15px', background: salvandoUsuario ? '#333' : MAIN_COLOR, color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
                            {salvandoUsuario ? 'SALVANDO...' : '➕ SALVAR FUNCIONÁRIO E GERAR ACESSO'}
                        </button>
                    </div>
                    <h3 style={{ color: MAIN_COLOR, marginBottom: '15px' }}>Funcionários Cadastrados</h3>
                    {listaUsuarios.length === 0 ? (
                        <p style={{ color: '#555', textAlign: 'center', padding: '20px' }}>Nenhum funcionário cadastrado ainda.</p>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
                            {listaUsuarios.map(usuario => (
                                <div key={usuario.id} style={{ background: '#111', padding: '20px', borderRadius: '10px', textAlign: 'center', border: '1px solid #333', position: 'relative' }}>
                                    <button onClick={() => deletarFuncionario(usuario.id)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', color: MAIN_COLOR, border: 'none', fontSize: '12px', cursor: 'pointer' }}>❌</button>
                                    {usuario.foto ? <img src={usuario.foto} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '50%', margin: '0 auto 10px' }} /> : <div style={{ fontSize: '40px', marginBottom: '10px' }}>{usuario.cargo === 'Secretária' ? '👩‍💼' : usuario.cargo === 'Estoque/Peças' ? '📦' : '👨‍🔧'}</div>}
                                    <h4 style={{ margin: '0 0 2px 0', fontSize: '16px' }}>{usuario.nome}</h4>
                                    <p style={{ margin: '0 0 5px 0', color: GREEN_MONEY, fontSize: '11px', fontWeight: 'bold' }}>{usuario.cargo || 'Funcionário'}</p>
                                    <p style={{ margin: '0 0 15px 0', color: '#666', fontSize: '11px' }}>Login: {usuario.email}</p>
                                    <button onClick={() => enviarAppFuncionario(usuario)} style={{ width: '100%', padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px' }}>📲 ENVIAR APP E SENHA (ZAP)</button>
                                    <div style={{ background: '#0a0a0a', padding: '10px', borderRadius: '8px', border: '1px solid #222', marginBottom: '10px' }}>
                                        <p style={{ fontSize: '10px', color: '#888', margin: '0 0 5px 0' }}>DESPACHAR TAREFA (O.S.):</p>
                                        <select onChange={(e) => enviarTrabalhoParaFuncionario(usuario, e.target.value, e)} style={{ width: '100%', padding: '8px', background: '#222', color: 'white', border: 'none', borderRadius: '5px', fontSize: '12px', cursor: 'pointer' }}>
                                            <option value="">Selecione o veiculo...</option>
                                            {listaCarros.map(os => <option key={os.id} value={os.id}>{os.placa} - {os.modelo}</option>)}
                                        </select>
                                    </div>
                                    {usuario.cargo === 'Mecânico' && (
                                        <button onClick={() => setMembroAuditando(usuario)} style={{ width: '100%', padding: '10px', background: '#D4AF37', color: 'black', fontWeight: 'bold', border: 'none', borderRadius: '5px', cursor: 'pointer', marginBottom: '10px' }}>🤖 AUDITAR MALA (IA)</button>
                                    )}
                                    <div style={{ borderTop: '1px solid #333', paddingTop: '10px' }}>
                                        <p style={{ fontSize: '10px', color: '#888', margin: '0 0 8px 0' }}>PERMISSÕES ATIVAS:</p>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', justifyContent: 'center' }}>
                                            {[{ key: 'os', label: 'OS' }, { key: 'estoque', label: 'Estoque' }, { key: 'financeiro', label: 'Finanças' }, { key: 'equipe', label: 'Equipe' }, { key: 'oficina', label: 'Patrimônio' }].map(item => {
                                                const ativo = usuario.permissoes?.[item.key] || false;
                                                return <button key={item.key} onClick={() => salvarPermissoes(usuario.id, { ...usuario.permissoes, [item.key]: !ativo })} style={{ padding: '4px 8px', background: ativo ? GREEN_MONEY : '#222', color: ativo ? 'black' : '#666', border: 'none', borderRadius: '3px', fontWeight: 'bold', fontSize: '10px', cursor: 'pointer' }}>{item.label}</button>;
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
                <div style={{ background: '#111', padding: '20px', borderRadius: '10px', border: `2px solid #D4AF37` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: '0 0 20px 0', color: '#D4AF37' }}>🤖 Auditoria da Mala: {membroAuditando.nome}</h3>
                        <button onClick={fecharAuditoria} style={{ background: 'transparent', color: 'white', border: 'none', fontSize: '20px', cursor: 'pointer' }}>❌</button>
                    </div>
                    <label style={{ display: 'block', padding: '30px', background: '#0a0a0a', border: '2px dashed #D4AF37', textAlign: 'center', cursor: 'pointer', borderRadius: '10px', marginBottom: '15px' }}>
                        <span style={{ fontSize: '30px', display: 'block', marginBottom: '10px' }}>📸</span>
                        FOTOGRAFAR MALA DO MECÂNICO
                        <input type="file" accept="image/*" capture="environment" onChange={(e) => { const r = new FileReader(); r.onload = () => setFotoMaleta(r.result); r.readAsDataURL(e.target.files[0]); }} style={{ display: 'none' }} />
                    </label>
                    {fotoMaleta && (
                        <div style={{ marginBottom: '15px' }}>
                            <img src={fotoMaleta} style={{ width: '100%', maxHeight: '250px', objectFit: 'contain', borderRadius: '10px', border: `2px solid #D4AF37` }} />
                            <button onClick={auditarMaleta} style={{ width: '100%', padding: '15px', background: '#D4AF37', color: 'black', border: 'none', fontWeight: 'bold', cursor: 'pointer', borderRadius: '5px', marginTop: '15px' }}>✨ INICIAR VARREDURA COM INTELIGÊNCIA ARTIFICIAL</button>
                        </div>
                    )}
                    {resultadoAuditoriaIA && (
                        <div style={{ background: '#000', padding: '15px', borderRadius: '5px', border: '1px solid #333', marginTop: '15px' }}>
                            <h4 style={{ color: '#D4AF37', margin: '0 0 10px 0' }}>📋 Relatório de Ferramentas:</h4>
                            <p style={{ color: '#ddd', fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{resultadoAuditoriaIA}</p>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}