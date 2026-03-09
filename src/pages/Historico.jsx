import React from 'react';

export default function Historico() {
    const servicos = [
        { modelo: 'Caminhão 1113 1978', placa: 'OOO9999', data: '12/02/2026', status: 'Concluído' },
        { modelo: 'Uno 91', placa: 'QQQ1111', data: '08/02/2026', status: 'Em manutenção' },
        { modelo: 'Moto CG Titã 91', placa: 'PPP9999', data: '08/02/2026', status: 'Orçamento' }
    ];

    return (
        <div className="space-y-3 max-w-lg mx-auto">
            <h2 className="text-center text-gray-500 font-bold uppercase text-[10px] mb-4 tracking-widest italic">
                Histórico de Serviços - ADMIN
            </h2>

            {servicos.map((s, i) => (
                <div key={i} className="bg-[#0f0f0f] border-l-4 border-red-600 p-4 flex justify-between items-center rounded-r-xl shadow-lg">
                    <div>
                        <p className="text-white font-bold text-sm uppercase leading-tight">
                            {s.modelo}
                        </p>
                        <p className="text-red-500 font-black text-[10px]">{s.placa}</p>
                        <p className="text-gray-600 text-[9px] mt-1">{s.data} • {s.status}</p>
                    </div>
                    <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors">
                        WhatsApp
                    </button>
                </div>
            ))}
        </div>
    );
}