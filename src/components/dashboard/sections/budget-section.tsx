"use client"

import {useMemo, useState} from 'react';
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from '@/components/ui/card';
import {Progress} from '@/components/ui/progress';
import {Button} from '@/components/ui/button';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {AlertTriangle, CheckCircle2, Lightbulb, Plus, Target, Trash2, TrendingUp, Users, Lock} from 'lucide-react';
import {IMes} from "@/model/IMes.ts";
import {formatTransactionAmount, useTransactions} from '@/hooks/useTransactions';
import {useCategories} from '@/hooks/useCategories';
import {cn} from "@/lib/utils";
import {useBudgets} from "@/hooks/useBudgets.ts";
import {useDialogManager} from "@/context/DialogManagerContext.tsx";
import {AddBudgetForm} from "@/components/add-budget-form.tsx";
import {ConfirmDialog} from "@/components/confirm-dialog.tsx";
import {TutorialWizard} from "@/components/tutorial-wizard";
import {useAuth} from "@/context/AuthContext";
import {useUserPreferences} from "@/hooks/useUserPreferences.ts";
import {UpgradePlanModal} from "@/components/upgrade-plan-modal.tsx";

export const BudgetSection = () => {
    const { user: currentUser } = useAuth();
    const { isPremium } = useUserPreferences(currentUser?.id);
    const currentDate = new Date();
    const [activeMonth, setActiveMonth] = useState(IMes[currentDate.getMonth()]);
    const [activeYear, setActiveYear] = useState(currentDate.getFullYear());
    const [selectedUser, setSelectedUser] = useState<string>("all");

    const { activeDialog, setActiveDialog } = useDialogManager();
    const { budgets, deleteBudget } = useBudgets(IMes.indexOf(activeMonth) + 1, activeYear);
    const { data: transactions = [] } = useTransactions(activeMonth, activeYear);
    const { data: categories = [] } = useCategories();

    const [idToDelete, setIdToDelete] = useState<string | null>(null);

    const budgetUsers = useMemo(() => {
        const usersMap = new Map();
        budgets.forEach(b => {
            if (b.userId !== currentUser?.id) {
                usersMap.set(b.userId, "Parceiro");
            }
        });
        return Array.from(usersMap.entries()).map(([id, label]) => ({ id, label }));
    }, [budgets, currentUser]);

    const budgetAnalysis = useMemo(() => {
        return categories.map(category => {
            const spent = transactions
                .filter(t => t.category.id === category.id && t.type === 'DESPESA' &&
                    (!isPremium || selectedUser === "all" || (selectedUser === "me" ? t.owner.id === currentUser?.id : t.owner.id === selectedUser)))
                .reduce((acc, t) => acc + Number(t.amount || 0), 0);

            const relevantBudgets = budgets.filter(b =>
                b.categoryId === category.id &&
                (!isPremium || selectedUser === "all" || (selectedUser === "me" ? b.userId === currentUser?.id : b.userId === selectedUser))
            );

            const allocated = relevantBudgets.reduce((acc, b) => acc + Number(b.amount || 0), 0);
            const budgetId = relevantBudgets.length > 0 ? relevantBudgets[0].id : null;
            const isSharedBudget = relevantBudgets.some(b => b.userId !== currentUser?.id);

            const percentSpent = allocated > 0 ? (spent / allocated) * 100 : 0;
            const remaining = allocated - spent;

            return { ...category, allocated, spent, percentSpent, remaining, budgetId, isSharedBudget };
        })
            .filter(item => item.allocated > 0)
            .sort((a, b) => b.percentSpent - a.percentSpent);
    }, [categories, transactions, budgets, selectedUser, currentUser, isPremium]);

    const totalAllocated = useMemo(() =>
            budgetAnalysis.reduce((sum, item) => sum + item.allocated, 0),
        [budgetAnalysis]);

    const totalSpent = useMemo(() =>
            budgetAnalysis.reduce((sum, item) => sum + item.spent, 0),
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

    return (
        <div className="space-y-6 animate-in fade-in duration-700 pb-10">
            <TutorialWizard tutorialKey="budget-management" steps={[]} />

            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="text-left">
                        <h2 className="text-2xl font-bold tracking-tight">Gestão de Orçamentos</h2>
                        <p className="text-sm text-muted-foreground">Controle seus limites de gastos reais.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
                        {isPremium && (
                            <Select value={selectedUser} onValueChange={setSelectedUser}>
                                <SelectTrigger className="w-full sm:w-[180px] border-blue-500/20">
                                    <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4 text-blue-500" />
                                        <SelectValue placeholder="Usuário" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos Usuários</SelectItem>
                                    <SelectItem value="me">Apenas Eu</SelectItem>
                                    {budgetUsers.map(u => (
                                        <SelectItem key={u.id} value={u.id}>{u.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        <div className="flex flex-row items-center gap-2 w-full sm:w-auto">
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
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                <Card className="border-none shadow-sm md:border text-left">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs uppercase font-bold text-muted-foreground">Total Planejado</CardDescription>
                        <CardTitle className="text-2xl font-bold">{formatTransactionAmount(totalAllocated)}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-sm md:border text-left">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs uppercase font-bold text-muted-foreground">Total Gasto Real</CardDescription>
                        <CardTitle className="text-2xl font-bold">{formatTransactionAmount(totalSpent)}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className={cn(
                    "border-none shadow-sm md:border transition-colors text-left",
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
                <Card className="col-span-7 md:col-span-4 border-none shadow-none md:border md:shadow-sm text-left">
                    <CardHeader>
                        <CardTitle className="text-lg">Progresso por Categoria</CardTitle>
                        <CardDescription>Baseado em suas despesas de {activeMonth}.</CardDescription>
                    </CardHeader>
                    <CardContent className="px-4 md:px-6">
                        <div className="space-y-7">
                            {budgetAnalysis.length === 0 ? (
                                <p className="text-center text-muted-foreground py-10">Nenhum limite configurado para este mês.</p>
                            ) : (
                                budgetAnalysis.map((item) => (
                                    <div key={item.id} className={cn(
                                        "space-y-2 group p-2 rounded-lg transition-colors border-l-4",
                                        item.isSharedBudget ? "border-l-blue-400 bg-blue-50/10" : "border-l-emerald-400 bg-emerald-50/10"
                                    )}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-muted rounded-lg">
                                                    <Target className={cn("h-4 w-4", item.spent > item.allocated ? "text-red-500" : "text-primary")} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-bold">{item.name}</p>
                                                        {item.isSharedBudget && <Users className="h-3 w-3 text-blue-500" />}
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
                            variant="outline"
                            className="w-full border-dashed py-6 text-emerald-600 border-emerald-500/30 hover:bg-emerald-50"
                            onClick={() => setActiveDialog("add-budget")}
                        >
                            {!isPremium && <Lock className="h-3 w-3 mr-2" />}
                            <Plus className="mr-2 h-4 w-4" /> Configurar Limites
                        </Button>
                    </CardFooter>
                </Card>

                <Card className="col-span-7 md:col-span-3 border-none shadow-none md:border md:shadow-sm text-left">
                    <CardHeader>
                        <CardTitle className="text-lg">Insights de {activeMonth}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {insights.totalBudgets > 0 ? (
                            <>
                                {insights.critical && insights.critical.spent > insights.critical.allocated && (
                                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
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
                                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                                        <div className="flex items-center gap-3 mb-2">
                                            <TrendingUp className="h-5 w-5 text-emerald-600" />
                                            <span className="font-bold text-sm text-emerald-900">Boa Economia em {insights.saving.name}</span>
                                        </div>
                                        <p className="text-xs text-emerald-800/80">
                                            Você gastou apenas {insights.saving.percentSpent.toFixed(0)}% do planejado.
                                        </p>
                                    </div>
                                )}

                                <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
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

            {activeDialog === "add-budget" && <AddBudgetForm month={activeMonth} year={activeYear} />}
            {activeDialog === "upgrade-plan" && <UpgradePlanModal isOpen={true} onClose={() => setActiveDialog(null)} />}

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