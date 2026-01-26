import {initializeApp} from "firebase/app";
import {getFirestore} from 'firebase/firestore/lite';
import {
    createUserWithEmailAndPassword,
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut
} from "firebase/auth";
import {toast} from "@/components/ui/use-toast";

const firebaseConfig = {
    apiKey: "AIzaSyCRFilxwocJcaTGyK2oNf8yYPYm-1PVGNs",
    authDomain: "cashz-c832d.firebaseapp.com",
    projectId: "cashz-c832d",
    storageBucket: "cashz-c832d.firebasestorage.app",
    messagingSenderId: "682821596364",
    appId: "1:682821596364:web:a1fb2324dd786c57097e69",
    measurementId: "G-KCWPPXWR3R"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export async function register(email: string, password: string) {
    try {
        await createUserWithEmailAndPassword(auth, email, password);
        toast({
            title: "Registrado com sucesso!",
            description: "Conta criada e logada com sucesso.",
            duration: 2000
        });
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Erro ao registrar!",
            description: "Erro: " + error,
            duration: 1000
        });
    }
}

// Função para logar um usuário existente
export async function login(email: string, password: string) {
    try {
        await signInWithEmailAndPassword(auth, email, password);
        toast({
            title: "Login bem-sucedido!",
            description: "Você foi logado com sucesso.",
            duration: 1000
        });
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Erro ao fazer login!",
            description: "Erro: " + error,
            duration: 3000
        });
    }
}

// Função para deslogar o usuário
export async function logout() {
    try {
        await signOut(auth);
        toast({
            title: "Logout realizado!",
            description: "Você foi desconectado com sucesso.",
            duration: 1000
        });
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Erro ao deslogar!",
            description: "Erro: " + error,
            duration: 3000
        });
    }
}

export function onAuthChange(callback: (user: any) => void) {
    onAuthStateChanged(auth, user => {
        callback(user);
    });
}

export { db, auth };