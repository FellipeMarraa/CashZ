import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthChange, logout as firebaseLogout, auth } from "../../firebase.ts"; // Importe 'auth'
import { User as FirebaseUser } from "firebase/auth";

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

    // Função para transformar FirebaseUser em seu User customizado
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

    // Função para forçar a atualização dos dados do usuário logado
    const refreshUser = async () => {
        const currentUser = auth.currentUser;
        if (currentUser) {
            // Força o Firebase a buscar os dados mais recentes do servidor (como o displayName novo)
            await currentUser.reload();
            setUser(mapUser(auth.currentUser!));
        }
    };

    const logout = async (callback?: () => void) => {
        await firebaseLogout();
        setUser(null);
        if (callback) callback();
    };

    const deleteAccount = async () => {
        const currentUser = auth.currentUser;
        if (currentUser) {
            try {
                await currentUser.delete();
                setUser(null);
            } catch (error: any) {
                // Firebase exige login recente para deletar conta
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