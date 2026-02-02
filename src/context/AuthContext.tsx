import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthChange, logout as firebaseLogout, auth, db } from "../../firebase.ts";
import { User as FirebaseUser } from "firebase/auth";
import { collection, query, where, getDocs, writeBatch, doc } from "firebase/firestore/lite";

interface User {
    id: string;
    email: string;
    name: string;
    photo: string;
    roles: string[];
}

interface AuthContextProps {
    user: User | null;
    isAuthenticated: boolean;
    setUser: (user: User | null) => void;
    logout: (callback?: () => void) => void;
    refreshUser: () => Promise<void>;
    deleteAccount: () => Promise<void>;
    loading: boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const mapUser = (firebaseUser: FirebaseUser): User => ({
        id: firebaseUser.uid,
        email: firebaseUser.email || "",
        name: firebaseUser.displayName || "Usuário",
        photo: firebaseUser.photoURL || "",
        roles: [],
    });

    useEffect(() => {
        const unsubscribe = onAuthChange((firebaseUser: FirebaseUser | null) => {
            if (firebaseUser) {
                setUser(mapUser(firebaseUser));
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const refreshUser = async () => {
        const currentUser = auth.currentUser;
        if (currentUser) {
            await currentUser.reload();
            setUser(mapUser(auth.currentUser!));
        }
    };

    const logout = async (callback?: () => void) => {
        await firebaseLogout();
        setUser(null);
        if (callback) callback();
    };

    // --- FUNÇÃO DE LIMPEZA DE DADOS NO FIRESTORE ---
    const cleanupUserData = async (userId: string) => {
        const collections = ["transactions", "investments", "budgets", "categories"];
        const batch = writeBatch(db);

        for (const collectionName of collections) {
            // Busca documentos onde o campo userId é igual ao uid
            const q = query(collection(db, collectionName), where("userId", "==", userId));
            const querySnapshot = await getDocs(q);

            querySnapshot.forEach((document) => {
                batch.delete(doc(db, collectionName, document.id));
            });
        }

        batch.delete(doc(db, "user_preferences", userId));

        await batch.commit();
    };

    const deleteAccount = async () => {
        const currentUser = auth.currentUser;
        if (currentUser) {
            const userId = currentUser.uid;
            try {
                // 1. Primeiro limpa os dados do banco enquanto ainda tem permissão (logado)
                await cleanupUserData(userId);

                // 2. Depois deleta o usuário da autenticação
                await currentUser.delete();

                setUser(null);
            } catch (error: any) {
                if (error.code === 'auth/requires-recent-login') {
                    throw new Error("REAUTHENTICATION_REQUIRED");
                }
                throw error;
            }
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            setUser,
            logout,
            refreshUser,
            deleteAccount,
            loading
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextProps => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};