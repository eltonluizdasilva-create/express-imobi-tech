const fs = require('fs');
const path = 'src/Admin.jsx';

try {
    const content = fs.readFileSync(path, 'utf8');
    const startTag = '{/* ===== DESMANCHE ===== */}';
    const endTag = '{/* ===== FORNECEDORES - visão da oficina ===== */}';

    const startIndex = content.indexOf(startTag);
    const endIndex = content.indexOf(endTag);

    if (startIndex === -1 || endIndex === -1) {
        console.error('Could not find tags:');
        console.error('Start index:', startIndex);
        console.error('End index:', endIndex);
        process.exit(1);
    }

    const replacement = startTag + `\n        {abaAtiva === 'desmanche' && (
          <Desmanche 
            oficinaId={oficinaId} 
            dadosOficina={dadosOficina} 
            db={db} 
            carregarFinanceiro={carregarFinanceiro}
            setLightboxFotos={setLightboxFotos}
            setLightboxIdx={setLightboxIdx}
            setLightboxAberto={setLightboxAberto}
          />
        )}\n\n        `;

    const newContent = content.substring(0, startIndex) + replacement + content.substring(endIndex);

    fs.writeFileSync(path, newContent, 'utf8');
    console.log('Replaced successfully! O bloco do Desmanche foi atualizado.');
} catch (err) {
    console.error('Error during refactor:', err);
}
