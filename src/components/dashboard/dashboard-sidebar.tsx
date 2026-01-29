"use client"

import {cn} from '@/lib/utils';
import {Button} from '@/components/ui/button';
import {ScrollArea} from '@/components/ui/scroll-area';
import {ArrowLeftRight, CreditCard, LayoutDashboard, LineChart, PieChart} from 'lucide-react';
import {forwardRef} from "react";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip.tsx";

type DashboardSection = 'overview' | 'transactions' | 'budget' | 'accounts' | 'investments' | 'profile' | 'settings';

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
            {id: 'overview', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5"/>},
            {id: 'transactions', label: 'Transações', icon: <ArrowLeftRight className="h-5 w-5"/>},
            {id: 'accounts', label: 'Carteira', icon: <CreditCard className="h-5 w-5"/>},
            {id: 'budget', label: 'Orçamentos', icon: <PieChart className="h-5 w-5"/>},
            {id: 'investments', label: 'Investimentos', icon: <LineChart className="h-5 w-5"/>},
        ] as const;

        return (
            <>
                {/* Backdrop: Fecha a barra ao clicar fora (apenas quando aberta) */}
                {!collapsed && (
                    <div
                        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
                        onClick={onToggleSidebar}
                    />
                )}

                <aside
                    ref={ref}
                    className={cn(
                        // Mudança para fixed garante que não empurre os itens
                        "fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-card transition-all duration-300 ease-in-out",
                        // Oculta completamente se colapsado
                        collapsed ? "-translate-x-full" : "translate-x-0 w-64 shadow-2xl"
                    )}
                >
                    <div className="flex h-16 items-center border-b px-4">
                        <div className="flex items-center">
                            <img src="/cashz.svg" className="h-8 w-8 mr-2"/>
                            <span className="text-xl font-bold text-gray-900 dark:text-white">CashZ</span>
                        </div>
                    </div>

                    <ScrollArea className="flex-1 py-4">
                        <nav className="px-2 space-y-1">
                            {navItems.map((item) => (
                                <Button
                                    key={item.id}
                                    variant={activeSection === item.id ? "secondary" : "ghost"}
                                    size="lg"
                                    className={cn(
                                        "flex w-full items-center space-x-3 px-3 justify-start mb-1 transition-all duration-200",
                                        activeSection === item.id ? "bg-secondary text-secondary-foreground" : "hover:bg-secondary/50"
                                    )}
                                    onClick={() => {
                                        onSectionChange(item.id);
                                        onToggleSidebar(); // Fecha ao selecionar
                                    }}
                                >
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            {item.icon}
                                        </TooltipTrigger>
                                        <TooltipContent side="right">
                                            <p>{item.label}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                    <span>{item.label}</span>
                                </Button>
                            ))}
                        </nav>
                    </ScrollArea>
                </aside>
            </>
        );
    });