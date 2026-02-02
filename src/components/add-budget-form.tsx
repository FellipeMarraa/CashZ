"use client"

import { useState } from "react";
import { useBudgets } from "@/hooks/useBudgets";
import { useCategories } from "@/hooks/useCategories";
import { useDialogManager } from "@/context/DialogManagerContext";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useAuth } from "@/context/AuthContext";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { IMes } from "@/model/IMes";
import { Lock, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddBudgetFormProps {
    month: string;
    year: number;
}

export const AddBudgetForm = ({ month, year }: AddBudgetFormProps) => {
    const { user } = useAuth();
    const { isPremium } = useUserPreferences(user?.id);
    const { activeDialog, setActiveDialog } = useDialogManager();
    const { data: categories = [] } = useCategories();
    const { saveBudget } = useBudgets(IMes.indexOf(month) + 1, year);

    const [selectedCategoryId, setSelectedCategoryId] = useState("");
    const [amount, setAmount] = useState("");
    const [replicateAllMonths, setReplicateAllMonths] = useState(false);

    const handleSave = async () => {
        if (!selectedCategoryId || !amount) return;

        const category = categories.find(c => c.id === selectedCategoryId);

        saveBudget.mutate({
            categoryId: selectedCategoryId,
            categoryName: category?.name || "",
            amount: Number(amount),
            month: IMes.indexOf(month) + 1,
            year: year,
            replicateAllMonths: isPremium ? replicateAllMonths : false
        }, {
            onSuccess: () => {
                setActiveDialog(null);
                setAmount("");
                setSelectedCategoryId("");
                setReplicateAllMonths(false);
            }
        });
    };

    return (
        <Dialog open={activeDialog === "add-budget"} onOpenChange={(open) => !open && setActiveDialog(null)}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-emerald-500" />
                        Configurar Meta
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2 text-left">
                        <Label htmlFor="category">Categoria</Label>
                        <Select onValueChange={setSelectedCategoryId} value={selectedCategoryId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione uma categoria" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id!}>
                                        {cat.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2 text-left">
                        <Label htmlFor="amount">Valor Limite (Mensal)</Label>
                        <Input
                            id="amount"
                            type="number"
                            placeholder="R$ 0,00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>

                    {/* BLOCAGEM VISUAL DE REPLICAÇÃO PARA PLANO FREE */}
                    <div
                        className={cn(
                            "flex items-start space-x-3 space-y-0 rounded-md border p-4 transition-colors",
                            !isPremium ? "bg-muted/50 cursor-pointer" : "bg-background"
                        )}
                        onClick={() => !isPremium && setActiveDialog("upgrade-plan")}
                    >
                        <Checkbox
                            id="replicate"
                            checked={isPremium ? replicateAllMonths : false}
                            onCheckedChange={(checked) => isPremium && setReplicateAllMonths(!!checked)}
                            disabled={!isPremium}
                            className={cn(!isPremium && "opacity-50")}
                        />
                        <div className="grid gap-1.5 leading-none text-left">
                            <label
                                htmlFor="replicate"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                Replicar para todos os meses do ano
                                {!isPremium && <Lock className="h-3 w-3 text-amber-500" />}
                            </label>
                            <p className="text-xs text-muted-foreground">
                                {isPremium
                                    ? "Esta meta será aplicada automaticamente de Janeiro a Dezembro."
                                    : "Recurso exclusivo Premium para automação de metas."}
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setActiveDialog(null)}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saveBudget.isPending || !selectedCategoryId || !amount}
                        className="bg-emerald-600 hover:bg-emerald-700"
                    >
                        {saveBudget.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Salvar Meta"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};