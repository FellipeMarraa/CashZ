import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog"
import {Button} from "@/components/ui/button"
import {AlertTriangle, Loader2} from "lucide-react"
import {useDialogManager} from "@/context/DialogManagerContext"
import {cn} from "@/lib/utils"

interface ConfirmDialogProps {
    title: string
    description: string
    onConfirm: () => void
    cancelLabel?: string
    confirmLabel?: string
    variant?: "default" | "destructive" | "success"
    isLoading?: boolean
}

export const ConfirmDialog = ({
                                  title,
                                  description,
                                  onConfirm,
                                  cancelLabel = "Cancelar",
                                  confirmLabel = "Confirmar",
                                  variant = "destructive",
                                  isLoading = false
                              }: ConfirmDialogProps) => {
    const { activeDialog, setActiveDialog } = useDialogManager();
    const isOpen = activeDialog === "confirm-dialog";

    const variantStyles = {
        default: "bg-primary hover:bg-primary/90 text-white",
        destructive: "bg-red-600 hover:bg-red-700 text-white",
        success: "bg-emerald-600 hover:bg-emerald-700 text-white"
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && setActiveDialog(null)}>
            <DialogContent className="w-[calc(100%-2rem)] sm:max-w-[400px] rounded-lg bg-white p-6 shadow-lg">
                <DialogHeader className="space-y-3">
                    <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                        {variant === "destructive" && <AlertTriangle className="h-5 w-5 text-red-500" />}
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="mt-6 flex flex-col-reverse sm:flex-row gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setActiveDialog(null)}
                        className="w-full sm:w-auto"
                        disabled={isLoading}
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={cn("w-full sm:w-auto font-bold", variantStyles[variant])}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processando...
                            </>
                        ) : confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}