import {AnimatePresence, motion} from "framer-motion";
import {useEffect, useState} from "react";
import {RotateCcw} from "lucide-react"; // Importe o ícone X
import {Button} from "@/components/ui/button"; // Supondo que você tenha um componente Button

export const OrientationWarning = () => {
    const [isPortrait, setIsPortrait] = useState(false);
    // Novo estado para controlar se o usuário dispensou o aviso
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        // Função para checar orientação
        const checkOrientation = () => {
            setIsPortrait(window.matchMedia("(orientation: portrait)").matches);
        };

        // Checa inicialmente
        checkOrientation();

        const handler = () => checkOrientation();
        window.addEventListener("resize", handler);
        window.addEventListener("orientationchange", handler);

        return () => {
            window.removeEventListener("resize", handler);
            window.removeEventListener("orientationchange", handler);
        };
    }, []);

    // Se não for retrato OU se o usuário já dispensou, não mostra nada
    if (!isPortrait || isDismissed) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                animate={{ opacity: 1, backdropFilter: "blur(4px)" }}
                exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                transition={{ duration: 0.3 }}
                // Mudamos o fundo para ser semi-transparente (black/80) para dar contexto que o app está atrás
                className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/90 text-white p-6 text-center space-y-6"
            >
                <RotateCcw className="w-16 h-16 text-emerald-500 animate-spin-slow" />

                <div className="space-y-2">
                    <h2 className="text-2xl font-bold">Melhor visualização</h2>
                    <p className="text-gray-300 max-w-xs mx-auto">
                        Este aplicativo foi otimizado para o modo paisagem (horizontal).
                    </p>
                </div>

                <div className="flex flex-col gap-4 w-full max-w-xs">
                    {/* Botão para continuar mesmo assim */}
                    <Button
                        variant="outline"
                        onClick={() => setIsDismissed(true)}
                        className="w-full border-white/20 text-white hover:bg-white/10 hover:text-white"
                    >
                        Continuar no modo vertical
                    </Button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};