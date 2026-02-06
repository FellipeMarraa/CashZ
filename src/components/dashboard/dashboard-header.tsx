"use client"

import {UserMenu} from '@/components/dashboard/user-menu';
import {AnimatePresence, motion} from 'framer-motion';
import {ThemeToggle} from "@/components/theme-toggle.tsx";
import {NotificationsPopover} from "@/components/notifications-popover.tsx";
import {useAuth} from "@/context/AuthContext"; // Importe seu hook de autenticação
import {Button} from "@/components/ui/button";
import {Eye, EyeOff, LogIn} from "lucide-react";
import {usePrivacy} from "@/context/PrivacyContext.tsx";

type DashboardSection = 'overview' | 'transactions' | 'budget' | 'investments' | 'profile' | 'settings' | 'admin';

interface DashboardHeaderProps {
    collapsed: boolean;
    toggleSidebar: () => void;
    onNavigateToLanding: () => void;
    sectionTitle: string;
    sectionSubtitle: string;
    onSectionChange: (section: DashboardSection) => void;
}

export const DashboardHeader = ({
                                    onNavigateToLanding,
                                    sectionTitle,
                                    sectionSubtitle,
                                    onSectionChange,
                                    toggleSidebar
                                }: DashboardHeaderProps) => {

    const { user, loading } = useAuth();
    const { isPrivate, togglePrivacy } = usePrivacy();

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-4">

                <div
                    className="flex items-center cursor-pointer active:scale-95 transition-transform md:hidden"
                    onClick={toggleSidebar}
                >
                    <img src="/cashz.svg" className="h-8 w-8" alt="CashZ Logo" />
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={sectionTitle}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col justify-center md:border-l-0 md:pl-0 border-l pl-4 border-muted"
                    >
                    <span className="text-md md:text-base font-semibold leading-tight text-foreground">
                        {sectionTitle}
                    </span>
                        <span className="text-[10px] md:text-sm text-muted-foreground">
                        {sectionSubtitle}
                    </span>
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="flex items-center space-x-2">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={togglePrivacy}
                    className="text-muted-foreground hover:text-primary"
                >
                    {isPrivate ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </Button>
                <ThemeToggle />

                {!loading && (
                    <>
                        {user ? (
                            <>
                                <NotificationsPopover />
                                <UserMenu
                                    onNavigateToLanding={onNavigateToLanding}
                                    onSectionChange={onSectionChange}
                                />
                            </>
                        ) : (
                            <Button
                                variant="default"
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2"
                                onClick={() => window.location.href = '/login'}
                            >
                                <LogIn className="h-4 w-4" />
                                <span className="hidden sm:inline">Entrar</span>
                            </Button>
                        )}
                    </>
                )}
            </div>
        </header>
    );
};