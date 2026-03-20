import React, { useState } from 'react';

export default function AdminOS() {
    const [dados, setDados] = useState({
        placa: '',
        modelo: '',
        km: '',
        status: 'Em Análise', // Status padrão inicial
    });

    const [fotoPreview, setFotoPreview] = useState(null);
    const [arquivoFoto, setArquivoFoto] = useState(null);

    // 1. Função que ativa ao tirar a foto
    const handleFoto = (e) => {
        const file = e.target.files[0];
        if (file) {
            setArquivoFoto(file);
            // Cria uma URL temporária para mostrar a foto na tela na hora
            setFotoPreview(URL.createObjectURL(file));
        }
    };

    // 2. Função para preencher os textos
    const handleChange = (e) => {
        setDados({
            ...dados,
            [e.target.name]: e.target.value
        });
    };

    // 3. Função de Salvar (Simulação do envio)
    const handleSalvar = (e) => {
        e.preventDefault();
        if (!dados.placa || !dados.modelo) {
            alert("Preencha placa e modelo!");
            return;
        }

        // AQUI entra o código do Firebase depois
        console.log("Enviando para o Firebase:", {
            ...dados,
            foto: arquivoFoto ? "Foto capturada" : "Sem foto"
        });

        alert(`OS Aberta para ${dados.modelo}!\nStatus: ${dados.status}`);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col items-center">

            <h2 className="text-2xl font-bold mb-6 text-blue-400">Nova Ordem de Serviço</h2>

            <form onSubmit={handleSalvar} className="w-full max-w-md space-y-6">

                {/* --- ÁREA DA CÂMERA (O Pulo do Gato) --- */}
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-600 rounded-lg p-4 bg-gray-800">
                    {fotoPreview ? (
                        <div className="relative w-full">
                            <img
                                src={fotoPreview}
                                alt="Prévia do Carro"
                                className="w-full h-48 object-cover rounded-md"
                            />
                            <button
                                type="button"
                                onClick={() => setFotoPreview(null)}
                                className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full text-xs"
                            >
                                Remover
                            </button>
                        </div>
                    ) : (
                        <label htmlFor="cameraInput" className="cursor-pointer flex flex-col items-center text-gray-400 hover:text-white transition">
                            {/* Ícone de Câmera */}
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="font-semibold">Tirar Foto do Veículo</span>
                            <span className="text-xs mt-1 text-gray-500">Toque aqui para abrir a câmera</span>
                        </label>
                    )}

                    {/* O Input Mágico Escondido */}
                    <input
                        type="file"
                        id="cameraInput"
                        accept="image/*"
                        capture="environment" // ISSO força a câmera traseira no celular
                        onChange={handleFoto}
                        className="hidden"
                    />
                </div>

                {/* --- DADOS DO VEÍCULO --- */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Placa do Veículo</label>
                        <input
                            type="text"
                            name="placa"
                            value={dados.placa}
                            onChange={handleChange}
                            placeholder="ABC-1234"
                            className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white focus:border-blue-500 outline-none uppercase"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Modelo do Carro</label>
                        <input
                            type="text"
                            name="modelo"
                            value={dados.modelo}
                            onChange={handleChange}
                            placeholder="Ex: Fiat Uno 2010"
                            className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white focus:border-blue-500 outline-none"
                        />
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm text-gray-400 mb-1">Quilometragem (KM)</label>
                            <input
                                type="number"
                                name="km"
                                value={dados.km}
                                onChange={handleChange}
                                placeholder="Ex: 150000"
                                className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white focus:border-blue-500 outline-none"
                            />
                        </div>

                        <div className="w-1/3">
                            <label className="block text-sm text-gray-400 mb-1">Status</label>
                            <div className="w-full bg-gray-700 border border-gray-600 rounded p-3 text-yellow-400 font-bold text-center text-sm">
                                {dados.status}
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- BOTÃO SALVAR --- */}
                <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg transition-all shadow-lg shadow-blue-900/50"
                >
                    ABRIR ORDEM DE SERVIÇO
                </button>

            </form>
        </div>
    );
}