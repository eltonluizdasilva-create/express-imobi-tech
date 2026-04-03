import { useRef, useState } from 'react';

export function useVoz() {
    const [campoOuvindo, setCampoOuvindo] = useState(null);
    const [finCampoOuvindo, setFinCampoOuvindo] = useState(false);
    const [leadCampoOuvindo, setLeadCampoOuvindo] = useState(null);
    const recognitionRef = useRef(null);
    const finRecognitionRef = useRef(null);

    const ouvirCampo = (nomeCampo, setFuncaoEstado, normalizarPlaca, modo = 'substituir') => {
        if (!('webkitSpeechRecognition' in window)) return alert("O seu navegador não suporta voz. Use o Chrome.");

        if (campoOuvindo === nomeCampo) {
            if (recognitionRef.current) recognitionRef.current.stop();
            setCampoOuvindo(null);
            return;
        }

        if (recognitionRef.current) recognitionRef.current.stop();

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'pt-BR';
        recognition.interimResults = false;
        recognitionRef.current = recognition;

        recognition.onstart = () => setCampoOuvindo(nomeCampo);

        recognition.onresult = (event) => {
            const texto = event.results[0][0].transcript;
            if (modo === 'substituir') {
                if (nomeCampo.includes('placa')) setFuncaoEstado(normalizarPlaca(texto));
                else if (nomeCampo.includes('telefone')) setFuncaoEstado(texto.replace(/\D/g, ''));
                else setFuncaoEstado(texto);
            } else {
                setFuncaoEstado(prev => prev ? prev + " " + texto : texto);
            }
        };

        recognition.onerror = () => setCampoOuvindo(null);
        recognition.onend = () => setCampoOuvindo(null);
        recognition.start();
    };

    const ouvirFinDesc = (setFinDesc) => {
        if (!('webkitSpeechRecognition' in window)) return alert('Use Chrome para usar voz.');
        if (finCampoOuvindo) {
            if (finRecognitionRef.current) finRecognitionRef.current.stop();
            setFinCampoOuvindo(false);
            return;
        }
        const rec = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        rec.lang = 'pt-BR';
        rec.interimResults = false;
        finRecognitionRef.current = rec;
        rec.onstart = () => setFinCampoOuvindo(true);
        rec.onresult = (e) => {
            setFinDesc(e.results[0][0].transcript);
            setFinCampoOuvindo(false);
        };
        rec.onerror = () => setFinCampoOuvindo(false);
        rec.onend = () => setFinCampoOuvindo(false);
        rec.start();
    };

    const ouvirCampoLead = (nomeCampo, setFuncaoEstado) => {
        if (!('webkitSpeechRecognition' in window)) return alert('Use Chrome para voz.');
        if (leadCampoOuvindo === nomeCampo) {
            if (recognitionRef.current) recognitionRef.current.stop();
            setLeadCampoOuvindo(null);
            return;
        }
        if (recognitionRef.current) recognitionRef.current.stop();
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'pt-BR';
        recognition.interimResults = false;
        recognitionRef.current = recognition;
        recognition.onstart = () => setLeadCampoOuvindo(nomeCampo);
        recognition.onresult = (event) => {
            const texto = event.results[0][0].transcript;
            if (nomeCampo === 'telefone') setFuncaoEstado(texto.replace(/\D/g, ''));
            else setFuncaoEstado(texto);
        };
        recognition.onerror = () => setLeadCampoOuvindo(null);
        recognition.onend = () => setLeadCampoOuvindo(null);
        recognition.start();
    };

    return { campoOuvindo, setCampoOuvindo, finCampoOuvindo, ouvirCampo, ouvirFinDesc, leadCampoOuvindo, ouvirCampoLead };
}