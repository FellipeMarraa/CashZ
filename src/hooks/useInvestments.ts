import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { db, auth } from "../../firebase";
import {
    collection,
    addDoc,
    updateDoc,
    doc,
    query,
    where,
    getDocs,
    serverTimestamp
} from 'firebase/firestore'; // Use a versão padrão, não a /lite
import { InvestmentItem } from "@/components/dashboard/sections/investments-section.tsx";

const COLLECTION_NAME = 'investments';

const api = {
    async getInvestments(): Promise<InvestmentItem[]> {
        const user = auth.currentUser;
        if (!user) return [];

        const q = query(
            collection(db, COLLECTION_NAME),
            where("userId", "==", user.uid)
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as InvestmentItem[];
    },

    async saveInvestment(data: any): Promise<void> {
        const user = auth.currentUser;
        if (!user) throw new Error("Usuário não autenticado");

        const { id, ...rest } = data;
        const cleanData = JSON.parse(JSON.stringify(rest)); // Remove undefined

        if (id) {
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, {
                ...cleanData,
                updatedAt: serverTimestamp()
            });
        } else {
            await addDoc(collection(db, COLLECTION_NAME), {
                ...cleanData,
                userId: user.uid,
                createdAt: serverTimestamp()
            });
        }
    }
};

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