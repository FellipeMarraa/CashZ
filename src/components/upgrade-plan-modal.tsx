"use client"

import {useState} from "react"
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/components/ui/dialog"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Loader2, ShieldCheck, Sparkles, Star, Ticket, Zap} from "lucide-react"
import {useUserPreferences} from "@/hooks/useUserPreferences"
import {useAuth} from "@/context/AuthContext"
import {toast} from "@/hooks/use-toast.ts";

export const UpgradePlanModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const { user } = useAuth();
    const { redeemCoupon, isRedeeming } = useUserPreferences(user?.id);
    const [couponInput, setCouponInput] = useState("");
    const [showCouponField, setShowCouponField] = useState(false);
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

    const handleRedeem = async () => {
        if (!couponInput) return;
        try {
            await redeemCoupon(couponInput);
            setCouponInput("");
            onClose();
        } catch (e) {
            // Erro tratado pelo toast do hook
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
                window.open(data.init_point);
                setLoadingPlan(null);
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
                    <DialogDescription className="text-muted-foreground">
                        Desbloqueie todos os recursos e gerencie suas finanças em família.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Benefícios */}
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="mt-1 bg-emerald-500 rounded-full p-0.5"><ShieldCheck className="h-3 w-3 text-white" /></div>
                            <div className="text-sm">
                                <p className="font-bold text-foreground">Compartilhamento Ilimitado</p>
                                <p className="text-muted-foreground text-xs leading-tight">Convide parceiros com acesso total para leitura e edição.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="mt-1 bg-emerald-500 rounded-full p-0.5"><Star className="h-3 w-3 text-white" /></div>
                            <div className="text-sm">
                                <p className="font-bold text-foreground">Exportação de Relatórios</p>
                                <p className="text-muted-foreground text-xs leading-tight">Gere arquivos Excel e CSV de todas as suas transações.</p>
                            </div>
                        </div>
                    </div>

                    {/* Opções de Planos */}
                    <div className="space-y-3">
                        <div className="relative group">
                            <div className="absolute -top-2 -right-2 z-10 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md animate-bounce">
                                <Sparkles className="h-2 w-2 fill-white" /> ECONOMIZE 20%
                            </div>

                            <Button
                                className="w-full bg-slate-900 dark:bg-emerald-600 dark:hover:bg-emerald-700 hover:bg-slate-800 text-white h-14 rounded-xl flex flex-col items-center justify-center gap-0 transition-all disabled:opacity-80 border-none"
                                onClick={() => handlePayment('annual', 129.90)}
                                disabled={loadingPlan !== null}
                            >
                                {loadingPlan === 'annual' ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <>
                                        <span className="text-sm font-bold">Plano Anual</span>
                                        <span className="text-[10px] opacity-70 font-normal">R$ 129,90 / ano</span>
                                    </>
                                )}
                            </Button>
                        </div>

                        <Button
                            variant="outline"
                            className="w-full border-border hover:bg-muted text-foreground h-14 rounded-xl flex flex-col items-center justify-center gap-0 disabled:opacity-80"
                            onClick={() => handlePayment('premium', 14.90)}
                            disabled={loadingPlan !== null}
                        >
                            {loadingPlan === 'premium' ? (
                                <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                            ) : (
                                <>
                                    <span className="text-sm font-bold">Plano Mensal</span>
                                    <span className="text-[10px] text-muted-foreground font-normal">R$ 14,90 / mês</span>
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Cupom */}
                    <div className="pt-2 border-t dark:border-slate-800 text-left">
                        {!showCouponField ? (
                            <button
                                onClick={() => setShowCouponField(true)}
                                className="w-full flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-emerald-500 transition-colors py-2"
                            >
                                <Ticket className="h-3 w-3" /> Possui um código de acesso?
                            </button>
                        ) : (
                            <div className="flex gap-2 animate-in fade-in slide-in-from-top-2">
                                <Input
                                    placeholder="CÓDIGO"
                                    value={couponInput}
                                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                                    className="h-10 uppercase font-mono text-center tracking-widest bg-background border-border focus-visible:ring-emerald-500"
                                />
                                <Button
                                    className="bg-emerald-600 hover:bg-emerald-700 h-10 px-4 font-bold text-white"
                                    onClick={handleRedeem}
                                    disabled={isRedeeming || !couponInput}
                                >
                                    {isRedeeming ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ativar"}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}