"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { db, auth } from "../../firebase";
import {
    collection,
    query,
    where,
    getDocs,
    deleteDoc,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    serverTimestamp,
    onSnapshot // Adicionado para Tempo Real
} from 'firebase/firestore'; // REMOVIDO /lite para permitir realtime
import { useDialogManager } from "@/context/DialogManagerContext";
import { useToast } from "@/hooks/use-toast";
import { sendNotification } from "@/service/notificationService";
import { useEffect, useState } from "react";

export const useSharing = () => {
    const queryClient = useQueryClient();
    const { setActiveDialog } = useDialogManager();
    const { toast } = useToast();
    const user = auth.currentUser;

    const [sharedWith, setSharedWith] = useState<any[]>([]);
    const [sharedToMe, setSharedToMe] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user?.uid || !user?.email) return;

        const myEmail = user.email.toLowerCase().trim();

        const qSent = query(
            collection(db, 'sharing'),
            where("ownerId", "==", user.uid)
        );

        const unsubSent = onSnapshot(qSent, (snap) => {
            setSharedWith(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        const qReceived = query(
            collection(db, 'sharing'),
            where("email", "==", myEmail)
        );

        const unsubReceived = onSnapshot(qReceived, (snap) => {
            setSharedToMe(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setIsLoading(false);
        });

        return () => {
            unsubSent();
            unsubReceived();
        };
    }, [user?.uid, user?.email]);

    const shareMutation = useMutation({
        mutationFn: async (data: { email: string, permissions: string[] }) => {
            if (!user?.uid) throw new Error("Usuário não autenticado");

            const userPrefsRef = doc(db, "user_preferences", user.uid);
            const userPrefsSnap = await getDoc(userPrefsRef);
            const plan = userPrefsSnap.data()?.plan || "free";

            if (plan !== "premium" && plan !== "annual") {
                throw new Error("PREMIUM_REQUIRED");
            }

            const targetEmail = data.email.trim().toLowerCase();

            const userPrefsCol = collection(db, "user_preferences");
            const qUser = query(userPrefsCol, where("email", "==", targetEmail));
            const userSnap = await getDocs(qUser);

            const shareRef = doc(db, 'sharing', targetEmail);
            await setDoc(shareRef, {
                email: targetEmail,
                permissions: data.permissions,
                ownerId: user.uid,
                ownerName: user.displayName || "Usuário",
                ownerEmail: user.email?.toLowerCase().trim(),
                status: 'PENDENTE',
                updatedAt: serverTimestamp()
            });

            if (!userSnap.empty) {
                const targetUserId = userSnap.docs[0].id;

                await sendNotification(
                    targetUserId,
                    "Novo Convite de Acesso 🤝",
                    `${user.email} quer compartilhar as finanças com você.`,
                    "INFO"
                );
            } else {
                console.warn("Destinatário não encontrado em user_preferences. Verifique se o e-mail está correto no cadastro dele.");
            }
        },
        onSuccess: () => {
            toast({ title: "Convite enviado!", description: "Aguardando o parceiro aceitar." });
        },
        onError: (error: any) => {
            if (error.message === "PREMIUM_REQUIRED") {
                setActiveDialog("upgrade-plan");
            } else {
                toast({ title: "Erro", description: "Falha ao enviar convite.", variant: "destructive" });
                console.log(error.message);
            }
        }
    });

    const acceptSharingMutation = useMutation({
        mutationFn: async (shareId: string) => {
            const shareRef = doc(db, 'sharing', shareId);
            const snap = await getDoc(shareRef);

            await updateDoc(shareRef, {
                status: 'ACEITO',
                acceptedAt: serverTimestamp()
            });

            if (snap.exists()) {
                const data = snap.data();
                await sendNotification(
                    data.ownerId,
                    "Convite Aceito! ✨",
                    `${user?.email} agora compartilha as finanças com você.`,
                    "SUCCESS"
                );
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            toast({ title: "Convite aceito!", variant: "success" });
        }
    });

    const revokeMutation = useMutation({
        mutationFn: async (shareId: string) => {
            await deleteDoc(doc(db, 'sharing', shareId));
        },
        onSuccess: () => toast({ title: "Acesso revogado." })
    });

    const leaveSharingMutation = useMutation({
        mutationFn: async (shareId: string) => {
            const shareRef = doc(db, 'sharing', shareId);
            const snap = await getDoc(shareRef);

            if (snap.exists()) {
                const data = snap.data();
                await sendNotification(
                    data.ownerId,
                    "Acesso Removido 🚪",
                    `${user?.email} removeu o vínculo de compartilhamento.`,
                    "INFO"
                );
            }
            await deleteDoc(doc(db, 'sharing', shareId));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            toast({ title: "Você saiu do compartilhamento." });
        }
    });

    return {
        sharedWith,
        sharedToMe,
        shareMutation,
        revokeMutation,
        acceptSharingMutation,
        leaveSharingMutation,
        isLoading
    };
};