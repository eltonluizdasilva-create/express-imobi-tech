/* eslint-disable react/prop-types */
import React, { useRef, useState } from 'react';

export default function SpeechTextarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  style = {},
  labelStyle = {},
  buttonStyle = {},
}) {
  const recognitionRef = useRef(null);
  const [gravando, setGravando] = useState(false);

  const iniciarDitado = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Ditado por voz não disponível neste navegador.');
      return;
    }

    if (gravando && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setGravando(true);
    recognition.onend = () => setGravando(false);
    recognition.onerror = () => setGravando(false);
    recognition.onresult = (event) => {
      const textoFalado = Array.from(event.results)
        .map((result) => result[0]?.transcript || '')
        .join(' ')
        .trim();

      if (!textoFalado) return;

      const proximoTexto = value ? `${value}${value.endsWith(' ') || value.endsWith('\n') ? '' : ' '}${textoFalado}` : textoFalado;
      onChange(proximoTexto);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      {label && (
        <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '5px', ...labelStyle }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: '12px 54px 12px 12px',
            background: '#111',
            border: '1px solid #333',
            color: 'white',
            borderRadius: '8px',
            resize: 'vertical',
            boxSizing: 'border-box',
            ...style,
          }}
        />
        <button
          type="button"
          onClick={iniciarDitado}
          title={gravando ? 'Parar gravação' : 'Ditado por voz'}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            border: '1px solid #444',
            background: gravando ? '#FF0033' : '#1a1a1a',
            color: 'white',
            cursor: 'pointer',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            ...buttonStyle,
          }}
        >
          🎙️
        </button>
      </div>
      <p style={{ margin: '6px 0 0 0', color: gravando ? '#FF0033' : '#666', fontSize: '10px' }}>
        {gravando ? 'Ouvindo... toque no microfone para parar.' : 'Toque no microfone para preencher por voz.'}
      </p>
    </div>
  );
}
