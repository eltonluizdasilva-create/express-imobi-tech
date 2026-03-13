import React from 'react';

export default function Maintenance({ title }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="text-7xl mb-6 animate-bounce">🚧</div>
            <h2 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">
                {title}
            </h2>
            <p className="text-gray-500 max-w-xs mx-auto italic">
                Estamos calibrando os motores deste módulo. Esta aba estará disponível em breve no seu painel.
            </p>
            <div className="mt-8 w-24 h-1 bg-red-600 rounded-full shadow-[0_0_15px_rgba(220,38,38,0.8)]"></div>
        </div>
    );
}