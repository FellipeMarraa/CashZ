import { db } from "../../firebase";
import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore/lite";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export type UserPlan = "free" | "premium" | "annual";

interface UserPrefs {
    hiddenTutorials: string[];
    plan: UserPlan;
    planExpiresAt?: string;
    couponUsed?: string;
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
                // Verifica se o plano expirou
                if (data.planExpiresAt && new Date(data.planExpiresAt) < new Date()) {
                    return { ...data, plan: "free" } as UserPrefs;
                }
                return { plan: "free", ...data } as UserPrefs;
            }
            return { hiddenTutorials: [], plan: "free" };
        },
        enabled: !!userId,
    });

    const redeemCouponMutation = useMutation({
        mutationFn: async (couponCode: string) => {
            if (!userId) throw new Error("Usuário não logado");

            const code = couponCode.trim().toUpperCase();
            const couponRef = doc(db, "coupons", code);
            const couponSnap = await getDoc(couponRef);

            if (!couponSnap.exists()) throw new Error("Cupom inexistente");

            const couponData = couponSnap.data();

            if (!couponData.isActive) throw new Error("Cupom desativado");
            if (couponData.usedCount >= couponData.usageLimit) throw new Error("Limite de uso atingido");

            // Calcula expiração: data atual + dias do cupom
            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + (couponData.days || 365));

            // 1. Atualiza o usuário
            const userPrefsRef = doc(db, "user_preferences", userId);
            await setDoc(userPrefsRef, {
                plan: couponData.planType || "premium",
                planExpiresAt: expirationDate.toISOString(),
                couponUsed: code,
                lastUpdated: new Date().toISOString()
            }, { merge: true });

            // 2. Incrementa uso do cupom (Dinamismo)
            await updateDoc(couponRef, {
                usedCount: increment(1)
            });

            return couponData;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["user-preferences", userId] });
            toast({ title: "Sucesso!", description: "Plano atualizado via cupom!", variant: "success" });
        },
        onError: (error: any) => {
            toast({ title: "Ops!", description: error.message, variant: "destructive" });
        }
    });

    return {
        preferences,
        isLoading,
        redeemCoupon: redeemCouponMutation.mutateAsync,
        isRedeeming: redeemCouponMutation.isPending,
        isPremium: (preferences?.plan === "premium" || preferences?.plan === "annual")
    };
};