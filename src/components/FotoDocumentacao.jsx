import { useState, useRef } from 'react';

const TIPOS_FOTO = {
  frontal: { 
    id: 'frontal', 
    label: 'FRONTAL', 
    icon: '🚗', 
    desc: 'Frente do veículo',
    obrigatorio: true 
  },
  traseira: { 
    id: 'traseira', 
    label: 'TRASEIRA', 
    icon: '🚗', 
    desc: 'Traseira do veículo',
    obrigatorio: true 
  },
  lateral_esq: { 
    id: 'lateral_esq', 
    label: 'LATERAL ESQ', 
    icon: '⬅️', 
    desc: 'Lado esquerdo',
    obrigatorio: true 
  },
  lateral_dir: { 
    id: 'lateral_dir', 
    label: 'LATERAL DIR', 
    icon: '➡️', 
    desc: 'Lado direito',
    obrigatorio: true 
  },
  painel: { 
    id: 'painel', 
    label: 'PAINEL/KM', 
    icon: '📊', 
    desc: 'Quilometragem',
    obrigatorio: true 
  },
  avarias: { 
    id: 'avarias', 
    label: 'AVARIAS', 
    icon: '⚠️', 
    desc: 'Riscos, amassados',
    obrigatorio: false 
  },
  interior: { 
    id: 'interior', 
    label: 'INTERIOR', 
    icon: '🪑', 
    desc: 'Bancos, porta-malas',
    obrigatorio: false 
  },
  adesivo_oleo: { 
    id: 'adesivo_oleo', 
    label: 'ADESIVO ÓLEO', 
    icon: '🏷️', 
    desc: 'Comprovante troca',
    obrigatorio: false 
  }
};

// Hook personalizado para gerenciar fotos
export function useFotosDocumentacao(tiposObrigatorios = ['frontal', 'traseira', 'lateral_esq', 'lateral_dir', 'painel']) {
  const [fotos, setFotos] = useState([]);
  const [capturando, setCapturando] = useState(null);
  const inputRef = useRef(null);

  const compressImage = (base64, maxWidth = 1200, quality = 0.7) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
    });
  };

  const adicionarFoto = async (tipo, file) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('❌ Imagem muito grande! Máximo 5MB');
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async (e) => {
      const comprimida = await compressImage(e.target.result);
      
      const novaFoto = {
        id: Date.now().toString(),
        tipo,
        imagem: comprimida,
        timestamp: new Date().toISOString(),
        legenda: TIPOS_FOTO[tipo]?.label || 'Foto'
      };

      setFotos(prev => {
        const filtradas = prev.filter(f => f.tipo !== tipo);
        return [...filtradas, novaFoto];
      });
      
      setCapturando(null);
    };
  };

  const removerFoto = (id) => {
    setFotos(prev => prev.filter(f => f.id !== id));
  };

  const iniciarCaptura = (tipo) => {
    setCapturando(tipo);
    setTimeout(() => inputRef.current?.click(), 100);
  };

  const fotosObrigatoriasPendentes = tiposObrigatorios.filter(
    tipo => !fotos.some(f => f.tipo === tipo)
  );

  const progresso = Math.round(
    ((tiposObrigatorios.length - fotosObrigatoriasPendentes.length) / tiposObrigatorios.length) * 100
  );

  const limparFotos = () => {
    setFotos([]);
    setCapturando(null);
  };

  return {
    fotos,
    setFotos,
    adicionarFoto,
    removerFoto,
    iniciarCaptura,
    limparFotos,
    inputRef,
    capturando,
    progresso,
    fotosObrigatoriasPendentes,
    TIPOS_FOTO
  };
}

