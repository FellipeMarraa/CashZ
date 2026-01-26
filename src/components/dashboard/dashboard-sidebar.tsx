import {cn} from '@/lib/utils';
import {Button} from '@/components/ui/button';
import {ScrollArea} from '@/components/ui/scroll-area';
import {ArrowLeftRight, CreditCard, LayoutDashboard, LineChart, PieChart} from 'lucide-react';
import {forwardRef} from "react";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip.tsx";

type DashboardSection = 'overview' | 'transactions' | 'accounts' | 'budget' | 'investments' | 'profile';

interface DashboardSidebarProps {
    collapsed: boolean;
    activeSection: DashboardSection;
    onSectionChange: (section: DashboardSection) => void;
    onNavigateToLanding: () => void;
    onToggleSidebar: () => void;
}

export const DashboardSidebar = forwardRef<HTMLDivElement, DashboardSidebarProps>(
    ({collapsed, activeSection, onSectionChange, onToggleSidebar}, ref) => {

        const navItems = [
            {id: 'overview', label: 'Dashboard', icon:
                    <Tooltip>
                        <TooltipTrigger className="h-full">
                            <LayoutDashboard className="h-5 w-5 cursor-pointer"/>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                            <p>Dashboard</p>
                        </TooltipContent>
                    </Tooltip>
            },
            {id: 'transactions', label: 'Transações', icon:
                    <Tooltip>
                        <TooltipTrigger className="h-full">
                            <ArrowLeftRight className="h-5 w-5"/>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                            <p>Transações</p>
                        </TooltipContent>
                    </Tooltip>
            },
            {id: 'accounts', label: 'Carteira', icon:
                    <Tooltip>
                        <TooltipTrigger className="h-full">
                            <CreditCard className="h-5 w-5"/>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                            <p>Carteira</p>
                        </TooltipContent>
                    </Tooltip>
            },
            {id: 'budget', label: 'Orçamentos', icon:
                    <Tooltip>
                        <TooltipTrigger className="h-full">
                            <PieChart className="h-5 w-5"/>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                            <p>Orçamentos</p>
                        </TooltipContent>
                    </Tooltip>
            },
            {id: 'investments', label: 'Investimentos', icon:
                    <Tooltip>
                        <TooltipTrigger className="h-full">
                            <LineChart className="h-5 w-5"/>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                            <p>Investimentos</p>
                        </TooltipContent>
                    </Tooltip>
            },
        ] as const;

        // Função para controlar o clique no Header da Sidebar (Logo)
        const handleHeaderClick = () => {
            // Se for mobile (largura < 768px), NÃO faz nada.
            // Se for desktop, alterna o sidebar.
            if (window.innerWidth >= 768) {
                onToggleSidebar();
            }
        };

        const handleItemClick = (id: DashboardSection) => {
            onSectionChange(id);
            // No mobile, se o menu estiver expandido, recolhe ao clicar no item
            if (!collapsed && window.innerWidth < 768) {
                onToggleSidebar();
            }
        };

        return (
            <>
                {/* Overlay Escuro para Mobile quando expandido (Opcional, mas recomendado) */}
                {!collapsed && (
                    <div
                        className="fixed inset-0 bg-black/50 z-20 md:hidden"
                        onClick={onToggleSidebar}
                    />
                )}

                <aside
                    ref={ref}
                    className={cn(
                        // Base: Fixo no mobile, z-index alto
                        "fixed inset-y-0 left-0 z-30 flex flex-col border-r bg-card transition-all duration-300 ease-in-out md:relative",

                        // LÓGICA DE LARGURA:
                        // Removemos o 'translate' negativo. Agora a barra w-16 fica sempre visível no mobile também.
                        collapsed
                            ? "w-16"         // Mostra ícones (mini) tanto no Mobile quanto Desktop
                            : "w-64"         // Mostra menu completo
                    )}
                >
                    <div
                        className={cn(
                            "flex h-16 items-center border-b px-4",
                            // Cursor pointer apenas no desktop para indicar clique
                            "md:cursor-pointer cursor-default",
                            collapsed ? "justify-center md:px-0" : ""
                        )}
                        onClick={handleHeaderClick} // Usamos a função controlada aqui
                    >
                        <h2 className="text-lg font-semibold flex items-center">
                            <img src="/cashz.svg" className="h-8 w-8" alt="Logo"/>
                            {!collapsed && (
                                <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white animate-in fade-in duration-300">
                                    CashZ
                                </span>
                            )}
                        </h2>
                    </div>

                    <ScrollArea className="flex-1 py-4">
                        <nav className="px-2 space-y-1">
                            {navItems.map((item) => (
                                <Button
                                    key={item.id}
                                    variant={activeSection === item.id ? "secondary" : "ghost"}
                                    size="lg"
                                    className={cn(
                                        "flex w-full items-center space-x-3 px-3 justify-start",
                                        collapsed ? "justify-center px-0" : "",
                                        activeSection === item.id ? "bg-secondary text-secondary-foreground" : "hover:bg-secondary/50",
                                        "mb-1 transition-all duration-200 ease-in-out"
                                    )}
                                    onClick={() => handleItemClick(item.id)}
                                >
                                    {item.icon}
                                    {!collapsed && (
                                        <span className="animate-in fade-in duration-200">
                                            {item.label}
                                        </span>
                                    )}
                                </Button>
                            ))}
                        </nav>
                    </ScrollArea>
                </aside>
            </>
        );
    });