"use client"

import { useEffect } from "react";
import { collection, addDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import {db} from "../../../firebase.ts";

export const GlobalErrorInterceptor = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();

    useEffect(() => {
        const reportError = async (message: string, stack?: string) => {
            try {
                // Evita reportar erros em ambiente de desenvolvimento (opcional)
                if (process.env.NODE_ENV === 'development') {
                    console.warn("Log de erro ignorado no modo dev:", message);
                    return;
                }

                await addDoc(collection(db, "client_logs"), {
                    userId: user?.id || 'anonymous',
                    userEmail: user?.email || 'not-logged',
                    error: message,
                    stack: stack || 'N/A',
                    url: window.location.href,
                    userAgent: navigator.userAgent,
                    createdAt: new Date().toISOString()
                });
            } catch (e) {
                console.error("Falha ao reportar erro ao Firebase:", e);
            }
        };

        // 1. Captura erros de lógica e exceções não tratadas
        const handleGlobalError = (event: ErrorEvent) => {
            reportError(event.message, event.error?.stack);
        };

        // 2. Captura Promises rejeitadas e não tratadas (Ex: erro em fetch/Firebase)
        const handlePromiseRejection = (event: PromiseRejectionEvent) => {
            const msg = event.reason?.message || JSON.stringify(event.reason);
            reportError(`Promise Rejection: ${msg}`, event.reason?.stack);
        };

        window.addEventListener("error", handleGlobalError);
        window.addEventListener("unhandledrejection", handlePromiseRejection);

        return () => {
            window.removeEventListener("error", handleGlobalError);
            window.removeEventListener("unhandledrejection", handlePromiseRejection);
        };
    }, [user]);

    return <>{children}</>;
};