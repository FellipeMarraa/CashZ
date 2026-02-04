"use client"

import {useEffect, useState} from 'react';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover';
import {Button} from '@/components/ui/button';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Separator} from '@/components/ui/separator';
import {AlertCircle, BellRing, CheckCircle2, Info, TriangleAlert} from 'lucide-react';
import {cn} from '@/lib/utils';
import {formatDistanceToNow} from 'date-fns';
import {ptBR} from "date-fns/locale";
import {useDialogManager} from "@/context/DialogManagerContext.tsx";
import {useMarkAllNotificationsAsRead, useMarkNotificationAsRead, useNotifications} from "@/hooks/useNotifications";
import {NotificationsDialog} from "./all-notifications";

export const NotificationsPopover = () => {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount } = useNotifications();
  const { mutate: markAsRead } = useMarkNotificationAsRead();
  const { mutate: markAllAsRead } = useMarkAllNotificationsAsRead();
  const { setActiveDialog } = useDialogManager();
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const getIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'WARNING': return <TriangleAlert className="h-4 w-4 text-amber-500" />;
      case 'ERROR': return <AlertCircle className="h-4 w-4 text-rose-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  useEffect(() => {
    if (unreadCount > 0) {
      setShouldAnimate(true);
      const timer = setTimeout(() => setShouldAnimate(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [unreadCount]);

  return (
      <>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative outline-none">
              <BellRing className={cn("h-5 w-5 transition-all", unreadCount > 0 && shouldAnimate && "animate-tada")} />
              {unreadCount > 0 && !shouldAnimate && (
                  <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white border-2 border-background">
                    {unreadCount}
                  </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
              align="end"
              className="w-[92vw] sm:w-80 p-0 dark:bg-[#282a36] dark:border-slate-800 shadow-2xl mr-2"
          >
            <div className="flex items-center justify-between p-4">
              <h3 className="font-bold text-sm">Notificações</h3>
              {unreadCount > 0 && (
                  <button onClick={() => markAllAsRead()} className="text-xs text-emerald-500 hover:text-emerald-400 font-medium">
                    Ler todas
                  </button>
              )}
            </div>
            <Separator />
            <ScrollArea className="h-[350px] sm:h-[300px]">
              {notifications.length > 0 ? (
                  <div className="flex flex-col">
                    {notifications.slice(0, 10).map((n) => (
                        <button
                            key={n.id}
                            onClick={() => {
                              markAsRead(n.id);
                              if (window.innerWidth < 640) setOpen(false);
                            }}
                            className={cn(
                                "flex flex-col gap-1 p-4 text-left transition-colors border-b last:border-0 outline-none",
                                !n.read ? "bg-emerald-500/5 dark:bg-emerald-500/10" : "hover:bg-muted/50"
                            )}
                        >
                          <div className="flex items-center gap-2">
                            {getIcon(n.type)}
                            <span className="text-xs font-bold truncate pr-4">{n.title}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                            {n.message}
                          </p>
                          <span className="text-[9px] text-slate-500 mt-1">
                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: ptBR })}
                          </span>
                        </button>
                    ))}
                  </div>
              ) : (
                  <div className="flex flex-col items-center justify-center h-[200px] gap-2 opacity-40">
                    <BellRing className="h-8 w-8" />
                    <p className="text-xs">Tudo limpo por aqui!</p>
                  </div>
              )}
            </ScrollArea>
            <Separator />
            <div className="p-2">
              <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs font-bold text-emerald-500 hover:bg-emerald-500/5"
                  onClick={() => { setOpen(false); setActiveDialog("all-notifications"); }}
              >
                Ver histórico completo
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        <NotificationsDialog />
      </>
  );
};