"use client"

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Progress} from '@/components/ui/progress';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {StatCard} from '@/components/dashboard/stat-card';
import {FinanceChart} from '@/components/dashboard/finance-chart';
import {ArrowDownRight, ArrowUpRight, CreditCard, DollarSign, Filter, PiggyBank, Users, Wallet, Lock} from 'lucide-react';
import {formatTransactionAmount, useTransactions, useTransactionsByYear} from '@/hooks/useTransactions';
import {IMes} from '@/model/IMes';
import {Transaction} from "@/model/types/Transaction.ts";
import {useEffect, useMemo, useState} from "react";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select.tsx";
import {TooltipProvider} from "@/components/ui/tooltip.tsx";
import {useBudgets} from "@/hooks/useBudgets";
import {Budget} from "@/model/types/Budget";
import {useCategories} from '@/hooks/useCategories';
import {TutorialWizard} from '@/components/tutorial-wizard';
import {useAuth} from '@/context/AuthContext';
import {useUserPreferences} from "@/hooks/useUserPreferences.ts";
import {cn} from "@/lib/utils.ts";
import {UpgradePlanModal} from "@/components/upgrade-plan-modal.tsx";
import {useDialogManager} from "@/context/DialogManagerContext";
import {toast} from "@/hooks/use-toast.ts";
import {ReferralAnnouncementModal} from "@/components/referral-announcement-modal.tsx";

