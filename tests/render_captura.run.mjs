/**
 * render_captura.run.mjs — renderiza o modal/botão fora do navegador.
 * `src/lib/firebase.js` é substituído por um stub (o SDK real exigiria
 * variáveis de ambiente) para provar que a árvore monta sem quebrar.
 */
import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const raiz = process.cwd();
const saida = path.join(raiz, 'tests', '.render_captura.mjs');

const stubFirebase = {
  name: 'stub-firebase',
  setup(b) {
    b.onResolve({ filter: /lib\/firebase(\.js)?$/ }, () => ({ path: 'firebase-stub', namespace: 'stub' }));
    b.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({
      contents: 'export const db = {}; export const auth = { currentUser: null };',
      loader: 'js',
    }));
  },
};

await build({
  entryPoints: [path.join(raiz, 'tests', 'render_captura.entry.jsx')],
  outfile: saida,
  bundle: true,
  platform: 'node',
  format: 'esm',
  jsx: 'automatic',
  loader: { '.js': 'jsx' },
  external: ['react', 'react-dom', 'react-dom/server', 'react/jsx-runtime', 'lucide-react', 'firebase/firestore'],
  plugins: [stubFirebase],
  logLevel: 'error',
});

await import(pathToFileURL(saida).href);
