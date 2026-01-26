"use client"

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { NumericFormat } from 'react-number-format';
import { useCategories } from '@/hooks/useCategories';
import { useDialogManager } from '@/context/DialogManagerContext';
import { IMes } from '@/model/IMes';
import { Loader2, Target } from 'lucide-react';
import { useBudgets } from "@/hooks/useBudgets.ts";

export const AddBudgetForm = ({ month, year }: { month: string, year: number }) => {
    const { activeDialog, setActiveDialog } = useDialogManager();
    const { data: categories } = useCategories();

    // Acessando o hook consolidado
    const { saveBudget } = useBudgets(IMes.indexOf(month) + 1, year);

    const [selectedCategoryId, setSelectedCategoryId] = useState("");
    const [amount, setAmount] = useState("");

    const isOpen = activeDialog === "add-budget";

    // Limpa o formulário quando o modal é fechado
    useEffect(() => {
        if (!isOpen) {
            setSelectedCategoryId("");
            setAmount("");
        }
    }, [isOpen]);

    const handleSave = () => {
        if (!selectedCategoryId || !amount) return;

        saveBudget.mutate({
            categoryId: selectedCategoryId,
            categoryName: categories?.find(c => c.id === selectedCategoryId)?.name || "",
            amount: parseFloat(amount),
            month: IMes.indexOf(month) + 1,
            year: year
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
                    <div className="space-y-2">
                        <Label>Período selecionado</Label>
                        <Input value={`${month} / ${year}`} disabled className="bg-muted opacity-80" />
                    </div>

                    <div className="space-y-2">
                        <Label>Categoria</Label>
                        <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Selecione a categoria" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories?.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id!}>
                                        {cat.name}
                                    </SelectItem>
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
                            className="w-full text-lg font-bold"
                        />
                    </div>
                </div>

                <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setActiveDialog(null)}
                        className="w-full sm:w-auto"
                        disabled={saveBudget.isPending}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saveBudget.isPending || !selectedCategoryId || !amount}
                        className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                        {saveBudget.isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            "Salvar Limite"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};