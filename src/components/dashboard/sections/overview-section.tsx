"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatCard } from '@/components/dashboard/stat-card';
import { FinanceChart } from '@/components/dashboard/finance-chart';
import { ArrowDownRight, ArrowUpRight, CreditCard, DollarSign, PiggyBank, Wallet } from 'lucide-react';
import { formatTransactionAmount, useTransactions, useTransactionsByYear } from '@/hooks/useTransactions';
import { IMes } from '@/model/IMes';
import { Transaction } from "@/model/types/Transaction.ts";
import { useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip.tsx";
import { useBudgets } from "@/hooks/useBudgets";
import { Budget } from "@/model/types/Budget";

export const OverviewSection = () => {
    const currentDate = new Date();
    const [selectedMonth, setSelectedMonth] = useState(IMes[currentDate.getMonth()]);
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
    const [selectedView, setSelectedView] = useState<'month' | 'year'>('month');

    const { data: monthlyTransactions, isLoading: isLoadingMonthly } = useTransactions(selectedMonth, selectedYear);
    const { data: yearlyTransactions, isLoading: isLoadingYearly } = useTransactionsByYear(selectedYear);

    const { budgets, isLoading: isLoadingBudgets } = useBudgets(
        selectedView === 'month' ? IMes.indexOf(selectedMonth) + 1 : undefined,
        selectedYear
    );

    const transactions = selectedView === 'month' ? monthlyTransactions : yearlyTransactions;
    const isLoading = selectedView === 'month' ? isLoadingMonthly : isLoadingYearly;

    const years = useMemo(() => {
        return Array.from({ length: 11 }, (_, i) => currentDate.getFullYear() - 5 + i);
    }, [currentDate]);

    if (isLoadingBudgets && (!budgets || budgets.length === 0)) {
        return (
            <div className="flex justify-center items-center h-48 text-muted-foreground animate-pulse">
                Carregando visão geral...
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            <Tabs
                defaultValue="month"
                className="space-y-4"
                onValueChange={(value) => setSelectedView(value as 'month' | 'year')}
            >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <TabsList className="w-full md:w-auto">
                        <TabsTrigger value="month" className="flex-1 md:flex-none">
                            <Tooltip>
                                <TooltipTrigger className="h-full w-full">Mês</TooltipTrigger>
                                <TooltipContent className="bg-gray-200 text-black">Visualizar dados por mês</TooltipContent>
                            </Tooltip>
                        </TabsTrigger>
                        <TabsTrigger value="year" className="flex-1 md:flex-none">
                            <Tooltip>
                                <TooltipTrigger className="h-full w-full">Ano</TooltipTrigger>
                                <TooltipContent className="bg-gray-200 text-black">Visualizar dados por ano</TooltipContent>
                            </Tooltip>
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                        {selectedView === 'month' && (
                            <div className="w-full md:w-[180px]">
                                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Selecione o mês" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {IMes.map((mes, index) => (
                                            <SelectItem key={index} value={mes}>{mes}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="w-full md:w-[120px]">
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

                <TabsContent value="month" className="space-y-4">
                    <StatsGrid transactions={transactions} />
                    <ChartSection transactions={transactions} view={selectedView} month={selectedMonth} year={selectedYear} />
                </TabsContent>

                <TabsContent value="year" className="space-y-4">
                    <StatsGrid transactions={transactions} />
                    <ChartSection transactions={transactions} view={selectedView} year={selectedYear} />
                </TabsContent>
            </Tabs>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <Card className="xl:col-span-2">
                    <CardHeader>
                        <CardTitle>Transações recentes</CardTitle>
                        <CardDescription>
                            {selectedView === 'month' ? `Últimas movimentações de ${selectedMonth}` : `Movimentações de ${selectedYear}`}
                        </CardDescription>
                    </CardHeader>
                    {/* MAX-HEIGHT APLICADO AQUI */}
                    <CardContent className="max-h-[320px] overflow-y-auto pr-2 scrollbar-thin">
                        <RecentTransactionsList transactions={transactions} isLoading={isLoading} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Progresso do orçamento</CardTitle>
                        <CardDescription>Meta vs Gasto Real</CardDescription>
                    </CardHeader>
                    {/* MAX-HEIGHT APLICADO AQUI */}
                    <CardContent className="max-h-[320px] overflow-y-auto pr-2 scrollbar-thin">
                        <BudgetProgress transactions={transactions} budgets={budgets} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

// --- COMPONENTES AUXILIARES ---

const StatsGrid = ({ transactions }: { transactions?: Transaction[] }) => {
    if (!transactions) return null;

    const pendingTransactions = transactions.filter(t => t.status === 'PENDENTE');

    const income = pendingTransactions
        .filter(t => t.type === 'RECEITA')
        .reduce((acc, curr) => acc + curr.amount, 0);

    const expenses = pendingTransactions
        .filter(t => t.type === 'DESPESA')
        .reduce((acc, curr) => acc + curr.amount, 0);

    const balance = income - expenses;

    return (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
                title="Balanço Previsto"
                value={formatTransactionAmount(balance)}
                description="Saldo das pendências"
                icon={<Wallet className="h-4 w-4 text-blue-400" />}
                trend={balance >= 0 ? "up" : "down"}
            />
            <StatCard
                title="A Receber"
                value={formatTransactionAmount(income)}
                description="Receitas pendentes"
                icon={<ArrowUpRight className="h-4 w-4 text-green-400" />}
                trend="up"
            />
            <StatCard
                title="A Pagar"
                value={formatTransactionAmount(expenses)}
                description="Despesas pendentes"
                icon={<ArrowDownRight className="h-4 w-4 text-red-500" />}
                trend="down"
            />
            <StatCard
                title="Total Pendente"
                value={formatTransactionAmount(expenses)}
                description="Saídas futuras"
                icon={<DollarSign className="h-4 w-4 text-yellow-500" />}
                trend="warning"
            />
        </div>
    );
};

const ChartSection = ({ transactions, view, month, year }: { transactions?: Transaction[]; view: 'month' | 'year'; month?: string; year: number; }) => {
    return (
        <Card>
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
    if (!transactions?.length) return <div className="py-4 text-center text-sm text-muted-foreground">Nenhuma transação encontrada.</div>;

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
                                    <span className="text-green-600 font-bold mr-1 text-[10px]">LANCADO</span>
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

const BudgetProgress = ({ transactions, budgets }: { transactions?: Transaction[], budgets: Budget[] }) => {
    const analysis = useMemo(() => {
        if (!budgets || budgets.length === 0) return [];

        const consolidatedBudgets = budgets.reduce((acc, b) => {
            if (!acc[b.categoryId]) {
                acc[b.categoryId] = { name: b.categoryName, allocated: 0 };
            }
            acc[b.categoryId].allocated += b.amount;
            return acc;
        }, {} as Record<string, { name: string; allocated: number }>);

        const expensesMap = (transactions || [])
            .filter(t => t.type === 'DESPESA')
            .reduce((acc, t) => {
                acc[t.category.id] = (acc[t.category.id] || 0) + t.amount;
                return acc;
            }, {} as Record<string, number>);

        return Object.keys(consolidatedBudgets).map(categoryId => {
            const budgetData = consolidatedBudgets[categoryId];
            const spent = expensesMap[categoryId] || 0;
            const allocated = budgetData.allocated;
            const percent = allocated > 0 ? (spent / allocated) * 100 : 0;

            return {
                name: budgetData.name,
                spent,
                allocated,
                percent: percent > 100 ? 100 : percent,
                isOver: spent > allocated
            };
        }).sort((a, b) => b.percent - a.percent);
    }, [transactions, budgets]);

    if (!budgets || budgets.length === 0) {
        return <div className="py-4 text-center text-sm text-muted-foreground">Sem metas de orçamento para este período.</div>;
    }

    return (
        <div className="space-y-6">
            {analysis.map((item) => (
                <div key={item.name} className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center space-x-2 overflow-hidden">
                            <PiggyBank className={`h-4 w-4 shrink-0 ${item.isOver ? 'text-red-500' : 'text-muted-foreground'}`} />
                            <span className="text-sm font-medium truncate">{item.name}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                             {formatTransactionAmount(item.spent)} / {formatTransactionAmount(item.allocated)}
                        </span>
                    </div>
                    <Progress value={item.percent} className="h-2" indicatorClassName={item.isOver ? "bg-red-500" : "bg-emerald-500"} />
                </div>
            ))}
        </div>
    );
};