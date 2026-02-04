import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {IMes} from "@/model/IMes";
import {Transaction} from "@/model/types/Transaction";
import {auth, db} from "../../firebase";
import {useAuth} from "@/context/AuthContext";
import {useDialogManager} from "@/context/DialogManagerContext";
import {useToast} from "@/hooks/use-toast";
import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    updateDoc,
    where,
    writeBatch
} from 'firebase/firestore/lite';
import {sendNotification} from "@/service/notificationService.ts";

const COLLECTION_NAME = 'transactions';
export const FREE_TRANSACTION_LIMIT = 10;

type TransactionInput = Omit<Transaction, 'id' | 'owner'>;

// --- FUNÇÃO DE LIMPEZA ---
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
    mapDocumentToTransaction(docSnapshot: any): Transaction {
        const data = docSnapshot.data();
        let dateObj = new Date();
        if (data.date) {
            dateObj = data.date.toDate ? data.date.toDate() : new Date(data.date);
        }

        return {
            id: docSnapshot.id,
            description: data.description,
            amount: data.amount,
            month: data.month,
            year: data.year,
            type: data.type,
            recurrence: data.recurrence,
            status: data.status,
            numInstallments: data.numInstallments,
            currentInstallment: data.currentInstallment,
            reference: data.reference,
            category: data.category,
            sharedWith: data.sharedWith,
            owner: data.owner || { id: data.userId || 'unknown', name: 'Usuário', email: '' },
            date: dateObj
        } as Transaction;
    },

    async getAllowedUserIds(): Promise<string[]> {
        const user = auth.currentUser;
        if (!user || !user.email) return [];
        try {
            const emailId = user.email.trim().toLowerCase();
            const shareRef = doc(db, 'sharing', emailId);
            const shareSnap = await getDoc(shareRef);

            const allowedIds = [user.uid];
            if (shareSnap.exists() && shareSnap.data().status === 'ACEITO') {
                allowedIds.push(shareSnap.data().ownerId);
            }
            return allowedIds;
        } catch (error) { return [user.uid]; }
    },

    async getTransactions(month: string, year: number): Promise<Transaction[]> {
        const user = auth.currentUser;
        if (!user) return [];

        const allowedIds = await this.getAllowedUserIds();

        const monthIndex = IMes.indexOf(month);
        if (monthIndex === -1) return [];

        const startDate = new Date(year, monthIndex, 1);
        const endDate = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);

        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where("userId", "in", allowedIds),
                where("date", ">=", startDate.toISOString()),
                where("date", "<=", endDate.toISOString()),
                orderBy("date", "desc")
            );

            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => this.mapDocumentToTransaction(doc));
        } catch (error) {
            console.error("Erro ao buscar transações:", error);
            const qFallback = query(
                collection(db, COLLECTION_NAME),
                where("userId", "==", user.uid),
                where("date", ">=", startDate.toISOString()),
                where("date", "<=", endDate.toISOString()),
                orderBy("date", "desc")
            );
            const snapFallback = await getDocs(qFallback);
            return snapFallback.docs.map(doc => this.mapDocumentToTransaction(doc));
        }
    },

    async getAllTransactions(): Promise<Transaction[]> {
        const user = auth.currentUser;
        if (!user) return [];

        try {
            const allowedIds = await this.getAllowedUserIds();

            const q = query(
                collection(db, COLLECTION_NAME),
                where("userId", "in", allowedIds),
                orderBy("date", "desc")
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => this.mapDocumentToTransaction(doc));
        } catch (error) {
            console.error("Erro ao buscar todas as transações:", error);
            throw error;
        }
    },

    // --- CRIAR TRANSAÇÃO ---
    async createTransaction(data: TransactionInput): Promise<Transaction> {
        const user = auth.currentUser;
        if (!user) throw new Error("Usuário não autenticado");

        const userPrefsRef = doc(db, "user_preferences", user.uid);
        const userPrefsSnap = await getDoc(userPrefsRef);
        const plan = userPrefsSnap.data()?.plan || "free";

        if (plan === "free" && data.recurrence !== 'UNICO') {
            throw new Error("RECURRENCE_PREMIUM_ONLY");
        }

        if (plan === "free") {
            const qLimit = query(
                collection(db, COLLECTION_NAME),
                where("userId", "==", user.uid),
                where("month", "==", data.month),
                where("year", "==", data.year)
            );
            const snapLimit = await getDocs(qLimit);
            if (snapLimit.size >= FREE_TRANSACTION_LIMIT) {
                throw new Error("LIMIT_REACHED");
            }
        }

        if (data.type === 'DESPESA') {
            const budgetsRef = collection(db, "budgets");
            const qBudget = query(budgetsRef, where("userId", "==", user.uid), where("categoryId", "==", data.category.id));
            const budgetSnap = await getDocs(qBudget);

            if (!budgetSnap.empty) {
                const budgetData = budgetSnap.docs[0].data();
                const limit = budgetData.amount;

                const qSpent = query(
                    collection(db, COLLECTION_NAME),
                    where("userId", "==", user.uid),
                    where("category.id", "==", data.category.id),
                    where("month", "==", data.month),
                    where("year", "==", data.year),
                    where("type", "==", "DESPESA")
                );
                const spentSnap = await getDocs(qSpent);
                const currentSpent = spentSnap.docs.reduce((acc, d) => acc + d.data().amount, 0);
                const totalAfterNew = currentSpent + data.amount;

                if (totalAfterNew >= limit) {
                    await sendNotification(
                        user.uid,
                        "Orçamento Esgotado! 🚨",
                        `Você atingiu o limite de ${new Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'}).format(limit)} na categoria ${data.category.name}.`,
                        "ERROR"
                    );
                } else if (totalAfterNew >= limit * 0.8) {
                    await sendNotification(
                        user.uid,
                        "Atenção ao Orçamento ⚠️",
                        `Você já utilizou 80% do limite para ${data.category.name}.`,
                        "WARNING"
                    );
                }
            }
        }

        const ownerData = { id: user.uid, name: user.displayName || "Usuário", email: user.email || "" };
        const batch = writeBatch(db);
        const collectionRef = collection(db, COLLECTION_NAME);
        const firstDocRef = doc(collectionRef);
        const referenceId = firstDocRef.id;

        const basePayload = {
            description: data.description,
            type: data.type,
            category: data.category,
            recurrence: data.recurrence,
            status: data.status,
            userId: user.uid,
            owner: ownerData,
            reference: referenceId
        };

        if (data.recurrence === 'PARCELADO' && data.numInstallments && data.numInstallments > 1) {
            const installmentValue = parseFloat((data.amount / data.numInstallments).toFixed(2));
            for (let i = 0; i < data.numInstallments; i++) {
                const targetMonthIndex = (data.month - 1) + i;
                const targetYear = data.year + Math.floor(targetMonthIndex / 12);
                const targetMonth = (targetMonthIndex % 12) + 1;
                const dateObj = new Date(targetYear, targetMonth - 1, 1, new Date().getHours(), new Date().getMinutes());
                const payload = { ...basePayload, amount: installmentValue, month: targetMonth, year: targetYear, numInstallments: data.numInstallments, currentInstallment: i + 1, date: dateObj.toISOString() };
                const currentDocRef = i === 0 ? firstDocRef : doc(collectionRef);
                batch.set(currentDocRef, sanitizeData(payload));
            }
        } else if (data.recurrence === 'FIXO') {
            const startMonth = data.month;
            for (let m = startMonth; m <= 12; m++) {
                const targetYear = data.year;
                const dateObj = new Date(targetYear, m - 1, 1, new Date().getHours(), new Date().getMinutes());
                const payload = { ...basePayload, amount: data.amount, month: m, year: targetYear, date: dateObj.toISOString() };
                const currentDocRef = m === startMonth ? firstDocRef : doc(collectionRef);
                batch.set(currentDocRef, sanitizeData(payload));
            }
        } else {
            const dateObj = new Date(data.year, data.month - 1, 1, new Date().getHours(), new Date().getMinutes());
            const payload = { ...basePayload, amount: data.amount, month: data.month, year: data.year, date: dateObj.toISOString() };
            batch.set(firstDocRef, sanitizeData(payload));
        }

        await batch.commit();
        return { id: referenceId, ...data, owner: ownerData } as Transaction;
    },

    async updateTransaction(id: string, data: Partial<Transaction>): Promise<Transaction> {
        const transactionRef = doc(db, COLLECTION_NAME, id);
        let updateData: any = { ...data };

        if (data.month !== undefined && data.year !== undefined) {
            const newDate = new Date(data.year, data.month - 1, 1);
            updateData.date = newDate.toISOString();
        }

        updateData = sanitizeData(updateData);
        await updateDoc(transactionRef, updateData);
        return { id, ...data } as Transaction;
    },

    async deleteTransaction(id: string, deleteAll: boolean = false): Promise<void> {
        const user = auth.currentUser;
        if (!user) throw new Error("Usuário não autenticado");

        if (!deleteAll) {
            const transactionRef = doc(db, COLLECTION_NAME, id);
            await deleteDoc(transactionRef);
            return;
        }

        const pivotDocRef = doc(db, COLLECTION_NAME, id);
        const pivotSnap = await getDoc(pivotDocRef);

        if (!pivotSnap.exists()) return;

        const pivotData = pivotSnap.data();
        const groupReferenceId = pivotData.reference || id;
        const pivotDateISO = pivotData.date;

        const qChildren = query(
            collection(db, COLLECTION_NAME),
            where("userId", "==", user.uid),
            where("reference", "==", groupReferenceId)
        );

        const childrenSnaps = await getDocs(qChildren);
        const batch = writeBatch(db);

        childrenSnaps.forEach((childDoc) => {
            const childData = childDoc.data();
            if (childData.date >= pivotDateISO) {
                batch.delete(childDoc.ref);
            }
        });

        await batch.commit();
    },

    async getTransactionsByMonth(month: number): Promise<Transaction[]> {
        const user = auth.currentUser;
        if (!user) return [];
        const allowedIds = await this.getAllowedUserIds();

        const q = query(
            collection(db, COLLECTION_NAME),
            where("userId", "in", allowedIds),
            where("month", "==", month)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => this.mapDocumentToTransaction(doc));
    },

    async getTransactionsByYear(year: number): Promise<Transaction[]> {
        const user = auth.currentUser;
        if (!user) return [];
        const allowedIds = await this.getAllowedUserIds();
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59);

        const q = query(
            collection(db, COLLECTION_NAME),
            where("userId", "in", allowedIds),
            where("date", ">=", startDate.toISOString()),
            where("date", "<=", endDate.toISOString()),
            orderBy("date", "desc")
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => this.mapDocumentToTransaction(doc));
    }
};

