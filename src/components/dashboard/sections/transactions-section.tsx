"use client"

import {useEffect, useState, useMemo} from 'react';
import {Card, CardContent, CardFooter, CardHeader} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {ChevronLeft, ChevronRight, Filter, Loader2, PlusCircle, Search, Download} from 'lucide-react'; // Importado Download
import {IMes} from '@/model/IMes';
import * as XLSX from 'xlsx';
import {useDialogManager} from "@/context/DialogManagerContext";
import {AddFinanceForm} from "@/components/add-finance-form";
import {TransactionList} from "@/components/transaction-list.tsx";
import {Transaction, TransactionType} from "@/model/types/Transaction.ts";
import {useTransactions, useUpdateTransaction} from "@/hooks/useTransactions";
import {TutorialWizard} from "@/components/tutorial-wizard";

export const TransactionsSection = () => {
    const [transactionType, setTransactionType] = useState<TransactionType>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'highest' | 'lowest' | 'paid' | 'pending'>('newest');
    const [month, setMonth] = useState(IMes[new Date().getMonth()]);
    const [year, setYear] = useState(new Date().getFullYear());
    const {activeDialog, setActiveDialog} = useDialogManager();
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const {data: transactions = [], isLoading, error} = useTransactions(month, year);
    useUpdateTransaction();

    useEffect(() => {
        setCurrentPage(1);
    }, [transactionType, searchQuery, sortOrder, month, year]);

    const normalizeString = (str: string) => {
        return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    };

    const processedTransactions = useMemo(() => {
        const normalizedQuery = normalizeString(searchQuery);

        return transactions
            .filter((transaction: Transaction) => {
                const descriptionMatch = normalizeString(transaction.description).includes(normalizedQuery);
                const categoryMatch = normalizeString(transaction.category.name).includes(normalizedQuery);
                const matchesSearch = searchQuery ? (descriptionMatch || categoryMatch) : true;

                if (sortOrder === 'paid') return matchesSearch && (transaction.status === 'PAGA' || transaction.status === 'RECEBIDA');
                if (sortOrder === 'pending') return matchesSearch && transaction.status === 'PENDENTE';
                return matchesSearch;
            })
            .sort((a: Transaction, b: Transaction) => {
                switch (sortOrder) {
                    case 'highest': return b.amount - a.amount;
                    case 'lowest': return a.amount - b.amount;
                    case 'oldest': return new Date(a.date).getTime() - new Date(b.date).getTime();
                    case 'newest':
                    default: return new Date(b.date).getTime() - new Date(a.date).getTime();
                }
            });
    }, [transactions, searchQuery, sortOrder]);

    const filteredTransactions = useMemo(() => (
        processedTransactions.filter((transaction: Transaction) =>
            transactionType === 'all' ? true : transaction.type === transactionType
        )
    ), [processedTransactions, transactionType]);

    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const displayTransactions = isMobile
        ? filteredTransactions
        : filteredTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const generateYears = (startYear: number, endYear: number) => {
        return Array.from({length: endYear - startYear + 1}, (_, i) => startYear + i);
    };

    const exportCSV = (finances: Transaction[]) => {
        const headers = ['Descrição', 'Valor', 'Mês', 'Ano', 'Tipo', 'Status', 'Categoria'];
        const rows = finances.map(f => [
            `"${f.description}"`, f.amount.toFixed(2), IMes[f.month], f.year, f.type, f.status, f.category?.name ?? ''
        ]);
        const csvContent = [headers, ...rows].map(row => row.join(';')).join('\n');
        const blob = new Blob(["\uFEFF" + csvContent], {type: 'text/csv;charset=utf-8;'});
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'financas.csv');
        link.click();
    };

    const exportToExcel = (finances: Transaction[]) => {
        const data = finances.map(f => ({
            Descrição: f.description,
            Valor: f.amount,
            Mês: IMes[f.month],
            Ano: f.year,
            Tipo: f.type,
            Status: f.status,
            Categoria: f.category?.name ?? ''
        }));
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Finanças');
        XLSX.writeFile(workbook, 'financas.xlsx');
    };

    if (isLoading) return <div className="flex justify-center items-center h-48"><Loader2 className="animate-spin h-8 w-8"/></div>;
    if (error) return <div className="text-center text-red-500 p-4">Erro: {error.message}</div>;

    const transactionSteps = [
        {
            element: '#search-input',
            title: 'Busca Inteligente',
            description: 'Procure rapidamente por descrição ou categoria.'
        },
        {
            element: '#period-select',
            title: 'Seleção de Período',
            description: 'Alterne entre meses e anos para visualizar seu histórico.'
        },
        {
            element: '#sort-select',
            title: 'Ordenação e Filtros',
            description: 'Organize suas transações por valor, data ou status.'
        },
        {
            element: '#transaction-tabs',
            title: 'Categorização por Tipo',
            description: 'Filtre rapidamente apenas suas Receitas ou Despesas.'
        },
        {
            element: '#add-transaction-btn',
            title: 'Novo Lançamento',
            description: 'Clique aqui para adicionar uma nova movimentação financeira.'
        },
        {
            element: '#export-actions',
            title: 'Exportação de Dados',
            description: 'Precisa dos dados em outra planilha? Exporte para CSV ou Excel com um clique.'
        }
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-700 pb-10">
            <TutorialWizard tutorialKey="transactions-page" steps={transactionSteps} />

            <Card className="border-none shadow-none md:border md:shadow-sm">
                <CardHeader className="px-4 md:px-6">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1 w-full space-y-3">
                            <div className="relative w-full" id="search-input">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                                <Input
                                    placeholder="Procurar transações..."
                                    className="pl-10 w-full"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-row items-center gap-2" id="period-select">
                                <Select value={month} onValueChange={setMonth}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Mês"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {IMes.map((mes, index) => (
                                            <SelectItem key={index} value={mes}>{mes}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={year.toString()} onValueChange={(value) => setYear(Number(value))}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Ano"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {generateYears(new Date().getFullYear() - 5, new Date().getFullYear() + 5).map((y) => (
                                            <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="w-full md:w-auto md:min-w-[200px] flex flex-col gap-3" id="sort-select">
                            <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as any)}>
                                <SelectTrigger className="w-full h-10 border-emerald-500/20">
                                    <div className="flex items-center gap-2">
                                        <Filter className="h-4 w-4 text-emerald-500"/>
                                        <SelectValue placeholder="Ordenar"/>
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="newest">Mais recentes</SelectItem>
                                    <SelectItem value="oldest">Mais antigas</SelectItem>
                                    <SelectItem value="highest">Maior valor</SelectItem>
                                    <SelectItem value="lowest">Menor valor</SelectItem>
                                    <SelectItem value="paid">Pagas/Recebidas</SelectItem>
                                    <SelectItem value="pending">Pendentes</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="px-4 md:px-6 pb-2">
                    <Tabs value={transactionType} onValueChange={(value) => setTransactionType(value as TransactionType)}>
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                            <TabsList className="w-full md:w-auto" id="transaction-tabs">
                                <TabsTrigger value="all" className="flex-1 md:flex-none">Todas</TabsTrigger>
                                <TabsTrigger value="RECEITA" className="flex-1 md:flex-none text-emerald-600">Receitas</TabsTrigger>
                                <TabsTrigger value="DESPESA" className="flex-1 md:flex-none text-rose-600">Despesas</TabsTrigger>
                            </TabsList>

                            <Button
                                id="add-transaction-btn"
                                className="w-full md:min-w-[200px] md:w-auto flex gap-2 items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white h-10 font-semibold"
                                onClick={() => setActiveDialog("add-finance", "transactions")}
                            >
                                <PlusCircle className="w-5 h-5 md:w-4 md:h-4"/>
                                <span>Nova Transação</span>
                            </Button>

                            {activeDialog === "add-finance" && <AddFinanceForm/>}
                        </div>
                        <TabsContent value={transactionType} className="mt-0">
                            <div className="max-h-[500px] md:max-h-none overflow-y-auto md:overflow-visible">
                                <TransactionList transactions={displayTransactions}/>
                            </div>
                        </TabsContent>
                    </Tabs>

                    {/* EXPORTAÇÃO MOBILE: Visível apenas em telas pequenas */}
                    <div className="md:hidden mt-6 mb-4 flex flex-col gap-3 pt-4 border-t border-dashed" id="export-actions">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Download className="h-4 w-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Exportar Relatórios</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-9"
                                onClick={() => exportCSV(filteredTransactions)}
                                disabled={filteredTransactions.length === 0}
                            >
                                CSV
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-9 border-emerald-600/20 text-emerald-700"
                                onClick={() => exportToExcel(filteredTransactions)}
                                disabled={filteredTransactions.length === 0}
                            >
                                Excel
                            </Button>
                        </div>
                        <p className="text-[10px] text-center text-muted-foreground italic">
                            O arquivo será gerado com base nos filtros atuais.
                        </p>
                    </div>
                </CardContent>

                {/* FOOTER DESKTOP: Mantido original mas oculto no mobile */}
                <CardFooter className="hidden md:flex flex-col md:flex-row justify-between gap-4 items-center px-4 md:px-6 py-6 border-t">
                    <p className="text-xs text-muted-foreground order-2 md:order-1">
                        Mostrando {displayTransactions.length} de {filteredTransactions.length} transações
                    </p>
                    <div className="flex items-center space-x-2 order-1 md:order-2">
                        <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}>
                            <ChevronLeft className="h-4 w-4"/>
                        </Button>
                        <span className="text-xs font-medium">
                            {currentPage} / {totalPages || 1}
                        </span>
                        <Button variant="outline" size="sm" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}>
                            <ChevronRight className="h-4 w-4"/>
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 order-3" id="export-actions">
                        <Button variant="ghost" size="sm" className="text-xs" onClick={() => exportCSV(filteredTransactions)} disabled={filteredTransactions.length === 0}>CSV</Button>
                        <Button variant="ghost" size="sm" className="text-xs" onClick={() => exportToExcel(filteredTransactions)} disabled={filteredTransactions.length === 0}>Excel</Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
};