import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useDialogManager } from "@/context/DialogManagerContext";
import { Transaction } from "@/model/types/Transaction";
import { useState } from "react";

interface DeleteFinanceDialogProps {
    transaction: Transaction | null;
    onConfirm: (deleteAll: boolean) => void;
    isDeleting: boolean;
}

export const DeleteFinanceDialog = ({ transaction, onConfirm, isDeleting }: DeleteFinanceDialogProps) => {
    const { activeDialog, setActiveDialog } = useDialogManager();
    const [deleteAll, setDeleteAll] = useState(false);

    const isOpen = activeDialog === "delete-finance";
    const isRecurrent = transaction?.recurrence === "FIXO" || transaction?.recurrence === "PARCELADO";

    const handleConfirm = () => {
        onConfirm(deleteAll);
        setDeleteAll(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={() => {
            setActiveDialog(null);
            setDeleteAll(false);
        }}>
            <DialogContent className="w-[95vw] sm:max-w-[425px] max-h-[95vh] overflow-y-auto rounded-lg">
                <DialogHeader>
                    <DialogTitle className="text-left">Confirmar Exclusão</DialogTitle>
                    <DialogDescription className="pt-3 text-left">
                        Você tem certeza que deseja excluir a transação
                        <span className="font-medium text-foreground"> {transaction?.description}</span>?
                        {isRecurrent && (
                            <p className="mt-2 text-muted-foreground">
                                Esta é uma transação {transaction?.recurrence.toLowerCase()}.
                            </p>
                        )}
                    </DialogDescription>
                </DialogHeader>

                {isRecurrent && (
                    <div className="flex items-center space-x-3 py-4 border-y my-2">
                        <Switch
                            id="delete-all"
                            checked={deleteAll}
                            onCheckedChange={setDeleteAll}
                        />
                        <Label htmlFor="delete-all" className="text-sm cursor-pointer leading-tight">
                            Excluir todas as {transaction?.recurrence === "FIXO" ? "recorrências" : "parcelas"}
                        </Label>
                    </div>
                )}

                <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-2 mt-4">
                    <Button
                        variant="outline"
                        onClick={() => setActiveDialog(null)}
                        disabled={isDeleting}
                        className="w-full sm:w-auto"
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={isDeleting}
                        className="w-full sm:w-auto"
                    >
                        {isDeleting ? "Excluindo..." : "Excluir"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};