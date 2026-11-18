
import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const raiz = process.cwd();
const saida = path.join(raiz, 'tests', '.render_onboarding.mjs');

const stubs = {
  name: 'stubs',
  setup(b) {
    b.onResolve({ filter: /^firebase\/(firestore|auth|functions|app)$/ }, (a) => ({ path: a.path.split('/')[1], namespace: 'stub' }));
    b.onResolve({ filter: /(^|\/)lib\/firebase(\.js)?$/ }, () => ({ path: 'fb', namespace: 'stub' }));

    b.onLoad({ filter: /^firestore$/, namespace: 'stub' }, () => ({ loader: 'js', contents: `
      const noop = () => ({});
      export const doc = noop, collection = noop, query = noop, where = noop, orderBy = noop, limit = noop;
      export const getDoc = async () => ({ exists: () => false, data: () => ({}) });
      export const getDocs = async () => ({ empty: true, docs: [] });
      export const setDoc = async () => {}, updateDoc = async () => {}, deleteDoc = async () => {}, addDoc = async () => ({ id: 'x' });
      export const serverTimestamp = () => null, arrayUnion = () => ({}), Timestamp = { now: () => 0 };
      export const getFirestore = noop, onSnapshot = () => () => {};
    ` }));

    b.onLoad({ filter: /^auth$/, namespace: 'stub' }, () => ({ loader: 'js', contents: `
      export const getAuth = () => ({ currentUser: { uid: 'UID_TESTE', email: 'teste@exemplo.com' } });
      export const onAuthStateChanged = () => () => {};
      export const signOut = async () => {};
    ` }));

    b.onLoad({ filter: /^functions$/, namespace: 'stub' }, () => ({ loader: 'js', contents: `
      export const getFunctions = () => ({}), httpsCallable = () => async () => ({ data: { ok: true } });
    ` }));

    b.onLoad({ filter: /^app$/, namespace: 'stub' }, () => ({ loader: 'js', contents: 'export const getApp = () => ({});' }));

    b.onLoad({ filter: /^fb$/, namespace: 'stub' }, () => ({ loader: 'js', contents: 'export const db = {}; export const auth = {}; export const storage = {};' }));
  },
};

await build({
  entryPoints: [path.join(raiz, 'tests', 'render_onboarding.entry.jsx')],
  outfile: saida, bundle: true, platform: 'node', format: 'esm', jsx: 'automatic',
  loader: { '.js': 'jsx' },
  external: ['react', 'react-dom', 'react-dom/server', 'react/jsx-runtime', 'lucide-react'],
  plugins: [stubs],
  define: { 'import.meta.env': JSON.stringify({}) },
  logLevel: 'error',
});
await import(pathToFileURL(saida).href);
