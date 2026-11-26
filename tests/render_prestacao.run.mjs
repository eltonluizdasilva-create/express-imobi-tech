/**
 * render_prestacao.run.mjs — renderiza a sub-aba Prestação de Contas fora do
 * navegador. `src/lib/firebase.js` é trocado por um stub (o SDK real exigiria
 * variáveis de ambiente) para provar que a árvore monta e não imprime
 * `undefined`/`NaN`.
 */
import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const raiz = process.cwd();
const saida = path.join(raiz, 'tests', '.render_prestacao.mjs');

const stubFirebase = {
  name: 'stub-firebase',
  setup(b) {
    // O filtro casa o caminho absoluto do arquivo (Windows usa '\').
    b.onLoad({ filter: /src[\\/]lib[\\/]firebase\.js$/ }, () => ({
      contents: 'export const db = {}; export const auth = { currentUser: null }; export const storage = {};',
      loader: 'js',
    }));
  },
};

await build({
  entryPoints: [path.join(raiz, 'tests', 'render_prestacao.entry.jsx')],
  outfile: saida,
  bundle: true,
  platform: 'node',
  format: 'esm',
  jsx: 'automatic',
  loader: { '.js': 'jsx' },
  external: [
    'react', 'react-dom', 'react-dom/server', 'react/jsx-runtime', 'lucide-react',
    'firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage',
  ],
  plugins: [stubFirebase],
  logLevel: 'error',
});

await import(pathToFileURL(saida).href);
