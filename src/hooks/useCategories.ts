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

const COLLECTION_NAME = 'categories';

const api = {
    // --- BUSCAR CATEGORIAS (DO USUÁRIO + PADRÕES) ---
    async getCategories(): Promise<CategoryDTO[]> {
        const user = auth.currentUser;
        // Se não houver usuário logado, retorna array vazio ou lança erro (depende da tua regra de negócio)
        if (!user) return [];

        // 1. Query para categorias do USUÁRIO
        const userQuery = query(
            collection(db, COLLECTION_NAME),
            where("userId", "==", user.uid)
        );

        // 2. Query para categorias PADRÃO (do sistema)
        const defaultQuery = query(
            collection(db, COLLECTION_NAME),
            where("isDefault", "==", true)
        );

        // Executa as duas buscas em paralelo para ser mais rápido
        const [userSnapshot, defaultSnapshot] = await Promise.all([
            getDocs(userQuery),
            getDocs(defaultQuery)
        ]);

        // Mapeia os resultados
        const userCategories = userSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as CategoryDTO[];

        const defaultCategories = defaultSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as CategoryDTO[];

        // Junta as duas listas e retorna
        // Dica: Podes ordenar aqui se quiseres (ex: sort por nome)
        return [...defaultCategories, ...userCategories];
    },

    // --- CRIAR CATEGORIA ---
    async createCategory(data: Omit<CategoryDTO, 'id'>): Promise<CategoryDTO> {
        const user = auth.currentUser;
        if (!user) throw new Error("Usuário não autenticado");

        // Ao criar, forçamos 'isDefault' como false para garantir que é uma categoria privada
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
        // Importante: No frontend devemos bloquear a edição de categorias padrão.
        // Aqui confiamos que o UI não vai chamar update para uma categoria default,
        // mas as regras de segurança do Firestore (backend) é que devem bloquear de fato.
        const categoryRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(categoryRef, data);
    },

    // --- DELETAR CATEGORIA ---
    async deleteCategory(id: string): Promise<void> {
        const categoryRef = doc(db, COLLECTION_NAME, id);
        await deleteDoc(categoryRef);
    }
};

// --- HOOKS ---

export const useCategories = () => {
    return useQuery({
        queryKey: ['categories'],
        queryFn: () => api.getCategories(),
        staleTime: 5 * 60 * 1000 // 5 minutos de cache
    });
};

export const useCreateCategory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Omit<CategoryDTO, 'id'>) => api.createCategory(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        }
    });
};

export const useUpdateCategory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CategoryDTO> }) =>
            api.updateCategory(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        }
    });
};

export const useDeleteCategory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.deleteCategory(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        }
    });
};