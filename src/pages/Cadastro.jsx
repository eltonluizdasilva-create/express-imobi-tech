import { useState } from 'react';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

const SEU_WHATSAPP = '5534991439845';

export default function Cadastro() {
  const [etapa, setEtapa] = useState(1);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [form, setForm] = useState({
    nomeOficina: '',
    cidade: '',
    telefone: '',
    email: '',
    senha: '',
    confirmarSenha: ''
  });

  const atualizar = (campo, valor) => setForm(prev => ({ ...prev, [campo]: valor }));

  const handleCadastro = async () => {
    setErro('');
    if (!form.nomeOficina || !form.email || !form.senha || !form.telefone) {
      return setErro('⚠️ Preencha todos os campos obrigatórios.');
    }
    if (form.senha !== form.confirmarSenha) {
      return setErro('⚠️ As senhas não coincidem.');
    }
    if (form.senha.length < 6) {
      return setErro('⚠️ A senha precisa ter pelo menos 6 caracteres.');
    }

    setLoading(true);
    try {
      const auth = getAuth();

      // Cria o usuário no Firebase Auth
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.senha);
      const uid = cred.user.uid;

      // Data de trial — 10 dias a partir de hoje
      const agora = new Date();
      const fimTrial = new Date(agora);
      fimTrial.setDate(fimTrial.getDate() + 10);

      // Salva a oficina no Firestore (Com Módulos SaaS Liberados)
      await setDoc(doc(db, 'oficinas', uid), {
        uid,
        nomeOficina: form.nomeOficina,
        cidade: form.cidade,
        telefone: form.telefone.replace(/\D/g, ''),
        email: form.email,
        plano: 'trial',
        trialInicio: agora,
        trialFim: fimTrial,
        ativo: true,
        criadoEm: agora,
        modulosAtivos: ['os', 'oleo', 'alinhamento'] // Libera tudo no Trial para encantar o cliente
      });

      // Salva o usuário dono com permissões sincronizadas com o Admin.jsx
      await setDoc(doc(db, 'usuarios', uid), {
        uid,
        oficinaId: uid,
        nome: form.nomeOficina,
        email: form.email,
        papel: 'dono',
        permissoes: {
          dashboard: true,
          os: true,
          oleo: true,
          alinhamento: true,
          retorno: true,
          estoque: true,
          financeiro: true,
          equipe: true,
          oficina: true,
          leads: true,
          config: true
        }
      });

      // Notifica no WhatsApp
      const msg =
        `🆕 *NOVA OFICINA CADASTRADA!*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `🏢 *Oficina:* ${form.nomeOficina}\n` +
        `📍 *Cidade:* ${form.cidade}\n` +
        `📱 *Tel:* ${form.telefone}\n` +
        `📧 *Email:* ${form.email}\n` +
        `📅 *Trial até:* ${fimTrial.toLocaleDateString('pt-BR')}\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `👉 Acesse o painel master para acompanhar.`;
      window.open(`https://wa.me/${SEU_WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank');

      setEtapa(2);
    } catch (e) {
      if (e.code === 'auth/email-already-in-use') {
        setErro('❌ Este e-mail já está cadastrado.');
      } else {
        setErro('❌ Erro ao cadastrar: ' + e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // TELA DE SUCESSO
  if (etapa === 2) {
    return (
      <div style={{ minHeight: '100vh', background: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>🎉</div>
          <h1 style={{ color: '#00E676', fontSize: '2rem', fontWeight: '900', marginBottom: '10px' }}>
            CADASTRO REALIZADO!
          </h1>
          <p style={{ color: '#888', marginBottom: '30px', lineHeight: '1.6' }}>
            Sua oficina tem <strong style={{ color: 'white' }}>10 dias grátis</strong> com acesso completo a todos os módulos de Inteligência Artificial.
          </p>
          <div style={{ background: '#111', padding: '20px', borderRadius: '10px', marginBottom: '30px', border: '1px solid #333' }}>
            <p style={{ color: '#888', fontSize: '12px', margin: '0 0 5px 0' }}>ACESSE COM</p>
            <p style={{ color: 'white', fontWeight: 'bold', margin: 0 }}>{form.email}</p>
          </div>
          <a href="/admin" style={{ textDecoration: 'none' }}>
            <button style={{ width: '100%', padding: '20px', background: '#FF0033', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '900', cursor: 'pointer', letterSpacing: '2px' }}>
              ENTRAR NO SISTEMA →
            </button>
          </a>
        </div>
      </div>
    );
  }

  // FORMULÁRIO DE CADASTRO
  return (
    <div style={{ minHeight: '100vh', background: 'black', color: 'white', padding: '40px 20px', paddingBottom: '60px' }}>
      <div style={{ maxWidth: '450px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ width: '50px', height: '50px', background: '#FF0033', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 15px', boxShadow: '0 0 20px #FF003366' }}>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: 'black' }}>E</span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: '900', margin: '0 0 10px 0' }}>
            EXPRESS<span style={{ color: '#FF0033' }}> IA</span>
          </h1>
          <div style={{ background: '#00E67622', border: '1px solid #00E676', padding: '12px 20px', borderRadius: '8px', display: 'inline-block' }}>
            <span style={{ color: '#00E676', fontWeight: 'bold', fontSize: '14px' }}>✅ 10 DIAS GRÁTIS — SEM CARTÃO</span>
          </div>
        </div>

        {/* Formulário */}
        <div style={{ background: '#111', padding: '30px 20px', borderRadius: '15px', border: '1px solid #222' }}>
          <h3 style={{ margin: '0 0 25px 0', color: '#fff', fontSize: '1.1rem' }}>Cadastre sua oficina</h3>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ color: '#888', fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>NOME DA OFICINA *</label>
            <input value={form.nomeOficina} onChange={e => atualizar('nomeOficina', e.target.value)} placeholder="Ex: Oficina do João" style={{ width: '100%', padding: '14px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '8px', fontSize: '15px' }} />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ color: '#888', fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>CIDADE *</label>
            <input value={form.cidade} onChange={e => atualizar('cidade', e.target.value)} placeholder="Ex: São Paulo - SP" style={{ width: '100%', padding: '14px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '8px', fontSize: '15px' }} />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ color: '#888', fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>WHATSAPP *</label>
            <input type="tel" value={form.telefone} onChange={e => atualizar('telefone', e.target.value)} placeholder="(11) 99999-9999" style={{ width: '100%', padding: '14px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '8px', fontSize: '15px' }} />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ color: '#888', fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>E-MAIL *</label>
            <input type="email" value={form.email} onChange={e => atualizar('email', e.target.value)} placeholder="email@suaoficina.com" style={{ width: '100%', padding: '14px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '8px', fontSize: '15px' }} />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ color: '#888', fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>SENHA *</label>
            <input type="password" value={form.senha} onChange={e => atualizar('senha', e.target.value)} placeholder="Mínimo 6 caracteres" style={{ width: '100%', padding: '14px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '8px', fontSize: '15px' }} />
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{ color: '#888', fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>CONFIRMAR SENHA *</label>
            <input type="password" value={form.confirmarSenha} onChange={e => atualizar('confirmarSenha', e.target.value)} placeholder="Repita a senha" onKeyDown={e => e.key === 'Enter' && handleCadastro()} style={{ width: '100%', padding: '14px', background: '#0a0a0a', border: `1px solid ${form.confirmarSenha && form.senha !== form.confirmarSenha ? '#FF0033' : '#333'}`, color: 'white', borderRadius: '8px', fontSize: '15px' }} />
          </div>

          {erro && (
            <div style={{ background: 'rgba(255,0,0,0.1)', border: '1px solid #FF0033', padding: '12px', borderRadius: '8px', marginBottom: '20px', color: '#ff4444', fontSize: '14px' }}>
              {erro}
            </div>
          )}

          <button onClick={handleCadastro} disabled={loading} style={{ width: '100%', padding: '18px', background: loading ? '#333' : '#FF0033', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '900', cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '1px', boxShadow: loading ? 'none' : '0 0 20px #FF003366' }}>
            {loading ? 'CRIANDO CONTA...' : 'COMEÇAR 10 DIAS GRÁTIS →'}
          </button>

          <p style={{ textAlign: 'center', color: '#555', fontSize: '12px', marginTop: '20px' }}>
            Já tem conta? <a href="/admin" style={{ color: '#FF0033', textDecoration: 'none', fontWeight: 'bold' }}>Entrar</a>
          </p>
        </div>

        {/* O que está incluso (Marketing Atualizado) */}
        <div style={{ marginTop: '30px', padding: '20px', background: '#0a0a0a', borderRadius: '10px', border: '1px solid #222' }}>
          <p style={{ color: '#888', fontSize: '11px', fontWeight: 'bold', marginBottom: '15px' }}>O QUE ESTÁ INCLUSO NO TRIAL:</p>
          {[
            '✅ OS, Financeiro e Estoque integrados',
            '✅ Módulo Óleo (IA lê KM do painel)',
            '✅ Módulo Alinhamento (IA lê laudo 3D)',
            '✅ Disparo automático de retenção (WhatsApp)',
            '✅ Portal do Cliente exclusivo',
            '✅ Auditoria de ferramentas com IA'
          ].map((item, i) => (
            <p key={i} style={{ color: '#ddd', fontSize: '13px', margin: '6px 0' }}>{item}</p>
          ))}
        </div>
      </div>
    </div>
  );
}