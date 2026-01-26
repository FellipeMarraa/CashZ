import {useEffect, useRef, useState} from 'react';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover';
import {Button} from '@/components/ui/button';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Separator} from '@/components/ui/separator';
import {AlertCircle, BellRing, CheckCircle2, Info, TriangleAlert} from 'lucide-react';
import {cn} from '@/lib/utils';
import {formatDistanceToNow} from 'date-fns';
import {ptBR} from "date-fns/locale";
import {AnimatePresence, motion} from 'framer-motion';
import {useMarkAllNotificationsAsRead, useMarkNotificationAsRead, useNotifications} from '@/hooks/useNotifications';
import {NotificationsDialog} from '../all-notifications.tsx';
import {useDialogManager} from "@/context/DialogManagerContext.tsx";

export const NotificationsPopover = () => {
  const [open, setOpen] = useState(false);
  const [animateBell, setAnimateBell] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { notifications, unreadCount } = useNotifications();
  const { mutate: markAsRead } = useMarkNotificationAsRead();
  const { mutate: markAllAsRead } = useMarkAllNotificationsAsRead();
  const { activeDialog, setActiveDialog } = useDialogManager();

  const getIconByType = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'WARNING':
        return <TriangleAlert className="h-4 w-4" />;
      case 'INFO':
        return <Info className="h-4 w-4" />;
      case 'ERROR':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  useEffect(() => {
    const handleNewNotification = () => {
      setAnimateBell(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setAnimateBell(false), 600);
    };

    window.addEventListener('new-notification', handleNewNotification);
    return () => {
      window.removeEventListener('new-notification', handleNewNotification);
    };
  }, []);

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
  };

  return (
      <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <motion.div
                animate={animateBell ? { rotate: [0, -15, 15, -10, 10, 0] } : {}}
                transition={{ duration: 0.6, ease: "easeInOut" }}
            >
              <BellRing className="h-5 w-5" />
            </motion.div>
            {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                  {unreadCount}
                </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <div className="flex items-center justify-between p-4">
            <h3 className="font-semibold">Notificações</h3>
            {unreadCount > 0 && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => markAllAsRead()}
                >
                  Marcar todas como lidas
                </Button>
            )}
          </div>
          <Separator />
          <ScrollArea className="h-[300px]">
            {notifications.length > 0 ? (
                <AnimatePresence initial={false}>
                  {notifications.map((notification) => (
                      <motion.button
                          key={notification.id}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ duration: 0.3 }}
                          className={cn(
                              "flex w-full items-start space-x-3 rounded-md p-3 text-left",
                              !notification.read && "bg-green-50",
                              "transition-colors hover:bg-muted hover:bg-green-50"
                          )}
                          onClick={() => handleMarkAsRead(notification.id)}
                      >
                        <div
                            className={cn(
                                "mt-0.5 rounded-full p-1.5",
                                notification.type === 'SUCCESS' && "bg-success/20 text-success",
                                notification.type === 'WARNING' && "bg-warning/20 text-warning",
                                notification.type === 'INFO' && "bg-primary/20 text-primary",
                                notification.type === 'ERROR' && "bg-destructive/20 text-destructive"
                            )}
                        >
                          {getIconByType(notification.type)}
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground/80">
                            {(() => {
                              try {
                                const date = new Date(notification.createdAt);
                                if (isNaN(date.getTime())) {
                                  return "Data inválida";
                                }
                                return formatDistanceToNow(date, {
                                  addSuffix: true,
                                  locale: ptBR
                                });
                              } catch {
                                return "Data inválida";
                              }
                            })()}
                          </p>
                        </div>
                      </motion.button>
                  ))}
                </AnimatePresence>
            ) : (
                <div className="flex h-full items-center justify-center p-4">
                  <p className="text-sm text-muted-foreground">Sem notificações</p>
                </div>
            )}
          </ScrollArea>
          <Separator />
          <div className="p-2">
            <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  setOpen(false);
                  setActiveDialog("all-notifications");
                }}
            >
              Ver todas
            </Button>
          </div>
        </PopoverContent>
      </Popover>
        {activeDialog === "all-notifications" && <NotificationsDialog />}
      </>

  );
};