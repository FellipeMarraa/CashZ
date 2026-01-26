import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db, auth } from "../../firebase";
import { Budget } from "@/model/types/Budget";
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    setDoc,
    doc
} from "firebase/firestore/lite";
import { useToast } from "@/hooks/use-toast";

export const useBudgets = (month?: number, year?: number) => {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const user = auth.currentUser;

    const budgetsQuery = useQuery({
        // A chave da query permanece sensível ao mês e ano
        queryKey: ["budgets", month, year, user?.uid],
        queryFn: async () => {
            // Se não houver usuário ou ano, não há o que buscar
            if (!user || !year || !db) return [];

            const budgetsRef = collection(db, "budgets");
            let q;

            // LÓGICA CORRIGIDA: Se houver mês, filtra por mês. Caso contrário, traz o ano todo.
            if (month !== undefined && month !== null) {
                q = query(
                    budgetsRef,
                    where("userId", "==", user.uid),
                    where("month", "==", month),
                    where("year", "==", year)
                );
            } else {
                q = query(
                    budgetsRef,
                    where("userId", "==", user.uid),
                    where("year", "==", year)
                );
            }

            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(document => ({
                id: document.id,
                ...document.data()
            } as Budget));
        },
        // Habilitado se houver usuário e ano (mês agora é opcional)
        enabled: !!user && !!year && !!db,
    });

    const saveBudgetMutation = useMutation({
        mutationFn: async (payload: Omit<Budget, 'id' | 'userId'>) => {
            if (!user || !db) throw new Error("Usuário não autenticado ou DB offline");

            const budgetsRef = collection(db, "budgets");

            const q = query(
                budgetsRef,
                where("userId", "==", user.uid),
                where("categoryId", "==", payload.categoryId),
                where("month", "==", payload.month),
                where("year", "==", payload.year)
            );

            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const existingDoc = querySnapshot.docs[0];
                const docRef = doc(db, "budgets", existingDoc.id);
                return await setDoc(docRef, { amount: payload.amount }, { merge: true });
            } else {
                return await addDoc(budgetsRef, {
                    ...payload,
                    userId: user.uid
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["budgets"] });
            toast({
                variant: "success",
                title: "Sucesso!",
                description: "Limite de orçamento atualizado.",
                duration: 2000,
            });
        },
        onError: (error: any) => {
            toast({
                variant: "destructive",
                title: "Erro ao salvar",
                description: error.message || "Erro de conexão",
            });
        }
    });

    return {
        budgets: budgetsQuery.data ?? [],
        isLoading: budgetsQuery.isLoading,
        saveBudget: saveBudgetMutation
    };
};