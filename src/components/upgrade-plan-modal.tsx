"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, ShieldCheck, Star, Ticket, Zap, UserPlus, CheckCircle2 } from "lucide-react"
import { useUserPreferences } from "@/hooks/useUserPreferences"
import { useAuth } from "@/context/AuthContext"
import { toast } from "@/hooks/use-toast.ts";
import { db } from "../../firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export const UpgradePlanModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const { user } = useAuth();
    const { redeemCoupon, isRedeeming } = useUserPreferences(user?.id);

    // Estados para Cupom
    const [couponInput, setCouponInput] = useState("");
    const [showCouponField, setShowCouponField] = useState(false);
    const [couponApplied, setCouponApplied] = useState(false);

    // Estados para Indicação
    const [showReferralField, setShowReferralField] = useState(false);
    const [referralEmail, setReferralEmail] = useState("");
    const [isSubmittingReferral, setIsSubmittingReferral] = useState(false);
    const [referralApplied, setReferralApplied] = useState(false);

    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

    const handleRedeem = async () => {
        if (!couponInput) return;
        try {
            await redeemCoupon(couponInput);
            setCouponInput("");
            setCouponApplied(true);
            toast({ title: "Cupom aplicado! 🎉", variant: "success" });
            onClose();
        } catch (e) { }
    };

    const handleReferral = async () => {
        if (!user?.id || !user?.email) {
            toast({ title: "Erro", description: "Usuário não identificado." });
            return;
        }

        const emailTrimmed = referralEmail.trim().toLowerCase();

        if (!emailTrimmed) return;
        if (emailTrimmed === user.email.toLowerCase()) {
            toast({
                title: "Epa! ✋",
                description: "Você não pode indicar a si mesmo.",
                variant: "destructive"
            });
            return;
        }

        setIsSubmittingReferral(true);
        try {
            await setDoc(doc(db, 'referrals', user.id), {
                referrerEmail: emailTrimmed,
                targetUserId: user.id,
                targetEmail: user.email,
                status: 'PENDING_PAYMENT',
                createdAt: serverTimestamp()
            }, { merge: true });

            setReferralApplied(true);
            setShowReferralField(false);
            toast({
                title: "Indicação registrada! 🤝",
                description: "Seu bônus será liberado após a confirmação do pagamento.",
                variant: "success"
            });
        } catch (error) {
            toast({ title: "Erro", description: "Falha ao registrar indicação.", variant: "destructive" });
        } finally {
            setIsSubmittingReferral(false);
        }
    };

    const handlePayment = async (planType: 'premium' | 'annual', price: number) => {
        if (!user?.id) return;
        setLoadingPlan(planType);

        try {
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, planType, price }),
            });

            const data = await response.json();
            if (data.init_point) {
                window.location.href = data.init_point;
            } else {
                throw new Error("Ponto de início não encontrado");
            }
        } catch (error) {
            toast({ title: "Erro", description: "Não foi possível gerar o link de pagamento.", variant: "destructive" });
            setLoadingPlan(null);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="w-[calc(100%-2rem)] sm:max-w-[400px] rounded-2xl border-none shadow-2xl p-6 bg-background dark:bg-[#282a36] outline-none">
                <DialogHeader className="items-center text-center">
                    <div className="h-14 w-14 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
                        <Zap className="h-7 w-7 text-emerald-600 fill-emerald-600" />
                    </div>
                    <DialogTitle className="text-2xl font-bold text-foreground">Seja Premium</DialogTitle>
                    <DialogDescription className="text-muted-foreground text-xs">
                        Desbloqueie todos os recursos e gerencie suas finanças em família.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-2">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 bg-muted/30 p-2 rounded-lg">
                            <ShieldCheck className="h-5 w-5 text-emerald-500" />
                            <span className="text-xs font-medium">Compartilhamento Ilimitado</span>
                        </div>
                        <div className="flex items-center gap-3 bg-muted/30 p-2 rounded-lg">
                            <Star className="h-5 w-5 text-emerald-500" />
                            <span className="text-xs font-medium">Exportação de Relatórios (Excel/CSV)</span>
                        </div>
                    </div>

                    <Button
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-14 rounded-xl flex flex-col items-center justify-center gap-0 shadow-lg shadow-emerald-500/20"
                        onClick={() => handlePayment('premium', 14.90)}
                        disabled={loadingPlan !== null}
                    >
                        {loadingPlan === 'premium' ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <>
                                <span className="text-sm font-bold">Assinar Plano Mensal</span>
                                <span className="text-[10px] opacity-80">R$ 14,90 / mês</span>
                            </>
                        )}
                    </Button>

                    <div className="space-y-2 pt-2 border-t dark:border-slate-800">
                        {/* Seção de Feedback Visual para o que já foi aplicado */}
                        {(couponApplied || referralApplied) && (
                            <div className="flex items-center justify-center gap-2 text-emerald-500 py-2 animate-in zoom-in-95">
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="text-[10px] font-bold tracking-wide uppercase">
                                    {couponApplied ? "Cupom Ativado" : "Indicação Registrada"}
                                </span>
                            </div>
                        )}

                        {!referralApplied && !couponApplied && (
                            !showCouponField ? (
                                <button
                                    onClick={() => { setShowCouponField(true); setShowReferralField(false); }}
                                    className="w-full flex items-center justify-center gap-2 text-[10px] text-muted-foreground hover:text-emerald-500 transition-colors py-1"
                                >
                                    <Ticket className="h-3 w-3" /> Possui um código?
                                </button>
                            ) : (
                                <div className="flex gap-2 animate-in slide-in-from-top-1">
                                    <Input
                                        placeholder="CÓDIGO"
                                        value={couponInput}
                                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                                        className="h-9 text-xs text-center tracking-widest uppercase font-mono"
                                    />
                                    <Button size="sm" className="bg-emerald-600 text-white" onClick={handleRedeem} disabled={isRedeeming}>
                                        {isRedeeming ? <Loader2 className="h-3 w-3 animate-spin" /> : "Ativar"}
                                    </Button>
                                </div>
                            )
                        )}

                        {/* Seção de Indicação - Só aparece se cupom NÃO foi aplicado */}
                        {!couponApplied && !referralApplied && (
                            !showReferralField ? (
                                <button
                                    onClick={() => { setShowReferralField(true); setShowCouponField(false); }}
                                    className="w-full flex items-center justify-center gap-2 text-[10px] text-muted-foreground hover:text-blue-500 transition-colors py-1"
                                >
                                    <UserPlus className="h-3 w-3" /> Foi indicado por alguém?
                                </button>
                            ) : (
                                <div className="flex gap-2 animate-in slide-in-from-top-1">
                                    <Input
                                        type="email"
                                        placeholder="E-mail de quem indicou"
                                        value={referralEmail}
                                        onChange={(e) => setReferralEmail(e.target.value)}
                                        className="h-9 text-xs"
                                    />
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={handleReferral}
                                        disabled={isSubmittingReferral || !referralEmail}
                                    >
                                        {isSubmittingReferral ? <Loader2 className="h-3 w-3 animate-spin" /> : "Salvar"}
                                    </Button>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}