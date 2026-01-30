import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { db, auth } from "../../firebase";
import { useAuth } from "@/context/AuthContext";
import {
    collection,
    addDoc,
    updateDoc,
    doc,
    query,
    where,
    getDocs,
    serverTimestamp, deleteDoc
} from 'firebase/firestore/lite'; // Padronizado para Lite como seu exemplo
import { InvestmentItem } from "@/components/dashboard/sections/investments-section.tsx";

const COLLECTION_NAME = 'investments';

// --- FUN√á√ÉO DE LIMPEZA (Crucial para evitar erros de undefined no Firebase) ---
const sanitizeData = (data: any) => {
    const cleanData = { ...data };
    Object.keys(cleanData).forEach(key => {
        if (cleanData[key] === undefined) {
            delete cleanData[key];
        }
    });
    return cleanData;
};

const api = {
    async getInvestments(): Promise<InvestmentItem[]> {
        const user = auth.currentUser;
        if (!user) return [];

        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where("userId", "==", user.uid)
            );

            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as InvestmentItem[];
        } catch (error) {
            console.error("Erro ao buscar investimentos:", error);
            throw error;
        }
    },

    async saveInvestment(data: any): Promise<void> {
        const user = auth.currentUser;
        if (!user) throw new Error("Usu√°rio n√£o autenticado");

        const { id, ...rest } = data;

        // Prepara o payload removendo IDs e campos undefined
        const payload = sanitizeData({
            ...rest,
            userId: user.uid,
            updatedAt: serverTimestamp()
        });

        try {
            if (id) {
                // Update
                const docRef = doc(db, COLLECTION_NAME, id);
                await updateDoc(docRef, payload);
            } else {
                // Create
                const collectionRef = collection(db, COLLECTION_NAME);
                await addDoc(collectionRef, {
                    ...payload,
                    createdAt: serverTimestamp()
                });
            }
        } catch (error) {
            console.error("Erro ao salvar no Firestore:", error);
            throw error;
        }
    },

    // --- NOVA FUN«√O DE EXCLUS√O ---
    async deleteInvestment(id: string): Promise<void> {
        const user = auth.currentUser;
        if (!user) throw new Error("Usu·rio n„o autenticado");

        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await deleteDoc(docRef);
        } catch (error) {
            console.error("Erro ao excluir investimento:", error);
            throw error;
        }
    }
};

// --- HOOKS ---

export const useInvestments = () => {
    const { user } = useAuth();
    return useQuery({
        queryKey: ['investments', user?.id],
        queryFn: () => api.getInvestments(),
        staleTime: 5 * 60 * 1000,
        enabled: !!user?.id
    });
};

export const useSaveInvestment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: any) => api.saveInvestment(data),
        onSuccess: () => {
            // Invalida o cache para for√ßar o componente a reler os dados do banco
            queryClient.invalidateQueries({ queryKey: ['investments'] });
        },
        onError: (error) => {
            console.error("Erro na muta√ß√£o de investimento:", error);
        }
    });
};

export const useDeleteInvestment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const user = auth.currentUser;
            if (!user) throw new Error("Usu√°rio n√£o autenticado");

            const docRef = doc(db, 'investments', id);
            await deleteDoc(docRef);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['investments'] });
        },
        onError: (error) => {
            console.error("Erro ao excluir investimento:", error);
        }
    });
};