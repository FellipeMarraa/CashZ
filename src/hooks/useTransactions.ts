import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { IMes } from "@/model/IMes";
import { Transaction } from "@/model/types/Transaction";

const API_BASE_URL = 'http://localhost:8080/api/finances';
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

    async getTransactions(month: string, year: number): Promise<Transaction[]> {
        const monthNumber = IMes.indexOf(month) + 1;
        const response = await this.fetchWithAuth(`/byMonthAndYear?mes=${monthNumber}&ano=${year}`);
        const data = await response.json();

        return data.map((transaction: any) => ({
            ...transaction,
            date: transaction.date ? new Date(transaction.date) : null,
        }));
    },

    async getAllTransactions(): Promise<Transaction[]> {
        const response = await this.fetchWithAuth('/list');
        return response.json();
    },

    async getTransactionById(id: string): Promise<Transaction> {
        const response = await this.fetchWithAuth(`/${id}`);
        return response.json();
    },

    async createTransaction(data: Omit<Transaction, 'id'>): Promise<Transaction> {
        const response = await this.fetchWithAuth('/create', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        return response.json();
    },

    async updateTransaction(id: string, data: Partial<Transaction>): Promise<Transaction> {
        const response = await this.fetchWithAuth(`/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        return response.json();
    },

    async deleteTransaction(id: string, deleteAll: boolean = false): Promise<void> {
        await this.fetchWithAuth(`/${id}?deleteAll=${deleteAll}`, {
            method: 'DELETE'
        });
    },

    async getTransactionsByMonth(month: number): Promise<Transaction[]> {
        const response = await this.fetchWithAuth(`/byMonth?mes=${month}`);
        return response.json();
    },

    async getTransactionsByYear(year: number): Promise<Transaction[]> {
        const response = await this.fetchWithAuth(`/byYear?ano=${year}`);
        return response.json();
    }
};

export const useTransactions = (month: string, year: number) => {
    return useQuery({
        queryKey: ['transactions', month, year],
        queryFn: () => api.getTransactions(month, year),
        staleTime: 5 * 60 * 1000,
    });
};

export const useAllTransactions = () => {
    return useQuery({
        queryKey: ['transactions'],
        queryFn: () => api.getAllTransactions(),
        staleTime: 5 * 60 * 1000
    });
};

export const useTransactionById = (id: string) => {
    return useQuery({
        queryKey: ['transaction', id],
        queryFn: () => api.getTransactionById(id),
        enabled: !!id,
        staleTime: 5 * 60 * 1000
    });
};

export const useTransactionsByMonth = (month: number) => {
    return useQuery({
        queryKey: ['transactions', 'month', month],
        queryFn: () => api.getTransactionsByMonth(month),
        staleTime: 5 * 60 * 1000
    });
};

export const useTransactionsByYear = (year: number) => {
    return useQuery({
        queryKey: ['transactions', 'year', year],
        queryFn: () => api.getTransactionsByYear(year),
        staleTime: 5 * 60 * 1000
    });
};

export const useCreateTransaction = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Omit<Transaction, 'id'>) => api.createTransaction(data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['transactions']
            });
        }
    });
};

export const useUpdateTransaction = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Transaction> }) =>
            api.updateTransaction(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['transactions']
            });
        }
    });
};

export const useDeleteTransaction = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, deleteAll = false }: { id: string; deleteAll?: boolean }) =>
            api.deleteTransaction(id, deleteAll),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['transactions']
            });
        }
    });
};

// Tipos de erro personalizados
export class ApiError extends Error {
    constructor(
        message: string,
        public status?: number,
        public data?: any
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

// Utilitários para formatação
export const formatTransactionAmount = (amount: number): string => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(amount);
};

export const formatTransactionDate = (date: Date): string => {
    return new Intl.DateTimeFormat('pt-BR').format(date);
};