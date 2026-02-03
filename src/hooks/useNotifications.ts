import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { db } from "../../firebase";
import {
    collection, query, where, getDocs, updateDoc,
    doc, deleteDoc, orderBy, writeBatch
} from "firebase/firestore/lite";
import { useAuth } from "@/context/AuthContext";

export interface Notification {
    id: string;
    userId: string;
    title: string;
    message: string;
    createdAt: string;
    read: boolean;
    type: 'SUCCESS' | 'WARNING' | 'INFO' | 'ERROR';
}

export const useNotifications = () => {
    const { user } = useAuth();
    useQueryClient();
    const queryInfo = useQuery({
        queryKey: ["notifications", user?.id],
        queryFn: async () => {
            if (!user) return [];
            const q = query(
                collection(db, "notifications"),
                where("userId", "==", user.id),
                orderBy("createdAt", "desc")
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Notification));
        },
        enabled: !!user,
    });

    return {
        notifications: queryInfo.data ?? [],
        unreadCount: queryInfo.data?.filter(n => !n.read).length ?? 0,
        isLoading: queryInfo.isLoading,
        refetch: queryInfo.refetch
    };
};

export const useMarkNotificationAsRead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            // No Lite, sempre use doc(db, collection, id) para garantir a ref
            const docRef = doc(db, "notifications", id);
            await updateDoc(docRef, { read: true });
        },
        onSuccess: (_) => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        }
    });
};

export const useMarkAllNotificationsAsRead = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            if (!user) return;

            const q = query(
                collection(db, "notifications"),
                where("userId", "==", user.id),
                where("read", "==", false)
            );

            const snapshot = await getDocs(q);
            if (snapshot.empty) return;

            const batch = writeBatch(db);

            snapshot.docs.forEach(d => {
                const docRef = doc(db, "notifications", d.id);
                batch.update(docRef, { read: true });
            });

            await batch.commit();
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] })
    });
};

export const useDeleteNotification = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await deleteDoc(doc(db, "notifications", id));
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] })
    });
};
export const useDeleteAllNotifications = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            if (!user) return;
            const q = query(collection(db, "notifications"), where("userId", "==", user.id));
            const snapshot = await getDocs(q);
            const batch = writeBatch(db);
            snapshot.docs.forEach(d => batch.delete(d.ref));
            await batch.commit();
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] })
    });
};