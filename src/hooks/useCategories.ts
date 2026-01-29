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
    where
} from 'firebase/firestore/lite';
import { useMemo } from "react";

const COLLECTION_NAME = 'categories';

const api = {
    // --- BUSCAR CATEGORIAS (DO USUÁRIO + PADRÕES) ---
    async getCategories(): Promise<CategoryDTO[]> {
        const user = auth.currentUser;
        if (!user) return [];

        const userQuery = query(
            collection(db, COLLECTION_NAME),
            where("userId", "==", user.uid)
        );

        const defaultQuery = query(
            collection(db, COLLECTION_NAME),
            where("isDefault", "==", true)
        );

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

        return [...defaultCategories, ...userCategories];
    },

    // --- CRIAR CATEGORIA ---
    async createCategory(data: Omit<CategoryDTO, 'id'>): Promise<CategoryDTO> {
        const user = auth.currentUser;
        if (!user) throw new Error("Usuário não autenticado");

        const newCategoryData = {
            ...data,
            userId: user.uid,
            isDefault: false
        };

        const docRef = await addDoc(collection(db, COLLECTION_NAME), newCategoryData);
        return { id: docRef.id, ...newCategoryData } as CategoryDTO;
    },

    // --- ATUALIZAR CATEGORIA ---
    async updateCategory(id: string, data: Partial<CategoryDTO>): Promise<void> {
        const categoryRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(categoryRef, data);
    },

    // --- DELETAR CATEGORIA COM CASCATA (BUDGETS) ---
    async deleteCategory(id: string): Promise<void> {
        const user = auth.currentUser;
        if (!user) throw new Error("Usuário não autenticado");

        const categoryRef = doc(db, COLLECTION_NAME, id);
        const budgetsRef = collection(db, "budgets");

        const q = query(
            budgetsRef,
            where("userId", "==", user.uid),
            where("categoryId", "==", id)
        );

        const budgetSnapshot = await getDocs(q);
        const deleteBudgetsPromises = budgetSnapshot.docs.map(budgetDoc =>
            deleteDoc(doc(db, "budgets", budgetDoc.id))
        );

        await Promise.all([
            ...deleteBudgetsPromises,
            deleteDoc(categoryRef)
        ]);
    }
};

// --- HOOKS ---

export const useCategories = () => {
    const user = auth.currentUser;

    // 1. Busca Categorias Brutas
    const categoriesQuery = useQuery({
        queryKey: ['categories-raw', user?.uid],
        queryFn: () => api.getCategories(),
        staleTime: 5 * 60 * 1000,
        enabled: !!user
    });

    // 2. Busca IDs Ocultos
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

    // 3. Filtra as categorias para uso geral nos Selects
    const filteredCategories = useMemo(() => {
        const cats = categoriesQuery.data || [];
        const hiddenIds = hiddenQuery.data || [];
        if (hiddenIds.length === 0) return cats;
        return cats.filter(cat => !hiddenIds.includes(cat.id!));
    }, [categoriesQuery.data, hiddenQuery.data]);

    return {
        ...categoriesQuery,
        data: filteredCategories, // Dados filtrados (usado nos selects)
        allCategories: categoriesQuery.data || [], // Dados brutos (usado no Perfil)
        isLoading: categoriesQuery.isLoading || hiddenQuery.isLoading
    };
};

export const useCreateCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Omit<CategoryDTO, 'id'>) => api.createCategory(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories-raw'] });
        }
    });
};

export const useUpdateCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CategoryDTO> }) =>
            api.updateCategory(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories-raw'] });
        }
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
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hidden-categories'] });
            queryClient.invalidateQueries({ queryKey: ['categories-raw'] });
        }
    });
};