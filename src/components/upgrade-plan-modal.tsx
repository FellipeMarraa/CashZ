"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ShieldCheck, Zap, Star, Ticket, Loader2 } from "lucide-react"
import { useUserPreferences } from "@/hooks/useUserPreferences"
import { useAuth } from "@/context/AuthContext"

export const UpgradePlanModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const { user } = useAuth();
    const { redeemCoupon, isRedeeming } = useUserPreferences(user?.id);
    const [couponInput, setCouponInput] = useState("");
    const [showCouponField, setShowCouponField] = useState(false);

    const handleRedeem = async () => {
        if (!couponInput) return;
        try {
            await redeemCoupon(couponInput);
            setCouponInput("");
            onClose(); // Isso chamará o setActiveDialog(null)
        } catch (e) {
            // Toast já emitido pelo hook
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="w-[calc(100%-2rem)] sm:max-w-[400px] rounded-2xl border-none shadow-2xl p-6 bg-white outline-none">
                <DialogHeader className="items-center text-center">
                    <div className="h-14 w-14 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                        <Zap className="h-7 w-7 text-emerald-600 fill-emerald-600" />
                    </div>
                    <DialogTitle className="text-2xl font-bold text-slate-900">CashZ Premium</DialogTitle>
                    <DialogDescription className="text-slate-500">
                        Tenha acesso a recursos exclusivos e gerencie suas finanças em família.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="mt-1 bg-emerald-500 rounded-full p-0.5"><ShieldCheck className="h-3 w-3 text-white" /></div>
                            <div className="text-sm">
                                <p className="font-bold text-slate-800">Compartilhamento Ilimitado</p>
                                <p className="text-slate-500 text-xs">Convide parceiros com acesso total para leitura e edição.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="mt-1 bg-emerald-500 rounded-full p-0.5"><Star className="h-3 w-3 text-white" /></div>
                            <div className="text-sm">
                                <p className="font-bold text-slate-800">Exportação de Relatórios</p>
                                <p className="text-slate-500 text-xs">Gere arquivos Excel e CSV de todas as suas transações.</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-2">
                        <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white h-12 rounded-xl transition-all">
                            Assinar Premium - R$ 14,90/mês
                        </Button>
                    </div>

                    <div className="pt-2 border-t">
                        {!showCouponField ? (
                            <button
                                onClick={() => setShowCouponField(true)}
                                className="w-full flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-emerald-600 transition-colors py-2"
                            >
                                <Ticket className="h-3 w-3" /> Possui um código de acesso?
                            </button>
                        ) : (
                            <div className="flex gap-2 animate-in fade-in slide-in-from-top-2">
                                <Input
                                    placeholder="CÓDIGO"
                                    value={couponInput}
                                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                                    className="h-10 uppercase font-mono text-center tracking-widest border-emerald-100 focus-visible:ring-emerald-500"
                                />
                                <Button
                                    className="bg-emerald-600 hover:bg-emerald-700 h-10 px-4"
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