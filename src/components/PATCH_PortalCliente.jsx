// ═══════════════════════════════════════════════════════════════════
// PATCH — PortalCliente.jsx
// ERRO: "Objects are not valid as a React child"
// CAUSA: o campo `checklist` (objeto) está sendo renderizado diretamente
//        como {os.checklist} no JSX, o que o React não aceita.
// ═══════════════════════════════════════════════════════════════════

// ─── PROBLEMA (o que você tem hoje) ─────────────────────────────────
// <p>{os.checklist}</p>           ← ERRO: checklist é um objeto
// <span>{os.observacoes}</span>   ← ERRO: observacoes também é objeto

// ─── SOLUÇÃO 1 — Não mostrar checklist no portal (recomendado) ──────
// Simplesmente não renderize o campo checklist na view do cliente.
// O portal deve mostrar apenas o resumo do serviço, não o checklist técnico.

// ─── SOLUÇÃO 2 — Mostrar resumo do checklist de forma segura ────────
// Substitua qualquer ocorrência de {os.checklist} por este componente:

const ChecklistResumo = ({ checklist }) => {
  if (!checklist || typeof checklist !== 'object') return null;

  const statusColor = {
    'OK': 'text-green-500',
    'Atenção': 'text-yellow-500',
    'Trocar': 'text-red-500',
  };

  const labels = {
    motorEstado: 'Motor',
    vazamentosOleo: 'Vazamentos',
    ruidos: 'Ruídos',
    radiador: 'Radiador',
    correiaDistribuicao: 'Correia',
    pastilhas: 'Pastilhas',
    discos: 'Discos',
    fluidoFreio: 'Fluido Freio',
    abs: 'ABS',
    amortecedores: 'Amortecedores',
    buchas: 'Buchas',
    rolamentos: 'Rolamentos',
    direcao: 'Direção',
    terminais: 'Terminais',
    bateria: 'Bateria',
    alternador: 'Alternador',
    luzes: 'Luzes',
    fusiveis: 'Fusíveis',
    escapamento: 'Escapamento',
  };

  return (
    <div className="grid grid-cols-2 gap-2 mt-4">
      {Object.entries(checklist).map(([key, value]) => (
        <div key={key} className="flex items-center justify-between bg-zinc-900 p-2 rounded-lg border border-zinc-800">
          <span className="text-zinc-400 text-xs">{labels[key] || key}</span>
          <span className={`text-xs font-bold ${statusColor[value] || 'text-zinc-400'}`}>{value}</span>
        </div>
      ))}
    </div>
  );
};

// ─── SOLUÇÃO 3 — Corrigir observacoes da mesma forma ────────────────
// Substitua {os.observacoes} por:
const ObservacoesResumo = ({ observacoes }) => {
  if (!observacoes || typeof observacoes !== 'object') return null;

  const secoes = {
    motor: '⚙️ Motor',
    freios: '🛑 Freios',
    suspensao: '🔩 Suspensão',
    eletrica: '⚡ Elétrica',
    geral: '📋 Geral',
  };

  return (
    <div className="space-y-2 mt-2">
      {Object.entries(secoes).map(([key, label]) =>
        observacoes[key] ? (
          <div key={key} className="bg-zinc-900 p-3 rounded-xl border border-zinc-800">
            <span className="text-zinc-500 text-xs font-bold block mb-1">{label}</span>
            <p className="text-zinc-300 text-sm">{observacoes[key]}</p>
          </div>
        ) : null
      )}
    </div>
  );
};

// ─── SENHA — Como gerar corretamente na triagem ──────────────────────
// Na Triagem (NovaOS.jsx ou similar), ao salvar a O.S., use:
//
//   const telLimpo = telefone.replace(/\D/g, '');
//   const senhaConsulta = telLimpo.length >= 4
//     ? telLimpo.slice(-4)         // ← 4 últimos dígitos do WhatsApp
//     : Math.floor(1000 + Math.random() * 9000).toString();
//
// Salve como: { senhaConsulta }
//
// No PortalCliente, valide assim:
//   if (os.senhaConsulta === senhaDigitada) { /* acesso liberado */ }
//
// Para enviar ao cliente via WhatsApp:
//   const numero = (os.whatsapp || os.telefone || '').replace(/\D/g, '');
//   const numeroFinal = numero.startsWith('55') ? numero : `55${numero}`;
//   const msg = `Sua senha de acesso ao portal é: ${os.senhaConsulta}`;
//   window.open(`https://wa.me/${numeroFinal}?text=${encodeURIComponent(msg)}`);

export { ChecklistResumo, ObservacoesResumo };
