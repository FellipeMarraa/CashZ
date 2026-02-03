"use client"

import {Dialog, DialogContent, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {useDialogManager} from "@/context/DialogManagerContext";
import {useEffect, useState} from "react";
import {IMes} from "@/model/IMes.ts";
import {useCreateTransaction} from "@/hooks/useTransactions";
import {useCategories} from "@/hooks/useCategories.ts";
import {useToast} from "@/hooks/use-toast.ts";
import {NumericFormat} from "react-number-format";
import {HelpCircle, Lock} from "lucide-react";
import {Tooltip, TooltipContent, TooltipTrigger, TooltipProvider} from "@/components/ui/tooltip.tsx";
import {Input} from "@/components/ui/input.tsx";
import {useUserPreferences} from "@/hooks/useUserPreferences";
import {useAuth} from "@/context/AuthContext";

export const AddFinanceForm = () => {
    const { user } = useAuth();
    const { isPremium } = useUserPreferences(user?.id);
    const { activeDialog, setActiveDialog } = useDialogManager();
    const isOpen = activeDialog === "add-finance";

    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [month, setMonth] = useState(IMes[new Date().getMonth()]);
    const [year, setYear] = useState(new Date().getFullYear());
    const [categoryId, setCategoryId] = useState<string>("");
    const [type, setType] = useState<"RECEITA" | "DESPESA">("RECEITA");
    const [recurrence, setRecurrence] = useState<"UNICO" | "PARCELADO" | "FIXO">("UNICO");
    const [status, setStatus] = useState<"PAGA" | "PENDENTE">("PENDENTE");
    const [numInstallments, setNumInstallments] = useState(1);

    const { mutate: createTransaction } = useCreateTransaction();
    const { data: categories} = useCategories();
    const {toast} = useToast();

    const handleSubmit = async () => {
        try {
            if (!description || !amount || !month || !year || !categoryId || !type || !recurrence) {
                toast({
                    variant: "destructive",
                    title: "Erro ao adicionar transação",
                    description: "Todos os campos obrigatórios devem ser preenchidos.",
                    duration: 3000,
                });
                return;
            }

            // Trava de segurança UI extra
            if (!isPremium && recurrence !== "UNICO") {
                setActiveDialog("upgrade-plan");
                return;
            }

            if (recurrence === "PARCELADO" && (!numInstallments || numInstallments < 2)) {
                toast({
                    variant: "destructive",
                    title: "Erro ao adicionar transação",
                    description: "Se a transação é parcelada o número de parcelas deve ser maior que 1.",
                    duration: 3000,
                });
                return;
            }

            const selectedCategory = categories?.find(cat => cat.id === categoryId);

            const payload = {
                description: description.trim(),
                amount: parseFloat(amount),
                month: IMes.indexOf(month) + 1,
                year,
                category: selectedCategory,
                type,
                recurrence: recurrence, // Ajuste para bater com o hook se necessário
                status,
                numInstallments: numInstallments,
            };

            // @ts-ignore
            createTransaction(payload, {
                onSuccess: () => {
                    toast({
                        variant: "success",
                        title: "Transação adicionada com sucesso",
                        duration: 3000,
                    });
                    setActiveDialog(null);
                    resetForm();
                }
            });

        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Erro ao adicionar transação",
                description: `${error instanceof Error ? error.message : String(error)}`,
                duration: 3000,
            });
        }
    };

    const resetForm = () => {
        setDescription("");
        setAmount("");
        setMonth(IMes[new Date().getMonth()]);
        setYear(new Date().getFullYear());
        setCategoryId("");
        setType("RECEITA");
        setRecurrence("UNICO");
        setStatus("PENDENTE");
        setNumInstallments(1);
    };

    useEffect(() => {
        if (!isOpen) resetForm();
    }, [isOpen]);

    function generateYears(startYear: number, endYear: number) {
        return Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && setActiveDialog(null)}>
            <DialogContent className="max-w-[95vw] sm:max-w-[550px] max-h-[95vh] overflow-y-auto rounded-lg">
                <DialogHeader>
                    <DialogTitle>Adicionar Transação</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="grid w-full items-center gap-1.5">
                        <Label>Descrição</Label>
                        <Input value={description} onChange={(e) => setDescription(e.target.value)} required />
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
                                        <SelectItem key={index} value={mes}>{mes}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-1.5">
                            <Label>Ano</Label>
                            <Select value={year.toString()} onValueChange={(value) => setYear(Number(value))} required>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Ano" />
                                </SelectTrigger>
                                <SelectContent>
                                    {generateYears(new Date().getFullYear() - 5, new Date().getFullYear() + 5).map((year) => (
                                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
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
                                        <SelectItem key={category.id} value={category.id!}>{category.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-1.5">
                            <Label>Tipo</Label>
                            <Select value={type} onValueChange={(value) => setType(value as any)} required>
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
                            <div className="flex items-center gap-2">
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
                                        <SelectItem value="PARCELADO" className="flex justify-between items-center">
                                            <span>Parcelado</span>
                                            {!isPremium && <Lock className="ml-2 h-3 w-3 inline text-amber-500" />}
                                        </SelectItem>
                                        <SelectItem value="FIXO" className="flex justify-between items-center">
                                            <span>Fixo</span>
                                            {!isPremium && <Lock className="ml-2 h-3 w-3 inline text-amber-500" />}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>

                                <TooltipProvider>
                                    <Tooltip delayDuration={0}>
                                        <TooltipTrigger asChild>
                                            <button type="button" className="shrink-0 p-1 focus:outline-none focus:ring-2 focus:ring-ring rounded-full">
                                                <HelpCircle className="h-5 w-5 text-gray-400" />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="bg-gray-800 text-white p-3 max-w-[280px] shadow-lg">
                                            <p className="text-xs"><b>Único:</b> Ocorre apenas uma vez.</p>
                                            <p className="text-xs"><b>Parcelado:</b> Dividido em parcelas (Premium).</p>
                                            <p className="text-xs"><b>Fixo:</b> Repete todo mês automaticamente (Premium).</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        </div>

                        {recurrence === "PARCELADO" && isPremium && (
                            <div className="grid gap-1.5 animate-in slide-in-from-left-2 duration-300">
                                <Label>Parcelas</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        min={2}
                                        value={numInstallments}
                                        onChange={(e) => setNumInstallments(parseInt(e.target.value))}
                                        required
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button className="w-full sm:w-auto" onClick={handleSubmit}>Salvar Transação</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};