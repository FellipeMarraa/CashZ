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
                if (data.planExpiresAt && new Date(data.planExpiresAt) < new Date()) {
                    return { ...data, plan: "free", hiddenTutorials: data.hiddenTutorials || [] } as UserPrefs;
                }
                return { hiddenTutorials: [], plan: "free", ...data } as UserPrefs;
            }
            return { hiddenTutorials: [], plan: "free" };
        },
        enabled: !!userId,
    });

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

            // 1. Verificar se o usuário já usou este código e se ainda está ativo
            if (preferences?.couponUsed === code && preferences?.plan !== "free") {
                throw new Error("Você já resgatou este cupom e ele ainda está ativo.");
            }

            const couponRef = doc(db, "coupons", code);
            const couponSnap = await getDoc(couponRef);

            if (!couponSnap.exists()) throw new Error("Código de cupom inválido.");

            const couponData = couponSnap.data();

            // 2. Validações de Limite e Status
            if (!couponData.isActive) throw new Error("Este cupom não está mais ativo.");

            // Se usageLimit for -1, consideramos uso ilimitado (para você)
            if (couponData.usageLimit !== -1 && couponData.usedCount >= couponData.usageLimit) {
                throw new Error("Este cupom atingiu o limite máximo de usos.");
            }

            // 3. Calcular Expiração
            const expirationDate = new Date();
            // Se days for 9999, tratamos como "vitalício"
            expirationDate.setDate(expirationDate.getDate() + (couponData.days || 30));

            const userPrefsRef = doc(db, "user_preferences", userId);

            // 4. Salvar no Usuário
            await setDoc(userPrefsRef, {
                plan: couponData.planType || "premium",
                planExpiresAt: expirationDate.toISOString(),
                couponUsed: code,
                lastUpdated: new Date().toISOString()
            }, { merge: true });

            // 5. Incrementar contador no Cupom (apenas se não for o ilimitado -1)
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
        isPremium: (preferences?.plan === "premium" || preferences?.plan === "annual")
    };
};