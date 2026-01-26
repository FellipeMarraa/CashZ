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
                    {/* Aqui passamos as transações, e o StatsGrid filtra as pendentes */}
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
                        {/* A lista de recentes continua mostrando TUDO (pago e não pago) para histórico */}
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

// --- COMPONENTE ALTERADO ---
const StatsGrid = ({ transactions }: { transactions?: Transaction[] }) => {
    if (!transactions) return null;

    // REGRA APLICADA: Filtra apenas o que é PENDENTE.
    // Se está PAGA ou RECEBIDA, não entra na conta do balanço deste painel.
    const pendingTransactions = transactions.filter(t => t.status === 'PENDENTE');

    const income = pendingTransactions
        .filter(t => t.type === 'RECEITA')
        .reduce((acc, curr) => acc + curr.amount, 0);

    const expenses = pendingTransactions
        .filter(t => t.type === 'DESPESA')
        .reduce((acc, curr) => acc + curr.amount, 0);

    // O balanço agora reflete: (Receita Pendente) - (Despesa Pendente)
    const balance = income - expenses;

    // Para o card de "Despesas Pendentes", usamos o valor calculado acima
    // (que já é somente pendente)
    const expensesRemain = expenses;

    return (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
                title="Balanço Previsto" // Ajustei o título para refletir melhor que é uma previsão do pendente
                value={formatTransactionAmount(balance)}
                description="Saldo das pendências"
                icon={<Wallet className="h-4 w-4 text-muted-foreground text-blue-400" />}
                trend={balance >= 0 ? "up" : "down"}
            />
            <StatCard
                title="A Receber"
                value={formatTransactionAmount(income)}
                description="Receitas pendentes"
                icon={<ArrowUpRight className="h-4 w-4 text-muted-foreground text-green-400" />}
                trend="up"
            />
            <StatCard
                title="A Pagar"
                value={formatTransactionAmount(expenses)}
                description="Despesas pendentes"
                icon={<ArrowDownRight className="h-4 w-4 text-muted-foreground text-red-500" />}
                trend="down"
            />
            {/* Nota: O card "Despesas Pendentes" agora exibe o mesmo valor que "A Pagar".
               Você pode querer manter para consistência visual ou remover se achar redundante.
               Mantive para não quebrar seu layout.
            */}
            <StatCard
                title="Total Pendente"
                value={formatTransactionAmount(expensesRemain)}
                description="Saídas futuras"
                icon={<DollarSign className="h-4 w-4 text-muted-foreground text-yellow-500" />}
                trend="warning"
            />
        </div>
    );
};

// --- RESTANTE DOS COMPONENTES (Mantidos iguais, apenas ajustando imports se necessário) ---

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

    // A lista de recentes continua mostrando TUDO para histórico
    return (
        <div className="space-y-4">
            {transactions.slice(0, 4).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between space-x-4">
                    <div className="flex items-center space-x-4">
                        <div className={`rounded-full p-2 bg-muted ${transaction.status === 'PAGA' || transaction.status === 'RECEBIDA' ? 'opacity-50' : ''}`}>
                            <CreditCard className="h-4 w-4" />
                        </div>
                        <div>
                            <p className="text-sm font-medium leading-none">{transaction.description}</p>
                            <p className="text-sm text-muted-foreground">
                                {transaction.date ? new Date(transaction.date).toLocaleDateString() : new Date().toLocaleDateString()}
                                { (transaction.status === 'PAGA' || transaction.status === 'RECEBIDA') &&
                                    <span className="ml-2 text-xs text-green-600 font-bold">(Pago)</span>
                                }
                            </p>
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

    // Nota: O Budget geralmente contabiliza o GASTO total (pago ou não).
    // Se quiseres que o Budget também ignore o que já foi pago (mostrando "quanto ainda falta pagar do orçamento"),
    // adiciona .filter(t => t.status === 'PENDENTE') aqui também.
    // Por padrão de orçamentos, mantivemos o total.
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