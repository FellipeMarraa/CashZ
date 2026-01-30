import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { db, auth } from "../../firebase";
import {
    collection,
    query,
    where,
    getDocs,
    deleteDoc,
    doc,
    setDoc, // Trocamos addDoc por setDoc
    serverTimestamp
} from 'firebase/firestore/lite';

export const useSharing = () => {
    const queryClient = useQueryClient();
    const user = auth.currentUser;

    // Busca com quem EU compartilhei meus dados
    const { data: sharedWith = []} = useQuery({
        queryKey: ['financial-sharing', user?.uid],
        queryFn: async () => {
            if (!user?.uid) return [];
            const q = query(
                collection(db, 'sharing'),
                where("ownerId", "==", user.uid)
            );
            const snap = await getDocs(q);
            return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        },
        enabled: !!user?.uid
    });

    // Mutation para criar novo compartilhamento
    const shareMutation = useMutation({
        mutationFn: async (data: { email: string, permissions: string[] }) => {
            if (!user?.uid) throw new Error("Usuário não autenticado");

            // AJUSTE CRÍTICO: Usamos o e-mail como ID do documento.
            // Isso permite que as Security Rules verifiquem o acesso sem fazer buscas lentas.
            const shareRef = doc(db, 'sharing', data.email.trim().toLowerCase());

            await setDoc(shareRef, {
                email: data.email.trim().toLowerCase(),
                permissions: data.permissions,
                ownerId: user.uid,
                ownerEmail: user.email,
                updatedAt: serverTimestamp()
            });
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['financial-sharing'] })
    });

    // Mutation para revogar acesso
    const revokeMutation = useMutation({
        mutationFn: async (shareId: string) => {
            // shareId aqui será o e-mail do usuário
            await deleteDoc(doc(db, 'sharing', shareId));
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['financial-sharing'] })
    });

    const { data: sharedToMe = [], isLoading: isLoadingReceived } = useQuery({
        queryKey: ['financial-sharing-received', user?.email],
        queryFn: async () => {
            if (!user?.email) return [];
            const q = query(
                collection(db, 'sharing'),
                where("email", "==", user.email.toLowerCase())
            );
            const snap = await getDocs(q);
            return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        },
        enabled: !!user?.email
    });

    // Mutation para o destinatário sair do compartilhamento (deletar o convite)
    const leaveSharingMutation = useMutation({
        mutationFn: async (shareId: string) => {
            await deleteDoc(doc(db, 'sharing', shareId));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['financial-sharing-received'] });
            queryClient.invalidateQueries({ queryKey: ['transactions'] }); // Limpa as transações do outro usuário
        }
    });

    return {
        sharedWith,
        sharedToMe,
        shareMutation,
        revokeMutation,
        leaveSharingMutation,
        isLoading: isLoadingReceived
    };
};