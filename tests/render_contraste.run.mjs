import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const raiz = process.cwd();
const saida = path.join(raiz, 'tests', '.render_contraste.mjs');

const stubs = {
  name: 'stubs',
  setup(b) {
    b.onResolve({ filter: /^firebase\/(firestore|auth|functions|app|storage)$/ }, (a) => ({
      path: a.path.split('/')[1],
      namespace: 'stub',
    }));
    b.onResolve({ filter: /(^|\/)lib\/firebase(\.js)?$/ }, () => ({ path: 'fb', namespace: 'stub' }));

    b.onLoad({ filter: /^firestore$/, namespace: 'stub' }, () => ({
      loader: 'js',
      contents: `
      const noop = () => ({});
      export const doc = noop, collection = noop, query = noop, where = noop, orderBy = noop, limit = noop;
      export const getDoc = async () => ({ exists: () => false, data: () => ({}) });
      export const getDocs = async () => ({ empty: true, docs: [], forEach() {} });
      export const setDoc = async () => {}, updateDoc = async () => {}, deleteDoc = async () => {}, addDoc = async () => ({ id: 'x' });
      export const serverTimestamp = () => null, arrayUnion = () => ({}), Timestamp = { now: () => 0 };
      export const getFirestore = noop, onSnapshot = () => () => {}, writeBatch = () => ({ set() {}, update() {}, delete() {}, commit: async () => {} });
      export const increment = (n) => n, deleteField = () => null;
      export const connectFirestoreEmulator = noop, arrayRemove = () => ({}), runTransaction = async () => ({});
      export const startAfter = noop, onSnapshotDocs = noop;
    `,
    }));

    b.onLoad({ filter: /^auth$/, namespace: 'stub' }, () => ({
      loader: 'js',
      contents: `
      const usuario = { uid: 'UID_TESTE', email: 'teste@exemplo.com', displayName: 'Teste', getIdToken: async () => 'token' };
      export const getAuth = () => ({ currentUser: usuario });
      export const onAuthStateChanged = () => () => {};
      export const signOut = async () => {};
      export const connectAuthEmulator = () => {};
      export const GoogleAuthProvider = class { static credential() { return null; } };
      export const signInWithEmailAndPassword = async () => ({ user: usuario });
      export const createUserWithEmailAndPassword = async () => ({ user: usuario });
      export const signInWithPopup = async () => ({ user: usuario });
      export const updateProfile = async () => {};
      export const sendPasswordResetEmail = async () => {};
      export const setPersistence = async () => {};
      export const browserLocalPersistence = {};
      export const getAdditionalUserInfo = () => null;
    `,
    }));

    b.onLoad({ filter: /^functions$/, namespace: 'stub' }, () => ({
      loader: 'js',
      contents: 'export const getFunctions = () => ({}), httpsCallable = () => async () => ({ data: { ok: true } });',
    }));

    b.onLoad({ filter: /^app$/, namespace: 'stub' }, () => ({
      loader: 'js',
      contents: 'export const initializeApp = () => ({}), getApp = () => ({}), getApps = () => [], deleteApp = async () => {};',
    }));
    b.onLoad({ filter: /^storage$/, namespace: 'stub' }, () => ({
      loader: 'js',
      contents: 'export const getStorage = () => ({}), ref = () => ({}), uploadBytes = async () => ({}), getDownloadURL = async () => "https://exemplo/x.png";',
    }));
    b.onLoad({ filter: /^fb$/, namespace: 'stub' }, () => ({
      loader: 'js',
      contents: 'export const db = {}; export const auth = {}; export const storage = {};',
    }));
  },
};

await build({
  entryPoints: [path.join(raiz, 'tests', 'render_contraste.entry.jsx')],
  outfile: saida,
  bundle: true,
  platform: 'node',
  format: 'esm',
  jsx: 'automatic',
  loader: { '.js': 'jsx' },
  external: ['react', 'react-dom', 'react-dom/server', 'react/jsx-runtime', 'lucide-react'],
  plugins: [stubs],
  define: { 'import.meta.env': JSON.stringify({}) },
  logLevel: 'error',
});

await import(pathToFileURL(saida).href);
