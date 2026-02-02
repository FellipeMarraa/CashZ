import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
    serverTimestamp
} from 'firebase/firestore/lite';
import { useDialogManager } from "@/context/DialogManagerContext";
import { useToast } from "@/hooks/use-toast";

export const useSharing = () => {
    const queryClient = useQueryClient();
    const { setActiveDialog } = useDialogManager();
    const { toast } = useToast();
    const user = auth.currentUser;

    // 1. Busca convites que EU enviei
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

    // 2. Criar novo compartilhamento (Inicia como PENDENTE)
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
            const shareRef = doc(db, 'sharing', targetEmail);

            await setDoc(shareRef, {
                email: targetEmail,
                permissions: data.permissions,
                ownerId: user.uid,
                ownerName: user.displayName || "Usuário",
                ownerEmail: user.email?.toLowerCase().trim(),
                status: 'PENDENTE', // Novo campo de controle
                updatedAt: serverTimestamp()
            });
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['financial-sharing'] }),
        onError: (error: any) => {
            if (error.message === "PREMIUM_REQUIRED") {
                setActiveDialog("upgrade-plan");
            }
        }
    });

    // 3. Busca convites que enviaram PARA MIM
    const { data: sharedToMe = [], isLoading: isLoadingReceived } = useQuery({
        queryKey: ['financial-sharing-received', user?.email],
        queryFn: async () => {
            if (!user?.email) return [];
            const myEmail = user.email.toLowerCase().trim();
            const q = query(
                collection(db, 'sharing'),
                where("email", "==", myEmail)
            );
            const snap = await getDocs(q);
            return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        },
        enabled: !!user?.email
    });

    // 4. Aceitar convite
    const acceptSharingMutation = useMutation({
        mutationFn: async (shareId: string) => {
            const shareRef = doc(db, 'sharing', shareId);
            await updateDoc(shareRef, {
                status: 'ACEITO',
                acceptedAt: serverTimestamp()
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['financial-sharing-received'] });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            toast({ title: "Convite aceito!", description: "Agora você visualiza as finanças compartilhadas." });
        }
    });

    const revokeMutation = useMutation({
        mutationFn: async (shareId: string) => {
            await deleteDoc(doc(db, 'sharing', shareId));
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['financial-sharing'] })
    });

    const leaveSharingMutation = useMutation({
        mutationFn: async (shareId: string) => {
            await deleteDoc(doc(db, 'sharing', shareId));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['financial-sharing-received'] });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
        }
    });

    return {
        sharedWith,
        sharedToMe,
        shareMutation,
        revokeMutation,
        acceptSharingMutation,
        leaveSharingMutation,
        isLoading: isLoadingReceived
    };
};