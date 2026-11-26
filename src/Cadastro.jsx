import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { WHATSAPP_SUPORTE } from './lib/contato';

const SEU_WHATSAPP = WHATSAPP_SUPORTE;

export default function Cadastro() {
  const { cadastrarConta } = useAuth();
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
      // Data de trial — 10 dias a partir de hoje
      const agora = new Date();
      const fimTrial = new Date(agora);
      fimTrial.setDate(fimTrial.getDate() + 10);

      await cadastrarConta({
        email: form.email,
        senha: form.senha,
        oficina: {
          nomeOficina: form.nomeOficina,
          cidade: form.cidade,
          telefone: form.telefone.replace(/\D/g, ''),
          email: form.email,
          plano: 'gratis',
          isPro: false,
          nivelInteligencia: 'padrao',
          trialInicio: agora,
          trialFim: fimTrial,
          ativo: true,
          criadoEm: agora,
          modulosAtivos: ['os', 'oleo', 'alinhamento']
        },
        usuario: {
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
            Sua conta começa com             <strong style={{ color: 'white' }}>10 dias de teste completo</strong>: os módulos PRO
            e os Agentes Operacionais ficam liberados nesse período.             Depois, sem assinatura, os módulos PRO pedem o Plano PRO; os módulos exclusivos pedem o PLUS.
            CRM e agenda continuam disponíveis no plano gratuito.
          </p>
          <div style={{ background: '#111', padding: '20px', borderRadius: '10px', marginBottom: '30px', border: '1px solid #333' }}>
            <p style={{ color: '#888', fontSize: '12px', margin: '0 0 5px 0' }}>ACESSE COM</p>
            <p style={{ color: 'white', fontWeight: 'bold', margin: 0 }}>{form.email}</p>
          </div>
          <a href="/admin" style={{ textDecoration: 'none' }}>
            <button style={{ width: '100%', padding: '20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '900', cursor: 'pointer', letterSpacing: '2px' }}>
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
          <div style={{ width: '50px', height: '50px', background: '#10b981', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 15px', boxShadow: '0 0 20px #10b98166' }}>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: 'black' }}>E</span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: '900', margin: '0 0 10px 0' }}>
            EXPRESS<span style={{ color: '#10b981' }}> IA</span>
          </h1>
          <div style={{ background: '#00E67622', border: '1px solid #00E676', padding: '12px 20px', borderRadius: '8px', display: 'inline-block' }}>
            <span style={{ color: '#00E676', fontWeight: 'bold', fontSize: '14px' }}>✅ 10 DIAS GRÁTIS — SEM CARTÃO</span>
          </div>
        </div>

        {/* Formulário */}
        <div style={{ background: '#111', padding: '30px 20px', borderRadius: '15px', border: '1px solid #222' }}>
          <h3 style={{ margin: '0 0 25px 0', color: '#fff', fontSize: '1.1rem' }}>Cadastre sua oficina</h3>

          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="cadastro-oficina" style={{ color: '#888', fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>NOME DA OFICINA / EMPRESA *</label>
            <input id="cadastro-oficina" name="nomeOficina" autoComplete="organization" required value={form.nomeOficina} onChange={e => atualizar('nomeOficina', e.target.value)} placeholder="Ex: Oficina do João" style={{ width: '100%', padding: '14px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '8px', fontSize: '15px' }} />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="cadastro-cidade" style={{ color: '#888', fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>CIDADE (OPCIONAL)</label>
            <input id="cadastro-cidade" name="cidade" autoComplete="address-level2" value={form.cidade} onChange={e => atualizar('cidade', e.target.value)} placeholder="Ex: Uberlândia - MG" style={{ width: '100%', padding: '14px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '8px', fontSize: '15px' }} />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="cadastro-whatsapp" style={{ color: '#888', fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>WHATSAPP *</label>
            <input id="cadastro-whatsapp" name="telefone" type="tel" inputMode="tel" autoComplete="tel" required value={form.telefone} onChange={e => atualizar('telefone', e.target.value)} placeholder="(34) 99999-9999" style={{ width: '100%', padding: '14px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '8px', fontSize: '15px' }} />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="cadastro-email" style={{ color: '#888', fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>E-MAIL *</label>
            <input id="cadastro-email" name="email" type="email" inputMode="email" autoComplete="email" required value={form.email} onChange={e => atualizar('email', e.target.value)} placeholder="email@suaempresa.com.br" style={{ width: '100%', padding: '14px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '8px', fontSize: '15px' }} />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="cadastro-senha" style={{ color: '#888', fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>SENHA *</label>
            <input id="cadastro-senha" name="senha" type="password" autoComplete="new-password" required minLength={6} aria-describedby="cadastro-senha-dica" value={form.senha} onChange={e => atualizar('senha', e.target.value)} placeholder="Mínimo 6 caracteres" style={{ width: '100%', padding: '14px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '8px', fontSize: '15px' }} />
            <span id="cadastro-senha-dica" style={{ display: 'block', marginTop: '6px', color: '#777', fontSize: '11px' }}>Use pelo menos 6 caracteres. Não reutilize a senha do seu e-mail.</span>
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label htmlFor="cadastro-confirmar-senha" style={{ color: '#888', fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>CONFIRMAR SENHA *</label>
            <input id="cadastro-confirmar-senha" name="confirmarSenha" type="password" autoComplete="new-password" required value={form.confirmarSenha} onChange={e => atualizar('confirmarSenha', e.target.value)} placeholder="Repita a senha" onKeyDown={e => e.key === 'Enter' && handleCadastro()} style={{ width: '100%', padding: '14px', background: '#0a0a0a', border: `1px solid ${form.confirmarSenha && form.senha !== form.confirmarSenha ? '#f59e0b' : '#333'}`, color: 'white', borderRadius: '8px', fontSize: '15px' }} />
          </div>

          {erro && (
            <div role="alert" aria-live="assertive" style={{ background: 'rgba(255,0,0,0.1)', border: '1px solid #10b981', padding: '12px', borderRadius: '8px', marginBottom: '20px', color: '#10b981', fontSize: '14px' }}>
              {erro}
            </div>
          )}

          {/* LGPD — coleta mínima + consentimento informado (D-22.04) */}
          <p style={{ color: '#777', fontSize: '11.5px', lineHeight: 1.6, margin: '0 0 16px 0' }}>
            Coletamos apenas o necessário para criar e operar a sua conta: nome da empresa, e-mail, WhatsApp, senha e,
            se você informar, a cidade. Ao continuar, você declara ter lido os{' '}
            <Link to="/termos" style={{ color: '#10b981' }}>Termos de Uso</Link> e a{' '}
            <Link to="/privacidade" style={{ color: '#10b981' }}>Política de Privacidade</Link>. Para pedir acesso,
            correção ou exclusão dos seus dados, escreva para{' '}
            <a href="mailto:contato@expresstech.com.br?subject=LGPD%20-%20Exclus%C3%A3o%20de%20dados" style={{ color: '#10b981' }}>
              contato@expresstech.com.br
            </a>
            .
          </p>

          <button type="button" onClick={handleCadastro} disabled={loading} aria-busy={loading} style={{ width: '100%', padding: '18px', background: loading ? '#333' : '#10b981', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '900', cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '1px', boxShadow: loading ? 'none' : '0 0 20px #10b98166' }}>
            {loading ? 'CRIANDO CONTA...' : 'COMEÇAR 10 DIAS GRÁTIS →'}
          </button>

          <p style={{ textAlign: 'center', color: '#555', fontSize: '12px', marginTop: '20px' }}>
            Já tem conta? <a href="/admin" style={{ color: '#10b981', textDecoration: 'none', fontWeight: 'bold' }}>Entrar</a>
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