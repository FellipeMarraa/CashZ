"use client"

import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, CheckCheck, BellOff, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useNotifications, useMarkNotificationAsRead, useMarkAllNotificationsAsRead, useDeleteNotification } from "@/hooks/useNotifications";
import { useDialogManager } from "@/context/DialogManagerContext.tsx";
import * as DialogPrimitive from "@radix-ui/react-dialog";

export const NotificationsDialog = () => {
    const { activeDialog, setActiveDialog } = useDialogManager();
    const { notifications } = useNotifications();
    const { mutate: markAsRead } = useMarkNotificationAsRead();
    const { mutate: markAllAsRead } = useMarkAllNotificationsAsRead();
    const { mutate: deleteNotification } = useDeleteNotification();

    const typeTranslations: Record<string, string> = {
        'SUCCESS': 'Sucesso',
        'WARNING': 'Atenção',
        'ERROR': 'Erro',
        'INFO': 'Info'
    };

    const isOpen = activeDialog === "all-notifications";

    return (
        <Dialog open={isOpen} onOpenChange={() => setActiveDialog(null)}>
            <DialogContent className="w-[95vw] sm:max-w-xl p-0 overflow-hidden dark:bg-[#282a36] rounded-xl sm:rounded-2xl border-none sm:border [&>button]:hidden">
                <DialogHeader className="p-4 sm:p-6 pb-2 sm:pb-0 relative">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pr-8">
                        <DialogTitle className="text-lg sm:text-xl font-bold">Histórico</DialogTitle>
                        <DialogDescription className="sr-only">
                            Visualize e gerencie suas notificações recentes.
                        </DialogDescription>

                        <div className="flex gap-2 w-full sm:w-auto">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => markAllAsRead()}
                                className="flex-1 sm:flex-none text-[10px] h-9 px-3 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                disabled={notifications.length === 0}
                            >
                                <CheckCheck className="mr-1.5 h-3.5 w-3.5" /> Ler Tudo
                            </Button>
                        </div>
                    </div>

                    <DialogPrimitive.Close className="absolute right-4 top-4 sm:right-6 sm:top-7 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                        <X className="h-4 w-4 text-muted-foreground" />
                        <span className="sr-only">Fechar</span>
                    </DialogPrimitive.Close>
                </DialogHeader>

                <ScrollArea className="h-[70vh] sm:h-[60vh] p-4 sm:p-6">
                    <div className="space-y-3 pb-4">
                        {notifications.length > 0 ? (
                            notifications.map((n) => (
                                <div key={n.id} className={cn(
                                    "group relative flex flex-col gap-1 p-4 rounded-xl sm:rounded-2xl border transition-all",
                                    !n.read
                                        ? "border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10"
                                        : "bg-card/50 border-border dark:border-slate-800"
                                )}>
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={cn("text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full",
                                                n.type === 'ERROR' && "bg-rose-500/10 text-rose-500",
                                                n.type === 'SUCCESS' && "bg-emerald-500/10 text-emerald-500",
                                                n.type === 'WARNING' && "bg-amber-500/10 text-amber-500",
                                                n.type === 'INFO' && "bg-blue-500/10 text-blue-500")}>
                                            {typeTranslations[n.type] || n.type}
                                        </span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteNotification(n.id);
                                            }}
                                            className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-md transition-all z-20"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <h4 className="text-sm font-bold pr-6">{n.title}</h4>
                                    <p className="text-xs text-muted-foreground leading-relaxed">{n.message}</p>
                                    <span className="text-[10px] mt-2 opacity-50 font-medium">
                                        {format(new Date(n.createdAt), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                                    </span>

                                    {!n.read && (
                                        <button
                                            onClick={() => markAsRead(n.id)}
                                            className="absolute inset-0 w-full h-full cursor-pointer z-10"
                                            aria-label="Marcar como lida"
                                        />
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground opacity-30">
                                <BellOff className="h-12 w-12 mb-2" />
                                <p className="text-sm">Nenhuma notificação encontrada.</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};