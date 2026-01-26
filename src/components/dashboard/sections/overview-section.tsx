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
                <div className="flex items-center justify-between">
                    <TabsList>
                        <TabsTrigger value="month">
                            <Tooltip>
                                <TooltipTrigger className="h-full">
                                    Mês
                                </TooltipTrigger>
                                <TooltipContent className="bg-gray-200 text-black">
                                    Visualizar dados por mês
                                </TooltipContent>
                            </Tooltip>
                        </TabsTrigger>
                        <TabsTrigger value="year">
                            <Tooltip>
                                <TooltipTrigger className="h-full">
                                    Ano
                                </TooltipTrigger>
                                <TooltipContent className="bg-gray-200 text-black">
                                    Visualizar dados por ano
                                </TooltipContent>
                            </Tooltip>
                        </TabsTrigger>
                    </TabsList>
                    <div className="flex gap-2">
                        {selectedView === 'month' && (
                            <Tooltip>
                                <TooltipTrigger className="h-full">
                                    <Select
                                        value={selectedMonth}
                                        onValueChange={setSelectedMonth}
                                    >
                                        <SelectTrigger className="w-[180px]">
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

                        )}
                        <Tooltip>
                            <TooltipTrigger className="h-full">
                                <Select
                                    value={selectedYear.toString()}
                                    onValueChange={(value) => setSelectedYear(Number(value))}
                                >
                                    <SelectTrigger className="w-[120px]">
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

    const income = transactions
        .filter(t => t.type === 'RECEITA')
        .reduce((acc, curr) => acc + curr.amount, 0);

    const expenses = transactions
        .filter(t => t.type === 'DESPESA')
        .reduce((acc, curr) => acc + curr.amount, 0);

    const expensesRemain = transactions
        .filter(t => t.type === 'DESPESA' && t.status === 'PENDENTE')
        .reduce((acc, curr) => acc + curr.amount, 0);

    const balance = income - expenses;

    return (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
                title="Balanço total"
                value={formatTransactionAmount(balance)}
                description="Saldo atual"
                icon={<Wallet className="h-4 w-4 text-muted-foreground text-blue-400" />}
                trend={balance >= 0 ? "up" : "down"}
            />
            <StatCard
                title="Receitas"
                value={formatTransactionAmount(income)}
                description="Total de receitas"
                icon={<ArrowUpRight className="h-4 w-4 text-muted-foreground text-green-400" />}
                trend="up"
            />
            <StatCard
                title="Despesas"
                value={formatTransactionAmount(expenses)}
                description="Total de despesas"
                icon={<ArrowDownRight className="h-4 w-4 text-muted-foreground text-red-500" />}
                trend="down"
            />
            <StatCard
                title="Despesas pendentes"
                value={formatTransactionAmount(expensesRemain)}
                description="Pendentes para pagamento"
                icon={<DollarSign className="h-4 w-4 text-muted-foreground text-yellow-500" />}
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
    if (isLoading) return <div>Carregando...</div>;
    if (!transactions?.length) return <div>Nenhuma transação encontrada.</div>;

    return (
        <div className="space-y-4">
            {transactions.slice(0, 4).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between space-x-4">
                    <div className="flex items-center space-x-4">
                        <div className="rounded-full p-2 bg-muted">
                            <CreditCard className="h-4 w-4" />
                        </div>
                        <div>
                            <p className="text-sm font-medium leading-none">{transaction.description}</p>
                            <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString()}</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="text-right">
                            <p className={`text-sm font-medium leading-none ${transaction.type === 'RECEITA' ? 'text-success' : ''}`}>
                                {formatTransactionAmount(transaction.amount)}
                            </p>
                            <p className="text-xs text-muted-foreground">{transaction.category.name}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

const BudgetProgress = ({ transactions }: { transactions?: Transaction[] }) => {
    if (!transactions?.length) return null;

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
            budget: spent * 1.2, // Define um orçamento 20% maior que o gasto atual
            percent: 83 // Valor fixo temporário, ajustar conforme necessidade
        }));

    return (
        <div className="space-y-6">
            {categories.map((category) => (
                <div key={category.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <PiggyBank className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{category.name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
              {formatTransactionAmount(category.spent)} / {formatTransactionAmount(category.budget)}
            </span>
                    </div>
                    <Progress value={category.percent} className="h-2" />
                </div>
            ))}
        </div>
    );
};