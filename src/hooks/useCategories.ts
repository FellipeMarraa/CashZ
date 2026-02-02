"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CategoryDTO } from "@/model/CategoryDTO";
import { db, auth } from "../../firebase";
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    getDoc
} from 'firebase/firestore/lite';
import { useMemo } from "react";
import { useDialogManager } from "@/context/DialogManagerContext";

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

    async createCategory(data: Omit<CategoryDTO, 'id'>): Promise<CategoryDTO> {
        const user = auth.currentUser;
        if (!user) throw new Error("Usuário não autenticado");

        const userPrefsRef = doc(db, "user_preferences", user.uid);
        const userPrefsSnap = await getDoc(userPrefsRef);
        const plan = userPrefsSnap.data()?.plan || "free";

        if (plan !== "premium") {
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
    const categoriesQuery = useQuery({
        queryKey: ['categories-raw', user?.uid],
        queryFn: () => api.getCategories(),
        staleTime: 5 * 60 * 1000,
        enabled: !!user
    });

    const hiddenQuery = useQuery({
        queryKey: ['hidden-categories', user?.uid],
        queryFn: async () => {
            if (!user) return [];
            const q = query(collection(db, 'hidden_categories'), where("userId", "==", user.uid));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => doc.data().categoryId) as string[];
        },
        enabled: !!user
    });

    const filteredCategories = useMemo(() => {
        const cats = categoriesQuery.data || [];
        const hiddenIds = hiddenQuery.data || [];
        return cats.filter(cat => !hiddenIds.includes(cat.id!));
    }, [categoriesQuery.data, hiddenQuery.data]);

    return {
        ...categoriesQuery,
        data: filteredCategories,
        allCategories: categoriesQuery.data || [],
        isLoading: categoriesQuery.isLoading || hiddenQuery.isLoading
    };
};

export const useCreateCategory = () => {
    const queryClient = useQueryClient();
    const { setActiveDialog } = useDialogManager();

    return useMutation({
        mutationFn: (data: Omit<CategoryDTO, 'id'>) => api.createCategory(data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories-raw'] }); },
        onError: (error: any) => {
            if (error.message === "PREMIUM_REQUIRED") {
                setActiveDialog("upgrade-plan");
            }
        }
    });
};

export const useUpdateCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CategoryDTO> }) => api.updateCategory(id, data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories-raw'] }); }
    });
};

export const useDeleteCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.deleteCategory(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories-raw'] });
            queryClient.invalidateQueries({ queryKey: ['budgets'] });
        }
    });
};

export const useHiddenCategories = () => {
    const user = auth.currentUser;
    return useQuery({
        queryKey: ['hidden-categories', user?.uid],
        queryFn: async () => {
            if (!user) return [];
            const q = query(collection(db, 'hidden_categories'), where("userId", "==", user.uid));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => doc.data().categoryId) as string[];
        },
        enabled: !!user
    });
};

export const useToggleCategoryVisibility = () => {
    const queryClient = useQueryClient();
    const user = auth.currentUser;

    return useMutation({
        mutationFn: async (categoryId: string) => {
            if (!user) return;

            const q = query(collection(db, 'hidden_categories'), where("userId", "==", user.uid));
            const snapshot = await getDocs(q);

            const existingDoc = snapshot.docs.find(doc => doc.data().categoryId === categoryId);

            if (existingDoc) {
                await deleteDoc(doc(db, 'hidden_categories', existingDoc.id));
            } else {
                await addDoc(collection(db, 'hidden_categories'), {
                    userId: user.uid,
                    categoryId: categoryId
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hidden-categories'] });
            queryClient.invalidateQueries({ queryKey: ['categories-raw'] });
        }
    });
};