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
    const deleteAccount = async () => {
        const currentUser = auth.currentUser;
        if (!currentUser) return;
        const userId = currentUser.uid;

        const collections = [
            { name: "transactions", filter: "userId" },
            { name: "investments", filter: "userId" },
            { name: "budgets", filter: "userId" },
            { name: "categories", filter: "userId" },
            { name: "notifications", filter: "userId" },
            { name: "sharing", filter: "ownerId" },
            { name: "hidden_categories", filter: "userId" }
        ];

        let allDocsRefs: any[] = [];
        for (const col of collections) {
            const q = query(collection(db, col.name), where(col.filter, "==", userId));
            const snap = await getDocs(q);
            snap.forEach(d => allDocsRefs.push(doc(db, col.name, d.id)));
        }

        try {
            const batch = writeBatch(db);
            allDocsRefs.forEach(ref => batch.delete(ref));
            batch.delete(doc(db, "user_preferences", userId));
            batch.delete(doc(db, "users_metadata", userId));
            await batch.commit();
        } catch (dbError: any) {
            console.error("Erro ao limpar banco:", dbError);
            throw new Error("Erro de permissão: Não foi possível limpar seus dados financeiros.");
        }

        try {
            await currentUser.delete();
            setUser(null);
        } catch (authError: any) {
            if (authError.code === 'auth/requires-recent-login') {
                throw new Error("REAUTHENTICATION_REQUIRED");
            }
            throw authError;
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