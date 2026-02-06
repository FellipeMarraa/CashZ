"use client"

import {useEffect, useMemo, useState} from 'react';
import {Card, CardContent, CardFooter, CardHeader} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {ChevronLeft, ChevronRight, Filter, Loader2, PlusCircle, Search, Users} from 'lucide-react';
import {IMes} from '@/model/IMes';
import * as XLSX from 'xlsx';
import {useDialogManager} from "@/context/DialogManagerContext";
import {AddFinanceForm} from "@/components/add-finance-form";
import {TransactionList} from "@/components/transaction-list.tsx";
import {Transaction, TransactionType} from "@/model/types/Transaction.ts";
import {useTransactions} from "@/hooks/useTransactions";
import {TutorialWizard} from "@/components/tutorial-wizard";
import {useAuth} from "@/context/AuthContext";
import {useUserPreferences} from "@/hooks/useUserPreferences.ts";
import {UpgradePlanModal} from "@/components/upgrade-plan-modal.tsx";

export const TransactionsSection = () => {
    const { user: currentUser } = useAuth();
    const [transactionType, setTransactionType] = useState<TransactionType>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'highest' | 'lowest' | 'paid' | 'pending' | 'parcelada' | 'fixa'>('highest');
    const [selectedUser, setSelectedUser] = useState<string>("all");
    const [month, setMonth] = useState(IMes[new Date().getMonth()]);
    const [year, setYear] = useState(new Date().getFullYear());
    const {activeDialog, setActiveDialog} = useDialogManager();
    const [currentPage, setCurrentPage] = useState(1);
    const { isPremium } = useUserPreferences(currentUser?.id);

    const itemsPerPage = 8;
    const {data: transactions = [], isLoading} = useTransactions(month, year);

    useEffect(() => {
        setCurrentPage(1);
    }, [transactionType, searchQuery, sortOrder, month, year, selectedUser]);

    // --- PASSOS DO TUTORIAL DIDÁTICO ---
    const transactionSteps = useMemo(() => [
        {
            element: "#trans-search-box",
            title: "Encontre rápido",
            description: "Use a busca para localizar transações específicas pelo nome ou pela categoria que você deu a elas.",
            side: "bottom" as const
        },
        {
            element: "#trans-filters-bar",
            title: "Filtros e Período",
            description: "Você pode navegar entre os meses e anos, ou filtrar para ver apenas o que está pendente de pagamento.",
            side: "bottom" as const
        },
        {
            element: "#trans-tabs-list",
            title: "Entradas e Saídas",
            description: "Alterne rapidamente entre suas receitas (dinheiro que entrou) e despesas (dinheiro que saiu).",
            side: "bottom" as const
        },
        {
            element: "#trans-add-btn",
            title: "Nova movimentação",
            description: "Clique aqui sempre que precisar registrar um novo gasto ou ganho no seu dia a dia.",
            side: "left" as const
        },
        {
            element: "#trans-export-btns",
            title: "Leve seus dados com você",
            description: "Gere planilhas em Excel ou CSV para fazer suas próprias análises fora do aplicativo.",
            side: "top" as const
        }
    ], []);

    const normalizeString = (str: string) => {
        return str?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || "";
    };

    const transactionUsers = useMemo(() => {
        const usersMap = new Map();
        transactions.forEach(t => {
            if (t.owner && t.owner.id !== currentUser?.id) {
                usersMap.set(t.owner.id, t.owner.name);
            }
        });
        return Array.from(usersMap.entries()).map(([id, label]) => ({ id, label }));
    }, [transactions, currentUser]);

    const filteredTransactions = useMemo(() => {
        const normalizedQuery = normalizeString(searchQuery);
        return transactions
            .filter((t: Transaction) => {
                const descriptionMatch = normalizeString(t.description).includes(normalizedQuery);
                const categoryMatch = normalizeString(t.category.name).includes(normalizedQuery);
                const matchesSearch = searchQuery ? (descriptionMatch || categoryMatch) : true;
                const matchesType = transactionType === 'all' ? true : t.type === transactionType;
                const matchesUser = selectedUser === "all" ||
                    (selectedUser === "me" ? t.owner.id === currentUser?.id : t.owner.id === selectedUser);

                let matchesStatus = true;
                if (sortOrder === 'paid') matchesStatus = (t.status === 'PAGA' || t.status === 'RECEBIDA');
                if (sortOrder === 'pending') matchesStatus = (t.status === 'PENDENTE');
                if (sortOrder === 'parcelada') matchesStatus = (t.recurrence === 'PARCELADO' && t.numInstallments !== undefined && t.numInstallments > 1);
                if (sortOrder === 'fixa') matchesStatus = (t.recurrence === 'FIXO');

                return matchesSearch && matchesType && matchesUser && matchesStatus;
            })
            .sort((a: Transaction, b: Transaction) => {
                if (selectedUser === "all") {
                    const isAOwner = a.owner.id === currentUser?.id;
                    const isBOwner = b.owner.id === currentUser?.id;
                    if (isAOwner && !isBOwner) return -1;
                    if (!isAOwner && isBOwner) return 1;
                }
                switch (sortOrder) {
                    case 'highest': return b.amount - a.amount;
                    case 'lowest': return a.amount - b.amount;
                    case 'paid':
                    case 'pending':
                    case 'parcelada':
                    case 'fixa':
                    default: return new Date(b.date).getTime() - new Date(a.date).getTime();
                }
            });
    }, [transactions, searchQuery, sortOrder, transactionType, selectedUser, currentUser]);

    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    const displayTransactions = filteredTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const generateYears = (startYear: number, endYear: number) => {
        return Array.from({length: endYear - startYear + 1}, (_, i) => startYear + i);
    };

    const exportData = (type: 'csv' | 'excel') => {
        if (!isPremium) {
            setActiveDialog("upgrade-plan");
            return;
        }
        if (type === 'csv') {
            const headers = ['Proprietário', 'Descrição', 'Valor', 'Mês', 'Ano', 'Tipo', 'Status', 'Categoria'];
            const rows = filteredTransactions.map(f => [
                `"${f.owner?.name || ''}"`, `"${f.description}"`, f.amount.toFixed(2), IMes[f.month - 1], f.year, f.type, f.status, f.category?.name ?? ''
            ]);
            const csvContent = [headers, ...rows].map(row => row.join(';')).join('\n');
            const blob = new Blob(["\uFEFF" + csvContent], {type: 'text/csv;charset=utf-8;'});
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.setAttribute('download', 'financas_cashz.csv');
            link.click();
        } else {
            const data = filteredTransactions.map(f => ({
                Proprietário: f.owner?.name || 'Eu', Descrição: f.description, Valor: f.amount,
                Mês: IMes[f.month - 1], Ano: f.year, Tipo: f.type, Status: f.status, Categoria: f.category?.name ?? ''
            }));
            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Finanças');
            XLSX.writeFile(workbook, 'financas_cashz.xlsx');
        }
    };

    if (isLoading) return <div className="flex justify-center items-center h-48"><Loader2 className="animate-spin h-8 w-8 text-emerald-500"/></div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-700 pb-10 text-left">
            <TutorialWizard tutorialKey="transactions-didactic-v1" steps={transactionSteps} />

            <Card className="border-none shadow-none md:border md:shadow-sm">
                <CardHeader className="px-4 md:px-6">
                    <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
                        <div className="flex-1 w-full space-y-3">
                            <div id="trans-search-box" className="relative w-full">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                                <Input
                                    placeholder="Procurar transações..."
                                    className="pl-10 w-full bg-muted/20"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <div id="trans-filters-bar" className="flex flex-col sm:flex-row gap-2">
                                {isPremium && (
                                    <div className="w-full sm:w-[200px]">
                                        <Select value={selectedUser} onValueChange={setSelectedUser}>
                                            <SelectTrigger className="w-full border-blue-500/20 bg-blue-50/10">
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-4 w-4 text-blue-500" />
                                                    <SelectValue placeholder="Proprietário" />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todos os Usuários</SelectItem>
                                                <SelectItem value="me">Apenas Eu</SelectItem>
                                                {transactionUsers.map((u) => (
                                                    <SelectItem key={u.id} value={u.id}>{u.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                <div className="flex flex-1 flex-row items-center gap-2">
                                    <Select value={month} onValueChange={setMonth}>
                                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {IMes.map((mes) => <SelectItem key={mes} value={mes}>{mes}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <Select value={year.toString()} onValueChange={(v) => setYear(Number(v))}>
                                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {generateYears(new Date().getFullYear() - 5, new Date().getFullYear() + 5).map((y) => (
                                                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="w-full sm:w-[180px]">
                                    <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as any)}>
                                        <SelectTrigger className="w-full border-emerald-500/20">
                                            <div className="flex items-center gap-2">
                                                <Filter className="h-4 w-4 text-emerald-500"/>
                                                <SelectValue placeholder="Ordenar" />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="highest">Maior valor</SelectItem>
                                            <SelectItem value="lowest">Menor valor</SelectItem>
                                            <SelectItem value="paid">Pagas/Recebidas</SelectItem>
                                            <SelectItem value="pending">Pendentes</SelectItem>
                                            <SelectItem value="parcelada">Parceladas</SelectItem>
                                            <SelectItem value="fixa">Fixas</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="px-0 md:px-6">
                    <Tabs value={transactionType} onValueChange={(v) => setTransactionType(v as TransactionType)}>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mx-4 md:mx-0 mb-6">
                            <TabsList id="trans-tabs-list" className="grid grid-cols-3 w-full md:w-[400px]">
                                <TabsTrigger value="all">Todas</TabsTrigger>
                                <TabsTrigger value="RECEITA" className="text-emerald-600">Receitas</TabsTrigger>
                                <TabsTrigger value="DESPESA" className="text-rose-600">Despesas</TabsTrigger>
                            </TabsList>

                            <Button
                                id="trans-add-btn"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 px-6 h-10 w-full md:w-auto shadow-sm"
                                onClick={() => setActiveDialog("add-finance", "transactions")}
                            >
                                <PlusCircle className="h-4 w-4"/>
                                Nova Transação
                            </Button>
                        </div>

                        <TabsContent value={transactionType} className="mt-0 outline-none">
                            <TransactionList transactions={displayTransactions}/>
                        </TabsContent>
                    </Tabs>
                </CardContent>

                <CardFooter className="flex flex-col md:flex-row justify-between gap-4 items-center px-4 md:px-6 py-6 border-t bg-muted/10">
                    <div className="text-[10px] md:text-xs text-muted-foreground order-2 md:order-1 text-center md:text-left">
                        <p className=" text-foreground uppercase tracking-wider">
                            Mostrando {displayTransactions.length} de {filteredTransactions.length} registros
                        </p>
                    </div>

                    <div className="flex items-center space-x-2 order-1 md:order-2">
                        <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}>
                            <ChevronLeft className="h-4 w-4"/>
                        </Button>
                        <div className="bg-background border px-4 py-1 rounded-md text-xs shadow-sm min-w-[60px] text-center">
                            {currentPage} / {totalPages || 1}
                        </div>
                        <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}>
                            <ChevronRight className="h-4 w-4"/>
                        </Button>
                    </div>

                    <div id="trans-export-btns" className="flex gap-2 order-3 w-full md:w-auto">
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 md:flex-none text-[10px] gap-2 border-muted hover:bg-muted/50 dark:border-muted/30"
                            onClick={() => exportData('csv')}
                            disabled={filteredTransactions.length === 0}
                        >
                            CSV
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 md:flex-none text-[10px] gap-2 border-emerald-500/20 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500/10 dark:text-emerald-500 dark:hover:bg-emerald-950/20"
                            onClick={() => exportData('excel')}
                            disabled={filteredTransactions.length === 0}
                        >
                            EXCEL
                        </Button>
                    </div>
                </CardFooter>
            </Card>

            {activeDialog === "add-finance" && <AddFinanceForm/>}
            {activeDialog === "upgrade-plan" && (
                <UpgradePlanModal
                    isOpen={true}
                    onClose={() => setActiveDialog(null)}
                />
            )}
        </div>
    );
};