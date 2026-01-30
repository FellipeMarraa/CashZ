import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { db, auth } from "../../firebase";
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc, // Adicionado para exclusão
    doc,
    query,
    where,
    getDocs,
    serverTimestamp
} from 'firebase/firestore/lite'; // Padronizado para /lite conforme seu exemplo de transações
import { InvestmentItem } from "@/components/dashboard/sections/investments-section.tsx";

const COLLECTION_NAME = 'investments';

// --- FUNÇÃO DE LIMPEZA ---
// Remove campos undefined que o Firebase não aceita
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
        if (!user) throw new Error("Usuário não autenticado");

        const { id, ...rest } = data;
        const payload = sanitizeData({
            ...rest,
            userId: user.uid,
            updatedAt: serverTimestamp()
        });

        if (id) {
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, payload);
        } else {
            await addDoc(collection(db, COLLECTION_NAME), {
                ...payload,
                createdAt: serverTimestamp()
            });
        }
    },

    // --- NOVA FUNÇÃO DE EXCLUSÃO ---
    async deleteInvestment(id: string): Promise<void> {
        const user = auth.currentUser;
        if (!user) throw new Error("Usuário não autenticado");

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
    const user = auth.currentUser;
    return useQuery({
        queryKey: ['investments', user?.uid],
        queryFn: () => api.getInvestments(),
        enabled: !!user?.uid,
        staleTime: 5 * 60 * 1000
    });
};

export const useSaveInvestment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => api.saveInvestment(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['investments'] });
        }
    });
};

// --- NOVO HOOK PARA DELETAR ---
export const useDeleteInvestment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.deleteInvestment(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['investments'] });
        }
    });
};