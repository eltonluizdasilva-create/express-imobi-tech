/* eslint-disable react/prop-types */
import React, { useState, useEffect, useMemo } from 'react';
import { db } from './lib/firebase';
import { collection, addDoc, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import {
  Trash2,
  CheckCircle,
  MessageCircle,
  Users,
  Building2,
  BadgeCheck,
  UserPlus,
  Shield,
  Mail,
  Lock,
  KeyRound,
  LayoutGrid,
  Table as TableIcon,
  X,
  Sparkles,
} from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { limiteUsuariosDoPlano } from './lib/planos';
import BloqueioPremium from './components/BloqueioPremium';

const FUNCOES_EQUIPE = [
  {
    value: 'corretor',
    label: 'Corretor',
    nivelExibicao: 'Corretor',
    cargoPadrao: 'Corretor de Imóveis',
    cor: '#10b981',
  },
  {
    value: 'gerente',
    label: 'Gerente (Admin)',
    nivelExibicao: 'Admin / Gerente',
    cargoPadrao: 'Gerente Comercial (Admin)',
    cor: '#10b981',
  },
];

const AVATARES_SUGERIDOS = [
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=240&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=240&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=240&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=240&q=80',
];

export default function Equipe({
  oficinaId: oficinaIdProp,
  imobiliariaId: imobiliariaIdProp,
  dadosOficina: dadosOficinaProp,
  dadosImobiliaria: dadosImobiliariaProp,
  listaFinanceiro,
  setAbaAtiva,
}) {
  const authCtx = useAuth() || {};

  const targetOficinaId =
    oficinaIdProp ||
    imobiliariaIdProp ||
    authCtx.dadosOficina?.id ||
    authCtx.currentUserId ||
    null;

  const dadosRaiz =
    dadosImobiliariaProp ||
    dadosOficinaProp ||
    authCtx.dadosOficina ||
    {};

  // Assentos: `limiteUsuarios` do documento raiz manda (é o que sobe quando o
  // cliente compra usuário extra). Sem ele, o limite vem do catálogo pelo plano
  // — Grátis 1 · PRO 1 · PLUS até 3 inclusos.
  const limiteUsuarios = useMemo(() => {
    if (typeof dadosRaiz?.limiteUsuarios === 'number' && !Number.isNaN(dadosRaiz.limiteUsuarios) && dadosRaiz.limiteUsuarios > 0) {
      return dadosRaiz.limiteUsuarios;
    }
    if (typeof authCtx?.limiteUsuarios === 'number' && !Number.isNaN(authCtx.limiteUsuarios) && authCtx.limiteUsuarios > 0) {
      return authCtx.limiteUsuarios;
    }
    return limiteUsuariosDoPlano(dadosRaiz?.plano || 'gratis');
  }, [dadosRaiz?.limiteUsuarios, dadosRaiz?.plano, authCtx?.limiteUsuarios]);

  // Estado local sincronizado com o estado global (subcoleção `equipe`)
  const [membrosLocais, setMembrosLocais] = useState([]);
  const [modoVisualizacao, setModoVisualizacao] = useState('cards'); // 'cards' | 'tabela'

  // Estados do Modal de Adição (Passo 3) e Paywall PLG (Passo 2)
  const [modalAdicionarAberto, setModalAdicionarAberto] = useState(false);
  const [mostrarBloqueioLimite, setMostrarBloqueioLimite] = useState(false);
  const [sucessoCriar, setSucessoCriar] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Campos do Modal de Adição (Apenas UI: Nome, Email, Senha, Select de Função)
  const [nome, setNome] = useState('');
  const [emailFuncionario, setEmailFuncionario] = useState('');
  const [senhaProvisoria, setSenhaProvisoria] = useState('');
  const [funcaoSelecionada, setFuncaoSelecionada] = useState('corretor');
  const [fotoUrl, setFotoUrl] = useState('');

  useEffect(() => {
    if (!targetOficinaId) return;
    const q = collection(db, 'oficinas', targetOficinaId, 'equipe');
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const lista = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setMembrosLocais(lista);
        if (typeof authCtx.setMembrosEquipe === 'function') {
          authCtx.setMembrosEquipe(lista);
        }
      },
      (err) => console.warn('Aviso ao ler subcoleção equipe:', err?.message)
    );
    return () => unsubscribe();
  }, [targetOficinaId]);

  // Lista consolidada lendo do estado global ou listener da subcoleção
  const membros = useMemo(() => {
    if (Array.isArray(membrosLocais) && membrosLocais.length > 0) return membrosLocais;
    if (Array.isArray(authCtx?.membrosEquipe) && authCtx.membrosEquipe.length > 0) return authCtx.membrosEquipe;
    return membrosLocais || [];
  }, [membrosLocais, authCtx?.membrosEquipe]);

  const quantidadeAtualCorretores = membros.length;
  const limiteUsuariosIlimitado = !Number.isFinite(limiteUsuarios);
  const limiteUsuariosExibicao = limiteUsuariosIlimitado ? 'Ilimitado' : limiteUsuarios;
  const vagasDisponiveis = limiteUsuariosIlimitado
    ? null
    : Math.max(0, limiteUsuarios - quantidadeAtualCorretores);
  const limiteUsuariosDescricao = limiteUsuariosIlimitado
    ? 'usuários ilimitados'
    : `${limiteUsuarios} usuários`;

  // Cálculo do Medidor Visual de Capacidade
  const percentualCapacidade = useMemo(() => {
    if (!limiteUsuarios || limiteUsuarios <= 0) return 100;
    return Math.min(100, Math.round((quantidadeAtualCorretores / limiteUsuarios) * 100));
  }, [quantidadeAtualCorretores, limiteUsuarios]);

  const statusBarraCapacidade = useMemo(() => {
    if (quantidadeAtualCorretores >= limiteUsuarios) {
      return {
        cor: '#ef4444', // Vermelha quando atingiu o limite
        classeTexto: 'text-red-400',
        classeBadge: 'bg-red-500/15 text-red-400 border-red-500/40',
        rotulo: 'Limite Atingido',
      };
    }
    if (percentualCapacidade >= 75) {
      return {
        cor: '#f59e0b', // Amarela quando perto do limite
        classeTexto: 'text-amber-400',
        classeBadge: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
        rotulo: 'Próximo do Limite',
      };
    }
    return {
      cor: '#10b981', // Verde Esmeralda quando tranquilo
      classeTexto: 'text-[#10b981]',
      classeBadge: 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/40',
      rotulo: 'Capacidade Saudável',
    };
  }, [quantidadeAtualCorretores, limiteUsuarios, percentualCapacidade]);

  // PASSO 2: Lógica de Bloqueio do Convite (O Gatilho PLG)
  const handleClicarConvidarCorretor = () => {
    if (quantidadeAtualCorretores >= limiteUsuarios) {
      setModalAdicionarAberto(false);
      setMostrarBloqueioLimite(true);
      return;
    }

    setMostrarBloqueioLimite(false);
    setModalAdicionarAberto(true);
  };

  // PASSO 3: Função simulada do Modal de Adição (Sem criar usuário no Firebase Auth ainda)
  const handleSimularAdicaoMembro = async (e) => {
    if (e) e.preventDefault();

    if (!nome.trim() || !emailFuncionario.trim() || !senhaProvisoria.trim()) {
      alert('Preencha Nome, E-mail e Senha para convidar o membro.');
      return;
    }

    if (quantidadeAtualCorretores >= limiteUsuarios) {
      setModalAdicionarAberto(false);
      setMostrarBloqueioLimite(true);
      return;
    }

    setSalvando(true);
    try {
      const funcaoInfo =
        FUNCOES_EQUIPE.find((f) => f.value === funcaoSelecionada) || FUNCOES_EQUIPE[0];
      const avatarPadrao =
        fotoUrl.trim() ||
        AVATARES_SUGERIDOS[quantidadeAtualCorretores % AVATARES_SUGERIDOS.length];

      const novoMembroSimulado = {
        nome: nome.trim(),
        email: emailFuncionario.toLowerCase().trim(),
        nivelAcesso: funcaoSelecionada === 'gerente' ? 'gerente' : 'corretor',
        funcao: funcaoInfo.label,
        cargo: funcaoInfo.cargoPadrao,
        foto: avatarPadrao,
        ativo: true,
        simuladoUI: true,
        dataCadastro: new Date().toISOString(),
      };

      // Registra apenas o documento na subcoleção da equipe (sem Firebase Auth),
      // permitindo testar o contador de capacidade em tempo real, e fecha o modal.
      if (targetOficinaId) {
        try {
          await addDoc(collection(db, 'oficinas', targetOficinaId, 'equipe'), novoMembroSimulado);
        } catch {
          const novaLista = [{ id: `local_${Date.now()}`, ...novoMembroSimulado }, ...membros];
          setMembrosLocais(novaLista);
          if (typeof authCtx.setMembrosEquipe === 'function') {
            authCtx.setMembrosEquipe(novaLista);
          }
        }
      } else {
        const novaLista = [{ id: `local_${Date.now()}`, ...novoMembroSimulado }, ...membros];
        setMembrosLocais(novaLista);
        if (typeof authCtx.setMembrosEquipe === 'function') {
          authCtx.setMembrosEquipe(novaLista);
        }
      }

      // Limpa os campos e fecha o modal
      setNome('');
      setEmailFuncionario('');
      setSenhaProvisoria('');
      setFuncaoSelecionada('corretor');
      setFotoUrl('');
      setModalAdicionarAberto(false);

      setSucessoCriar(true);
      setTimeout(() => setSucessoCriar(false), 3500);
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = async (id) => {
    if (window.confirm('Remover este corretor/membro da equipe imobiliária?')) {
      if (targetOficinaId && !String(id).startsWith('local_')) {
        try {
          await deleteDoc(doc(db, 'oficinas', targetOficinaId, 'equipe', id));
        } catch {
          setMembrosLocais((prev) => (prev || []).filter((m) => m.id !== id));
        }
      } else {
        setMembrosLocais((prev) => (prev || []).filter((m) => m.id !== id));
      }
      setMostrarBloqueioLimite(false);
    }
  };

  const obterAdiantamentosMembro = (membro) => {
    const base = Array.isArray(listaFinanceiro) ? listaFinanceiro : [];
    let total = 0;
    base.forEach((t) => {
      if (t.valeFuncionario === true) {
        const desc = (t.descricao || '').toLowerCase();
        const n = (membro.nome || '').toLowerCase();
        if (n && desc.includes(n)) {
          total += Number(t.valor) || 0;
        }
      }
    });
    return total;
  };

  const formatarNivelAcesso = (membro) => {
    const raw = String(membro?.nivelAcesso || membro?.funcao || 'corretor').toLowerCase();
    if (raw === 'gerente' || raw === 'admin' || raw === 'diretor' || raw === 'dono') {
      return {
        titulo: 'Admin / Gerente',
        subtitulo: 'Acesso Executivo & Gestão',
        isAdmin: true,
      };
    }
    return {
      titulo: 'Corretor',
      subtitulo: membro?.creci ? `CRECI ${membro.creci}` : 'Corretor de Imóveis',
      isAdmin: false,
    };
  };

  const copyBloqueioEquipe = `Limite de Equipe Atingido. Seu plano atual permite ${limiteUsuariosDescricao}. Faça um upgrade ou contrate pacotes de expansão para adicionar mais corretores e ativar a roleta de leads.`;

  return (
    <div
      style={{ backgroundColor: '#020408' }}
      className="min-h-screen text-white p-4 md:p-6 pb-32 font-sans rounded-3xl border border-slate-900"
    >
      {/* NOTIFICAÇÃO DE SUCESSO */}
      {sucessoCriar && (
        <div className="fixed inset-x-0 top-12 z-50 flex justify-center animate-bounce">
          <div className="flex items-center gap-3 rounded-full border border-[#10b981]/50 bg-[#020408]/95 px-6 py-3 text-xs font-black uppercase tracking-wider text-[#10b981] shadow-[0_20px_50px_rgba(16,185,129,0.35)] backdrop-blur">
            <CheckCircle className="text-[#10b981]" size={20} />
            Convite simulado com sucesso! Membro adicionado à equipe.
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          PASSO 1 (TOPO): CABEÇALHO + MEDIDOR VISUAL DE CAPACIDADE + BOTÃO PLG
         ═══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-slate-950/90 rounded-3xl border border-slate-800/90 p-6 md:p-8 mb-6 space-y-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 mb-2">
              <Building2 size={12} /> Corretores & Equipe
            </span>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white">
              Gestão de <span style={{ color: '#10b981' }}>Corretores & Equipe</span>
            </h1>
            <p className="text-slate-400 text-xs mt-1 max-w-2xl">
              Gerencie os membros da organização, controle permissões de acesso (Admin ou Corretor) e distribua leads automaticamente na roleta comercial.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Alternador Cards / Tabela */}
            <div className="inline-flex items-center bg-[#020408] border border-slate-800 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setModoVisualizacao('cards')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  modoVisualizacao === 'cards'
                    ? 'bg-[#10b981] text-[#020408]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid size={14} /> Cards
              </button>
              <button
                type="button"
                onClick={() => setModoVisualizacao('tabela')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  modoVisualizacao === 'tabela'
                    ? 'bg-[#10b981] text-[#020408]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <TableIcon size={14} /> Tabela
              </button>
            </div>

            {/* Botão "Convidar / Adicionar Corretor" com Gatilho PLG */}
            <button
              type="button"
              onClick={handleClicarConvidarCorretor}
              style={{ backgroundColor: '#10b981' }}
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl text-[#020408] font-black text-xs uppercase tracking-wider hover:opacity-90 transition cursor-pointer shadow-[0_0_25px_rgba(16,185,129,0.3)]"
            >
              <UserPlus size={16} /> Convidar / Adicionar Corretor
            </button>
          </div>
        </div>

        {/* MEDIDOR VISUAL DE CAPACIDADE */}
        <div
          style={{ backgroundColor: '#020408' }}
          className="rounded-2xl border border-slate-800/90 p-5 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#10b981]/15 border border-[#10b981]/30 flex items-center justify-center text-[#10b981]">
                <Users size={18} />
              </div>
              <div>
                <p className="text-xs md:text-sm font-black text-white">
                  Usuários: <span className={statusBarraCapacidade.classeTexto}>{quantidadeAtualCorretores}</span>
                  {limiteUsuariosIlimitado ? (
                    <> · Limite <span className="text-[#10b981]">Ilimitado</span> no seu plano</>
                  ) : (
                    <> de <span className="text-[#10b981]">{limiteUsuariosExibicao}</span> disponíveis no seu plano</>
                  )}
                </p>
                <p className="text-[11px] text-slate-400">
                  {quantidadeAtualCorretores >= limiteUsuarios
                    ? 'Capacidade máxima atingida no plano atual. Faça upgrade para liberar novas vagas.'
                    : vagasDisponiveis === null
                      ? 'Há vagas ilimitadas disponíveis para novos corretores ou gerentes.'
                      : `Restam ${vagasDisponiveis} vaga(s) disponível(is) para novos corretores ou gerentes.`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusBarraCapacidade.classeBadge}`}
              >
                {statusBarraCapacidade.rotulo} ({percentualCapacidade}%)
              </span>
            </div>
          </div>

          {/* Barra de Progresso (Verde se tranquilo, Amarela/Vermelha se perto/no limite) */}
          <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.max(percentualCapacidade, quantidadeAtualCorretores > 0 ? 8 : 0)}%`,
                backgroundColor: statusBarraCapacidade.cor,
                boxShadow: `0 0 12px ${statusBarraCapacidade.cor}88`,
              }}
            />
          </div>
        </div>

        {/* PASSO 2: COMPONENTE <BloqueioPremium /> QUANDO ATINGE O LIMITE */}
        {mostrarBloqueioLimite && (
          <BloqueioPremium
            aberto={mostrarBloqueioLimite}
            onFechar={() => setMostrarBloqueioLimite(false)}
            setAbaAtiva={setAbaAtiva}
            titulo="Limite de Equipe Atingido"
            mensagem={copyBloqueioEquipe}
          />
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          PASSO 1 (CORPO): LISTA DE CORRETORES (CARDS OU TABELA)
          Mostrando Foto, Nome, Email e Nível de Acesso (Admin ou Corretor)
         ═══════════════════════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-slate-400 font-extrabold uppercase tracking-wider flex items-center gap-2">
            <Sparkles size={14} className="text-[#10b981]" />
            Membros Cadastrados na Organização ({quantidadeAtualCorretores})
          </p>
        </div>

        {membros.length === 0 ? (
          <div
            style={{ backgroundColor: '#020408' }}
            className="rounded-3xl border border-slate-800 p-12 text-center space-y-4"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#10b981]/10 border border-[#10b981]/30 flex items-center justify-center text-[#10b981] mx-auto">
              <Users size={26} />
            </div>
            <div>
              <p className="text-white font-black text-sm uppercase tracking-wider">
                Nenhum corretor ou membro cadastrado ainda
              </p>
              <p className="text-slate-400 text-xs mt-1 max-w-md mx-auto">
                Clique em &ldquo;Convidar / Adicionar Corretor&rdquo; no topo da tela para cadastrar os membros da sua imobiliária.
              </p>
            </div>
            <button
              type="button"
              onClick={handleClicarConvidarCorretor}
              style={{ backgroundColor: '#10b981' }}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-[#020408] font-black text-xs uppercase tracking-wider hover:opacity-90 transition cursor-pointer"
            >
              <UserPlus size={15} /> Convidar Primeiro Corretor
            </button>
          </div>
        ) : modoVisualizacao === 'cards' ? (
          /* VISUALIZAÇÃO EM CARDS */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {membros.map((membro, index) => {
              const nivel = formatarNivelAcesso(membro);
              const fotoMembro =
                membro.foto ||
                membro.avatar ||
                membro.photoURL ||
                AVATARES_SUGERIDOS[index % AVATARES_SUGERIDOS.length];

              return (
                <div
                  key={membro.id}
                  style={{ backgroundColor: '#020408' }}
                  className="rounded-2xl border border-slate-800 hover:border-[#10b981]/60 p-5 flex flex-col justify-between gap-4 transition-all shadow-lg"
                >
                  <div className="flex items-start gap-4">
                    {/* Foto do Corretor / Membro */}
                    <div className="relative shrink-0">
                      <img
                        src={fotoMembro}
                        alt={membro.nome || 'Membro'}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-[#10b981]/50 bg-slate-900"
                      />
                      <span
                        className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#10b981] border-2 border-[#020408]"
                        title="Ativo"
                      />
                    </div>

                    {/* Nome, Email e Nível de Acesso */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h3 className="font-black text-sm text-white truncate">
                          {membro.nome || 'Membro da Equipe'}
                        </h3>
                        {membro.creci && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 text-[10px] font-extrabold">
                            <BadgeCheck size={11} /> {membro.creci}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 truncate flex items-center gap-1.5 mt-1">
                        <Mail size={12} className="text-[#10b981] shrink-0" />
                        {membro.email || 'sem-email@imobiliaria.com'}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            nivel.isAdmin
                              ? 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/50'
                              : 'bg-slate-900 text-[#10b981] border-[#10b981]/30'
                          }`}
                        >
                          <Shield size={11} />
                          {nivel.titulo}
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold">
                          {nivel.subtitulo}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Rodapé do Card: Adiantamentos + Ações */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <div className="text-left">
                      <span className="block text-[9px] uppercase font-bold text-slate-500">
                        Adiantamentos / Mês
                      </span>
                      <span className="text-xs font-black text-[#10b981]">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(obterAdiantamentosMembro(membro))}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const msg = `*Olá, ${membro.nome}!* 🏢✨\nSeja bem-vindo(a) à equipe no *Express Imobi Tech*!\n\n🔗 *Acesso:* ${window.location.origin}/admin\n📧 *E-mail:* ${membro.email}\n🛡️ *Nível de Acesso:* ${nivel.titulo}`;
                          const url = `https://wa.me/${membro.whatsapp || ''}?text=${encodeURIComponent(msg)}`;
                          window.open(url, '_blank');
                        }}
                        style={{ backgroundColor: '#10b981' }}
                        className="px-3 py-2 rounded-xl text-[#020408] text-[11px] font-black uppercase tracking-wider hover:opacity-90 transition inline-flex items-center gap-1.5 cursor-pointer"
                        title="Enviar credenciais no WhatsApp"
                      >
                        <MessageCircle size={13} /> Acesso
                      </button>

                      <button
                        type="button"
                        onClick={() => handleExcluir(membro.id)}
                        className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-500/40 transition cursor-pointer"
                        title="Remover membro da equipe"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* VISUALIZAÇÃO EM TABELA */
          <div
            style={{ backgroundColor: '#020408' }}
            className="rounded-2xl border border-slate-800 overflow-hidden shadow-lg"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/90 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <th className="py-3.5 px-4">Corretor / Membro</th>
                    <th className="py-3.5 px-4">E-mail Corporativo</th>
                    <th className="py-3.5 px-4">Nível de Acesso</th>
                    <th className="py-3.5 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-xs">
                  {membros.map((membro, index) => {
                    const nivel = formatarNivelAcesso(membro);
                    const fotoMembro =
                      membro.foto ||
                      membro.avatar ||
                      membro.photoURL ||
                      AVATARES_SUGERIDOS[index % AVATARES_SUGERIDOS.length];

                    return (
                      <tr
                        key={membro.id}
                        className="hover:bg-slate-900/50 transition-colors"
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={fotoMembro}
                              alt={membro.nome || 'Membro'}
                              className="w-10 h-10 rounded-xl object-cover border border-[#10b981]/50 bg-slate-900 shrink-0"
                            />
                            <div>
                              <p className="font-black text-white text-xs">
                                {membro.nome}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                {nivel.subtitulo}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 font-medium">
                          {membro.email}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/40">
                            <Shield size={11} />
                            {nivel.titulo}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleExcluir(membro.id)}
                              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 transition cursor-pointer"
                              title="Remover membro"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          PASSO 3: MODAL DE ADIÇÃO (APENAS UI)
          Inputs: Nome, Email, Senha + Select de Função (Corretor ou Gerente)
         ═══════════════════════════════════════════════════════════════════════ */}
      {modalAdicionarAberto && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            style={{ backgroundColor: '#020408' }}
            className="w-full max-w-md rounded-3xl border-2 border-[#10b981]/50 p-6 md:p-7 shadow-[0_0_50px_rgba(16,185,129,0.2)] space-y-5 animate-in fade-in duration-200"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#10b981]/15 border border-[#10b981]/40 flex items-center justify-center text-[#10b981] shrink-0">
                  <UserPlus size={20} />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#10b981]">
                    Nova Vaga Disponível ({quantidadeAtualCorretores}/{limiteUsuariosExibicao})
                  </span>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">
                    Convidar / Adicionar Corretor
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalAdicionarAberto(false)}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                title="Fechar modal"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSimularAdicaoMembro} className="space-y-4">
              {/* Input de Nome */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Mariana Costa"
                  className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:border-[#10b981] transition-colors"
                />
              </div>

              {/* Input de Email */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                  E-mail de Acesso *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={emailFuncionario}
                    onChange={(e) => setEmailFuncionario(e.target.value)}
                    placeholder="Ex: mariana@imobiliaria.com.br"
                    className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:border-[#10b981] transition-colors"
                  />
                </div>
              </div>

              {/* Input de Senha */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                  Senha Provisória *
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={senhaProvisoria}
                    onChange={(e) => setSenhaProvisoria(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:border-[#10b981] transition-colors"
                  />
                  <KeyRound
                    size={15}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                  />
                </div>
              </div>

              {/* Select de Função (Corretor ou Gerente) */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                  Função / Nível de Acesso *
                </label>
                <select
                  value={funcaoSelecionada}
                  onChange={(e) => setFuncaoSelecionada(e.target.value)}
                  className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-bold outline-none focus:border-[#10b981] transition-colors"
                >
                  <option value="corretor">Corretor</option>
                  <option value="gerente">Gerente</option>
                </select>
              </div>

              {/* Botões de Ação do Modal */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalAdicionarAberto(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold hover:text-white transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  style={{ backgroundColor: '#10b981' }}
                  className="px-5 py-2.5 rounded-xl text-[#020408] font-black text-xs uppercase tracking-wider hover:opacity-90 transition cursor-pointer shadow-lg shadow-[#10b981]/25 disabled:opacity-50"
                >
                  {salvando ? 'Adicionando...' : 'Confirmar e Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
