"use client"

import {Dialog, DialogContent, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {useDialogManager} from "@/context/DialogManagerContext";
import {useState} from "react";
import {IMes} from "@/model/IMes.ts";
import {useUpdateTransaction} from "@/hooks/useTransactions";
import {useCategories} from "@/hooks/useCategories.ts";
import {useToast} from "@/hooks/use-toast.ts";
import {Transaction} from "@/model/types/Transaction";
import {NumericFormat} from "react-number-format";
import {useUserPreferences} from "@/hooks/useUserPreferences";
import {useAuth} from "@/context/AuthContext";
import {Lock} from "lucide-react";

interface EditFinanceFormProps {
    transaction: Transaction;
    onClose: () => void;
}

export const EditFinanceForm = ({ transaction, onClose }: EditFinanceFormProps) => {
    const { user } = useAuth();
    const { isPremium } = useUserPreferences(user?.id);
    const { activeDialog, setActiveDialog } = useDialogManager();
    const isOpen = activeDialog === "edit-finance";

    const [description, setDescription] = useState(transaction.description);
    const [amount, setAmount] = useState(transaction.amount.toString());
    const [month, setMonth] = useState(IMes[transaction.month - 1]);
    const [year, setYear] = useState(transaction.year);
    const [categoryId, setCategoryId] = useState(transaction.category.id);
    const [type, setType] = useState(transaction.type);
    const [recurrence, setRecurrence] = useState(transaction.recurrence);
    const [status] = useState(transaction.status);
    const [numInstallments, setNumInstallments] = useState(transaction.numInstallments || 1);

    const { mutate: updateTransaction } = useUpdateTransaction();
    const { data: categories } = useCategories();
    const { toast } = useToast();

    const handleSubmit = async () => {
        try {
            if (!description || !amount || !month || !year || !categoryId || !type || !recurrence) {
                toast({
                    variant: "destructive",
                    title: "Erro ao atualizar transação",
                    description: "Todos os campos obrigatórios devem ser preenchidos.",
                    duration: 3000,
                });
                return;
            }

            if (!isPremium && recurrence !== "UNICO") {
                setActiveDialog("upgrade-plan");
                return;
            }

            if (recurrence === "PARCELADO" && (!numInstallments || numInstallments < 2)) {
                toast({
                    variant: "destructive",
                    title: "Erro ao atualizar transação",
                    description: "Se a transação é parcelada o número de parcelas deve ser maior que 1.",
                    duration: 3000,
                });
                return;
            }

            const selectedCategory = categories?.find(cat => cat.id === categoryId);

            if (!selectedCategory) {
                toast({
                    variant: "destructive",
                    title: "Erro ao atualizar transação",
                    description: "Categoria selecionada não encontrada.",
                    duration: 3000,
                });
                return;
            }

            const payload = {
                id: transaction.id,
                description: description.trim(),
                amount: parseFloat(amount),
                month: IMes.indexOf(month) + 1,
                year,
                category: {
                    ...selectedCategory,
                    id: selectedCategory.id!,
                },
                type,
                recurrence,
                status,
                numInstallments: recurrence === "PARCELADO" ? numInstallments : undefined,
            };

            updateTransaction(
                {
                    id: transaction.id,
                    data: payload
                },
                {
                    onSuccess: () => {
                        toast({
                            variant: "success",
                            title: "Transação atualizada com sucesso",
                            duration: 3000,
                        });
                        onClose();
                    }
                }
            );

        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Erro ao atualizar transação",
                description: `${error instanceof Error ? error.message : String(error)}`,
                duration: 3000,
            });
        }
    };

    function generateYears(startYear: number, endYear: number) {
        return Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && setActiveDialog(null)}>
            <DialogContent className="w-[calc(100%-2rem)] sm:max-w-[550px] max-h-[95vh] overflow-y-auto rounded-lg">
                <DialogHeader>
                    <DialogTitle>Editar Transação</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="grid gap-1.5">
                        <Label>Descrição</Label>
                        <Input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div className="sm:col-span-2 grid gap-1.5">
                            <Label>Valor</Label>
                            <NumericFormat
                                customInput={Input}
                                value={amount}
                                onValueChange={(values) => {
                                    setAmount(values.floatValue?.toString() || '');
                                }}
                                thousandSeparator="."
                                decimalSeparator=","
                                decimalScale={2}
                                fixedDecimalScale
                                prefix="R$ "
                                placeholder="R$ 0,00"
                                className="w-full"
                                required
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <Label>Mês</Label>
                            <Select value={month} onValueChange={(value) => setMonth(value)} required>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Mês" />
                                </SelectTrigger>
                                <SelectContent>
                                    {IMes.map((mes, index) => (
                                        <SelectItem key={index} value={mes}>
                                            {mes}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-1.5">
                            <Label>Ano</Label>
                            <Select
                                value={year.toString()}
                                onValueChange={(value) => setYear(Number(value))}
                                required
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Ano" />
                                </SelectTrigger>
                                <SelectContent>
                                    {generateYears(new Date().getFullYear() - 5, new Date().getFullYear() + 5).map((year) => (
                                        <SelectItem key={year} value={year.toString()}>
                                            {year}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="grid gap-1.5">
                            <Label>Categoria</Label>
                            <Select value={categoryId} onValueChange={setCategoryId} required>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Selecione uma categoria" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories?.map((category) => (
                                        <SelectItem key={category.id} value={category.id!}>
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-1.5">
                            <Label>Tipo</Label>
                            <Select
                                value={type}
                                onValueChange={(value: "RECEITA" | "DESPESA") => setType(value)}
                                required
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="RECEITA">Receita</SelectItem>
                                    <SelectItem value="DESPESA">Despesa</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="grid gap-1.5">
                            <Label>Recorrência</Label>
                            <Select
                                value={recurrence}
                                onValueChange={(value: any) => {
                                    if (!isPremium && value !== "UNICO") {
                                        setActiveDialog("upgrade-plan");
                                        return;
                                    }
                                    setRecurrence(value);
                                }}
                                required
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Recorrência" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="UNICO">Único</SelectItem>
                                    <SelectItem value="PARCELADO">
                                        Parcelado {!isPremium && <Lock className="ml-2 h-3 w-3 inline text-amber-500" />}
                                    </SelectItem>
                                    <SelectItem value="FIXO">
                                        Fixo {!isPremium && <Lock className="ml-2 h-3 w-3 inline text-amber-500" />}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {recurrence === "PARCELADO" && isPremium && (
                            <div className="grid gap-1.5 animate-in fade-in">
                                <Label>Parcelas</Label>
                                <Input
                                    type="number"
                                    value={numInstallments}
                                    onChange={(e) => setNumInstallments(parseInt(e.target.value))}
                                    required
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button className="w-full sm:w-auto" onClick={handleSubmit}>Atualizar Transação</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};