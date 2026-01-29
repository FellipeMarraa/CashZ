import { db } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore/lite";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useUserPreferences = (userId: string | undefined) => {
    const queryClient = useQueryClient();

    const { data: preferences, isLoading } = useQuery({
        queryKey: ["user-preferences", userId],
        queryFn: async () => {
            if (!userId) return { hiddenTutorials: [] };
            const docRef = doc(db, "user_preferences", userId);
            const docSnap = await getDoc(docRef);
            return docSnap.exists() ? docSnap.data() : { hiddenTutorials: [] };
        },
        enabled: !!userId,
        staleTime: Infinity,
    });

    const hideTutorialMutation = useMutation({
        mutationFn: async (tutorialKey: string) => {
            if (!userId) throw new Error("Sem userId");

            const docRef = doc(db, "user_preferences", userId);

            // IMPORTANTE: Em vez de confiar no 'preferences' do hook (que pode estar desatualizado),
            // buscamos o dado atual direto do cache do queryClient ou do banco
            const currentPrefs = queryClient.getQueryData<{ hiddenTutorials: string[] }>(["user-preferences", userId]);
            const currentHidden = currentPrefs?.hiddenTutorials || [];

            if (currentHidden.includes(tutorialKey)) return;

            const newValue = [...currentHidden, tutorialKey];

            await setDoc(docRef, {
                hiddenTutorials: newValue,
                lastUpdated: new Date().toISOString()
            }, { merge: true });

            return newValue;
        },
        onSuccess: () => {
            console.log("Preferência salva no Firebase!");
            queryClient.invalidateQueries({ queryKey: ["user-preferences", userId] });
        },
        onError: (error) => {
            console.error("Falha ao salvar no Firebase:", error);
        }
    });

    return {
        preferences,
        isLoading,
        hideTutorial: hideTutorialMutation.mutateAsync
    };
};