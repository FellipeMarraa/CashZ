import {useEffect, useState} from 'react';
import {Card, CardContent, CardFooter, CardHeader} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Filter, PlusCircle, Search} from 'lucide-react';
import {IMes} from '@/model/IMes';
import * as XLSX from 'xlsx';
import {useDialogManager} from "@/context/DialogManagerContext";
import {AddFinanceForm} from "@/components/add-finance-form";
import {TransactionList} from "@/components/transaction-list.tsx";
import {Transaction, TransactionType} from "@/model/types/Transaction.ts";
import {useTransactions, useUpdateTransaction} from "@/hooks/useTransactions";
import {Tooltip, TooltipContent} from '@/components/ui/tooltip';
import {TooltipTrigger} from "@/components/ui/tooltip.tsx";

export const TransactionsSection = () => {
    const [transactionType, setTransactionType] = useState<TransactionType>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
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

    const filteredBySearchAndSort = transactions
        .filter((transaction: Transaction) => {
            if (searchQuery) {
                return (
                    transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    transaction.category.name.toLowerCase().includes(searchQuery.toLowerCase())
                );
            }
            return true;
        })
        .sort((a: Transaction, b: Transaction) => {
            switch (sortOrder) {
                case 'highest':
                    return b.amount - a.amount;
                case 'lowest':
                    return a.amount - b.amount;
                default:
                    return 0;
            }
        });

    const filteredTransactions = filteredBySearchAndSort.filter((transaction: Transaction) =>
        transactionType === 'all' ? true : transaction.type === transactionType
    );

    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    const paginatedTransactions = filteredTransactions.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

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
            <div className="text-center text-red-500 p-4 animate-[shake_0.5s_ease-in-out] animate-in fade-in duration-300">
                <svg className="w-12 h-12 mx-auto mb-2 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
                <p className="font-semibold">Erro ao carregar transações: {error.message}</p>
            </div>
        );
    }


    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="relative flex-1 w-full">
                            <div className="flex flex-col sm:flex-row items-stretch gap-2">
                                <div className="relative w-full">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                                    <Input
                                        placeholder="Procurar transações..."
                                        className="pl-10 w-full"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <Select value={month} onValueChange={setMonth}>
                                    <SelectTrigger className="w-full sm:w-40">
                                        <Tooltip>
                                            <TooltipTrigger className="h-full">
                                                <SelectValue placeholder="Selecionar Mês"/>
                                            </TooltipTrigger>
                                            <TooltipContent className="bg-gray-200 text-black">Selecionar o mês</TooltipContent>
                                        </Tooltip>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {IMes.map((mes, index) => (
                                            <SelectItem key={index} value={mes}>{mes}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={year.toString()} onValueChange={(value) => setYear(Number(value))}>
                                    <SelectTrigger className="w-full sm:w-40">
                                        <Tooltip>
                                            <TooltipTrigger className="h-full">
                                                <SelectValue placeholder="Selecionar Ano"/>
                                            </TooltipTrigger>
                                            <TooltipContent className="bg-gray-200 text-black">Selecionar o ano</TooltipContent>
                                        </Tooltip>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {generateYears(new Date().getFullYear() - 5, new Date().getFullYear() + 5).map((year) => (
                                            <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as any)}>
                                <SelectTrigger className="w-full sm:w-auto">
                                    <div className="flex items-center gap-2">
                                        <Tooltip>
                                            <TooltipTrigger className="h-full">
                                                <Filter className="h-4 w-4"/>
                                            </TooltipTrigger>
                                            <TooltipContent className="bg-gray-200 text-black">Ordenar transações</TooltipContent>
                                        </Tooltip>
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="highest">
                                        <div className="flex items-center">
                                            <ArrowUp className="mr-2 h-4 w-4"/>
                                            <span>Maior valor</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="lowest">
                                        <div className="flex items-center">
                                            <ArrowDown className="mr-2 h-4 w-4"/>
                                            <span>Menor valor</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs value={transactionType} onValueChange={(value) => setTransactionType(value as TransactionType)}>
                        <div className="flex items-center align-baseline justify-between gap-4 mb-4">
                            <TabsList>
                                <TabsTrigger value="all">Todas</TabsTrigger>
                                <TabsTrigger value="RECEITA">Receitas</TabsTrigger>
                                <TabsTrigger value="DESPESA">Despesas</TabsTrigger>
                            </TabsList>
                            <Button variant="outline" className="flex gap-2 items-center justify-center" onClick={() => setActiveDialog("add-finance", "transactions")}>
                                <PlusCircle className="w-4 h-4 text-green-500"/>
                            </Button>
                            {activeDialog === "add-finance" && <AddFinanceForm/>}
                        </div>
                        <TabsContent value={transactionType} className="mt-0">
                            <TransactionList transactions={paginatedTransactions}/>
                        </TabsContent>
                    </Tabs>
                </CardContent>
                <CardFooter className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
                    <p className="text-sm text-muted-foreground">
                        Mostrando {paginatedTransactions.length} de {filteredTransactions.length} transações
                    </p>
                    <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}>
                            <ChevronLeft className="h-4 w-4"/>
                        </Button>
                        <span className="text-sm text-muted-foreground">
                            Página {currentPage} de {totalPages || 1}
                        </span>
                        <Button variant="outline" size="sm" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}>
                            <ChevronRight className="h-4 w-4"/>
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => exportCSV(filteredTransactions)} disabled={filteredTransactions.length === 0}>
                            Exportar CSV
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => exportToExcel(filteredTransactions)} disabled={filteredTransactions.length === 0}>
                            Exportar Excel
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
};