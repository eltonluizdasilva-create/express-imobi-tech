import HeroAba from './components/admin/HeroAba';
import SeletorUF from './components/ui/SeletorUF';
import { Settings } from 'lucide-react';
/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { getAuth, deleteUser } from 'firebase/auth';
import { db } from './lib/firebase';

const ESTADO_INICIAL = {
  nome: '',
  creci: '',
  endereco: '',
  telefone: '',
  logoUrl: '',
  pixKey: '',
};

/* Classes do painel: o tema claro (src/index.css) converte bg-[#020408],
   bg-slate-950 e text-white, então esta tela acompanha o temaClaro sem
   precisar de cor inline. */
const labelCls = 'mb-1.5 block text-[11px] font-bold text-slate-400';
const inputCls =
  'w-full rounded-[10px] border border-slate-800 bg-slate-950 p-[15px] text-sm text-white placeholder-slate-500 focus:border-[#10b981] focus:outline-none';

import IntegracaoPortais from './components/IntegracaoPortais';

export default function Configuracoes({ oficinaId, onSalvo }) {
  const [config, setConfig] = useState(ESTADO_INICIAL);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  useEffect(() => {
    async function carregar() {
      if (!oficinaId) return;
      const snap = await getDoc(doc(db, 'oficinas', oficinaId, 'configuracoes', 'geral'));
      if (snap.exists()) {
        setConfig((prev) => ({ ...prev, ...snap.data() }));
      }
    }

    carregar();
  }, [oficinaId]);

  const atualizarCampo = (campo, valor) => {
    setConfig((prev) => ({ ...prev, [campo]: valor }));
  };

  const salvar = async () => {
    if (!oficinaId) return;

    setSalvando(true);
    try {
      await setDoc(doc(db, 'oficinas', oficinaId, 'configuracoes', 'geral'), config, { merge: true });
      if (onSalvo) await onSalvo();
      alert('Configurações da imobiliária salvas com sucesso!');
    } catch (error) {
      alert('Erro ao salvar configurações: ' + error.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluirConta = async () => {
    if (!oficinaId) return;

    const confirmacao1 = window.confirm(
      "🚨 ATENÇÃO MÁXIMA! 🚨\n\nVocê está prestes a excluir permanentemente a sua imobiliária e TODOS os seus dados vinculados.\nEsta ação é irreversível nos termos da LGPD.\n\nTem certeza absoluta que deseja prosseguir?"
    );
    if (!confirmacao1) return;

    const confirmacao2 = window.prompt(
      'Para confirmar a exclusão definitiva em cascata, digite exatamente a palavra "EXCLUIR" em letras maiúsculas:'
    );
    if (confirmacao2 !== "EXCLUIR") {
      alert("Confirmação incorreta. Ação cancelada por segurança.");
      return;
    }

    setExcluindo(true);
    try {
      console.log("Iniciando limpeza em cascata para oficina:", oficinaId);

      // Subcoleções mapeadas do Firestore vinculadas à oficina
      const subcolecoes = [
        'os',
        'estoque',
        'retornos',
        'burocracias',
        'descartes',
        'relatorios_mensais',
        'configuracoes',
        'funcionarios',
        'despesas',
        'equipe'
      ];

      // 1. Deleta documentos de cada subcoleção concorrentemente
      await Promise.all(subcolecoes.map(async (subColNome) => {
        try {
          const colRef = collection(db, 'oficinas', oficinaId, subColNome);
          const snap = await getDocs(colRef);
          await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
          console.log(`Limpeza concluída: subcoleção /${subColNome}`);
        } catch (err) {
          console.warn(`Aviso na limpeza da subcoleção /${subColNome}:`, err);
        }
      }));

      // 2. Deleta o documento raiz da oficina
      await deleteDoc(doc(db, 'oficinas', oficinaId));
      console.log("Documento raiz da oficina deletado.");

      // 3. Deleta documento de usuário no Firestore (se houver)
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        try {
          await deleteDoc(doc(db, 'usuarios', user.uid));
          console.log("Dados do usuário no Firestore deletados.");
        } catch (err) {
          console.warn("Erro ao apagar dados extras de usuário:", err);
        }

        // 4. Exclusão da Conta Auth Engine do Firebase
        try {
          await deleteUser(user);
          console.log("Conta de Autenticação deletada com sucesso.");
        } catch (err) {
          console.warn("Aviso Auth: deleteUser falhou ou exige login recente.", err);
          if (err.code === 'auth/requires-recent-login') {
             alert("Por motivos de segurança do Firebase, esta operação exige que você tenha feito login recentemente. Por favor, faça logout, logue de novo e repita o processo.");
             setExcluindo(false);
             return;
          }
        }
      }

      alert("Todos os seus dados foram apagados permanentemente em conformidade com a LGPD! Redirecionando...");
      window.location.href = '/';
    } catch (error) {
      console.error("Erro crítico na deleção cascata LGPD:", error);
      alert("Erro ao excluir dados: " + error.message);
    } finally {
      setExcluindo(false);
    }
  };

  return (
    <div className="rounded-[18px] border border-slate-800 bg-[#020408] p-[22px]">
      <div className="mb-4">
        <SeletorUF />
        <p className="mt-2 text-[11px] text-slate-500">
          UF e porte do município padrão da imobiliária. Ficam salvos neste navegador e valem para as abas Fiscal,
          Jurídico, Captação e Acompanhamento — o seletor rápido de cada aba serve para negociar imóvel de outro estado.
        </p>
      </div>

      <div className="mb-5">
        <HeroAba
          flat
          icone={Settings}
          titulo="Configurações da"
          destaque="Imobiliária / Corretor"
          chip="Identidade, documentos e dados de emissão"
          subtitulo="Personalize os dados da sua imobiliária ou perfil de corretor para exibição nos portais, emissão de recibos de comissão e relatórios de vistoria."
          cor="#64748b"
        />
      </div>

      <div className="grid gap-4">
        <div>
          <label className={labelCls}>NOME DA IMOBILIÁRIA / CORRETOR</label>
          <input
            type="text"
            value={config.nome}
            onChange={(e) => atualizarCampo('nome', e.target.value)}
            placeholder="Ex: Imobiliária Prime ou João Silva Corretor"
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>CRECI</label>
          <input
            type="text"
            value={config.creci || ''}
            onChange={(e) => atualizarCampo('creci', e.target.value)}
            placeholder="Ex: CRECI-SP 123456-F ou J-12345"
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>ENDEREÇO</label>
          <input
            type="text"
            value={config.endereco}
            onChange={(e) => atualizarCampo('endereco', e.target.value)}
            placeholder="Ex: Av. Paulista, 1000 - Sala 402, São Paulo/SP"
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>TELEFONE / WHATSAPP</label>
          <input
            type="text"
            value={config.telefone}
            onChange={(e) => atualizarCampo('telefone', e.target.value)}
            placeholder="Ex: (11) 99999-9999"
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>URL DA LOGOMARCA</label>
          <input
            type="text"
            value={config.logoUrl}
            onChange={(e) => atualizarCampo('logoUrl', e.target.value)}
            placeholder="https://..."
            className={inputCls}
          />
        </div>

        {config.logoUrl && (
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-center">
            <p className="mb-2.5 text-[11px] font-bold text-slate-400">PRÉVIA DA LOGOMARCA</p>
            <img src={config.logoUrl} alt="Logomarca da imobiliária" className="mx-auto max-h-[120px] max-w-full object-contain" />
          </div>
        )}

        <div>
          <label className={labelCls}>CHAVE PIX / DADOS DE COMISSÃO</label>
          <input
            type="text"
            value={config.pixKey}
            onChange={(e) => atualizarCampo('pixKey', e.target.value)}
            placeholder="Ex: CNPJ, CPF, e-mail, telefone ou dados bancários para repasse de comissão"
            className={inputCls}
          />
        </div>
      </div>

      <button
        onClick={salvar}
        disabled={salvando}
        style={{ background: '#10b981', color: '#020408' }}
        className="mt-[22px] w-full rounded-xl p-4 font-black tracking-[0.5px] disabled:opacity-60"
      >
        {salvando ? 'SALVANDO...' : '💾 SALVAR CONFIGURAÇÕES'}
      </button>

      {/* 🔗 INTEGRAÇÃO COM PORTAIS IMOBILIÁRIOS */}
      <div className="mt-[30px] border-t border-dashed border-slate-800 pt-[30px]">
        <IntegracaoPortais oficinaId={oficinaId} />
      </div>

      {/* 🔒 ÁREA DE PRIVACIDADE E LGPD */}
      <div className="mt-[30px] border-t border-dashed border-slate-800 pt-[30px]">
        <div className="mb-4">
          <h3 className="mb-1.5 flex items-center gap-2 text-[15px] font-bold text-white">
            <span style={{ color: '#00E676' }}>🔒</span> Segurança e Privacidade (LGPD)
          </h3>
          <p className="text-xs leading-relaxed text-slate-400">
            Como titular dos dados, você possui o <strong className="text-slate-200">Direito ao Esquecimento</strong> digital. Você pode solicitar a eliminação permanente e definitiva de todas as suas informações dos nossos servidores a qualquer momento.
          </p>
        </div>

        <button
          onClick={handleExcluirConta}
          disabled={excluindo || salvando}
          style={{
            width: '100%',
            padding: '14px',
            background: 'rgba(255, 49, 49, 0.05)',
            border: '1px solid rgba(255, 49, 49, 0.3)',
            color: '#FF3131',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '900',
            cursor: 'pointer',
            transition: '0.2s',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          {excluindo ? 'DELETANDO TUDO EM CASCATA...' : '⚠️ Excluir Minha Conta e Dados Permanentemente'}
        </button>
      </div>
    </div>
  );
}