// Componente visual
export function FotoDocumentacao({ 
  hookFotos, 
  modo = 'chegada'
}) {
  const { 
    fotos, 
    adicionarFoto, 
    removerFoto, 
    iniciarCaptura, 
    inputRef, 
    capturando,
    progresso,
    fotosObrigatoriasPendentes,
    TIPOS_FOTO 
  } = hookFotos;

  const tiposVisiveis = {
    chegada: ['frontal', 'traseira', 'lateral_esq', 'lateral_dir', 'painel', 'avarias'],
    servico: ['painel', 'adesivo_oleo', 'avarias'],
    completo: Object.keys(TIPOS_FOTO)
  }[modo] || Object.keys(TIPOS_FOTO);

  const getStatusFoto = (tipo) => {
    const foto = fotos.find(f => f.tipo === tipo);
    if (foto) return { status: 'ok', foto };
    if (TIPOS_FOTO[tipo].obrigatorio) return { status: 'pendente' };
    return { status: 'opcional' };
  };

  return (
    <div className="w-full space-y-4">
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={inputRef}
        onChange={(e) => {
          if (capturando && e.target.files[0]) {
            adicionarFoto(capturando, e.target.files[0]);
            e.target.value = '';
          }
        }}
        className="hidden"
      />

      <div className="bg-neutral-900 p-3 rounded-lg">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-400">Documentação fotográfica</span>
          <span className={progresso === 100 ? 'text-green-400' : 'text-yellow-400'}>
            {progresso}%
          </span>
        </div>
        <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${progresso === 100 ? 'bg-green-500' : 'bg-yellow-500'}`}
            style={{ width: `${progresso}%` }}
          />
        </div>
        {fotosObrigatoriasPendentes.length > 0 && (
          <p className="text-xs text-red-400 mt-1">
            ⚠️ Faltam: {fotosObrigatoriasPendentes.map(t => TIPOS_FOTO[t].label).join(', ')}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {tiposVisiveis.map(tipo => {
          const { status, foto } = getStatusFoto(tipo);
          const config = TIPOS_FOTO[tipo];

          return (
            <button
              key={tipo}
              onClick={() => iniciarCaptura(tipo)}
              className={`relative p-3 rounded-lg border-2 transition-all ${
                status === 'ok' 
                  ? 'bg-green-900/30 border-green-500' 
                  : status === 'pendente'
                    ? 'bg-red-900/20 border-red-500/50 animate-pulse'
                    : 'bg-neutral-900 border-neutral-700'
              }`}
            >
              <div className="flex flex-col items-center gap-1">
                <span className="text-2xl">{config.icon}</span>
                <span className={`text-[10px] font-bold uppercase ${
                  status === 'ok' ? 'text-green-400' : 'text-gray-400'
                }`}>
                  {status === 'ok' ? '✓ ' : ''}{config.label}
                </span>
                <span className="text-[8px] text-gray-600 text-center leading-tight">
                  {config.desc}
                </span>
              </div>

              {foto && (
                <div className="absolute inset-0 rounded-lg overflow-hidden">
                  <img 
                    src={foto.imagem} 
                    alt={config.label}
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-green-500/20" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removerFoto(foto.id);
                    }}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-600 text-white rounded-full text-xs font-bold"
                  >
                    ×
                  </button>
                </div>
              )}

              {config.obrigatorio && status !== 'ok' && (
                <span className="absolute -top-1 -left-1 w-4 h-4 bg-red-500 rounded-full text-[8px] flex items-center justify-center">
                  !
                </span>
              )}
            </button>
          );
        })}
      </div>

      {fotos.length > 0 && (
        <div className="bg-neutral-900 p-3 rounded-lg">
          <p className="text-xs text-gray-400 mb-2">📷 Fotos capturadas ({fotos.length})</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {fotos.map(f => (
              <div key={f.id} className="relative flex-shrink-0">
                <img 
                  src={f.imagem} 
                  alt={f.legenda}
                  className="w-20 h-20 object-cover rounded-lg border border-green-500"
                />
                <span className="absolute bottom-0 left-0 right-0 bg-black/80 text-[8px] text-center text-white py-0.5 truncate">
                  {f.legenda}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}