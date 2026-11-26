/**
 * render_migracao.run.mjs — monta o harness SSR do wizard de Migração (D-23.16).
 *
 * Os SDKs que dependem de navegador (Firebase, xlsx, browser-image-compression)
 * são substituídos por stubs: aqui interessa provar que a árvore das 3 etapas
 * renderiza sem quebrar e sem nenhuma trava de plano.
 */
import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const raiz = process.cwd();
const saida = path.join(raiz, 'tests', '.render_migracao.mjs');

const stubs = {
  name: 'stubs-migracao',
  setup(b) {
    b.onResolve({ filter: /firebase(\.js)?$/ }, () => ({ path: 'firebase-stub', namespace: 'stub' }));
    b.onResolve({ filter: /^firebase\/(firestore|storage|app|auth)$/ }, (args) => ({
      path: `fb-${args.path.split('/')[1]}`,
      namespace: 'stub',
    }));
    b.onResolve({ filter: /^xlsx$/ }, () => ({ path: 'xlsx-stub', namespace: 'stub' }));
    b.onResolve({ filter: /^browser-image-compression$/ }, () => ({ path: 'bic-stub', namespace: 'stub' }));

    b.onLoad({ filter: /^firebase-stub$/, namespace: 'stub' }, () => ({
      contents: 'export const db = {}; export const storage = {}; export const auth = { currentUser: null };',
      loader: 'js',
    }));
    b.onLoad({ filter: /^fb-(app|auth)$/, namespace: 'stub' }, () => ({
      contents: 'export const initializeApp = () => ({}); export const getApp = () => ({});',
      loader: 'js',
    }));
    b.onLoad({ filter: /^fb-firestore$/, namespace: 'stub' }, () => ({
      contents:
        'export const addDoc = async () => ({ id: "x" }); export const collection = () => ({}); export const serverTimestamp = () => null;',
      loader: 'js',
    }));
    b.onLoad({ filter: /^fb-storage$/, namespace: 'stub' }, () => ({
      contents:
        'export const ref = () => ({}); export const uploadBytes = async () => ({}); export const getDownloadURL = async () => "https://exemplo/foto.webp";',
      loader: 'js',
    }));
    b.onLoad({ filter: /^xlsx-stub$/, namespace: 'stub' }, () => ({
      contents:
        'export const read = () => ({ SheetNames: [], Sheets: {} }); export const utils = { sheet_to_json: () => [] };',
      loader: 'js',
    }));
    b.onLoad({ filter: /^bic-stub$/, namespace: 'stub' }, () => ({
      contents: 'export default async function imageCompression(file) { return file; }',
      loader: 'js',
    }));
  },
};

await build({
  entryPoints: [path.join(raiz, 'tests', 'render_migracao.entry.jsx')],
  outfile: saida,
  bundle: true,
  platform: 'node',
  format: 'esm',
  jsx: 'automatic',
  loader: { '.js': 'jsx' },
  external: ['react', 'react-dom', 'react-dom/server', 'react/jsx-runtime', 'lucide-react'],
  plugins: [stubs],
  logLevel: 'error',
});

await import(pathToFileURL(saida).href);
