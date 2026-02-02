import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
    deleteDoc,
    getDoc
} from "firebase/firestore/lite";
import { useToast } from "@/hooks/use-toast";
import { useDialogManager } from "@/context/DialogManagerContext";

export const FREE_BUDGET_LIMIT = 2;

export const useBudgets = (month?: number, year?: number) => {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const { setActiveDialog } = useDialogManager();
    const user = auth.currentUser;

    const getAllowedUserIds = async (): Promise<string[]> => {
        if (!user?.email) return [];
        try {
            const emailId = user.email.trim().toLowerCase();
            const shareRef = doc(db, 'sharing', emailId);
            const shareSnap = await getDoc(shareRef);
            if (shareSnap.exists()) {
                return [user.uid, shareSnap.data().ownerId];
            }
            return [user.uid];
        } catch (error) {
            return [user.uid];
        }
    };

    const budgetsQuery = useQuery({
        queryKey: ["budgets", month, year, user?.uid],
        queryFn: async () => {
            if (!user || !year || !db) return [];
            const allowedIds = await getAllowedUserIds();
            const budgetsRef = collection(db, "budgets");

            let q = query(budgetsRef,
                where("userId", "in", allowedIds),
                where("year", "==", year)
            );

            if (month !== undefined && month !== null) {
                q = query(q, where("month", "==", month));
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

            const userPrefsRef = doc(db, "user_preferences", user.uid);
            const userPrefsSnap = await getDoc(userPrefsRef);
            const plan = userPrefsSnap.data()?.plan || "free";

            const budgetsRef = collection(db, "budgets");

            // --- CORREÇÃO DO FURO E BLOQUEIO DE RÉPLICA ---
            if (plan === "free") {
                // 1. Bloqueia a réplica automática para Free
                if (payload.replicateAllMonths) {
                    throw new Error("REPLICATE_PREMIUM_ONLY");
                }

                // 2. Verifica limite do mês específico
                const qLimit = query(budgetsRef,
                    where("userId", "==", user.uid),
                    where("month", "==", payload.month),
                    where("year", "==", payload.year)
                );
                const snapLimit = await getDocs(qLimit);
                const alreadyExists = snapLimit.docs.some(d => d.data().categoryId === payload.categoryId);

                if (!alreadyExists && snapLimit.size >= FREE_BUDGET_LIMIT) {
                    throw new Error("LIMIT_REACHED");
                }
            }

            const targetMonths = payload.replicateAllMonths ? Array.from({ length: 12 }, (_, i) => i + 1) : [payload.month];

            const promises = targetMonths.map(async (m) => {
                const q = query(budgetsRef,
                    where("userId", "==", user.uid),
                    where("categoryId", "==", payload.categoryId),
                    where("month", "==", m),
                    where("year", "==", payload.year)
                );

                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const docRef = doc(db, "budgets", querySnapshot.docs[0].id);
                    return await setDoc(docRef, {
                        amount: payload.amount,
                        categoryName: payload.categoryName,
                        updatedAt: new Date().toISOString()
                    }, { merge: true });
                } else {
                    return await addDoc(budgetsRef, {
                        categoryId: payload.categoryId,
                        categoryName: payload.categoryName,
                        amount: payload.amount,
                        month: m,
                        year: payload.year,
                        userId: user.uid,
                        ownerEmail: user.email
                    });
                }
            });

            return Promise.all(promises);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["budgets"] });
            toast({ title: "Sucesso!", description: "Orçamento atualizado." });
        },
        onError: (error: any) => {
            if (error.message === "LIMIT_REACHED") {
                setActiveDialog("upgrade-plan");
                toast({
                    variant: "destructive",
                    title: "Limite atingido",
                    description: `Planos gratuitos podem configurar até ${FREE_BUDGET_LIMIT} metas por mês.`
                });
            } else if (error.message === "REPLICATE_PREMIUM_ONLY") {
                setActiveDialog("upgrade-plan");
                toast({
                    variant: "destructive",
                    title: "Recurso Premium",
                    description: "A replicação automática de metas para todos os meses é exclusiva para membros Premium."
                });
            } else {
                toast({ variant: "destructive", title: "Erro!", description: "Não foi possível salvar a meta." });
            }
        }
    });

    const deleteBudgetMutation = useMutation({
        mutationFn: async (budgetId: string) => {
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