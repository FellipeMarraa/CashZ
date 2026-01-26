import {cn} from '@/lib/utils';
import {Button} from '@/components/ui/button';
import {ScrollArea} from '@/components/ui/scroll-area';
import {ArrowLeftRight, CreditCard, LayoutDashboard, LineChart, PieChart} from 'lucide-react';
import {forwardRef} from "react";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip.tsx";

type DashboardSection = 'overview' | 'transactions' | 'budget' | 'accounts' | 'investments' | 'profile';

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
                        <TooltipContent className="">
                            <p>Dashboard</p>
                        </TooltipContent>
                    </Tooltip>
            },
            {id: 'transactions', label: 'Transações', icon:
                    <Tooltip>
                        <TooltipTrigger className="h-full">
                            <ArrowLeftRight className="h-5 w-5"/>
                        </TooltipTrigger>
                        <TooltipContent className="">
                            <p>Transações</p>
                        </TooltipContent>
                    </Tooltip>
            },
            {id: 'accounts', label: 'Carteira', icon:
                    <Tooltip>
                        <TooltipTrigger className="h-full">
                            <CreditCard className="h-5 w-5"/>
                        </TooltipTrigger>
                        <TooltipContent className="">
                            <p>Carteira</p>
                        </TooltipContent>
                    </Tooltip>
            },
            {id: 'budget', label: 'Orçamentos', icon:
                    <Tooltip>
                        <TooltipTrigger className="h-full">
                            <PieChart className="h-5 w-5"/>
                        </TooltipTrigger>
                        <TooltipContent className="">
                            <p>Orçamentos</p>
                        </TooltipContent>
                    </Tooltip>
            },
            {id: 'investments', label: 'Investimentos', icon:
                    <Tooltip>
                        <TooltipTrigger className="h-full">
                            <LineChart className="h-5 w-5"/>
                        </TooltipTrigger>
                        <TooltipContent className="">
                            <p>Investimentos</p>
                        </TooltipContent>
                    </Tooltip>
            },
        ] as const;

        return (
            <aside
                ref={ref}
                className={cn(
                    "fixed inset-y-0 left-0 z-20 flex flex-col border-r bg-card transition-all duration-300 ease-in-out md:relative",
                    collapsed ? "w-16" : "w-64"
                )}
            >
                <div
                    className="flex h-16 items-center border-b px-4 cursor-pointer"
                    onClick={onToggleSidebar}
                >
                    <h2 className="text-lg font-semibold flex items-center">
                        <img src="/cashz.svg" className="h-8 w-8 mr-2"/>
                        {!collapsed && (
                            <span className="text-xl font-bold text-gray-900 dark:text-white">CashZ</span>
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
                                    collapsed ? "justify-center" : "",
                                    activeSection === item.id ? "bg-secondary text-secondary-foreground" : "hover:bg-secondary/50",
                                    "mb-1 transition-all duration-200 ease-in-out"
                                )}
                                onClick={() => {
                                    onSectionChange(item.id);
                                    if (!collapsed) {
                                        onToggleSidebar();
                                    }
                                }}
                            >
                                {item.icon}
                                {!collapsed && <span>{item.label}</span>}
                            </Button>
                        ))}
                    </nav>
                </ScrollArea>
            </aside>
        );
    });