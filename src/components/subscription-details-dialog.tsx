"use client"

import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {ArrowRight, Calendar, CheckCircle2, Crown, History, Loader2, Star} from "lucide-react";
import {format} from "date-fns";
import {ptBR} from "date-fns/locale";
import {useDialogManager} from "@/context/DialogManagerContext";
import {useState} from "react";
import {toast} from "@/hooks/use-toast";

export const SubscriptionDetailsDialog = ({ preferences, userId }: { preferences: any, userId: string | undefined }) => {
    const { activeDialog, setActiveDialog } = useDialogManager();
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
    const isOpen = activeDialog === "subscription-details";

    const expirationDate = preferences?.planExpiresAt ? new Date(preferences.planExpiresAt) : null;

    const handleDirectPayment = async (planType: 'premium' | 'annual', price: number) => {
        if (!userId) return;
        setLoadingPlan(planType);

        try {
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, planType, price }),
            });

            const data = await response.json();

            if (data.init_point) {
                window.open(data.init_point);
                setLoadingPlan(null);
            } else {
                throw new Error("Ponto de início não encontrado");
            }
        } catch (error) {
            toast({ title: "Erro", description: "Não foi possível gerar o link de renovação.", variant: "destructive" });
            setLoadingPlan(null);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={() => setActiveDialog(null)}>
            <DialogContent className="w-[95vw] sm:max-w-md p-0 overflow-hidden dark:bg-[#282a36] border-none sm:border rounded-2xl outline-none">
                <DialogHeader className="p-6 bg-emerald-600 text-white relative">
                    <div className="flex items-center gap-3 text-left">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Crown className="h-6 w-6 text-white fill-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl text-white">Sua Assinatura</DialogTitle>
                            <DialogDescription className="text-emerald-100 text-xs">
                                Plano Premium {preferences?.plan === 'annual' ? 'Anual' : 'Mensal'}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6 space-y-6 text-left">
                    {/* Status e Vencimento */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border">
                        <div className="space-y-1">
                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Vencimento</p>
                            <p className="text-sm font-bold flex items-center gap-2 text-foreground">
                                <Calendar className="h-4 w-4 text-emerald-500" />
                                {expirationDate ? format(expirationDate, "dd 'de' MMMM, yyyy", { locale: ptBR }) : '---'}
                            </p>
                        </div>
                        <div className="text-right">
                            <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-1 rounded-full border border-emerald-500/20">
                                ATIVO
                            </span>
                        </div>
                    </div>

                    {/* Opções de Renovação Direta */}
                    <div className="space-y-3">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider ml-1">Estender Assinatura</p>
                        <div className="grid grid-cols-1 gap-2">
                            <Button
                                variant="outline"
                                className="justify-between h-16 border-emerald-500/20 hover:bg-emerald-500/5 group transition-all"
                                onClick={() => handleDirectPayment('premium', 14.90)}
                                disabled={loadingPlan !== null}
                            >
                                <div className="flex flex-col items-start">
                                    <span className="text-sm font-bold text-foreground">Mais 30 dias</span>
                                    <span className="text-[10px] text-muted-foreground">Renovação Mensal - R$ 14,90</span>
                                </div>
                                {loadingPlan === 'premium' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4 text-emerald-500 group-hover:translate-x-1 transition-transform" />}
                            </Button>

                            <Button
                                className="justify-between h-16 bg-slate-900 dark:bg-emerald-600 hover:opacity-90 group transition-all"
                                onClick={() => handleDirectPayment('annual', 129.90)}
                                disabled={loadingPlan !== null}
                            >
                                <div className="flex flex-col items-start">
                                    <span className="text-sm font-bold text-white">Mais 1 ano (Melhor valor)</span>
                                    <span className="text-[10px] text-white/70">Pagamento Anual - R$ 129,90</span>
                                </div>
                                {loadingPlan === 'annual' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4 fill-amber-400 text-amber-400 animate-pulse" />}
                            </Button>
                        </div>
                    </div>

                    {/* Histórico Simples */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-muted-foreground tracking-wider ml-1">
                            <History className="h-3 w-3" /> Histórico Recente
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg border border-dashed border-border text-xs">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                <span className="font-medium text-foreground">Última atualização</span>
                            </div>
                            <span className="text-muted-foreground">
                                {preferences?.lastUpdated ? format(new Date(preferences.lastUpdated), "dd/MM/yyyy") : '---'}
                            </span>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};