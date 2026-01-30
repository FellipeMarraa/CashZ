"use client"

import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useDialogManager } from "@/context/DialogManagerContext";
import { Loader2, Info, Landmark } from 'lucide-react';
import { cn } from "@/lib/utils";
import { NumericFormat } from "react-number-format";

export const AddInvestmentForm = ({ onAdd, initialData }: { onAdd: (data: any) => void, initialData?: any }) => {
    const { activeDialog, setActiveDialog } = useDialogManager();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isAporte = !!initialData;

    const { register, handleSubmit, reset, setValue, control } = useForm({
        defaultValues: {
            category: 'fixed' as any,
            amountInvested: undefined as any,
            currentValue: undefined as any,
            name: '',
            institution: '',
            indexador: '',
            taxa: undefined as any,
            quantity: undefined as any,
            averagePrice: undefined as any
        }
    });

    const selectedCategory = useWatch({ control, name: 'category' });
    const watchQty = useWatch({ control, name: 'quantity' });
    const watchPrice = useWatch({ control, name: 'averagePrice' });
    const watchIndexador = useWatch({ control, name: 'indexador' });
    const watchTaxa = useWatch({ control, name: 'taxa' });

    // Automação: Quantidade * Preço = Valor Aplicado
    useEffect(() => {
        if (selectedCategory !== 'fixed' && watchQty > 0 && watchPrice > 0) {
            const calculatedTotal = Number(watchQty) * Number(watchPrice);
            setValue("amountInvested", calculatedTotal);
        }
    }, [watchQty, watchPrice, selectedCategory, setValue]);

    useEffect(() => {
        if (initialData && activeDialog === "add-investment") {
            reset({
                name: initialData.name,
                category: initialData.category,
                institution: initialData.institution,
                indexador: initialData.indexador || '',
                taxa: initialData.taxa || undefined,
                quantity: undefined, // Zera para o novo aporte
                averagePrice: initialData.averagePrice || undefined,
                amountInvested: undefined,
                currentValue: initialData.currentValue
            });
        } else if (!initialData) {
            reset({
                category: 'fixed',
                name: '',
                institution: '',
                indexador: '',
                taxa: undefined,
                quantity: undefined,
                amountInvested: undefined,
                averagePrice: undefined,
                currentValue: undefined
            });
        }
    }, [initialData, activeDialog, reset]);

    const onSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            // Aguarda a execução da função de salvamento que vem por props
            await onAdd({
                ...data,
                amountInvested: Number(data.amountInvested || 0),
                currentValue: Number(data.currentValue || 0),
                taxa: Number(data.taxa || 0),
                quantity: Number(data.quantity || 0),
                averagePrice: Number(data.averagePrice || 0)
            });

            // SÓ FECHA após o sucesso do onAdd
            setActiveDialog(null);
        } catch (error) {
            console.error("Erro no formulário:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={activeDialog === "add-investment"} onOpenChange={() => setActiveDialog(null)}>
            <DialogContent className="sm:max-w-[480px] p-0 flex flex-col max-h-[90vh] text-left">
                <DialogHeader className="p-6 pb-2 text-left">
                    <DialogTitle className="flex items-center gap-2">
                        <Landmark className="h-5 w-5 text-emerald-600" />
                        {isAporte ? `Aporte em ${initialData.name}` : "Novo Ativo"}
                    </DialogTitle>
                    <DialogDescription>
                        {isAporte ? "Mantenha a estratégia e adicione capital." : "Preencha os dados do seu novo ativo financeiro."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col overflow-hidden text-left">
                    <div className="flex-1 overflow-y-auto px-6 py-2 space-y-4 scrollbar-thin">

                        {!isAporte && (
                            <>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">Nome</Label>
                                        <Input {...register("name", { required: true })} placeholder="Ex: CDB 120% CDI" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">Instituição</Label>
                                        <Input {...register("institution")} placeholder="Ex: XP ou NuBank" />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">Classe</Label>
                                    <Select onValueChange={(v) => setValue("category", v as any)} defaultValue="fixed">
                                        <SelectTrigger className="bg-muted/20"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="fixed">🏦 Renda Fixa</SelectItem>
                                            <SelectItem value="stocks">📈 Ações / FIIs</SelectItem>
                                            <SelectItem value="international">🌎 Internacional</SelectItem>
                                            <SelectItem value="crypto">🪙 Cripto</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </>
                        )}

                        <div className="bg-muted/30 p-3 rounded-lg space-y-3 border">
                            <p className="text-[9px] font-black uppercase text-emerald-600 flex items-center gap-1.5">
                                <Info className="h-3 w-3" /> Detalhes Estratégicos
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                {selectedCategory === 'fixed' ? (
                                    <>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">Indexador</Label>
                                            <Select
                                                disabled={isAporte}
                                                value={watchIndexador}
                                                onValueChange={(v) => setValue("indexador", v)}
                                            >
                                                <SelectTrigger className={cn("h-9 bg-background", isAporte && "opacity-70")}>
                                                    <SelectValue placeholder="Selecione" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="CDI">CDI</SelectItem>
                                                    <SelectItem value="IPCA">IPCA+</SelectItem>
                                                    <SelectItem value="SELIC">SELIC</SelectItem>
                                                    <SelectItem value="PRE">PRÉ-FIXADO</SelectItem>
                                                    <SelectItem value="POS">POS-FIXADO</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">Taxa Anual (%)</Label>
                                            <NumericFormat
                                                customInput={Input}
                                                className={cn("h-9", isAporte && "bg-muted cursor-not-allowed")}
                                                readOnly={isAporte}
                                                value={watchTaxa}
                                                onValueChange={(values) => setValue("taxa", values.floatValue)}
                                                suffix="%"
                                                decimalScale={2}
                                                placeholder="0,00%"
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">{isAporte ? "Qtd. Comprada" : "Qtd. Total"}</Label>
                                            <NumericFormat
                                                customInput={Input}
                                                className="h-9"
                                                value={watchQty}
                                                onValueChange={(values) => setValue("quantity", values.floatValue)}
                                                thousandSeparator="."
                                                decimalSeparator=","
                                                decimalScale={4}
                                                placeholder="Ex: 10"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">{isAporte ? "Preço de Compra" : "Preço Médio"}</Label>
                                            <NumericFormat
                                                customInput={Input}
                                                className="h-9"
                                                value={watchPrice}
                                                onValueChange={(values) => setValue("averagePrice", values.floatValue)}
                                                thousandSeparator="."
                                                decimalSeparator=","
                                                decimalScale={2}
                                                fixedDecimalScale
                                                prefix="R$ "
                                                placeholder="R$ 0,00"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pb-2">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                                    {isAporte ? "Valor do Aporte" : "Valor Aplicado"}
                                </Label>
                                <NumericFormat
                                    customInput={Input}
                                    className="h-10 bg-emerald-50/10 border-emerald-500/20"
                                    value={useWatch({ control, name: 'amountInvested' })}
                                    onValueChange={(values) => setValue("amountInvested", values.floatValue)}
                                    thousandSeparator="."
                                    decimalSeparator=","
                                    decimalScale={2}
                                    fixedDecimalScale
                                    prefix="R$ "
                                    placeholder="R$ 0,00"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Saldo Atual Total</Label>
                                <NumericFormat
                                    customInput={Input}
                                    className="h-10 font-bold text-emerald-600 border-emerald-500/30"
                                    value={useWatch({ control, name: 'currentValue' })}
                                    onValueChange={(values) => setValue("currentValue", values.floatValue)}
                                    thousandSeparator="."
                                    decimalSeparator=","
                                    decimalScale={2}
                                    fixedDecimalScale
                                    prefix="R$ "
                                    placeholder="R$ 0,00"
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-6 pt-2 border-t">
                        <Button type="submit" className="w-full bg-emerald-600 h-11 text-sm font-bold shadow-md" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : isAporte ? "Confirmar Aporte" : "Confirmar Ativo"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};