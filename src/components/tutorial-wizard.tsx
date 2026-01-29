"use client"

import { useEffect, useRef } from 'react';
import { driver, Config } from "driver.js";
import "driver.js/dist/driver.css";
import { useAuth } from '@/context/AuthContext';
import { useUserPreferences } from '@/hooks/useUserPreferences';

export const TutorialWizard = ({ tutorialKey, steps }: { tutorialKey: string, steps: any[] }) => {
    const { user } = useAuth();
    const { preferences, hideTutorial, isLoading } = useUserPreferences(user?.id || user?.id);
    const shouldHidePermanently = useRef(false);

    useEffect(() => {
        if (!(user?.id || user?.id) || isLoading || !preferences) return;
        if (preferences.hiddenTutorials?.includes(tutorialKey)) return;

        const handleGlobalClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target && target.id === 'dont-show-again') {
                const cb = target as HTMLInputElement;
                shouldHidePermanently.current = cb.checked;
            }
        };

        const driverConfig: Config = {
            showProgress: true,
            nextBtnText: 'Próximo',
            prevBtnText: 'Anterior',
            doneBtnText: 'Concluir',
            allowClose: true,
            // Classes Shadcn aplicadas via popoverClass (requer que estejam no seu globals.css ou que o Tailwind as rastreie)
            popoverClass: 'rounded-lg border border-border bg-card text-card-foreground shadow-lg p-4',
            steps: steps.map(step => ({
                element: step.element,
                popover: {
                    title: step.title,
                    description: `
                        <div class="space-y-4 pt-2">
                            <p class="text-sm text-muted-foreground leading-relaxed font-sans">${step.description}</p>
                            <div class="flex items-center space-x-2 pt-3 border-t border-border">
                                <input 
                                    type="checkbox" 
                                    id="dont-show-again" 
                                    class="h-4 w-4 rounded border-input bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 accent-emerald-600 cursor-pointer"
                                />
                                <label 
                                    for="dont-show-again" 
                                    class="text-xs font-medium leading-none cursor-pointer select-none text-foreground/70 hover:text-foreground font-sans"
                                >
                                    Não mostrar novamente nesta tela
                                </label>
                            </div>
                        </div>
                    `,
                    side: step.side || "bottom",
                }
            })),
            onHighlighted: () => {
                const checkbox = document.getElementById('dont-show-again') as HTMLInputElement;
                if (checkbox) {
                    checkbox.checked = shouldHidePermanently.current;
                }

                // Aplicando estilos Shadcn nos botões nativos do Driver.js via JS
                // para evitar o uso de <style>
                const nextBtn = document.querySelector('.driver-popover-next-btn');
                const prevBtn = document.querySelector('.driver-popover-prev-btn');

                if (nextBtn) {
                    nextBtn.className += " inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 py-1 ml-2 shadow-none border-none text-shadow-none";
                }
                if (prevBtn) {
                    prevBtn.className += " inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3 py-1 shadow-none text-shadow-none";
                }
            },
            onDestroyStarted: () => {
                if (shouldHidePermanently.current) {
                    hideTutorial(tutorialKey);
                }
                driverObj.destroy();
            }
        };

        const driverObj = driver(driverConfig);

        const timer = setTimeout(() => {
            driverObj.drive();
            document.addEventListener('click', handleGlobalClick);
        }, 1500);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('click', handleGlobalClick);
            driverObj.destroy();
        };
    }, [user, tutorialKey, preferences, isLoading, steps, hideTutorial]);

    return null;
};