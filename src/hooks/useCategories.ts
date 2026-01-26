import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CategoryDTO } from "@/model/CategoryDTO";

const API_BASE_URL = 'http://localhost:8080/api/categories';

const api = {
    async fetchWithAuth(endpoint: string, options?: RequestInit) {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Token de autenticação não encontrado.");

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
                ...(options?.headers || {})
            },
        });

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        return response;
    },

    async getCategories(): Promise<CategoryDTO[]> {
        const response = await this.fetchWithAuth('');
        return response.json();
    },

    async createCategory(data: Omit<CategoryDTO, 'id'>): Promise<CategoryDTO> {
        const response = await this.fetchWithAuth('', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        return response.json();
    },

    async updateCategory(id: string, data: Partial<CategoryDTO>): Promise<CategoryDTO> {
        const response = await this.fetchWithAuth(`/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        return response.json();
    },

    async deleteCategory(id: string): Promise<void> {
        await this.fetchWithAuth(`/${id}`, {
            method: 'DELETE'
        });
    }
};

export const useCategories = () => {
    return useQuery({
        queryKey: ['categories'],
        queryFn: () => api.getCategories(),
        staleTime: 5 * 60 * 1000 // 5 minutos
    });
};

export const useCreateCategory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Omit<CategoryDTO, 'id'>) => api.createCategory(data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['categories']
            });
        }
    });
};

export const useUpdateCategory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CategoryDTO> }) =>
            api.updateCategory(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['categories']
            });
        }
    });
};

export const useDeleteCategory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.deleteCategory(id),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['categories']
            });
        }
    });
};