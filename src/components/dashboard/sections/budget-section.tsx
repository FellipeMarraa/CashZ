"use client"

import {useMemo, useState} from 'react';
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from '@/components/ui/card';
import {Progress} from '@/components/ui/progress';
import {Button} from '@/components/ui/button';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {AlertTriangle, CheckCircle2, Lightbulb, Plus, Target, Trash2, TrendingUp} from 'lucide-react';
import {IMes} from "@/model/IMes.ts";
import {formatTransactionAmount, useTransactions} from '@/hooks/useTransactions';
import {useCategories} from '@/hooks/useCategories';
import {cn} from "@/lib/utils";
import {useBudgets} from "@/hooks/useBudgets.ts";
import {useDialogManager} from "@/context/DialogManagerContext.tsx";
import {AddBudgetForm} from "@/components/add-budget-form.tsx";
import {ConfirmDialog} from "@/components/confirm-dialog.tsx";
import {TutorialWizard} from "@/components/tutorial-wizard";

export const BudgetSection = () => {
    const currentDate = new Date();
    const [activeMonth, setActiveMonth] = useState(IMes[currentDate.getMonth()]);
    const [activeYear, setActiveYear] = useState(currentDate.getFullYear());

    const {setActiveDialog } = useDialogManager();
    const { budgets, deleteBudget } = useBudgets(IMes.indexOf(activeMonth) + 1, activeYear);
    const { data: transactions = [] } = useTransactions(activeMonth, activeYear);
    const { data: categories = [] } = useCategories();

    const [idToDelete, setIdToDelete] = useState<string | null>(null);
    const budgetAnalysis = useMemo(() => {
        return categories.map(category => {
            const spent = transactions
                .filter(t => t.category.id === category.id && t.type === 'DESPESA')
                .reduce((acc, t) => acc + Number(t.amount || 0), 0);

            const budgetData = budgets.find(b => b.categoryId === category.id);

            const allocated = budgetData ? Number(budgetData.amount) : 0;
            const budgetId = budgetData ? budgetData.id : null;

            const percentSpent = allocated > 0 ? (spent / allocated) * 100 : 0;
            const remaining = allocated - spent;

            return { ...category, allocated, spent, percentSpent, remaining, budgetId };
        });
    }, [categories, transactions, budgets]);

    const totalAllocated = useMemo(() =>
            budgetAnalysis.reduce((sum, item) => sum + item.allocated, 0),
        [budgetAnalysis]);

    const totalSpent = useMemo(() =>
            budgetAnalysis
                .filter(item => item.allocated > 0)
                .reduce((sum, item) => sum + item.spent, 0),
        [budgetAnalysis]);

    const isOverBudget = totalAllocated > 0 && totalSpent > totalAllocated;

    const insights = useMemo(() => {
        const categoriesWithBudget = budgetAnalysis.filter(cat => cat.allocated > 0);
        const critical = [...categoriesWithBudget].sort((a, b) => b.percentSpent - a.percentSpent)[0];
        const saving = [...categoriesWithBudget].sort((a, b) => a.percentSpent - b.percentSpent)[0];
        const overBudgetCount = categoriesWithBudget.filter(cat => cat.spent > cat.allocated).length;
        return { critical, saving, overBudgetCount, totalBudgets: categoriesWithBudget.length };
    }, [budgetAnalysis]);

    const handleOpenConfirm = (budgetId: string) => {
        setIdToDelete(budgetId);
        setActiveDialog("confirm-dialog");
    };

    const handleConfirmDelete = () => {
        if (idToDelete) {
            deleteBudget.mutate(idToDelete, {
                onSuccess: () => {
                    setActiveDialog(null);
                    setIdToDelete(null);
                }
            });
        }
    };

    const budgetSteps = [
        {
            element: '#budget-period-select',
            title: 'Planejamento Mensal',
            description: 'Os orçamentos são definidos mês a mês. Você pode planejar o próximo mês antecipadamente selecionando a data aqui.'
        },
        {
            element: '#budget-summary-cards',
            title: 'Resumo de Metas',
            description: 'Veja rapidamente o total que você planejou gastar vs. o que você realmente já gastou no mês selecionado.'
        },
        {
            element: '#category-progress-list',
            title: 'Controle por Categoria',
            description: 'Acompanhe as barras de progresso. Elas mudam de cor e mostram quanto ainda resta (ou quanto excedeu) em cada categoria.'
        },
        {
            element: '#add-budget-btn',
            title: 'Configurar Limites',
            description: 'Clique aqui para definir quanto você pretende gastar em cada categoria. Um bom planejamento é o segredo para economizar.'
        },
        {
            element: '#budget-insights',
            title: 'Insights Inteligentes',
            description: 'Aqui o sistema analisa seus hábitos e te avisa onde você está economizando e onde precisa de mais atenção.'
        }
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-700 pb-10">
            {/* COMPONENTE DE TUTORIAL */}
            <TutorialWizard tutorialKey="budget-management" steps={budgetSteps} />

            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Gestão de Orçamentos</h2>
                        <p className="text-sm text-muted-foreground">Controle seus limites de gastos reais.</p>
                    </div>

                    <div className="flex flex-row items-center gap-2 w-full md:w-auto" id="budget-period-select">
                        <Select value={activeMonth} onValueChange={setActiveMonth}>
                            <SelectTrigger className="flex-1 md:w-[140px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {IMes.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={activeYear.toString()} onValueChange={(v) => setActiveYear(Number(v))}>
                            <SelectTrigger className="w-[100px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {[2024, 2025, 2026].map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" id="budget-summary-cards">
                <Card className="border-none shadow-sm md:border">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs uppercase font-bold text-muted-foreground">Total Planejado</CardDescription>
                        <CardTitle className="text-2xl font-bold">{formatTransactionAmount(totalAllocated)}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-sm md:border">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs uppercase font-bold text-muted-foreground">Total Gasto Real</CardDescription>
                        <CardTitle className="text-2xl font-bold">{formatTransactionAmount(totalSpent)}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className={cn(
                    "border-none shadow-sm md:border transition-colors",
                    isOverBudget ? "bg-red-50 border-red-200" : "text-emerald-500"
                )}>
                    <CardHeader className="pb-2">
                        <CardDescription className={cn("text-xs uppercase font-bold", isOverBudget ? "text-red-500" : "text-muted-foreground")}>
                            Status Geral
                        </CardDescription>
                        <CardTitle className={cn("text-2xl truncate font-bold", isOverBudget && "text-red-600")}>
                            {totalAllocated === 0
                                ? "Sem metas"
                                : isOverBudget
                                    ? "Orçamento Estourado"
                                    : "Dentro do Limite"}
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-7">
                <Card className="col-span-7 md:col-span-4 border-none shadow-none md:border md:shadow-sm" id="category-progress-list">
                    <CardHeader>
                        <CardTitle className="text-lg">Progresso por Categoria</CardTitle>
                        <CardDescription>Baseado em suas despesas de {activeMonth}.</CardDescription>
                    </CardHeader>
                    <CardContent className="px-4 md:px-6">
                        <div className="space-y-7">
                            {budgetAnalysis.filter(item => item.allocated > 0).length === 0 ? (
                                <p className="text-center text-muted-foreground py-10">Nenhum limite configurado para este mês.</p>
                            ) : (
                                budgetAnalysis.filter(item => item.allocated > 0).map((item) => (
                                    <div key={item.id} className="space-y-2 group">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-muted rounded-lg">
                                                    <Target className={cn("h-4 w-4", item.spent > item.allocated ? "text-red-500" : "text-primary")} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-bold">{item.name}</p>
                                                        {item.budgetId && (
                                                            <button
                                                                onClick={() => handleOpenConfirm(item.budgetId!)}
                                                                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <p className={cn("text-[10px]", item.spent > item.allocated ? "text-red-500 font-bold" : "text-muted-foreground")}>
                                                        {item.spent > item.allocated
                                                            ? `Excedeu em ${formatTransactionAmount(item.spent - item.allocated)}`
                                                            : `Restam ${formatTransactionAmount(item.remaining)}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={cn("text-sm font-bold", item.spent > item.allocated ? "text-red-600" : "text-foreground")}>
                                                    {formatTransactionAmount(item.spent)}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground block">
                                                    de {formatTransactionAmount(item.allocated)}
                                                </span>
                                            </div>
                                        </div>
                                        <Progress
                                            value={item.percentSpent > 100 ? 100 : item.percentSpent}
                                            className="h-2"
                                        />
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button
                            id="add-budget-btn"
                            variant="outline"
                            className="w-full border-dashed py-6 text-emerald-600 border-emerald-500/30 hover:bg-emerald-50"
                            onClick={() => setActiveDialog("add-budget")}
                        >
                            <Plus className="mr-2 h-4 w-4" /> Configurar Limites
                        </Button>
                    </CardFooter>
                </Card>

                <Card className="col-span-7 md:col-span-3 border-none shadow-none md:border md:shadow-sm" id="budget-insights">
                    <CardHeader>
                        <CardTitle className="text-lg">Insights de {activeMonth}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {insights.totalBudgets > 0 ? (
                            <>
                                {insights.critical && insights.critical.spent > insights.critical.allocated && (
                                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900">
                                        <div className="flex items-center gap-3 mb-2">
                                            <AlertTriangle className="h-5 w-5 text-amber-600" />
                                            <span className="font-bold text-sm text-amber-900">Atenção em {insights.critical.name}</span>
                                        </div>
                                        <p className="text-xs text-amber-800/80">
                                            Orçamento excedido em {formatTransactionAmount(insights.critical.spent - insights.critical.allocated)}.
                                        </p>
                                    </div>
                                )}

                                {insights.saving && insights.saving.percentSpent < 80 && (
                                    <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-amber-900">
                                        <div className="flex items-center gap-3 mb-2">
                                            <TrendingUp className="h-5 w-5 text-emerald-600" />
                                            <span className="font-bold text-sm text-emerald-900">Boa Economia em {insights.saving.name}</span>
                                        </div>
                                        <p className="text-xs text-emerald-800/80">
                                            Você gastou apenas {insights.saving.percentSpent.toFixed(0)}% do planejado.
                                        </p>
                                    </div>
                                )}

                                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900">
                                    <div className="flex items-center gap-3 mb-2">
                                        <CheckCircle2 className="h-5 w-5 text-blue-600" />
                                        <span className="font-bold text-sm text-blue-900">Status Geral</span>
                                    </div>
                                    <p className="text-xs text-blue-800/80">
                                        {insights.overBudgetCount > 0
                                            ? `Você tem ${insights.overBudgetCount} categoria(s) fora do limite.`
                                            : "Parabéns! Todas as metas estão em dia."}
                                    </p>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-6 text-muted-foreground italic space-y-2">
                                <Lightbulb className="h-8 w-8 mx-auto opacity-20" />
                                <p className="text-xs text-muted-foreground">Configure metas para ver os insights.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
            <AddBudgetForm month={activeMonth} year={activeYear} />
            <ConfirmDialog
                title="Excluir Limite?"
                description="Tem certeza que deseja remover esta meta? Isso afetará os insights de economia do mês."
                confirmLabel="Sim, excluir"
                onConfirm={handleConfirmDelete}
                isLoading={deleteBudget.isPending}
                variant="destructive"
            />
        </div>
    );
};