import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Progress} from '@/components/ui/progress';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {StatCard} from '@/components/dashboard/stat-card';
import {FinanceChart} from '@/components/dashboard/finance-chart';
import {ArrowDownRight, ArrowUpRight, CreditCard, DollarSign, PiggyBank, Wallet} from 'lucide-react';
import {useTransactions, formatTransactionAmount, useTransactionsByYear} from '@/hooks/useTransactions';
import { IMes } from '@/model/IMes';
import {Transaction} from "@/model/types/Transaction.ts";
import {useState} from "react";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select.tsx";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip.tsx";

export const OverviewSection = () => {
    const currentDate = new Date();
    const [selectedMonth, setSelectedMonth] = useState(IMes[currentDate.getMonth()]);
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
    const [selectedView, setSelectedView] = useState<'month' | 'year'>('month');

    const {
        data: monthlyTransactions,
        isLoading: isLoadingMonthly
    } = useTransactions(selectedMonth, selectedYear);

    const {
        data: yearlyTransactions,
        isLoading: isLoadingYearly
    } = useTransactionsByYear(selectedYear);

    const transactions = selectedView === 'month' ? monthlyTransactions : yearlyTransactions;
    const isLoading = selectedView === 'month' ? isLoadingMonthly : isLoadingYearly;

    const years = Array.from(
        { length: 11 },
        (_, i) => currentDate.getFullYear() - 5 + i
    );

    const handleViewChange = (view: 'month' | 'year') => {
        setSelectedView(view);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            <Tabs
                defaultValue="month"
                className="space-y-4"
                onValueChange={(value) => handleViewChange(value as 'month' | 'year')}
            >
                {/* FILTROS RESPONSIVOS:
                    - Empilha em coluna no mobile (flex-col)
                    - Linha no desktop (md:flex-row)
                */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <TabsList className="w-full md:w-auto">
                        <TabsTrigger value="month" className="flex-1 md:flex-none">
                            <Tooltip>
                                <TooltipTrigger className="h-full w-full">Mês</TooltipTrigger>
                                <TooltipContent className="bg-gray-200 text-black">
                                    Visualizar dados por mês
                                </TooltipContent>
                            </Tooltip>
                        </TabsTrigger>
                        <TabsTrigger value="year" className="flex-1 md:flex-none">
                            <Tooltip>
                                <TooltipTrigger className="h-full w-full">Ano</TooltipTrigger>
                                <TooltipContent className="bg-gray-200 text-black">
                                    Visualizar dados por ano
                                </TooltipContent>
                            </Tooltip>
                        </TabsTrigger>
                    </TabsList>

                    {/* SELETORES RESPONSIVOS:
                        - Ocupam largura total no mobile (w-full)
                        - Ficam um ao lado do outro a partir de telas pequenas (sm:flex-row)
                    */}
                    <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                        {selectedView === 'month' && (
                            <div className="w-full md:w-[180px]">
                                <Tooltip>
                                    <TooltipTrigger className="w-full">
                                        <Select
                                            value={selectedMonth}
                                            onValueChange={setSelectedMonth}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Selecione o mês" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {IMes.map((mes, index) => (
                                                    <SelectItem key={index} value={mes}>
                                                        {mes}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-gray-200 text-black">
                                        Selecionar mês de visualização
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        )}
                        <div className="w-full md:w-[120px]">
                            <Tooltip>
                                <TooltipTrigger className="w-full">
                                    <Select
                                        value={selectedYear.toString()}
                                        onValueChange={(value) => setSelectedYear(Number(value))}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Ano" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {years.map((year) => (
                                                <SelectItem key={year} value={year.toString()}>
                                                    {year}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </TooltipTrigger>
                                <TooltipContent className="bg-gray-200 text-black">
                                    Selecionar ano de visualização
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    </div>
                </div>

                <TabsContent value="month" className="space-y-4">
                    <StatsGrid transactions={transactions} />
                    <ChartSection
                        transactions={transactions}
                        view={selectedView}
                        month={selectedMonth}
                        year={selectedYear}
                    />
                </TabsContent>

                <TabsContent value="year" className="space-y-4">
                    <StatsGrid transactions={transactions} />
                    <ChartSection
                        transactions={transactions}
                        view={selectedView}
                        year={selectedYear}
                    />
                </TabsContent>
            </Tabs>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <Card className="xl:col-span-2">
                    <CardHeader>
                        <CardTitle>Transações recentes</CardTitle>
                        <CardDescription>
                            {selectedView === 'month'
                                ? `Transações de ${selectedMonth} de ${selectedYear}`
                                : `Transações de ${selectedYear}`}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <RecentTransactionsList
                            transactions={transactions}
                            isLoading={isLoading}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Progresso do orçamento</CardTitle>
                        <CardDescription>
                            {selectedView === 'month'
                                ? `Status do orçamento em ${selectedMonth}`
                                : `Status do orçamento em ${selectedYear}`}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <BudgetProgress transactions={transactions} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

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
    const expensesRemain = expenses;

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
                value={formatTransactionAmount(expensesRemain)}
                description="Saídas futuras"
                icon={<DollarSign className="h-4 w-4 text-yellow-500" />}
                trend="warning"
            />
        </div>
    );
};

const ChartSection = ({
                          transactions,
                          view,
                          month,
                          year
                      }: {
    transactions?: Transaction[];
    view: 'month' | 'year';
    month?: string;
    year: number;
}) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Finanças</CardTitle>
                <CardDescription>
                    {view === 'month'
                        ? `Fluxo de caixa de ${month} de ${year}`
                        : `Fluxo de caixa de ${year}`}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[300px]">
                    <FinanceChart
                        transactions={transactions}
                        view={view}
                        month={month}
                        year={year}
                    />
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
            {transactions.slice(0, 4).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between space-x-4">
                    <div className="flex items-center space-x-3 overflow-hidden">
                        <div className={`rounded-full p-2 bg-muted shrink-0 ${transaction.status === 'PAGA' || transaction.status === 'RECEBIDA' ? 'opacity-50' : ''}`}>
                            <CreditCard className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium leading-none truncate">{transaction.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                { (transaction.status === 'PAGA' || transaction.status === 'RECEBIDA') &&
                                    <span className="text-green-600 font-bold mr-1">Pago</span>
                                }
                                {transaction.category.name}
                            </p>
                        </div>
                    </div>
                    <div className="text-right shrink-0">
                        <p className={`text-sm font-medium ${transaction.type === 'RECEITA' ? 'text-green-600' : 'text-red-600'}`}>
                            {transaction.type === 'RECEITA' ? '+' : '-'}{formatTransactionAmount(transaction.amount)}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
};

const BudgetProgress = ({ transactions }: { transactions?: Transaction[] }) => {
    if (!transactions?.length) return <div className="py-4 text-center text-sm text-muted-foreground">Sem dados de orçamento.</div>;

    const categoryExpenses = transactions
        .filter(t => t.type === 'DESPESA')
        .reduce((acc, curr) => {
            const category = curr.category.name;
            acc[category] = (acc[category] || 0) + curr.amount;
            return acc;
        }, {} as Record<string, number>);

    const categories = Object.entries(categoryExpenses)
        .slice(0, 4)
        .map(([name, spent]) => ({
            name,
            spent,
            budget: spent * 1.2,
            percent: 83
        }));

    return (
        <div className="space-y-6">
            {categories.map((category) => (
                <div key={category.name} className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center space-x-2 overflow-hidden">
                            <PiggyBank className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-sm font-medium truncate">{category.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                             {formatTransactionAmount(category.spent)}
                        </span>
                    </div>
                    <Progress value={category.percent} className="h-2" />
                </div>
            ))}
        </div>
    );
};