"use client"

import {Button} from '@/components/ui/button';
import {UserMenu} from '@/components/dashboard/user-menu';
import {AnimatePresence, motion} from 'framer-motion';

type DashboardSection = 'overview' | 'transactions' | 'accounts' | 'budget' | 'investments' | 'profile';

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

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-4">
                {/* Logo como gatilho da Sidebar */}
                <div
                    className="flex items-center cursor-pointer active:scale-95 transition-transform"
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
                        className="flex flex-col justify-center border-l pl-4 border-muted"
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
                <UserMenu
                    onNavigateToLanding={onNavigateToLanding}
                    onSectionChange={onSectionChange}
                />
            </div>
        </header>
    );
};