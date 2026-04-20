import { initializeApp } from 'firebase/app';
import { getFirestore, collectionGroup, query, where, getDocs, deleteDoc } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyCJtPXpPtHIhNCnqLRF5zJOq-AJR6cyZec",
    authDomain: "express-ai-automation.firebaseapp.com",
    projectId: "express-ai-automation",
    storageBucket: "express-ai-automation.firebasestorage.app",
    messagingSenderId: "234700237204",
    appId: "1:234700237204:web:0c99f3290c9b7cb9c10781"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function cleanup() {
    console.log('Iniciando limpeza...');
    const osId = '9MqsN0YFHP3GhIhvy4TS';
    const placa = 'MMM0000';

    const q = query(collectionGroup(db, 'os'), where('placa', '==', placa));
    const querySnapshot = await getDocs(q);

    let found = false;
    for (const document of querySnapshot.docs) {
        if (document.id === osId) {
            console.log('Documento encontrado:', document.ref.path);
            await deleteDoc(document.ref);
            console.log('Documento deletado com sucesso!');
            found = true;
        }
    }

    if (!found) {
        console.log('Documento não encontrado com a placa ' + placa + ' e ID ' + osId);
        console.log('Listando OS com essa placa encontradas:');
        querySnapshot.forEach(d => console.log('ID:', d.id, 'Path:', d.ref.path));
    }

    process.exit(0);
}

cleanup().catch(err => {
    console.error(err);
    process.exit(1);
});
