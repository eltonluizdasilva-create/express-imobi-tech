
import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const raiz = process.cwd();
const saida = path.join(raiz, 'tests', '.render_credito.mjs');

const stubFirestore = {
  name: 'stub-firestore',
  setup(b) {
    b.onResolve({ filter: /^firebase\/firestore$/ }, () => ({ path: 'stub-firestore', namespace: 'stub' }));
    b.onLoad({ filter: /^stub-firestore$/, namespace: 'stub' }, () => ({
      contents: [
        'const noop=()=>({});',
        'export const doc=noop, collection=noop, query=noop, orderBy=noop, limit=noop, where=noop;',
        'export const getDoc=async()=>({exists:()=>false,data:()=>({})});',
        'export const getDocs=async()=>({empty:true,docs:[]});',
        'export const addDoc=async()=>({id:\'teste\'});',
        'export const setDoc=async()=>{}, updateDoc=async()=>{}, deleteDoc=async()=>{};',
        'export const serverTimestamp=()=>null;',
        'export const getFirestore=()=>({}), connectFirestoreEmulator=()=>{};',
        'export const onSnapshot=()=>()=>{};',
        'export const arrayUnion=(...a)=>({__arrayUnion:a}), arrayRemove=(...a)=>({__arrayRemove:a});',
        'export const increment=(n)=>({__increment:n}), Timestamp={fromDate:(d)=>d, now:()=>new Date()};',
        'export const getFirestore2=()=>({}), initializeApp=()=>({});',
      ].join('\n'),
      loader: 'js',
    }));
    // stub do módulo de firebase do projeto (init do app no Node)
    b.onResolve({ filter: /(^|\/)lib\/firebase(\.js)?$/ }, () => ({ path: 'stub-fb', namespace: 'stub' }));
    b.onLoad({ filter: /^stub-fb$/, namespace: 'stub' }, () => ({
      contents: 'export const db={}; export const storage={}; export const auth={}; const app={}; export default app;',
      loader: 'js',
    }));
  },
};

await build({
  entryPoints: [path.join(raiz, 'tests', 'render_credito.entry.jsx')],
  outfile: saida,
  bundle: true,
  platform: 'node',
  format: 'esm',
  jsx: 'automatic',
  loader: { '.js': 'jsx' },
  external: ['react', 'react-dom', 'react-dom/server', 'react/jsx-runtime', 'lucide-react'],
  plugins: [stubFirestore],
  // firebase.js lê import.meta.env: no Node ele é undefined e o init do app quebra.
  define: {
    'import.meta.env': JSON.stringify({
      VITE_FIREBASE_API_KEY: 'demo-key',
      VITE_FIREBASE_AUTH_DOMAIN: 'demo.firebaseapp.com',
      VITE_FIREBASE_PROJECT_ID: 'demo-express-imobi',
      VITE_FIREBASE_STORAGE_BUCKET: 'demo.appspot.com',
      VITE_FIREBASE_MESSAGING_SENDER_ID: '1',
      VITE_FIREBASE_APP_ID: '1:1:web:1',
    }),
  },
  logLevel: 'error',
});

await import(pathToFileURL(saida).href);
