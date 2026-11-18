
import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const raiz = process.cwd();
const saida = path.join(raiz, 'tests', '.render_portais.mjs');

const stubs = {
  name: 'stubs',
  setup(b) {
    b.onResolve({ filter: /^firebase\/firestore$/ }, () => ({ path: 'fs', namespace: 'stub' }));
    b.onResolve({ filter: /^firebase\/auth$/ }, () => ({ path: 'auth', namespace: 'stub' }));
    b.onResolve({ filter: /(^|\/)lib\/firebase(\.js)?$/ }, () => ({ path: 'fb', namespace: 'stub' }));
    b.onResolve({ filter: /contexts\/AuthContext$/ }, () => ({ path: 'ctx', namespace: 'stub' }));

    b.onLoad({ filter: /^fs$/, namespace: 'stub' }, () => ({
      contents: [
        'const noop=()=>({});',
        'export const doc=noop, collection=noop, query=noop, where=noop, orderBy=noop, limit=noop;',
        'export const getDoc=async()=>({exists:()=>false,data:()=>({})});',
        'export const getDocs=async()=>({empty:true,docs:[]});',
        'export const addDoc=async()=>({id:"x"});',
        'export const setDoc=async()=>{}, updateDoc=async()=>{}, deleteDoc=async()=>{};',
        'export const serverTimestamp=()=>null, arrayUnion=()=>({});',
        'export const getFirestore=noop, connectFirestoreEmulator=()=>{};',
        'export const onSnapshot=()=>()=>{};',
      ].join('\n'),
      loader: 'js',
    }));
    b.onLoad({ filter: /^auth$/, namespace: 'stub' }, () => ({
      contents: 'export const getAuth=()=>({}); export const onAuthStateChanged=()=>()=>{}; export const signOut=async()=>{}; export const connectAuthEmulator=()=>{};',
      loader: 'js',
    }));
    b.onLoad({ filter: /^fb$/, namespace: 'stub' }, () => ({
      contents: 'export const db={}; export const auth={}; export const storage={}; const app={}; export default app;',
      loader: 'js',
    }));
    b.onLoad({ filter: /^ctx$/, namespace: 'stub' }, () => ({
      contents: 'export const useAuth=()=>({ currentUserId:"ofi_teste_123456", papelLogado:"dono", dadosOficina:{ id:"ofi_teste_123456" } }); export const AuthProvider=({children})=>children;',
      loader: 'js',
    }));
  },
};

await build({
  entryPoints: [path.join(raiz, 'tests', 'render_portais.entry.jsx')],
  outfile: saida,
  bundle: true,
  platform: 'node',
  format: 'esm',
  jsx: 'automatic',
  loader: { '.js': 'jsx' },
  external: ['react', 'react-dom', 'react-dom/server', 'react/jsx-runtime', 'lucide-react'],
  plugins: [stubs],
  define: { 'import.meta.env': JSON.stringify({ VITE_FIREBASE_PROJECT_ID: 'demo' }) },
  logLevel: 'error',
});

await import(pathToFileURL(saida).href);
