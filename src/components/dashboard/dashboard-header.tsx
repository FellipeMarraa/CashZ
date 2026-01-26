import {Button} from '@/components/ui/button';
import {UserMenu} from '@/components/dashboard/user-menu';
import {NotificationsPopover} from '@/components/dashboard/notifications-popover';
import {Search} from 'lucide-react';
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
                                    onSectionChange
                                }: DashboardHeaderProps) => {

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <AnimatePresence mode="wait">
            <motion.div
                key={sectionTitle}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col justify-center"
            >
                  <span className="text-base font-semibold leading-tight text-foreground">
                    {sectionTitle}
                  </span>
                <span className="text-sm text-muted-foreground">{sectionSubtitle}</span>
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
        {/*<NotificationsPopover />*/}
        {/*<ThemeToggle />*/}
            <UserMenu
                onNavigateToLanding={onNavigateToLanding}
                onSectionChange={onSectionChange}
            />
      </div>
    </header>
  );
};