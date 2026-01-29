"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatCard } from '@/components/dashboard/stat-card';
import { FinanceChart } from '@/components/dashboard/finance-chart';
import { ArrowDownRight, ArrowUpRight, CreditCard, DollarSign, PiggyBank, Wallet, Filter } from 'lucide-react';
import { formatTransactionAmount, useTransactions, useTransactionsByYear } from '@/hooks/useTransactions';
import { IMes } from '@/model/IMes';
import { Transaction } from "@/model/types/Transaction.ts";
import { useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip.tsx";
import { useBudgets } from "@/hooks/useBudgets";
import { Budget } from "@/model/types/Budget";
import { useCategories } from '@/hooks/useCategories';
import { TutorialWizard } from '@/components/tutorial-wizard';

export const OverviewSection = () => {
    const currentDate = new Date();
    const [selectedMonth, setSelectedMonth] = useState(IMes[currentDate.getMonth()]);
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
    const [selectedView, setSelectedView] = useState<'month' | 'year'>('month');
    const [selectedCategory, setSelectedCategory] = useState<string>("all");

    const { data: visibleCategories = [] } = useCategories();
    const { data: monthlyTransactions, isLoading: isLoadingMonthly } = useTransactions(selectedMonth, selectedYear);
    const { data: yearlyTransactions, isLoading: isLoadingYearly } = useTransactionsByYear(selectedYear);
    const { budgets, isLoading: isLoadingBudgets } = useBudgets(
        selectedView === 'month' ? IMes.indexOf(selectedMonth) + 1 : undefined,
        selectedYear
    );

    const rawTransactions = selectedView === 'month' ? monthlyTransactions : yearlyTransactions;
    const isLoading = selectedView === 'month' ? isLoadingMonthly : isLoadingYearly;

    const availableCategories = useMemo(() => {
        if (visibleCategories.length === 0) return [];
        return [...visibleCategories].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }, [visibleCategories]);

    const transactions = useMemo(() => {
        if (!rawTransactions) return [];
        if (selectedCategory === "all") return rawTransactions;
        return rawTransactions.filter(t => t.category.id === selectedCategory);
    }, [rawTransactions, selectedCategory]);

    const years = useMemo(() => {
        return Array.from({ length: 11 }, (_, i) => currentDate.getFullYear() - 5 + i);
    }, [currentDate]);

    const tutorialSteps = [
        {
            element: '#dashboard-tabs',
            title: 'Modo de Visualização',
            description: 'Alterne entre a visão detalhada do mês ou o acumulado do ano inteiro.'
        },
        {
            element: '#date-filters',
            title: 'Seleção de Período',
            description: 'Escolha o mês e ano que deseja analisar. Todos os cards serão atualizados.'
        },
        {
            element: '#category-filter',
            title: 'Filtro por Categoria',
            description: 'Filtre todas as informações do painel por uma categoria específica para uma análise detalhada.'
        },
        {
            element: '#dashboard-stats',
            title: 'Resumo Financeiro',
            description: 'Entenda seu fluxo: o que já foi pago (Gasto Real) e o que ainda está planejado (Comprometimento).'
        },
        {
            element: '#chart-section',
            title: 'Evolução Gráfica',
            description: 'Acompanhe visualmente a entrada e saída de dinheiro ao longo do tempo.'
        },
        {
            element: '#recent-transactions-card',
            title: 'Transações Recentes',
            description: 'Confira a lista das últimas movimentações baseadas nos seus filtros atuais.'
        },
        {
            element: '#budget-progress-card',
            title: 'Progresso do Orçamento',
            description: 'Controle suas metas! Veja se seus gastos reais estão dentro do planejado.'
        }
    ];

    if (isLoadingBudgets && (!budgets || budgets.length === 0)) {
        return (
            <div className="flex justify-center items-center h-48 text-muted-foreground animate-pulse">
                Carregando visão geral...
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-700 pb-10">
            <TutorialWizard tutorialKey="overview-detailed" steps={tutorialSteps} />

            <TooltipProvider>
                <Tabs
                    defaultValue="month"
                    className="space-y-4"
                    onValueChange={(value) => {
                        setSelectedView(value as 'month' | 'year');
                        setSelectedCategory("all");
                    }}
                >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <TabsList className="w-full md:w-auto" id="dashboard-tabs">
                            <TabsTrigger value="month" className="flex-1 md:flex-none">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="h-full w-full px-4 py-0">Mês</div>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-gray-800 text-white border-none">Visualizar dados por mês</TooltipContent>
                                </Tooltip>
                            </TabsTrigger>
                            <TabsTrigger value="year" className="flex-1 md:flex-none">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="h-full w-full px-4 py-0">Ano</div>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-gray-800 text-white border-none">Visualizar dados por ano</TooltipContent>
                                </Tooltip>
                            </TabsTrigger>
                        </TabsList>

                        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                            <div className="w-full md:w-[200px]" id="category-filter">
                                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                    <SelectTrigger className="w-full bg-background border-emerald-500/20">
                                        <div className="flex items-center gap-2">
                                            <Filter className="h-3 w-3 text-emerald-500" />
                                            <SelectValue placeholder="Categoria" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas Categorias</SelectItem>
                                        {availableCategories.map((cat) => (
                                            <SelectItem key={cat.id} value={cat.id!}>{cat.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex flex-row items-center gap-2" id="date-filters">
                                {selectedView === 'month' && (
                                    <div className="w-full md:w-[150px]">
                                        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
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
                                )}
                                <div className="w-full md:w-[100px]">
                                    <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(Number(value))}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Ano" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {years.map((year) => (
                                                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <TabsContent value="month" className="space-y-4 outline-none">
                        <div id="dashboard-stats">
                            <StatsGrid transactions={transactions} />
                        </div>
                        <div id="chart-section">
                            <ChartSection transactions={transactions} view={selectedView} month={selectedMonth} year={selectedYear} />
                        </div>
                    </TabsContent>

                    <TabsContent value="year" className="space-y-4 outline-none">
                        <StatsGrid transactions={transactions} />
                        <ChartSection transactions={transactions} view={selectedView} year={selectedYear} />
                    </TabsContent>
                </Tabs>
            </TooltipProvider>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <Card className="xl:col-span-2 border-none shadow-sm md:border" id="recent-transactions-card">
                    <CardHeader>
                        <CardTitle>Transações {selectedCategory !== "all" ? "Filtradas" : "Recentes"}</CardTitle>
                        <CardDescription>
                            {selectedView === 'month' ? `Movimentações de ${selectedMonth}` : `Movimentações de ${selectedYear}`}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="max-h-[320px] overflow-y-auto pr-2 scrollbar-thin">
                        <RecentTransactionsList transactions={transactions} isLoading={isLoading} />
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm md:border" id="budget-progress-card">
                    <CardHeader>
                        <CardTitle>Progresso do orçamento</CardTitle>
                        <CardDescription>Meta vs Gasto Real</CardDescription>
                    </CardHeader>
                    <CardContent className="max-h-[320px] overflow-y-auto pr-2 scrollbar-thin">
                        <BudgetProgress
                            transactions={transactions}
                            budgets={budgets}
                            filterId={selectedCategory}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

// --- COMPONENTES AUXILIARES (StatsGrid, ChartSection, RecentTransactionsList, BudgetProgress) ---
// Mantidos como no código anterior para brevidade, apenas garanta que estão presentes no arquivo.
const StatsGrid = ({ transactions }: { transactions?: Transaction[] }) => {
    if (!transactions) return null;
    const pendingTransactions = transactions.filter(t => t.status === 'PENDENTE');
    const completedTransactions = transactions.filter(t => t.status === 'PAGA' || t.status === 'RECEBIDA');

    const pendingIncome = pendingTransactions.filter(t => t.type === 'RECEITA').reduce((acc, curr) => acc + curr.amount, 0);
    const pendingExpenses = pendingTransactions.filter(t => t.type === 'DESPESA').reduce((acc, curr) => acc + curr.amount, 0);
    const realExpenses = completedTransactions.filter(t => t.type === 'DESPESA').reduce((acc, curr) => acc + curr.amount, 0);

    const balance = pendingIncome - pendingExpenses;
    const totalCommitted = realExpenses + pendingExpenses;

    return (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Balanço Previsto" value={formatTransactionAmount(balance)} description="Restante das pendências" icon={<Wallet className="h-4 w-4 text-blue-400" />} trend={balance >= 0 ? "up" : "down"} />
            <StatCard title="A Receber" value={formatTransactionAmount(pendingIncome)} description="Entradas futuras" icon={<ArrowUpRight className="h-4 w-4 text-green-400" />} trend="up" />
            <StatCard title="Gasto Real" value={formatTransactionAmount(realExpenses)} description="Já pago no período" icon={<ArrowDownRight className="h-4 w-4 text-rose-500" />} trend="down" />
            <StatCard title="Comprometimento" value={formatTransactionAmount(totalCommitted)} description="Total Realizado + Pendente" icon={<DollarSign className="h-4 w-4 text-yellow-500" />} trend="warning" />
        </div>
    );
};

const ChartSection = ({ transactions, view, month, year }: { transactions?: Transaction[]; view: 'month' | 'year'; month?: string; year: number; }) => {
    return (
        <Card className="border-none shadow-sm md:border">
            <CardHeader>
                <CardTitle>Finanças</CardTitle>
                <CardDescription>
                    {view === 'month' ? `Fluxo de caixa de ${month} de ${year}` : `Fluxo de caixa de ${year}`}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[300px]">
                    <FinanceChart transactions={transactions} view={view} month={month} year={year} />
                </div>
            </CardContent>
        </Card>
    );
};

const RecentTransactionsList = ({ transactions, isLoading }: { transactions?: Transaction[], isLoading: boolean }) => {
    if (isLoading) return <div className="py-4 text-center text-sm text-muted-foreground">Carregando...</div>;
    if (!transactions?.length) return <div className="py-4 text-center text-sm text-muted-foreground italic">Nenhuma transação visível para este filtro.</div>;

    return (
        <div className="space-y-4">
            {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between space-x-4 pb-2 border-b last:border-0 border-muted/50">
                    <div className="flex items-center space-x-3 overflow-hidden">
                        <div className={`rounded-full p-2 bg-muted shrink-0 ${transaction.status === 'PAGA' || transaction.status === 'RECEBIDA' ? 'opacity-50' : ''}`}>
                            <CreditCard className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium leading-none truncate">{transaction.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                { (transaction.status === 'PAGA' || transaction.status === 'RECEBIDA') &&
                                    <span className="text-green-600 font-bold mr-1 text-[10px]">LANÇADO</span>
                                }
                                {transaction.category.name}
                            </p>
                        </div>
                    </div>
                    <div className="text-right shrink-0">
                        <p className={`text-sm font-bold ${transaction.type === 'RECEITA' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {transaction.type === 'RECEITA' ? '+' : '-'}{formatTransactionAmount(transaction.amount)}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
};

const BudgetProgress = ({ transactions, budgets, filterId }: { transactions?: Transaction[], budgets: Budget[], filterId: string }) => {
    const analysis = useMemo(() => {
        if (!budgets || budgets.length === 0) return [];

        const consolidatedBudgets = budgets.reduce((acc, b) => {
            if (!acc[b.categoryId]) acc[b.categoryId] = { name: b.categoryName, allocated: 0 };
            acc[b.categoryId].allocated += b.amount;
            return acc;
        }, {} as Record<string, { name: string; allocated: number }>);

        const expensesMap = (transactions || []).filter(t => t.type === 'DESPESA').reduce((acc, t) => {
            acc[t.category.id] = (acc[t.category.id] || 0) + t.amount;
            return acc;
        }, {} as Record<string, number>);

        let result = Object.keys(consolidatedBudgets).map(categoryId => {
            const budgetData = consolidatedBudgets[categoryId];
            const spent = expensesMap[categoryId] || 0;
            const allocated = budgetData.allocated;
            const percent = allocated > 0 ? (spent / allocated) * 100 : 0;
            return { id: categoryId, name: budgetData.name, spent, allocated, percent: percent > 100 ? 100 : percent, isOver: spent > allocated };
        });

        if (filterId !== "all") result = result.filter(r => r.id === filterId);
        return result.sort((a, b) => b.percent - a.percent);
    }, [transactions, budgets, filterId]);

    if (!budgets || budgets.length === 0 || analysis.length === 0) return <div className="py-4 text-center text-sm text-muted-foreground italic">Sem metas visíveis para este filtro.</div>;

    return (
        <div className="space-y-6">
            {analysis.map((item) => (
                <div key={item.id} className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center space-x-2 overflow-hidden">
                            <PiggyBank className={`h-4 w-4 shrink-0 ${item.isOver ? 'text-red-500' : 'text-muted-foreground'}`} />
                            <span className="text-sm font-medium truncate">{item.name}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono">{formatTransactionAmount(item.spent)} / {formatTransactionAmount(item.allocated)}</span>
                    </div>
                    <Progress value={item.percent} className="h-2" indicatorClassName={item.isOver ? "bg-red-500" : "bg-emerald-500"} />
                </div>
            ))}
        </div>
    );
};