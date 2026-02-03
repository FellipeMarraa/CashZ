"use client"

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, PartyPopper, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";

export default function PaymentSuccessPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { user } = useAuth();

    useEffect(() => {
        if (user?.id) {
            queryClient.invalidateQueries({ queryKey: ["user-preferences", user.id] });
        }
    }, [user, queryClient]);

    return (
        <div className="flex min-h-[80vh] flex-col items-center justify-center p-4 text-center">
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 12, stiffness: 200 }}
                className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500"
            >
                <CheckCircle2 className="h-12 w-12" />
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-4"
            >
                <h1 className="flex items-center justify-center gap-2 text-3xl font-bold tracking-tighter sm:text-4xl">
                    Assinatura Confirmada! <PartyPopper className="h-8 w-8 text-amber-500" />
                </h1>
                <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl">
                    Obrigado por apoiar o <strong>CashZ</strong>. Sua conta Premium está ativa e todos os recursos foram desbloqueados.
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-10 grid w-full max-w-md grid-cols-1 gap-4 sm:grid-cols-2"
            >
                <div className="flex items-center gap-3 rounded-2xl border bg-card p-4 text-left">
                    <ShieldCheck className="h-5 w-5 text-emerald-500" />
                    <div className="text-xs">
                        <p className="font-bold">Acesso Total</p>
                        <p className="text-muted-foreground text-[10px]">Recursos liberados.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border bg-card p-4 text-left">
                    <PartyPopper className="h-5 w-5 text-amber-500" />
                    <div className="text-xs">
                        <p className="font-bold">Compartilhamento</p>
                        <p className="text-muted-foreground text-[10px]">Convide parceiros agora.</p>
                    </div>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-10"
            >
                <Button
                    size="lg"
                    className="bg-emerald-600 hover:bg-emerald-700 h-12 px-8 font-bold gap-2"
                    onClick={() => router.push("/dashboard")}
                >
                    Ir para o Dashboard <ArrowRight className="h-4 w-4" />
                </Button>
            </motion.div>
        </div>
    );
}