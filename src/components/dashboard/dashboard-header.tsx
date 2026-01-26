"use client"

import { Button } from '@/components/ui/button';
import { UserMenu } from '@/components/dashboard/user-menu';
import { Search } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import {DashboardSection} from "@/pages/dashboard/dashboard.tsx";

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
                                    onSectionChange
                                }: DashboardHeaderProps) => {

    return (
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <AnimatePresence mode="wait">
                <motion.div
                    key={sectionTitle}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col justify-center"
                >
                    <span className="text-base font-semibold leading-tight text-foreground">
                        {sectionTitle}
                    </span>
                    <span className="text-xs text-muted-foreground truncate max-w-[200px] sm:max-w-none">
                        {sectionSubtitle}
                    </span>
                </motion.div>
            </AnimatePresence>

            <div className="flex items-center space-x-2">
                <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    aria-label="Search"
                >
                    <Search className="h-5 w-5" />
                </Button>

                <UserMenu
                    onNavigateToLanding={onNavigateToLanding}
                    onSectionChange={onSectionChange}
                />
            </div>
        </header>
    );
};