import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore/lite';
import { sendPasswordResetEmail } from "firebase/auth";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    User
} from "firebase/auth";
import { toast } from "@/hooks/use-toast.ts";

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
const googleProvider = new GoogleAuthProvider();

export async function register(email: string, password: string) {
    try {
        await createUserWithEmailAndPassword(auth, email, password);
        toast({
            title: "Registrado com sucesso!",
            description: "Conta criada e logada com sucesso.",
            duration: 2000
        });
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Erro ao registrar!",
            description: "Erro: " + (error.message || error),
            duration: 3000
        });
    }
}

export async function login(email: string, password: string) {
    try {
        await signInWithEmailAndPassword(auth, email, password);
        toast({
            title: "Login bem-sucedido!",
            description: "Você foi logado com sucesso.",
            duration: 1000
        });
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Erro ao fazer login!",
            description: "Erro: " + (error.message || error),
            duration: 3000
        });
    }
}

export async function loginWithGoogle() {
    try {
        await signInWithPopup(auth, googleProvider);
        toast({
            title: "Login Google bem-sucedido!",
            description: "Você entrou com sua conta Google.",
            duration: 1000
        });
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Erro no login Google!",
            description: "Erro: " + (error.message || error),
            duration: 3000
        });
    }
}

export async function logout() {
    try {
        await signOut(auth);
        toast({
            title: "Logout realizado!",
            description: "Você foi desconectado com sucesso.",
            duration: 1000
        });
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Erro ao deslogar!",
            description: "Erro: " + (error.message || error),
            duration: 3000
        });
    }
}

export const resetPassword = async (email: string) => {
    try {
        await sendPasswordResetEmail(auth, email);
        toast({
            title: "Email enviado!",
            description: "Verifique sua caixa de entrada para redefinir a senha.",
        });
    } catch (error: any) {
        let message = "Ocorreu um erro ao tentar enviar o email.";
        if (error.code === "auth/user-not-found") message = "Este email não está cadastrado.";
        if (error.code === "auth/invalid-email") message = "Email inválido.";

        toast({
            variant: "destructive",
            title: "Erro ao redefinir senha",
            description: message,
        });
        throw error;
    }
};

export function onAuthChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, (user) => {
        callback(user);
    });
}

export { db, auth };