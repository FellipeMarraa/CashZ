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
    doc,
    deleteDoc
} from "firebase/firestore/lite";
import { useToast } from "@/hooks/use-toast";

export const useBudgets = (month?: number, year?: number) => {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const user = auth.currentUser;

    const budgetsQuery = useQuery({
        queryKey: ["budgets", month, year, user?.uid],
        queryFn: async () => {
            if (!user || !year || !db) return [];
            const budgetsRef = collection(db, "budgets");
            let q;
            if (month !== undefined && month !== null) {
                q = query(budgetsRef, where("userId", "==", user.uid), where("month", "==", month), where("year", "==", year));
            } else {
                q = query(budgetsRef, where("userId", "==", user.uid), where("year", "==", year));
            }
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(document => ({
                id: document.id,
                ...document.data()
            } as Budget));
        },
        enabled: !!user && !!year && !!db,
    });

    const saveBudgetMutation = useMutation({
        mutationFn: async (payload: Omit<Budget, 'id' | 'userId'> & { replicateAllMonths?: boolean }) => {
            if (!user || !db) throw new Error("Usuário não autenticado");
            const budgetsRef = collection(db, "budgets");

            // Define quais meses serão afetados
            const targetMonths = payload.replicateAllMonths ? Array.from({ length: 12 }, (_, i) => i + 1) : [payload.month];

            const promises = targetMonths.map(async (m) => {
                const q = query(
                    budgetsRef,
                    where("userId", "==", user.uid),
                    where("categoryId", "==", payload.categoryId),
                    where("month", "==", m),
                    where("year", "==", payload.year)
                );
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const existingDoc = querySnapshot.docs[0];
                    const docRef = doc(db, "budgets", existingDoc.id);
                    return await setDoc(docRef, { amount: payload.amount }, { merge: true });
                } else {
                    return await addDoc(budgetsRef, {
                        categoryId: payload.categoryId,
                        categoryName: payload.categoryName,
                        amount: payload.amount,
                        month: m,
                        year: payload.year,
                        userId: user.uid
                    });
                }
            });

            return Promise.all(promises);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["budgets"] });
            toast({ title: "Sucesso!", description: "Orçamento(s) atualizado(s)." });
        }
    });

    const deleteBudgetMutation = useMutation({
        mutationFn: async (budgetId: string) => {
            if (!db) throw new Error("DB offline");
            const docRef = doc(db, "budgets", budgetId);
            await deleteDoc(docRef);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["budgets"] });
            toast({ title: "Removido!", description: "Meta excluída com sucesso." });
        }
    });

    return {
        budgets: budgetsQuery.data ?? [],
        isLoading: budgetsQuery.isLoading,
        saveBudget: saveBudgetMutation,
        deleteBudget: deleteBudgetMutation
    };
};