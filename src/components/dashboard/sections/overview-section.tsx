"use client"

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Progress} from '@/components/ui/progress';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {StatCard} from '@/components/dashboard/stat-card';
import {FinanceChart} from '@/components/dashboard/finance-chart';
import {ArrowDownRight, ArrowUpRight, CreditCard, DollarSign, Filter, PiggyBank, Users, Wallet} from 'lucide-react';
import {formatTransactionAmount, useTransactions, useTransactionsByYear} from '@/hooks/useTransactions';
import {IMes} from '@/model/IMes';
import {Transaction} from "@/model/types/Transaction.ts";
import {useMemo, useState} from "react";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select.tsx";
import {TooltipProvider} from "@/components/ui/tooltip.tsx";
import {useBudgets} from "@/hooks/useBudgets";
import {Budget} from "@/model/types/Budget";
import {useCategories} from '@/hooks/useCategories';
import {TutorialWizard} from '@/components/tutorial-wizard';
import {useAuth} from '@/context/AuthContext';
import {cn} from "@/lib/utils.ts";

export const OverviewSection = () => {
    const { user: currentUser } = useAuth();
    const currentDate = new Date();

    const [selectedMonth, setSelectedMonth] = useState(IMes[currentDate.getMonth()]);
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
    const [selectedView, setSelectedView] = useState<'month' | 'year'>('month');
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [selectedUser, setSelectedUser] = useState<string>("all"); // Novo filtro de usuário

    const { data: visibleCategories = [] } = useCategories();
    const { data: monthlyTransactions, isLoading: isLoadingMonthly } = useTransactions(selectedMonth, selectedYear);
    const { data: yearlyTransactions, isLoading: isLoadingYearly } = useTransactionsByYear(selectedYear);
    const { budgets, isLoading: isLoadingBudgets } = useBudgets(
        selectedView === 'month' ? IMes.indexOf(selectedMonth) + 1 : undefined,
        selectedYear
    );

    const rawTransactions = selectedView === 'month' ? monthlyTransactions : yearlyTransactions;
    const isLoading = selectedView === 'month' ? isLoadingMonthly : isLoadingYearly;

    const transactionUsers = useMemo(() => {
        if (!rawTransactions) return [];
        const usersMap = new Map();
        rawTransactions.forEach(t => {
            if (t.owner && t.owner.id !== currentUser?.id) {
                usersMap.set(t.owner.id, t.owner.name);
            }
        });
        return Array.from(usersMap.entries()).map(([id, label]) => ({ id, label }));
    }, [rawTransactions, currentUser]);

    const transactions = useMemo(() => {
        if (!rawTransactions) return [];
        return rawTransactions.filter(t => {
            const categoryMatch = selectedCategory === "all" || t.category.id === selectedCategory;
            const userMatch = selectedUser === "all" ||
                (selectedUser === "me" ? t.owner.id === currentUser?.id : t.owner.id === selectedUser);
            return categoryMatch && userMatch;
        });
    }, [rawTransactions, selectedCategory, selectedUser, currentUser]);

    const availableCategories = useMemo(() => {
        if (visibleCategories.length === 0) return [];
        return [...visibleCategories].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }, [visibleCategories]);

    const years = useMemo(() => {
        return Array.from({ length: 11 }, (_, i) => currentDate.getFullYear() - 5 + i);
    }, [currentDate]);

    const tutorialSteps = [
        { element: '#dashboard-tabs', title: 'Modo de Visão', description: 'Alterne entre a visão mensal ou o acumulado do ano.' },
        { element: '#user-filter', title: 'Filtro de Usuários', description: 'Como você tem acesso a dados compartilhados, use este filtro para ver apenas suas finanças, apenas as de um parceiro ou de ambos simultaneamente.' },
        { element: '#category-filter', title: 'Filtro por Categoria', description: 'Analise detalhadamente uma categoria específica.' },
        { element: '#dashboard-stats', title: 'Resumo Financeiro', description: 'Veja o balanço do que já foi pago e o comprometimento total.' },
        { element: '#chart-section', title: 'Evolução Gráfica', description: 'Acompanhe visualmente o fluxo de caixa.' }
    ];

    if (isLoadingBudgets && (!budgets || budgets.length === 0)) {
        return (
            <div className="flex justify-center items-center h-48 text-muted-foreground animate-pulse font-medium">
                Carregando visão geral compartilhada...
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-700 pb-10">
            <TutorialWizard tutorialKey="overview-shared-v1" steps={tutorialSteps} />

            <TooltipProvider>
                <Tabs
                    defaultValue="month"
                    className="space-y-4"
                    onValueChange={(value) => {
                        setSelectedView(value as 'month' | 'year');
                        setSelectedCategory("all");
                        setSelectedUser("all");
                    }}
                >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <TabsList className="w-full md:w-auto" id="dashboard-tabs">
                            <TabsTrigger value="month" className="flex-1 md:flex-none">Mês</TabsTrigger>
                            <TabsTrigger value="year" className="flex-1 md:flex-none">Ano</TabsTrigger>
                        </TabsList>

                        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                            {/* NOVO: FILTRO DE USUÁRIO */}
                            <div className="w-full md:w-[180px]" id="user-filter">
                                <Select value={selectedUser} onValueChange={setSelectedUser}>
                                    <SelectTrigger className="w-full bg-background border-blue-500/20">
                                        <div className="flex items-center gap-2">
                                            <Users className="h-3 w-3 text-blue-500" />
                                            <SelectValue placeholder="Usuário" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos Usuários</SelectItem>
                                        <SelectItem value="me">Apenas Eu</SelectItem>
                                        {transactionUsers.map((u) => (
                                            <SelectItem key={u.id} value={u.id}>{u.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="w-full md:w-[180px]" id="category-filter">
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

                            <div className="flex flex-row items-center gap-2 w-full md:w-auto" id="date-filters">
                                {selectedView === 'month' && (
                                    <div className="flex-1 md:w-[120px] md:flex-none">
                                        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {IMes.map((mes) => (
                                                    <SelectItem key={mes} value={mes}>{mes}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                                <div className={cn(
                                    "md:w-[90px] md:flex-none",
                                    selectedView === 'month' ? "flex-1" : "w-full"
                                )}>
                                    <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number(v))}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {years.map((y) => (
                                                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <TabsContent value="month" className="space-y-4 outline-none">
                        <StatsGrid transactions={transactions} />
                        <ChartSection transactions={transactions} view={selectedView} month={selectedMonth} year={selectedYear} />
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
                        <CardTitle>Transações {selectedUser !== "all" || selectedCategory !== "all" ? "Filtradas" : "Recentes"}</CardTitle>
                        <CardDescription>
                            Mostrando movimentações {selectedUser === "me" ? "suas" : selectedUser !== "all" ? "compartilhadas" : "gerais"}.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="max-h-[320px] overflow-y-auto pr-2 scrollbar-thin">
                        <RecentTransactionsList transactions={transactions} isLoading={isLoading} currentUserId={currentUser?.id} />
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
                            selectedUser={selectedUser}
                            currentUserId={currentUser?.id}
                        />                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

// --- COMPONENTES AUXILIARES ---

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
            <CardHeader><CardTitle className="text-lg">Fluxo de Caixa</CardTitle></CardHeader>
            <CardContent>
                <div className="h-[300px]">
                    <FinanceChart transactions={transactions} view={view} month={month} year={year} />
                </div>
            </CardContent>
        </Card>
    );
};

const RecentTransactionsList = ({ transactions, isLoading, currentUserId }: { transactions?: Transaction[], isLoading: boolean, currentUserId?: string }) => {
    if (isLoading) return <div className="py-8 text-center text-sm text-muted-foreground animate-pulse">Carregando transações...</div>;
    if (!transactions?.length) return <div className="py-12 text-center text-sm text-muted-foreground italic">Nenhuma transação encontrada.</div>;

    return (
        <div className="space-y-4">
            {transactions.map((transaction) => {
                const isShared = transaction.owner && transaction.owner.id !== currentUserId;
                return (
                    <div key={transaction.id} className="flex items-center justify-between space-x-4 pb-3 border-b last:border-0 border-muted/30 group">
                        <div className="flex items-center space-x-3 overflow-hidden">
                            <div className={cn(
                                "rounded-full p-2 shrink-0 transition-colors",
                                isShared ? "bg-blue-50 text-blue-600" : "bg-muted text-slate-600"
                            )}>
                                {isShared ? <Users className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm  text-slate-800 truncate">{transaction.description}</p>
                                    {isShared && (
                                        <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded  uppercase tracking-tighter">
                                            {transaction.owner.name.split(' ')[0]}
                                        </span>
                                    )}
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                                    { (transaction.status === 'PAGA' || transaction.status === 'RECEBIDA') &&
                                        <span className="text-emerald-600 ">●</span>
                                    }
                                    {transaction.category.name}
                                </p>
                            </div>
                        </div>
                        <div className="text-right shrink-0">
                            <p className={cn("text-sm ", transaction.type === 'RECEITA' ? 'text-emerald-600' : 'text-rose-600')}>
                                {transaction.type === 'RECEITA' ? '+' : '-'}{formatTransactionAmount(transaction.amount)}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const BudgetProgress = ({
                            transactions,
                            budgets,
                            filterId,
                            selectedUser,
                            currentUserId
                        }: {
    transactions?: Transaction[],
    budgets: Budget[],
    filterId: string,
    selectedUser: string,
    currentUserId?: string
}) => {
    const analysis = useMemo(() => {
        if (!budgets || budgets.length === 0) return [];

        const filteredBudgets = budgets.filter(b => {
            if (selectedUser === "all") return true;
            if (selectedUser === "me") return b.userId === currentUserId;
            return b.userId === selectedUser;
        });

        const consolidatedBudgets = filteredBudgets.reduce((acc, b) => {
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
            return {
                id: categoryId,
                name: budgetData.name,
                spent,
                allocated,
                percent: percent > 100 ? 100 : percent,
                isOver: spent > allocated
            };
        });

        if (filterId !== "all") result = result.filter(r => r.id === filterId);
        return result.sort((a, b) => b.percent - a.percent);
    }, [transactions, budgets, filterId, selectedUser, currentUserId]);

    if (analysis.length === 0) {
        return (
            <div className="py-12 text-center text-sm text-muted-foreground italic">
                Nenhuma meta de orçamento definida para {selectedUser === "me" ? "você" : "este filtro"}.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {analysis.map((item) => (
                <div key={item.id} className="space-y-2 text-left">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center space-x-2 overflow-hidden">
                            <PiggyBank className={cn("h-4 w-4 shrink-0", item.isOver ? 'text-red-500' : 'text-slate-400')} />
                            <span className="text-sm  text-slate-700 truncate">{item.name}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono">{formatTransactionAmount(item.spent)}</span>
                    </div>
                    <Progress value={item.percent} className="h-1.5" indicatorClassName={item.isOver ? "bg-red-500" : "bg-emerald-500"} />
                </div>
            ))}
        </div>
    );
};