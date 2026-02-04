"use client"

import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog"
import {Button} from "@/components/ui/button"
import {AlertTriangle, Loader2} from "lucide-react"
import {useDialogManager} from "@/context/DialogManagerContext"
import {cn} from "@/lib/utils"

interface ConfirmDialogProps {
    title: string
    description: string
    onConfirm: () => void
    onConfirmAll?: () => void
    showConfirmAll?: boolean
    cancelLabel?: string
    confirmLabel?: string
    confirmAllLabel?: string
    variant?: "default" | "destructive" | "success"
    isLoading?: boolean
}

export const ConfirmDialog = ({
                                  title,
                                  description,
                                  onConfirm,
                                  onConfirmAll,
                                  showConfirmAll = false,
                                  cancelLabel = "Cancelar",
                                  confirmLabel = "Apenas este",
                                  confirmAllLabel = "Este e próximos meses",
                                  variant = "destructive",
                                  isLoading = false
                              }: ConfirmDialogProps) => {
    const { activeDialog, setActiveDialog } = useDialogManager();
    const isOpen = activeDialog === "confirm-dialog";

    const variantStyles = {
        default: "bg-primary hover:bg-primary/90 text-primary-foreground",
        destructive: "bg-rose-600 hover:bg-rose-700 text-white",
        success: "bg-emerald-600 hover:bg-emerald-700 text-white"
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && setActiveDialog(null)}>
            <DialogContent className="w-[calc(100%-2rem)] sm:max-w-[550px] rounded-xl bg-background dark:bg-[#282a36] p-6 shadow-2xl border-none outline-none">
                <DialogHeader className="space-y-3">
                    <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                        {variant === "destructive" && <AlertTriangle className="h-5 w-5 text-rose-500" />}
                        {title}
                    </DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <DialogFooter className="mt-6 flex flex-col-reverse sm:flex-row gap-2">
                    <Button
                        variant="ghost"
                        onClick={() => setActiveDialog(null)}
                        className="w-full sm:w-auto text-muted-foreground hover:bg-muted"
                        disabled={isLoading}
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={cn(
                            "w-full sm:w-auto font-bold transition-all",
                            variantStyles[variant],
                            isLoading && "opacity-80 cursor-not-allowed"
                        )}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Aguarde...
                            </>
                        ) : confirmLabel}
                    </Button>
                    {showConfirmAll && (
                        <Button
                            onClick={onConfirmAll}
                            disabled={isLoading}
                            className="w-full font-bold bg-amber-600 hover:bg-amber-700 text-white"
                        >
                            {isLoading ? <Loader2 className="animate-spin" /> : confirmAllLabel}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}