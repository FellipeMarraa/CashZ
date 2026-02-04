import {useMutation} from "@tanstack/react-query";
import {CategoryDTO} from "@/model/CategoryDTO";
import {auth, db} from "../../firebase";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    query,
    updateDoc,
    where
} from 'firebase/firestore';
import {useEffect, useMemo, useState} from "react";
import {useDialogManager} from "@/context/DialogManagerContext";

const COLLECTION_NAME = 'categories';

const api = {
    async getAllowedUserIds(): Promise<string[]> {
        const user = auth.currentUser;
        if (!user || !user.email) return [];
        try {
            const emailId = user.email.trim().toLowerCase();
            const shareRef = doc(db, 'sharing', emailId);
            const shareSnap = await getDoc(shareRef);
            if (shareSnap.exists()) {
                const data = shareSnap.data();
                return [user.uid, data.ownerId];
            }
            return [user.uid];
        } catch (error) {
            console.error("Erro ao buscar permissões de categorias:", error);
            return [user.uid];
        }
    },

    async getCategories(): Promise<CategoryDTO[]> {
        const user = auth.currentUser;
        if (!user) return [];

        const allowedIds = await this.getAllowedUserIds();

        const userQuery = query(
            collection(db, COLLECTION_NAME),
            where("userId", "in", allowedIds)
        );

        const defaultQuery = query(
            collection(db, COLLECTION_NAME),
            where("isDefault", "==", true)
        );

        // CORREÇÃO: Usando as queries corretas dentro do Promise.all
        const [userSnapshot, defaultSnapshot] = await Promise.all([
            getDocs(userQuery),
            getDocs(defaultQuery)
        ]);

        const userCategories = userSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as CategoryDTO[];

        const defaultCategories = defaultSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as CategoryDTO[];

        const allCats = [...defaultCategories, ...userCategories];
        return Array.from(new Map(allCats.map(item => [item.id, item])).values());
    },

    // No arquivo useCategories.ts, dentro do objeto api:
    async createCategory(data: Omit<CategoryDTO, 'id'>): Promise<CategoryDTO> {
        const user = auth.currentUser;
        if (!user) throw new Error("Usuário não autenticado");

        const userPrefsRef = doc(db, "user_preferences", user.uid);
        const userPrefsSnap = await getDoc(userPrefsRef);
        const plan = userPrefsSnap.data()?.plan || "free";

        const allowedPlans = ["premium", "annual"];
        if (!allowedPlans.includes(plan)) {
            throw new Error("PREMIUM_REQUIRED");
        }

        const newCategoryData = { ...data, userId: user.uid, isDefault: false };
        const docRef = await addDoc(collection(db, COLLECTION_NAME), newCategoryData);
        return { id: docRef.id, ...newCategoryData } as CategoryDTO;
    },

    async updateCategory(id: string, data: Partial<CategoryDTO>): Promise<void> {
        const categoryRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(categoryRef, data);
    },

    async deleteCategory(id: string): Promise<void> {
        const user = auth.currentUser;
        if (!user) throw new Error("Usuário não autenticado");
        const categoryRef = doc(db, COLLECTION_NAME, id);
        const budgetsRef = collection(db, "budgets");
        const q = query(budgetsRef, where("userId", "==", user.uid), where("categoryId", "==", id));
        const budgetSnapshot = await getDocs(q);
        const deleteBudgetsPromises = budgetSnapshot.docs.map(budgetDoc =>
            deleteDoc(doc(db, "budgets", budgetDoc.id))
        );
        await Promise.all([...deleteBudgetsPromises, deleteDoc(categoryRef)]);
    }
};

export const useCategories = () => {
    const user = auth.currentUser;
    const [categories, setCategories] = useState<CategoryDTO[]>([]);
    const [hiddenIds, setHiddenIds] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user?.uid) return;

        let unsubUserCats: () => void;
        let unsubHidden: () => void;

        const setupListeners = async () => {
            const allowedIds = await api.getAllowedUserIds();

            // Consultas separadas pois o Firestore não suporta OR entre campos diferentes em queries simples
            const qUserCats = query(collection(db, COLLECTION_NAME), where("userId", "in", allowedIds));
            const qDefaultCats = query(collection(db, COLLECTION_NAME), where("isDefault", "==", true));

            // Buscamos as categorias padrão (Default) apenas uma vez para economizar leituras
            const defaultSnap = await getDocs(qDefaultCats);
            const dCats = defaultSnap.docs.map(d => ({ id: d.id, ...d.data() } as CategoryDTO));

            // Listener em Tempo Real para categorias personalizadas (suas ou do parceiro)
            unsubUserCats = onSnapshot(qUserCats, (userSnap) => {
                const uCats = userSnap.docs.map(d => ({ id: d.id, ...d.data() } as CategoryDTO));

                // Unimos e removemos duplicados
                const combined = [...dCats, ...uCats];
                const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());

                setCategories(unique);
                setIsLoading(false);
            });

            // Listener em Tempo Real para categorias ocultas
            const qHidden = query(collection(db, 'hidden_categories'), where("userId", "==", user.uid));
            unsubHidden = onSnapshot(qHidden, (snap) => {
                setHiddenIds(snap.docs.map(d => d.data().categoryId));
            });
        };

        setupListeners();
        return () => {
            unsubUserCats?.();
            unsubHidden?.();
        };
    }, [user?.uid]);

    const filteredCategories = useMemo(() => {
        return categories.filter(cat => !hiddenIds.includes(cat.id!));
    }, [categories, hiddenIds]);

    return {
        data: filteredCategories, // Categorias visíveis
        allCategories: categories, // Todas (útil para a tela de gerenciamento)
        hiddenIds, // IDs das ocultas
        isLoading
    };
};

export const useCreateCategory = () => {
    const { setActiveDialog } = useDialogManager();
    return useMutation({
        mutationFn: (data: Omit<CategoryDTO, 'id'>) => api.createCategory(data),
        onError: (error: any) => {
            if (error.message === "PREMIUM_REQUIRED") setActiveDialog("upgrade-plan");
        }
    });
};

export const useUpdateCategory = () => {
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CategoryDTO> }) => api.updateCategory(id, data)
    });
};

export const useDeleteCategory = () => {
    return useMutation({
        mutationFn: (id: string) => api.deleteCategory(id)
    });
};

export const useHiddenCategories = () => {
    const user = auth.currentUser;
    const [hiddenIds, setHiddenIds] = useState<string[]>([]);

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, 'hidden_categories'), where("userId", "==", user.uid));

        return onSnapshot(q, (snap) => {
            setHiddenIds(snap.docs.map(doc => doc.data().categoryId));
        });
    }, [user]);

    return { data: hiddenIds };
};

export const useToggleCategoryVisibility = () => {
    const user = auth.currentUser;
    return useMutation({
        mutationFn: async (categoryId: string) => {
            if (!user) return;
            const q = query(collection(db, 'hidden_categories'),
                where("userId", "==", user.uid),
                where("categoryId", "==", categoryId));
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                await deleteDoc(doc(db, 'hidden_categories', snapshot.docs[0].id));
            } else {
                await addDoc(collection(db, 'hidden_categories'), {
                    userId: user.uid,
                    categoryId: categoryId
                });
            }
        }
    });
};