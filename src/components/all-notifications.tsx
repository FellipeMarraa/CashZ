import {Dialog, DialogContent, DialogHeader, DialogTitle,} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {ScrollArea} from "@/components/ui/scroll-area";
import {AlertCircle, CheckCheck, CheckCircle2, Info, Trash, TriangleAlert} from "lucide-react";
import {formatDistanceToNow} from "date-fns";
import {ptBR} from "date-fns/locale";
import {cn} from "@/lib/utils";
import {
    useDeleteAllNotifications,
    useDeleteNotification,
    useMarkAllNotificationsAsRead,
    useMarkNotificationAsRead,
    useNotifications,
} from "@/hooks/useNotifications";
import {useDialogManager} from "@/context/DialogManagerContext.tsx";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip.tsx";

export const NotificationsDialog = () => {

    const { activeDialog, setActiveDialog } = useDialogManager();
    const isOpen = activeDialog === "all-notifications";

    const { notifications } = useNotifications();
    const { mutate: markAsRead } = useMarkNotificationAsRead();
    const { mutate: markAllAsRead } = useMarkAllNotificationsAsRead();
    const { mutate: deleteNotification } = useDeleteNotification();
    const { mutate: deleteAll } = useDeleteAllNotifications();

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

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && setActiveDialog(null)}>
            <DialogContent className="max-w-2xl w-full h-[80vh]">
                <DialogHeader className="flex mb-0">
                    <DialogTitle>Gerenciar Notificações</DialogTitle>
                    <div className="flex gap-2 mt-2 justify-end">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markAllAsRead()}
                            className="hover:bg-green-50"
                            disabled={notifications.length === 0}
                        >
                            <CheckCheck className="h-4 w-4 mr-1" />
                            Marcar todas como lidas
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteAll()}
                            disabled={notifications.length === 0}
                        >
                            <Trash className="h-4 w-4 mr-1" />
                            Excluir todas
                        </Button>
                    </div>
                </DialogHeader>
                <ScrollArea className="h-full mt-0 pr-4">
                    <div className="space-y-4 h-full flex flex-col">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                onClick={() => markAsRead(notification.id)}
                                className={cn(
                                    "flex items-start justify-between space-x-4 rounded-lg border p-4 hover:bg-green-50 transition-colors cursor-pointer",
                                    !notification.read && "bg-green-50"
                                )}
                            >
                                <div className="flex space-x-4 h-full items-center">
                                    <div
                                        className={cn(
                                            "mt-0.5 rounded-full h-full p-1.5",
                                            notification.type === 'success' && "bg-success/20 text-success",
                                            notification.type === 'warning' && "bg-warning/20 text-warning",
                                            notification.type === 'info' && "bg-primary/20 text-primary",
                                            notification.type === 'error' && "bg-destructive/20 text-destructive"
                                        )}
                                    >
                                        {getIconByType(notification.type)}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium">
                                            {notification.title}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {notification.message}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(notification.createdAt), {
                                                addSuffix: true,
                                                locale: ptBR,
                                            })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex space-x-4 h-full items-center justify-center">
                                    {!notification.read && (
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <CheckCheck className="h-4 w-4 text-blue-500 cursor-pointer" onClick={() => markAsRead(notification.id)} />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                Marcar como lida
                                            </TooltipContent>
                                        </Tooltip>
                                    )}
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <Trash className="h-4 w-4 text-red-500 cursor-pointer" onClick={() => deleteNotification(notification.id)} />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            Remover notificação
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            </div>
                        ))}
                        {notifications.length === 0 && (
                            <div className="flex items-center justify-center h-32">
                                <p className="text-muted-foreground">
                                    Nenhuma notificação encontrada
                                </p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};