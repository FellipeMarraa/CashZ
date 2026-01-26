import {CircleDollarSign, Search, SquarePen, Trash} from 'lucide-react';
import {useDeleteTransaction, useUpdateTransaction} from "@/hooks/useTransactions";
import {Transaction} from "@/model/types/Transaction.ts";
import {useDialogManager} from "@/context/DialogManagerContext.tsx";
import {EditFinanceForm} from "@/components/edit-finance-form.tsx";
import {useToast} from "@/hooks/use-toast.ts";
import {useState} from "react";
import {DeleteFinanceDialog} from "@/components/delete-finance-dialog.tsx";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip.tsx";

interface TransactionListProps {
    transactions: Transaction[];
}

export const TransactionList = ({ transactions }: TransactionListProps) => {

    const { activeDialog, setActiveDialog } = useDialogManager();
    const { mutate: deleteTransaction, isPending: isDeleting } = useDeleteTransaction();
    const { mutate: updateTransaction } = useUpdateTransaction();

    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
    const {toast} = useToast();

    const formatCurrency = (value: number, type: 'RECEITA' | 'DESPESA') => {
        const formatted = new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(Math.abs(value));
        return type === 'RECEITA' ? `+${formatted}` : `-${formatted}`;
    };

    const handleDeleteClick = (transaction: Transaction) => {
        setTransactionToDelete(transaction);
        setActiveDialog("delete-finance");
    };

    const handleConfirmDelete = (deleteAll: boolean) => {
        if (!transactionToDelete) return;
        deleteTransaction(
            { id: transactionToDelete.id, deleteAll },
            {
                onSuccess: () => {
                    toast({
                        title: "Transação excluída com sucesso!",
                        description: deleteAll ? "Todas as recorrências foram excluídas." : undefined,
                        duration: 3000,
                    });
                    setTransactionToDelete(null);
                    setActiveDialog(null);
                },
                onError: (error) => {
                    toast({
                        variant: "destructive",
                        title: "Erro ao excluir a transação",
                        description: error instanceof Error ? error.message : "Ocorreu um erro ao excluir a transação",
                        duration: 3000,
                    });
                }
            }
        );
    };

    const handleStatusUpdate = (transaction: Transaction) => {
        const newStatus = transaction.status === 'PENDENTE'
            ? (transaction.type === 'RECEITA' ? 'RECEBIDA' as const : 'PAGA' as const)
            : 'PENDENTE' as const;
        const updatedTransaction = {
            ...transaction,
            status: newStatus
        };
        updateTransaction(
            { id: transaction.id, data: updatedTransaction },
            {
                onSuccess: () => {
                    toast({ variant: "success", title: "Transação atualizada com sucesso!", duration: 3000 });
                },
                onError: (error) => {
                    toast({
                        variant: "destructive",
                        title: "Erro ao atualizar transação!",
                        description: `${error instanceof Error ? error.message : String(error)}`,
                        duration: 3000,
                    });
                }
            }
        );
    };

    const handleEdit = (transaction: Transaction) => {
        setSelectedTransaction(transaction);
        setActiveDialog("edit-finance");
    };

    if (transactions.length === 0) {
        return (
            <div className="flex h-[200px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                    <Search className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">Nenhuma transação encontrada.</h3>
                <p className="mb-4 mt-2 text-sm text-muted-foreground">
                    Tente ajustar sua pesquisa ou filtro para encontrar o que está procurando.
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-md border divide-y overflow-hidden">
            {/* Header da Tabela: Oculto no mobile, Grid no Desktop */}
            <div className="hidden md:grid grid-cols-[1.5fr_1fr_1fr_120px] gap-4 p-4 font-medium bg-muted/30">
                <div>Descrição</div>
                <div>Categoria</div>
                <div className="text-right">Valor</div>
                <div className="text-right">Ações</div>
            </div>

            <div className="divide-y">
                {transactions.map((transaction) => (
                    <div
                        key={transaction.id}
                        className="flex flex-col md:grid md:grid-cols-[1.5fr_1fr_1fr_120px] gap-2 md:gap-4 p-4 items-start md:items-center hover:bg-muted/50 transition-colors"
                    >
                        {/* Mobile: Layout de duas colunas empilhadas | Desktop: Grid standard */}
                        <div className="flex justify-between items-start w-full md:block">
                            <div className="flex flex-col">
                                <span className="font-medium text-sm md:text-base">{transaction.description}</span>
                                <span className="text-xs text-muted-foreground md:hidden">{transaction.category.name}</span>
                            </div>
                            <div className={`md:hidden font-medium text-sm ${transaction.type === 'RECEITA' ? 'text-success' : 'text-destructive'}`}>
                                {formatCurrency(transaction.amount, transaction.type)}
                            </div>
                        </div>

                        {/* Categoria: Escondida no mobile */}
                        <div className="hidden md:block text-sm text-muted-foreground truncate">
                            {transaction.category.name}
                        </div>

                        {/* Valor: Escondido no mobile (exibido acima) */}
                        <div className={`hidden md:block text-right font-medium ${transaction.type === 'RECEITA' ? 'text-success' : 'text-destructive'}`}>
                            {formatCurrency(transaction.amount, transaction.type)}
                        </div>

                        {/* Ações: Alinhadas à direita no desktop, com borda separadora no mobile */}
                        <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-2 mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-none">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground md:hidden">Ações</span>
                            <div className="flex items-center gap-3">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <CircleDollarSign
                                            className={`w-5 h-5 md:w-4 md:h-4 cursor-pointer transition-colors ${
                                                transaction.status === 'PAGA' || transaction.status === 'RECEBIDA'
                                                    ? 'text-success hover:text-green-600'
                                                    : 'text-yellow-300 hover:text-yellow-500'}
                                            `}
                                            onClick={() => handleStatusUpdate(transaction)}
                                        />
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-gray-200 text-black">
                                        {transaction.status === 'PENDENTE'
                                            ? (transaction.type === 'DESPESA' ? 'Marcar como paga' : 'Marcar como recebida')
                                            : (transaction.type === 'DESPESA' ? 'Marcar como não paga' : 'Marcar como não recebida')}
                                    </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <SquarePen
                                            className="w-5 h-5 md:w-4 md:h-4 text-blue-500 hover:text-blue-600 cursor-pointer"
                                            onClick={() => handleEdit(transaction)}
                                        />
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-gray-200 text-black">
                                        Editar transação
                                    </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Trash
                                            className="w-5 h-5 md:w-4 md:h-4 text-red-500 hover:text-red-600 cursor-pointer"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveDialog("delete-finance", "transaction-list");
                                                handleDeleteClick(transaction);
                                            }}
                                        />
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-gray-200 text-black">
                                        Deletar transação
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modais */}
            {activeDialog === "edit-finance" && selectedTransaction && (
                <EditFinanceForm
                    transaction={selectedTransaction}
                    onClose={() => {
                        setActiveDialog(null);
                        setSelectedTransaction(null);
                    }}
                />
            )}
            {activeDialog === "delete-finance" && (
                <DeleteFinanceDialog
                    transaction={transactionToDelete}
                    onConfirm={handleConfirmDelete}
                    isDeleting={isDeleting}
                />
            )}
        </div>
    );
};