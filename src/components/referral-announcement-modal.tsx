"use client"

import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/components/ui/dialog"
import {Button} from "@/components/ui/button"
import {Checkbox} from "@/components/ui/checkbox"
import {ArrowRight, Gift, Megaphone} from "lucide-react"
import {useState} from "react"

export const ReferralAnnouncementModal = ({
                                              isOpen,
                                              onClose,
                                              onSectionChange
                                          }: {
    isOpen: boolean;
    onClose: () => void;
    onSectionChange: (section: any) => void;
}) => {
    const [dontShowAgain, setDontShowAgain] = useState(false);

    const handleAction = () => {
        if (dontShowAgain) {
            localStorage.setItem("cashz_referral_announcement_seen", "true");
        }
        sessionStorage.setItem("cashz_referral_opened_session", "true");

        onSectionChange("profile");
        onClose();
    };

    return (
        <Dialog open={isOpen}>
            <DialogContent
                className="w-[92vw] sm:max-w-[420px] p-0 overflow-hidden border-none bg-background dark:bg-[#282a36] outline-none [&>button]:hidden rounded-2xl sm:rounded-lg"
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-2 flex justify-center relative">
                    <div className="bg-white/20 backdrop-blur-md rounded-full p-4 border border-white/30">
                        <Gift className="h-8 w-8 text-white" />
                    </div>
                </div>

                <div className="p-6 space-y-4 text-left">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-center">Ganhe Meses Grátis! 🎁</DialogTitle>
                        <DialogDescription className="text-center text-sm pt-2 text-muted-foreground">
                            Indique amigos e, quando eles assinarem,
                            <span className="font-bold text-emerald-600 dark:text-emerald-400"> você ganha +30 dias de Premium grátis.</span>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="bg-muted/50 rounded-xl p-4 flex items-start gap-3">
                        <Megaphone className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                        <div className="text-xs space-y-1 text-left">
                            <p className="font-bold">Onde acessar?</p>
                            <p className="text-muted-foreground text-[11px] leading-relaxed">
                                No seu <strong>Perfil</strong>, aba <strong>Indicações</strong>. Compartilhe seu e-mail!
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                        <Checkbox
                            id="dontShow"
                            checked={dontShowAgain}
                            onCheckedChange={(checked) => setDontShowAgain(!!checked)}
                        />
                        <label htmlFor="dontShow" className="text-xs text-muted-foreground cursor-pointer select-none">
                            Não mostrar novamente
                        </label>
                    </div>

                    <Button
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12"
                        onClick={handleAction}
                    >
                        Ver Indicações <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};