// --- HOOKS ---

export const useTransactions = (month: string, year: number) => {
    const { user } = useAuth();
    return useQuery({
        queryKey: ['transactions', month, year, user?.id],
        queryFn: () => api.getTransactions(month, year),
        staleTime: 5 * 60 * 1000,
        enabled: !!month && !!year && !!user?.id
    });
};

export const useAllTransactions = () => {
    const { user } = useAuth();
    return useQuery({
        queryKey: ['transactions', 'all', user?.id],
        queryFn: () => api.getAllTransactions(),
        staleTime: 5 * 60 * 1000,
        enabled: !!user?.id
    });
};

export const useTransactionsByMonth = (month: number) => {
    const { user } = useAuth();
    return useQuery({
        queryKey: ['transactions', 'month', month, user?.id],
        queryFn: () => api.getTransactionsByMonth(month),
        staleTime: 5 * 60 * 1000,
        enabled: !!user?.id
    });
};

export const useTransactionsByYear = (year: number) => {
    const { user } = useAuth();
    return useQuery({
        queryKey: ['transactions', 'year', year, user?.id],
        queryFn: () => api.getTransactionsByYear(year),
        staleTime: 5 * 60 * 1000,
        enabled: !!user?.id
    });
};

export const useCreateTransaction = () => {
    const queryClient = useQueryClient();
    const { setActiveDialog } = useDialogManager();
    const { toast } = useToast();

    return useMutation({
        mutationFn: (data: TransactionInput) => api.createTransaction(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
        },
        onError: (error: any) => {
            if (error.message === "LIMIT_REACHED") {
                setActiveDialog("upgrade-plan");
                toast({
                    title: "Limite atingido",
                    description: `Planos gratuitos possuem limite de ${FREE_TRANSACTION_LIMIT} transações por mês.`,
                    variant: "destructive"
                });
            } else if (error.message === "RECURRENCE_PREMIUM_ONLY") {
                setActiveDialog("upgrade-plan");
                toast({
                    title: "Recurso Premium",
                    description: "Parcelamentos e transações fixas são exclusivos para membros Premium.",
                    variant: "destructive"
                });
            } else {
                toast({ title: "Erro", description: "Falha ao salvar transação.", variant: "destructive" });
            }
        }
    });
};

export const useUpdateTransaction = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Transaction> }) =>
            api.updateTransaction(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
        }
    });
};

export const useDeleteTransaction = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, deleteAll = false }: { id: string; deleteAll?: boolean }) =>
            api.deleteTransaction(id, deleteAll),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
        }
    });
};

export const formatTransactionAmount = (amount: number): string => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(amount);
};

export const formatTransactionDate = (date: Date): string => {
    if (!date) return "";
    return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
};