const fs = require('fs');
const file = 'C:/Users/Elton/Desktop/oficina-ia-master/oficina-ia-master/src/Admin.jsx';
let content = fs.readFileSync(file, 'utf8');
const isCrLf = content.includes('\r\n');
const lines = content.split(/\r?\n/);
console.log('Start line (5542):', lines[5541]);
console.log('End line (6253):', lines[6252]);

if (lines[5541].includes("abaAtiva === 'desmanche'") && lines[6252].includes("})()}")) {
  lines.splice(5541, 712, `        {abaAtiva === 'desmanche' && (
          <Desmanche 
            oficinaId={oficinaId} 
            dadosOficina={dadosOficina} 
            db={db} 
            carregarFinanceiro={carregarFinanceiro}
            setLightboxFotos={setLightboxFotos}
            setLightboxIdx={setLightboxIdx}
            setLightboxAberto={setLightboxAberto}
          />
        )}`);
  fs.writeFileSync(file, lines.join(isCrLf ? '\r\n' : '\n'));
  console.log('Replaced!');
} else {
  console.log('Lines did not match, aborting.');
}
