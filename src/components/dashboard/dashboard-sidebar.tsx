"use client"

import {cn} from '@/lib/utils';
import {Button} from '@/components/ui/button';
import {ScrollArea} from '@/components/ui/scroll-area';
import {ArrowLeftRight, LayoutDashboard, LineChart, PieChart} from 'lucide-react';
import {forwardRef} from "react";

type DashboardSection = 'overview' | 'transactions' | 'budget' | 'investments' | 'profile' | 'settings' | 'admin' | 'help';

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
            {id: 'budget', label: 'Orçamentos', icon: <PieChart className="h-5 w-5"/>},
            {id: 'investments', label: 'Investimentos', icon: <LineChart className="h-5 w-5"/>},
        ] as const;

        return (
            <>
                {/* Backdrop: APENAS MOBILE */}
                {!collapsed && (
                    <div
                        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] md:hidden"
                        onClick={onToggleSidebar}
                    />
                )}

                <aside
                    ref={ref}
                    className={cn(
                        "flex flex-col border-r transition-all duration-300 ease-in-out h-full",
                        // MUDANÇA: trocado bg-card por bg-background para igualar a tonalidade
                        // e garantido que a borda seja sutil (border-muted/50)
                        "bg-background border-muted/50",

                        // MOBILE: Flutuante
                        "fixed inset-y-0 left-0 z-50 w-64 md:sticky md:z-0",

                        // DESKTOP: Sempre visível
                        collapsed ? "-translate-x-full md:translate-x-0" : "translate-x-0",
                        "md:translate-x-0 md:w-64 md:block"
                    )}
                >
                    <div className="flex h-16 items-center border-b border-muted/50 px-6 shrink-0">
                        <div className="flex items-center">
                            <img src="/cashz.svg" className="h-8 w-8 mr-2" alt="Logo"/>
                            <span className="text-xl font-bold text-foreground">CashZ</span>
                        </div>
                    </div>

                    <ScrollArea className="flex-1 py-6 px-3">
                        <nav className="space-y-1">
                            {navItems.map((item) => (
                                <Button
                                    key={item.id}
                                    variant={activeSection === item.id ? "secondary" : "ghost"}
                                    size="lg"
                                    className={cn(
                                        "flex w-full items-center space-x-3 px-4 justify-start mb-1 transition-all duration-200 rounded-xl",
                                        activeSection === item.id
                                            ? "bg-primary/10 text-primary hover:bg-primary/15"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                    onClick={() => {
                                        onSectionChange(item.id);
                                        if (window.innerWidth < 768) onToggleSidebar();
                                    }}
                                >
                                    <span className={cn(
                                        "shrink-0",
                                        activeSection === item.id ? "text-primary" : "text-muted-foreground"
                                    )}>
                                        {item.icon}
                                    </span>
                                    <span className="font-medium">{item.label}</span>
                                </Button>
                            ))}
                        </nav>
                    </ScrollArea>
                </aside>
            </>
        );
    });

DashboardSidebar.displayName = "DashboardSidebar";