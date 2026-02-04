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
    getDoc,
    serverTimestamp,
    deleteDoc
} from 'firebase/firestore';
import { InvestmentItem } from "@/components/dashboard/sections/investments-section.tsx";

const COLLECTION_NAME = 'investments';

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

        // --- TRAVA DE SEGURANÇA NO BACKEND (HOOK) ---
        const userPrefsRef = doc(db, "user_preferences", user.uid);
        const userPrefsSnap = await getDoc(userPrefsRef);
        const plan = userPrefsSnap.data()?.plan || "free";

        // Se não houver ID, é uma tentativa de criação de novo ativo
        if (!id && plan !== "premium") {
            throw new Error("PREMIUM_REQUIRED");
        }
        // --------------------------------------------

        const payload = sanitizeData({
            ...rest,
            userId: user.uid,
            updatedAt: serverTimestamp()
        });

        try {
            if (id) {
                const docRef = doc(db, COLLECTION_NAME, id);
                await updateDoc(docRef, payload);
            } else {
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
            queryClient.invalidateQueries({ queryKey: ['investments'] });
        },
        onError: (error: any) => {
            console.error("Erro na mutação de investimento:", error.message);
        }
    });
};

export const useDeleteInvestment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.deleteInvestment(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['investments'] });
        },
        onError: (error) => {
            console.error("Erro ao excluir investimento:", error);
        }
    });
};