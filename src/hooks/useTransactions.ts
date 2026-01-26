import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {IMes} from "@/model/IMes";
import {Transaction} from "@/model/types/Transaction";
import {auth, db} from "../../firebase";
import {useAuth} from "@/context/AuthContext";
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

const COLLECTION_NAME = 'transactions';

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

    async getTransactions(month: string, year: number): Promise<Transaction[]> {
        const user = auth.currentUser;
        if (!user) return [];

        const monthIndex = IMes.indexOf(month);
        if (monthIndex === -1) return [];

        const startDate = new Date(year, monthIndex, 1);
        const endDate = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);

        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where("userId", "==", user.uid),
                where("date", ">=", startDate.toISOString()),
                where("date", "<=", endDate.toISOString()),
                orderBy("date", "desc")
            );

            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => this.mapDocumentToTransaction(doc));
        } catch (error) {
            console.error("Erro ao buscar transações:", error);
            throw error;
        }
    },

    async getAllTransactions(): Promise<Transaction[]> {
        const user = auth.currentUser;
        if (!user) return [];
        const q = query(
            collection(db, COLLECTION_NAME),
            where("userId", "==", user.uid),
            orderBy("date", "desc")
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => this.mapDocumentToTransaction(doc));
    },

    // --- CRIAR TRANSAÇÃO ---
    async createTransaction(data: TransactionInput): Promise<Transaction> {
        const user = auth.currentUser;
        if (!user) throw new Error("Usuário não autenticado");

        const ownerData = {
            id: user.uid,
            name: user.displayName || "Usuário",
            email: user.email || ""
        };

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

        // --- LÓGICA 1: PARCELADO ---
        if (data.recurrence === 'PARCELADO' && data.numInstallments && data.numInstallments > 1) {
            const installmentValue = parseFloat((data.amount / data.numInstallments).toFixed(2));

            for (let i = 0; i < data.numInstallments; i++) {
                const targetMonthIndex = (data.month - 1) + i;
                const targetYear = data.year + Math.floor(targetMonthIndex / 12);
                const targetMonth = (targetMonthIndex % 12) + 1;

                const dateObj = new Date(targetYear, targetMonth - 1, 1, new Date().getHours(), new Date().getMinutes());

                const payload = {
                    ...basePayload,
                    amount: installmentValue,
                    month: targetMonth,
                    year: targetYear,
                    numInstallments: data.numInstallments,
                    currentInstallment: i + 1,
                    date: dateObj.toISOString()
                };

                const currentDocRef = i === 0 ? firstDocRef : doc(collectionRef);
                batch.set(currentDocRef, sanitizeData(payload));
            }
        }
        // --- LÓGICA 2: FIXO ---
        else if (data.recurrence === 'FIXO') {
            const startMonth = data.month;
            const endMonth = 12;

            for (let m = startMonth; m <= endMonth; m++) {
                const targetYear = data.year;
                const dateObj = new Date(targetYear, m - 1, 1, new Date().getHours(), new Date().getMinutes());

                const payload = {
                    ...basePayload,
                    amount: data.amount,
                    month: m,
                    year: targetYear,
                    date: dateObj.toISOString()
                };

                const currentDocRef = m === startMonth ? firstDocRef : doc(collectionRef);
                batch.set(currentDocRef, sanitizeData(payload));
            }
        }
        // --- LÓGICA 3: ÚNICO ---
        else {
            const dateObj = new Date(data.year, data.month - 1, 1, new Date().getHours(), new Date().getMinutes());

            const payload = {
                ...basePayload,
                amount: data.amount,
                month: data.month,
                year: data.year,
                date: dateObj.toISOString()
            };

            batch.set(firstDocRef, sanitizeData(payload));
        }

        await batch.commit();

        return {
            id: referenceId,
            ...data,
            owner: ownerData
        } as Transaction;
    },

    // --- ATUALIZAR TRANSAÇÃO ---
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

    // --- DELETAR TRANSAÇÃO (LÓGICA ALTERADA: DELETAR DESTA PARA FRENTE) ---
    async deleteTransaction(id: string, deleteAll: boolean = false): Promise<void> {
        const user = auth.currentUser;
        if (!user) throw new Error("Usuário não autenticado");

        // 1. Deleção Simples (Apenas o item selecionado)
        if (!deleteAll) {
            const transactionRef = doc(db, COLLECTION_NAME, id);
            await deleteDoc(transactionRef);
            return;
        }

        // 2. Deleção Recorrente (Desta para frente)
        // Primeiro, precisamos pegar a transação "Pivô" para saber a data e a referência dela
        const pivotDocRef = doc(db, COLLECTION_NAME, id);
        const pivotSnap = await getDoc(pivotDocRef);

        if (!pivotSnap.exists()) return;

        const pivotData = pivotSnap.data();
        const groupReferenceId = pivotData.reference || id;

        // A data de corte é a data da transação selecionada
        const pivotDateISO = pivotData.date;

        // Busca todas as transações que pertencem a este grupo (Reference ID igual)
        // Nota: Não usamos filtro de data na query do Firestore para evitar criar índices complexos compostos.
        // Como um parcelamento tem no maximo 12-60 itens, filtrar no cliente é rápido e barato.
        const qChildren = query(
            collection(db, COLLECTION_NAME),
            where("userId", "==", user.uid),
            where("reference", "==", groupReferenceId)
        );

        const childrenSnaps = await getDocs(qChildren);
        const batch = writeBatch(db);

        childrenSnaps.forEach((childDoc) => {
            const childData = childDoc.data();

            // LÓGICA DE CORTE:
            // Comparamos as datas (Strings ISO funcionam bem com >=)
            // Se a data do item for MAIOR ou IGUAL à data do pivô, deletamos.
            if (childData.date >= pivotDateISO) {
                batch.delete(childDoc.ref);
            }
        });

        // Executa a exclusão em lote
        await batch.commit();
    },

    // --- FILTROS EXTRAS ---
    async getTransactionsByMonth(month: number): Promise<Transaction[]> {
        const user = auth.currentUser;
        if (!user) return [];
        const q = query(
            collection(db, COLLECTION_NAME),
            where("userId", "==", user.uid),
            where("month", "==", month)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => this.mapDocumentToTransaction(doc));
    },

    async getTransactionsByYear(year: number): Promise<Transaction[]> {
        const user = auth.currentUser;
        if (!user) return [];
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59);
        const q = query(
            collection(db, COLLECTION_NAME),
            where("userId", "==", user.uid),
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

    return useMutation({
        mutationFn: (data: TransactionInput) => api.createTransaction(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
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