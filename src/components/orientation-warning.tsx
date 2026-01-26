// src/components/OrientationWarning.tsx
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";

export const OrientationWarning = () => {
    const [isPortrait, setIsPortrait] = useState(window.matchMedia("(orientation: portrait)").matches);

    useEffect(() => {
        const handler = () => setIsPortrait(window.matchMedia("(orientation: portrait)").matches);
        window.addEventListener("resize", handler);
        window.addEventListener("orientationchange", handler);
        return () => {
            window.removeEventListener("resize", handler);
            window.removeEventListener("orientationchange", handler);
        };
    }, []);

    return (
        <AnimatePresence>
            {isPortrait && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white text-black p-6 text-center space-y-4"
                >
                    <RotateCcw className="w-16 h-16 text-gray-600 animate-spin-slow" />
                    <h2 className="text-xl font-semibold">Gire seu dispositivo</h2>
                    <p className="text-base max-w-xs">
                        Para uma melhor experiência, utilize o sistema no modo paisagem (horizontal).
                    </p>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
