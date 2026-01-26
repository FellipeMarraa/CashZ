import {useEffect, useState} from 'react';
import {Card, CardContent, CardFooter, CardHeader} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {ChevronLeft, ChevronRight, Filter, PlusCircle, Search} from 'lucide-react';
import {IMes} from '@/model/IMes';
import * as XLSX from 'xlsx';
import {useDialogManager} from "@/context/DialogManagerContext";
import {AddFinanceForm} from "@/components/add-finance-form";
import {TransactionList} from "@/components/transaction-list.tsx";
import {Transaction, TransactionType} from "@/model/types/Transaction.ts";
import {useTransactions, useUpdateTransaction} from "@/hooks/useTransactions";

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

    // Lógica de Filtro e Ordenação combinada
    const processedTransactions = transactions
        .filter((transaction: Transaction) => {
            // Filtro de Busca
            const matchesSearch = searchQuery
                ? (transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    transaction.category.name.toLowerCase().includes(searchQuery.toLowerCase()))
                : true;

            // Filtro de Status via Select (se selecionado paid ou pending)
            if (sortOrder === 'paid') return matchesSearch && (transaction.status === 'PAGA' || transaction.status === 'RECEBIDA');
            if (sortOrder === 'pending') return matchesSearch && transaction.status === 'PENDENTE';

            return matchesSearch;
        })
        .sort((a: Transaction, b: Transaction) => {
            switch (sortOrder) {
                case 'highest':
                    return b.amount - a.amount;
                case 'lowest':
                    return a.amount - b.amount;
                case 'oldest':
                    return new Date(a.date).getTime() - new Date(b.date).getTime();
                case 'newest':
                default:
                    return new Date(b.date).getTime() - new Date(a.date).getTime();
            }
        });

    const filteredTransactions = processedTransactions.filter((transaction: Transaction) =>
        transactionType === 'all' ? true : transaction.type === transactionType
    );

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
        const headers = [
            'ID', 'Descrição', 'Valor', 'Mês', 'Ano', 'Tipo',
            'Recorrência', 'Status', 'Nº Parcelas', 'Parcela Atual',
            'Referência', 'Categoria'
        ];

        const rows = finances.map(f => [
            `"${f.description}"`,
            f.amount.toFixed(2).replace('.', ','),
            IMes[f.month],
            f.year,
            f.type,
            f.recurrence,
            f.status,
            f.numInstallments ?? '',
            f.currentInstallment ?? '',
            f.reference ?? '',
            f.category?.name ?? ''
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.join(';'))
            .join('\n');

        const blob = new Blob(["\uFEFF" + csvContent], {type: 'text/csv;charset=utf-8;'});
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'financas_exportadas.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportToExcel = (finances: Transaction[]) => {
        const data = finances.map(f => ({
            Descrição: f.description,
            Valor: Number(f.amount).toFixed(2).replace('.', ','),
            Mês: IMes[f.month],
            Ano: f.year,
            Tipo: f.type,
            Recorrência: f.recurrence,
            Status: f.status,
            'Nº Parcelas': f.numInstallments ?? '',
            'Parcela Atual': f.currentInstallment ?? '',
            Referência: f.reference ?? '',
            Categoria: f.category?.name ?? ''
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Finanças');
        XLSX.writeFile(workbook, 'financas_exportadas.xlsx');
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"/>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center text-red-500 p-4">
                <p className="font-semibold text-sm">Erro ao carregar transações: {error.message}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            <Card className="border-none shadow-none md:border md:shadow-sm">
                <CardHeader className="px-4 md:px-6">
                    {/* Container Principal dos Filtros */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">

                        {/* Lado Esquerdo: Busca e Datas */}
                        <div className="flex-1 w-full md:max-w-3xl">
                            <div className="flex flex-col gap-3">
                                <div className="relative w-full">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                                    <Input
                                        placeholder="Procurar transações..."
                                        className="pl-10 w-full"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <div className="flex flex-row items-center gap-2">
                                    <Select value={month} onValueChange={setMonth}>
                                        <SelectTrigger className="flex-1">
                                            <SelectValue placeholder="Mês"/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {IMes.map((mes, index) => (
                                                <SelectItem key={index} value={mes}>{mes}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Select value={year.toString()} onValueChange={(value) => setYear(Number(value))}>
                                        <SelectTrigger className="flex-1">
                                            <SelectValue placeholder="Ano"/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {generateYears(new Date().getFullYear() - 5, new Date().getFullYear() + 5).map((year) => (
                                                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Lado Direito: Ordenação (Alinhado por baixo no desktop) */}
                        <div className="hidden md:flex flex-col gap-1.5 min-w-[180px]">
                            <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as any)}>
                                <SelectTrigger className="w-full">
                                    <div className="flex items-center gap-2">
                                        <Filter className="h-4 w-4"/>
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

                <CardContent className="px-4 md:px-6">
                    <Tabs value={transactionType} onValueChange={(value) => setTransactionType(value as TransactionType)}>
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                            <TabsList className="hidden md:inline-flex">
                                <TabsTrigger value="all">Todas</TabsTrigger>
                                <TabsTrigger value="RECEITA">Receitas</TabsTrigger>
                                <TabsTrigger value="DESPESA">Despesas</TabsTrigger>
                            </TabsList>

                            <Button
                                variant="outline"
                                className="w-full md:w-auto flex gap-2 items-center justify-center border-green-500/50 hover:bg-green-50 dark:hover:bg-green-950/20 py-6 md:py-2 text-base md:text-sm font-semibold"
                                onClick={() => setActiveDialog("add-finance", "transactions")}
                            >
                                <PlusCircle className="w-5 h-5 md:w-4 md:h-4 text-green-500"/>
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
                </CardContent>

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
                    <div className="flex flex-wrap gap-2 order-3">
                        <Button variant="ghost" size="sm" className="text-xs" onClick={() => exportCSV(filteredTransactions)} disabled={filteredTransactions.length === 0}>
                            CSV
                        </Button>
                        <Button variant="ghost" size="sm" className="text-xs" onClick={() => exportToExcel(filteredTransactions)} disabled={filteredTransactions.length === 0}>
                            Excel
                        </Button>
                    </div>
                </CardFooter>

                <div className="md:hidden py-4 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Fim das transações do mês</p>
                </div>
            </Card>
        </div>
    );
};