import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {useNotificationSocket} from '@/hooks/useNotificationSocket';
import {useAuth} from "@/context/AuthContext.tsx";
import { useEffect } from "react";

interface Notification {
    id: string;
    title: string;
    message: string;
    createdAt: string;
    read: boolean;
    type: 'SUCCESS' | 'WARNING' | 'INFO' | 'ERROR';
}

const API_BASE_URL = 'http://localhost:8080/api/notifications';

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

    async getNotifications(): Promise<Notification[]> {
        const response = await this.fetchWithAuth('');
        return response.json();
    },

    async markAsRead(id: string): Promise<void> {
        const response = await this.fetchWithAuth(`/read`, {
            method: 'PUT',
            body: JSON.stringify(id)
        });
        if (!response.ok) {
            throw new Error(`Erro ao marcar notificação como lida: ${response.status}`);
        }
    },

    async markAllAsRead(): Promise<void> {
        await this.fetchWithAuth('/read/all', {
            method: 'PUT'
        });
    },

    async deleteNotification(id: string): Promise<void> {
        const response = await this.fetchWithAuth(`/delete`, {
            method: 'DELETE',
            body: id
        });
        if (!response.ok) {
            throw new Error(`Erro ao deletar notificação: ${response.status}`);
        }
    },

    async deleteAllNotifications(): Promise<void> {
        const response = await this.fetchWithAuth(`/delete/all`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error(`Erro ao deletar todas as notificações: ${response.status}`);
        }
    }
};

export const useNotifications = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    const query = useQuery({
        queryKey: ["notifications"],
        queryFn: () => api.getNotifications(),
        enabled: !!user,
        refetchOnMount: true,
        refetchOnWindowFocus: true,
    });

    useNotificationSocket(user?.id ?? "", (newNotification) => {
        queryClient.setQueryData(["notifications"], (oldData: Notification[] | undefined) => {
            if (!oldData) return [newNotification];
            const notificationExists = oldData.some(n => n.id === newNotification.id);
            if (notificationExists) return oldData;
            window.dispatchEvent(new CustomEvent('new-notification'));
            return [newNotification, ...oldData];
        });
    });

    useEffect(() => {
        if (user) {
            // @ts-ignore
            queryClient.invalidateQueries(["notifications"]);
        }
    }, [user?.id]);

    const unreadCount = query.data?.filter((n) => !n.read).length ?? 0;

    return {
        notifications: query.data ?? [],
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        unreadCount,
        refetch: query.refetch,
    };
};

export const useMarkNotificationAsRead = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.markAsRead(id),
        onSuccess: (_, id) => {
            queryClient.setQueryData(['notifications'], (oldData: Notification[] | undefined) => {
                if (!oldData) return [];
                return oldData.map(notification =>
                    notification.id === id ? { ...notification, read: true } : notification
                );
            });
        }
    });
};

export const useMarkAllNotificationsAsRead = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => api.markAllAsRead(),
        onSuccess: () => {
            queryClient.setQueryData(['notifications'], (oldData: Notification[] | undefined) => {
                if (!oldData) return [];
                return oldData.map(notification => ({ ...notification, read: true }));
            });
        }
    });
};

export const useDeleteNotification = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.deleteNotification(id),
        onSuccess: (_, id) => {
            queryClient.setQueryData(['notifications'], (oldData: Notification[] | undefined) => {
                if (!oldData) return [];
                return oldData.filter(notification => notification.id !== id);
            });
        }
    });
};

export const useDeleteAllNotifications = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => api.deleteAllNotifications(),
        onSuccess: () => {
            queryClient.setQueryData(['notifications'], []);
        }
    });
};