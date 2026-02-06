import { db } from "../../firebase";
import { doc, getDoc, setDoc, updateDoc, increment, arrayUnion } from "firebase/firestore"; // Adicionado arrayUnion
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {useMemo} from "react";

export type UserPlan = "free" | "premium" | "annual";

interface UserPrefs {
    hiddenTutorials: string[];
    plan: UserPlan;
    planExpiresAt?: string;
    couponsUsed?: string[]; // Alterado para array
    isAdmin?: boolean;
}

export const useUserPreferences = (userId: string | undefined) => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const { data: preferences, isLoading } = useQuery<UserPrefs>({
        queryKey: ["user-preferences", userId],
        queryFn: async () => {
            if (!userId) return { hiddenTutorials: [], plan: "free" };
            const docRef = doc(db, "user_preferences", userId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                const now = new Date();

                // Verificação de expiração mais robusta
                if (data.planExpiresAt && new Date(data.planExpiresAt) < now) {
                    // Se expirou, o plano volta a ser free internamente na query
                    return { ...data, plan: "free" } as UserPrefs;
                }
                return { hiddenTutorials: [], plan: "free", ...data } as UserPrefs;
            }
            return { hiddenTutorials: [], plan: "free" };
        },
        enabled: !!userId,
    });

    const isPremiumFinal = useMemo(() => {
        if (!preferences) return false;
        const hasPaidPlan = preferences.plan === "premium" || preferences.plan === "annual";
        const isNotExpired = preferences.planExpiresAt
            ? new Date(preferences.planExpiresAt) > new Date()
            : true;

        return hasPaidPlan && isNotExpired;
    }, [preferences]);

    const hideTutorialMutation = useMutation({
        mutationFn: async (tutorialKey: string) => {
            if (!userId) throw new Error("Sem userId");
            const docRef = doc(db, "user_preferences", userId);
            const currentHidden = preferences?.hiddenTutorials || [];
            if (currentHidden.includes(tutorialKey)) return;
            const newValue = [...currentHidden, tutorialKey];
            await setDoc(docRef, {
                hiddenTutorials: newValue,
                lastUpdated: new Date().toISOString()
            }, { merge: true });
            return newValue;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["user-preferences", userId] });
        }
    });

    const redeemCouponMutation = useMutation({
        mutationFn: async (couponCode: string) => {
            if (!userId) throw new Error("Usuário não logado");

            const code = couponCode.trim().toUpperCase();
            const couponRef = doc(db, "coupons", code);
            const couponSnap = await getDoc(couponRef);

            if (!couponSnap.exists()) throw new Error("Código de cupom inválido.");
            const couponData = couponSnap.data();

            if (!couponData.isActive) throw new Error("Este cupom não está mais ativo.");
            if (couponData.usageLimit !== -1 && couponData.usedCount >= couponData.usageLimit) {
                throw new Error("Este cupom atingiu o limite máximo de usos.");
            }

            const today = new Date();
            let baseDate = today;

            if (preferences?.plan !== "free" && preferences?.planExpiresAt) {
                const currentExpiration = new Date(preferences.planExpiresAt);
                if (currentExpiration > today) {
                    baseDate = currentExpiration;
                }
            }

            const expirationDate = new Date(baseDate);
            expirationDate.setDate(expirationDate.getDate() + (couponData.days || 30));

            const userPrefsRef = doc(db, "user_preferences", userId);

            await setDoc(userPrefsRef, {
                plan: couponData.planType || "premium",
                planExpiresAt: expirationDate.toISOString(),
                couponsUsed: arrayUnion(code), // Modificado para adicionar ao array
                lastUpdated: new Date().toISOString()
            }, { merge: true });

            if (couponData.usageLimit !== -1) {
                await updateDoc(couponRef, {
                    usedCount: increment(1)
                });
            }

            return couponData;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["user-preferences", userId] });
            toast({ title: "Sucesso!", description: "Seu cupom foi ativado!", variant: "success" });
        },
        onError: (error: any) => {
            toast({ title: "Erro", description: error.message, variant: "destructive" });
        }
    });

    return {
        preferences,
        isLoading,
        hideTutorial: hideTutorialMutation.mutateAsync,
        redeemCoupon: redeemCouponMutation.mutateAsync,
        isRedeeming: redeemCouponMutation.isPending,
        isPremium: isPremiumFinal
    };
};