"use client"

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox"; // Importar Checkbox
import { NumericFormat } from 'react-number-format';
import { useCategories } from '@/hooks/useCategories';
import { useDialogManager } from '@/context/DialogManagerContext';
import { IMes } from '@/model/IMes';
import { Loader2, Target, HelpCircle } from 'lucide-react';
import { useBudgets } from "@/hooks/useBudgets.ts";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip.tsx";

export const AddBudgetForm = ({ month, year }: { month: string, year: number }) => {
    const { activeDialog, setActiveDialog } = useDialogManager();
    const { data: categories } = useCategories();
    const { saveBudget } = useBudgets(IMes.indexOf(month) + 1, year);

    const [selectedCategoryId, setSelectedCategoryId] = useState("");
    const [amount, setAmount] = useState("");
    const [replicateAllMonths, setReplicateAllMonths] = useState(false);

    const isOpen = activeDialog === "add-budget";

    useEffect(() => {
        if (!isOpen) {
            setSelectedCategoryId("");
            setAmount("");
            setReplicateAllMonths(false);
        }
    }, [isOpen]);

    const handleSave = () => {
        if (!selectedCategoryId || !amount) return;

        saveBudget.mutate({
            categoryId: selectedCategoryId,
            categoryName: categories?.find(c => c.id === selectedCategoryId)?.name || "",
            amount: parseFloat(amount),
            month: IMes.indexOf(month) + 1,
            year: year,
            replicateAllMonths: replicateAllMonths // Enviar a flag de replicação
        }, {
            onSuccess: () => {
                setActiveDialog(null);
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && setActiveDialog(null)}>
            <DialogContent className="w-[calc(100%-2rem)] sm:max-w-[425px] rounded-lg bg-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-emerald-500" />
                        Configurar Limite
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Mês</Label>
                            <Input value={month} disabled className="bg-muted/50" />
                        </div>
                        <div className="space-y-2">
                            <Label>Ano</Label>
                            <Input value={year} disabled className="bg-muted/50" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Categoria</Label>
                        <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Selecione a categoria" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories?.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id!}>{cat.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Limite Mensal</Label>
                        <NumericFormat
                            customInput={Input}
                            value={amount}
                            onValueChange={(values) => setAmount(values.floatValue?.toString() || '')}
                            thousandSeparator="."
                            decimalSeparator=","
                            decimalScale={2}
                            fixedDecimalScale
                            prefix="R$ "
                            placeholder="R$ 0,00"
                            className="w-full"
                        />
                    </div>

                    <div className="flex items-center space-x-2 pt-2 bg-emerald-50/50 p-3 rounded-md border border-emerald-100">
                        <Checkbox
                            id="replicate"
                            checked={replicateAllMonths}
                            onCheckedChange={(checked) => setReplicateAllMonths(checked as boolean)}
                        />
                        <div className="grid gap-1.5 leading-none">
                            <label htmlFor="replicate" className="text-sm leading-none cursor-pointer">
                                Replicar para todos os meses de {year}
                            </label>
                        </div>
                        <TooltipProvider>
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <button type="button" className="focus:outline-none">
                                        <HelpCircle className="h-4 w-4 text-emerald-600" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="bg-gray-800 text-white p-2 text-xs max-w-[200px] animate-in fade-in zoom-in-95 duration-200">
                                    Define este mesmo valor para todos os 12 meses do ano selecionado.
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>

                <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
                    <Button variant="outline" onClick={() => setActiveDialog(null)} className="flex-1" disabled={saveBudget.isPending}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saveBudget.isPending || !selectedCategoryId || !amount}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                        {saveBudget.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Salvar Limite"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};