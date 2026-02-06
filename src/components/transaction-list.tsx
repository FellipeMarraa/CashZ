"use client"

import {CircleDollarSign, Lock, Search, SquarePen, Trash, Users} from 'lucide-react';
import {useDeleteTransaction, useUpdateTransaction} from "@/hooks/useTransactions";
import {Transaction} from "@/model/types/Transaction.ts";
import {useDialogManager} from "@/context/DialogManagerContext.tsx";
import {EditFinanceForm} from "@/components/edit-finance-form.tsx";
import {useToast} from "@/hooks/use-toast.ts";
import {useMemo, useState} from "react";
import {DeleteFinanceDialog} from "@/components/delete-finance-dialog.tsx";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip.tsx";
import {useAuth} from "@/context/AuthContext";
import {cn} from "@/lib/utils";
import {usePrivacy} from "@/context/PrivacyContext"; // IMPORTADO

interface TransactionListProps {
    transactions: Transaction[];
}

export const TransactionList = ({ transactions }: TransactionListProps) => {
    const { user: currentUser } = useAuth();
    const { isPrivate } = usePrivacy(); // HOOK ADICIONADO
    const { activeDialog, setActiveDialog } = useDialogManager();
    const { mutate: deleteTransaction, isPending: isDeleting } = useDeleteTransaction();
    const { mutate: updateTransaction } = useUpdateTransaction();

    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
    const {toast} = useToast();

    const sortedTransactions = useMemo(() => {
        return [...transactions].sort((a, b) => {
            const aIsMine = a.owner.id === currentUser?.id;
            const bIsMine = b.owner.id === currentUser?.id;
            if (aIsMine && !bIsMine) return -1;
            if (!aIsMine && bIsMine) return 1;
            return 0;
        });
    }, [transactions, currentUser?.id]);

    const formatCurrency = (value: number, type: 'RECEITA' | 'DESPESA') => {
        // LÓGICA DE MÁSCARA ADICIONADA
        if (isPrivate) return type === 'RECEITA' ? '+ R$ •••••' : '- R$ •••••';

        const formatted = new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(Math.abs(value));
        return type === 'RECEITA' ? `+${formatted}` : `-${formatted}`;
    };

    const handleDeleteClick = (transaction: Transaction) => {
        if (transaction.owner.id !== currentUser?.id) {
            toast({
                title: "Acesso restrito",
                description: "Você não tem permissão para excluir transações de outros usuários.",
                variant: "destructive"
            });
            return;
        }
        setTransactionToDelete(transaction);
        setActiveDialog("delete-finance");
    };

    const handleConfirmDelete = (deleteAll: boolean) => {
        if (!transactionToDelete) return;
        deleteTransaction(
            { id: transactionToDelete.id, deleteAll },
            {
                onSuccess: () => {
                    toast({ title: "Transação excluída!", duration: 3000 });
                    setTransactionToDelete(null);
                    setActiveDialog(null);
                }
            }
        );
    };

    const handleStatusUpdate = (transaction: Transaction) => {
        if (transaction.owner.id !== currentUser?.id) {
            toast({
                title: "Acesso restrito",
                description: "Apenas o proprietário pode alterar o status desta transação.",
                variant: "destructive"
            });
            return;
        }

        const newStatus = transaction.status === 'PENDENTE'
            ? (transaction.type === 'RECEITA' ? 'RECEBIDA' as const : 'PAGA' as const)
            : 'PENDENTE' as const;

        updateTransaction({ id: transaction.id, data: { ...transaction, status: newStatus } });
    };

    const handleEditClick = (transaction: Transaction) => {
        if (transaction.owner.id !== currentUser?.id) {
            toast({
                title: "Acesso restrito",
                description: "Somente o proprietário pode editar esta transação.",
                variant: "destructive"
            });
            return;
        }
        setSelectedTransaction(transaction);
        setActiveDialog("edit-finance");
    };

    if (transactions.length === 0) {
        return (
            <div className="flex h-[200px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
                <Search className="h-10 w-10 text-muted-foreground opacity-20" />
                <h3 className="mt-4 text-lg font-semibold italic opacity-50">Nenhuma transação encontrada.</h3>
            </div>
        );
    }

    return (
        <TooltipProvider>
            <div className="rounded-md border divide-y bg-background overflow-hidden">
                <div className="hidden md:grid grid-cols-[1.5fr_1fr_1fr_120px] gap-4 p-4 text-[10px] uppercase tracking-wider bg-muted/30 text-muted-foreground ">
                    <div>Descrição / Proprietário</div>
                    <div>Categoria</div>
                    <div className="text-right">Valor</div>
                    <div className="text-right">Ações</div>
                </div>

                <div className="divide-y max-h-[500px] md:max-h-none overflow-y-auto scrollbar-thin">
                    {sortedTransactions.map((transaction) => {
                        const isShared = transaction.owner && transaction.owner.id !== currentUser?.id;

                        return (
                            <div
                                key={transaction.id}
                                className={cn(
                                    "flex flex-col md:grid md:grid-cols-[1.5fr_1fr_1fr_120px] gap-2 md:gap-4 p-4 items-start md:items-center hover:bg-muted/50 transition-colors",
                                )}
                            >
                                <div className="flex justify-between items-start w-full md:block">
                                    <div className="flex flex-col text-left">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm md:text-base text-foreground font-medium flex-1 items-center gap-2">
                                                {transaction.description}
                                                {transaction.recurrence === 'PARCELADO' && transaction.numInstallments && transaction.numInstallments > 1 && (
                                                    <span className="text-xs text-muted-foreground font-mono ml-2 bg-muted px-1 rounded">
                                                        {String(transaction.currentInstallment).padStart(2, '0')}/{String(transaction.numInstallments).padStart(2, '0')}
                                                    </span>
                                                )}
                                            </span>

                                            {isShared && (
                                                <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full uppercase flex items-center gap-1 shrink-0">
                                                    <Users className="h-2.5 w-2.5" /> {transaction.owner.name.split(' ')[0]}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-xs text-muted-foreground md:hidden">{transaction.category.name}</span>
                                    </div>
                                    <div className={cn("md:hidden text-sm ", transaction.type === 'RECEITA' ? 'text-emerald-600' : 'text-rose-600')}>
                                        {formatCurrency(transaction.amount, transaction.type)}
                                    </div>
                                </div>

                                <div className="hidden md:block text-sm text-muted-foreground font-medium text-left">
                                    {transaction.category.name}
                                </div>

                                <div className={cn("hidden md:block text-right ", transaction.type === 'RECEITA' ? 'text-emerald-600' : 'text-rose-600')}>
                                    {formatCurrency(transaction.amount, transaction.type)}
                                </div>

                                <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-2 mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-none border-dashed border-muted-foreground/20">
                                    <span className="text-[10px] text-muted-foreground md:hidden uppercase tracking-tighter">Gerenciar</span>

                                    <div className="flex items-center gap-3">
                                        {isShared ? (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Lock className="w-4 h-4 text-foreground cursor-not-allowed" />
                                                </TooltipTrigger>
                                                <TooltipContent>Somente leitura</TooltipContent>
                                            </Tooltip>
                                        ) : (
                                            <>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <CircleDollarSign
                                                            className={cn(
                                                                "w-5 h-5 md:w-4 md:h-4 cursor-pointer transition-colors",
                                                                (transaction.status === 'PAGA' || transaction.status === 'RECEBIDA')
                                                                    ? 'text-emerald-500'
                                                                    : 'text-amber-400 hover:text-amber-500'
                                                            )}
                                                            onClick={() => handleStatusUpdate(transaction)}
                                                        />
                                                    </TooltipTrigger>
                                                    <TooltipContent className="text-foreground text-white text-xs ">Status</TooltipContent>
                                                </Tooltip>

                                                <SquarePen
                                                    className="w-5 h-5 md:w-4 md:h-4 text-blue-500 hover:text-blue-600 cursor-pointer"
                                                    onClick={() => handleEditClick(transaction)}
                                                />

                                                <Trash
                                                    className="w-5 h-5 md:w-4 md:h-4 text-rose-500 hover:text-rose-600 cursor-pointer"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteClick(transaction);
                                                    }}
                                                />
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

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
        </TooltipProvider>
    );
};