# Notebook do Projeto - Express Auto Tech

## Registro de Fatos Técnicos

- **Identidade da Marca:** O sistema foi oficialmente atualizado para Express Auto Tech.
- **Performance:** O arquivo `App.jsx` já utiliza Lazy Loading, dividindo o bundle de 2.2 MB para carregamento rápido em 3G/4G.
- **PWA e Cache:** O `vite.config.js` está configurado para suportar arquivos de até 4 MiB, permitindo o funcionamento offline em Araguari.
- **Correção de Build:** O erro de Duplicate key "bg" foi resolvido através da limpeza de chaves redundantes no objeto de temas.
- **Estrutura de Dados:** O sistema utiliza o campo oficinaId (ex: "oficina_teste_01") no Cloud Firestore para garantir o isolamento dos dados entre diferentes oficinas.