export const OverviewSection = () => {
    const { user: currentUser } = useAuth();
    const { isPremium } = useUserPreferences(currentUser?.id);
    const { activeDialog, setActiveDialog } = useDialogManager();
    const currentDate = new Date();

    const [selectedMonth, setSelectedMonth] = useState(IMes[currentDate.getMonth()]);
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
    const [selectedView, setSelectedView] = useState<'month' | 'year'>('month');
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [selectedUser, setSelectedUser] = useState<string>("all");

    const { data: visibleCategories = [] } = useCategories();
    const { data: monthlyTransactions, isLoading: isLoadingMonthly } = useTransactions(selectedMonth, selectedYear);
    const { data: yearlyTransactions, isLoading: isLoadingYearly } = useTransactionsByYear(selectedYear);
    const { budgets, isLoading: isLoadingBudgets } = useBudgets(
        selectedView === 'month' ? IMes.indexOf(selectedMonth) + 1 : undefined,
        selectedYear
    );

    const rawTransactions = selectedView === 'month' ? monthlyTransactions : yearlyTransactions;
    const isLoading = selectedView === 'month' ? isLoadingMonthly : isLoadingYearly;

    // --- PASSOS DO TUTORIAL REVISADOS (MAIS DIDÁTICOS) ---
    const overviewSteps = useMemo(() => [
        {
            element: "#overview-filters",
            title: "Personalize sua visão",
            description: "Escolha o mês, o ano ou filtre por categorias específicas para entender para onde seu dinheiro está indo.",
            side: "bottom" as const
        },
        {
            element: "#overview-stats",
            title: "Resumo do seu dinheiro",
            description: "Aqui você vê o que já pagou (Gasto Real), o que ainda tem para receber e o total comprometido no mês.",
            side: "top" as const
        },
        {
            element: "#overview-chart",
            title: "Evolução do seu bolso",
            description: "Este gráfico mostra o equilíbrio entre o que entra e o que sai. O objetivo é manter o saldo sempre positivo!",
            side: "top" as const
        },
        {
            element: "#overview-transactions",
            title: "Histórico detalhado",
            description: "Confira aqui as suas últimas movimentações. É uma ótima forma de revisar gastos rápidos do dia a dia.",
            side: "top" as const
        },
        {
            element: "#overview-budgets",
            title: "Suas metas de economia",
            description: "Definimos limites para cada categoria. A barra mostra o quanto você já usou da meta que planejou gastar.",
            side: "left" as const
        }
    ], []);

    useEffect(() => {
        const hasSeenPersistent = localStorage.getItem("cashz_referral_announcement_seen");
        const hasSeenInSession = sessionStorage.getItem("cashz_referral_opened_session");

        if (!hasSeenPersistent && !hasSeenInSession && !activeDialog) {
            const timer = setTimeout(() => {
                setActiveDialog("referral-announcement");
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [activeDialog, setActiveDialog]);

    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const status = queryParams.get('status');

        if (status === 'success') {
            toast({
                title: "Assinatura Ativada! ✨",
                description: "Seja bem-vindo ao CashZ Premium. Seus recursos já estão sendo liberados.",
                variant: "success",
            });

            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
        }

        if (status === 'error') {
            toast({
                title: "Pagamento não concluído",
                description: "Houve um problema com a transação. Tente novamente ou mude o método de pagamento.",
                variant: "destructive",
            });
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [toast]);
    const transactionUsers = useMemo(() => {
        if (!rawTransactions || !isPremium) return [];
        const usersMap = new Map();
        rawTransactions.forEach(t => {
            if (t.owner && t.owner.id !== currentUser?.id) {
                usersMap.set(t.owner.id, t.owner.name);
            }
        });
        return Array.from(usersMap.entries()).map(([id, label]) => ({ id, label }));
    }, [rawTransactions, currentUser, isPremium]);

    const transactions = useMemo(() => {
        if (!rawTransactions) return [];
        return rawTransactions.filter(t => {
            const categoryMatch = selectedCategory === "all" || t.category.id === selectedCategory;
            const userMatch = !isPremium
                ? t.owner.id === currentUser?.id
                : (selectedUser === "all" || (selectedUser === "me" ? t.owner.id === currentUser?.id : t.owner.id === selectedUser));
            return categoryMatch && userMatch;
        });
    }, [rawTransactions, selectedCategory, selectedUser, currentUser, isPremium]);

    const availableCategories = useMemo(() => {
        if (visibleCategories.length === 0) return [];
        return [...visibleCategories].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }, [visibleCategories]);

    const years = useMemo(() => {
        return Array.from({ length: 11 }, (_, i) => currentDate.getFullYear() - 5 + i);
    }, [currentDate]);

    if (isLoadingBudgets && (!budgets || budgets.length === 0)) {
        return (
            <div className="flex justify-center items-center h-48 text-muted-foreground animate-pulse font-medium">
                Carregando visão geral...
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-700 pb-10 text-left">
            <TutorialWizard tutorialKey="overview-didactic-v2" steps={overviewSteps} />

            <TooltipProvider>
                <Tabs
                    value={selectedView}
                    className="space-y-4"
                    onValueChange={(value) => {
                        setSelectedView(value as 'month' | 'year');
                        setSelectedCategory("all");
                        setSelectedUser("all");
                    }}
                >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <TabsList className="w-full md:w-auto">
                            <TabsTrigger value="month" className="flex-1 md:flex-none">Mês</TabsTrigger>
                            <TabsTrigger value="year" className="flex-1 md:flex-none">Ano</TabsTrigger>
                        </TabsList>

                        <div id="overview-filters" className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                            {/* FILTRO DE USUÁRIO */}
                            <div className="w-full md:w-[180px]">
                                <Select
                                    value={isPremium ? selectedUser : "me"}
                                    onValueChange={(val) => {
                                        if (!isPremium && val !== "me") {
                                            setActiveDialog("upgrade-plan");
                                            return;
                                        }
                                        setSelectedUser(val);
                                    }}
                                >
                                    <SelectTrigger className={cn(
                                        "w-full bg-background",
                                        !isPremium ? "border-amber-500/20 opacity-80" : "border-blue-500/20"
                                    )}>
                                        <div className="flex items-center gap-2">
                                            {isPremium ? (
                                                <Users className="h-3 w-3 text-blue-500" />
                                            ) : (
                                                <Lock className="h-3 w-3 text-amber-500" />
                                            )}
                                            <SelectValue placeholder="Usuário" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="me">Apenas Eu</SelectItem>
                                        <SelectItem value="all" className={cn(!isPremium && "text-muted-foreground opacity-50")}>
                                            <div className="flex items-center gap-2">
                                                Todos Usuários {!isPremium && <Lock className="h-3 w-3" />}
                                            </div>
                                        </SelectItem>
                                        {transactionUsers.map((u) => (
                                            <SelectItem key={u.id} value={u.id}>{u.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="w-full md:w-[180px]">
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

                            <div className="flex flex-row items-center gap-2 w-full md:w-auto">
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
                        <div id="overview-stats"><StatsGrid transactions={transactions} /></div>
                        <div id="overview-chart"><ChartSection transactions={transactions} view={selectedView} month={selectedMonth} year={selectedYear} /></div>
                    </TabsContent>

                    <TabsContent value="year" className="space-y-4 outline-none">
                        <div id="overview-stats-year"><StatsGrid transactions={transactions} /></div>
                        <div id="overview-chart-year"><ChartSection transactions={transactions} view={selectedView} year={selectedYear} /></div>
                    </TabsContent>
                </Tabs>
            </TooltipProvider>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <Card id="overview-transactions" className="xl:col-span-2 border-none shadow-sm md:border">
                    <CardHeader>
                        <CardTitle>Transações {selectedUser !== "all" || selectedCategory !== "all" ? "Filtradas" : "Recentes"}</CardTitle>
                        <CardDescription>
                            {isPremium ? "Movimentações da conta selecionada." : "Suas movimentações pessoais recentes."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="max-h-[320px] overflow-y-auto pr-2 scrollbar-thin">
                        <RecentTransactionsList transactions={transactions} isLoading={isLoading} currentUserId={currentUser?.id} />
                    </CardContent>
                </Card>

                <Card id="overview-budgets" className="border-none shadow-sm md:border text-left">
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
                            isPremium={isPremium}
                        />
                    </CardContent>
                </Card>
            </div>

            {activeDialog === "upgrade-plan" && (
                <UpgradePlanModal isOpen={true} onClose={() => setActiveDialog(null)} />
            )}
            {activeDialog === "referral-announcement" && (
                <ReferralAnnouncementModal isOpen={true} onClose={() => setActiveDialog(null)} />
            )}
        </div>
    );
};

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
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 text-left">
            <StatCard title="Balanço Previsto" value={formatTransactionAmount(balance)} description="Restante das pendências" icon={<Wallet className="h-4 w-4 text-blue-400" />} trend={balance >= 0 ? "up" : "down"} />
            <StatCard title="A Receber" value={formatTransactionAmount(pendingIncome)} description="Entradas futuras" icon={<ArrowUpRight className="h-4 w-4 text-green-400" />} trend="up" />
            <StatCard title="Gasto Real" value={formatTransactionAmount(realExpenses)} description="Já pago no período" icon={<ArrowDownRight className="h-4 w-4 text-rose-500" />} trend="down" />
            <StatCard title="Comprometimento" value={formatTransactionAmount(totalCommitted)} description="Total Realizado + Pendente" icon={<DollarSign className="h-4 w-4 text-yellow-500" />} trend="warning" />
        </div>
    );
};

const ChartSection = ({ transactions, view, month, year }: { transactions?: Transaction[]; view: 'month' | 'year'; month?: string; year: number; }) => {
    return (
        <Card className="border-none shadow-sm md:border text-left">
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
                        <div className="flex items-center space-x-3 overflow-hidden text-left">
                            <div className={cn(
                                "rounded-full p-2 shrink-0 transition-colors",
                                isShared ? "bg-blue-50 text-blue-600" : "bg-muted text-foreground"
                            )}>
                                {isShared ? <Users className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm text-foreground dark:text-white truncate">{transaction.description}</p>
                                    {isShared && (
                                        <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase tracking-tighter">
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
                            <p className={cn("text-sm font-medium", transaction.type === 'RECEITA' ? 'text-emerald-600' : 'text-rose-600')}>
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
                            currentUserId,
                            isPremium
                        }: {
    transactions?: Transaction[],
    budgets: Budget[],
    filterId: string,
    selectedUser: string,
    currentUserId?: string,
    isPremium: boolean
}) => {
    const analysis = useMemo(() => {
        if (!budgets || budgets.length === 0) return [];

        const filteredBudgets = budgets.filter(b => {
            if (!isPremium) return b.userId === currentUserId;
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
    }, [transactions, budgets, filterId, selectedUser, currentUserId, isPremium]);

    if (analysis.length === 0) {
        return (
            <div className="py-12 text-center text-sm text-muted-foreground italic">
                Nenhuma meta definida.
            </div>
        );
    }

    return (
        <div className="space-y-6 text-left">
            {analysis.map((item) => (
                <div key={item.id} className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center space-x-2 overflow-hidden">
                            <PiggyBank className={cn("h-4 w-4 shrink-0", item.isOver ? 'text-red-500' : 'text-foreground')} />
                            <span className="text-sm text-foreground truncate">{item.name}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono">{formatTransactionAmount(item.spent)}</span>
                    </div>
                    <Progress value={item.percent} className="h-1.5" indicatorClassName={item.isOver ? "bg-red-500" : "bg-emerald-500"} />
                </div>
            ))}
        </div>
    );
};