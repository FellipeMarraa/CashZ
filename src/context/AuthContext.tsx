import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthChange, logout as firebaseLogout } from "../../firebase.ts";
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
    loading: boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthChange((firebaseUser: FirebaseUser | null) => {
            if (firebaseUser) {
                const newUser: User = {
                    id: firebaseUser.uid,
                    email: firebaseUser.email || "",
                    name: firebaseUser.displayName || "Usuário",
                    photo: firebaseUser.photoURL || "",
                    roles: [],
                };
                setUser(newUser);
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const logout = async (callback?: () => void) => {
        await firebaseLogout();
        setUser(null);
        if (callback) callback();
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, setUser, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextProps => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};