"use client"

import {useMutation} from "@tanstack/react-query";
import {db} from "../../firebase";
import {useAuth} from "@/context/AuthContext";
import {useEffect, useState} from 'react';
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    doc,
    updateDoc,
    getDocs,
    writeBatch, deleteDoc
} from 'firebase/firestore';

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
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user?.id) return;

        const q = query(
            collection(db, "notifications"),
            where("userId", "==", user.id),
            orderBy("createdAt", "desc")
        );

        // Tempo real instantâneo
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Notification));
            setNotifications(docs);
            setUnreadCount(docs.filter(n => !n.read).length);
            setIsLoading(false);
        }, (error) => {
            console.error("Erro no tempo real das notificações:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user?.id]);

    return { notifications, unreadCount, isLoading };
};

export const useMarkNotificationAsRead = () => {
    return useMutation({
        mutationFn: async (id: string) => {
            const docRef = doc(db, "notifications", id);
            await updateDoc(docRef, { read: true });
        }
    });
};

export const useMarkAllNotificationsAsRead = () => {
    const { user } = useAuth();
    return useMutation({
        mutationFn: async () => {
            if (!user) return;
            const q = query(
                collection(db, "notifications"),
                where("userId", "==", user.id),
                where("read", "==", false)
            );
            const snapshot = await getDocs(q);
            const batch = writeBatch(db);
            snapshot.docs.forEach(d => batch.update(d.ref, { read: true }));
            await batch.commit();
        }
    });
};

export const useDeleteNotification = () => {
    return useMutation({
        mutationFn: async (id: string) => {
            await deleteDoc(doc(db, "notifications", id));
        }
    });
};