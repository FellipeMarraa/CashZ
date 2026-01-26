import React, {createContext, useContext, useEffect, useState} from "react";
import {jwtDecode} from "jwt-decode";

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
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const decoded: any = jwtDecode(token);
                const newUser = {
                    id: decoded.id,
                    email: decoded.email,
                    name: decoded.name,
                    photo: decoded.photo,
                    roles: decoded.roles || [],
                };
                setUser(newUser);
            } catch (e) {
                setUser(null);
            }
        }
    }, []);


    const logout = (callback?: () => void) => {
        localStorage.removeItem("token");
        setUser(null);
        if (callback) callback();
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, setUser, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextProps => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};
