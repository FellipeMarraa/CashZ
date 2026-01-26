export interface Transaction {
    id: string;
    date: Date;
    description: string;
    amount: number;
    month: number;
    year: number;
    type: 'RECEITA' | 'DESPESA';
    recurrence: 'UNICO' | 'PARCELADO' | 'FIXO';
    status: 'PAGA' | 'PENDENTE' | 'RECEBIDA';
    numInstallments?: number;
    currentInstallment?: number;
    reference?: string;
    category: {
        id: string;
        name: string;
    };
    owner: {
        id: string;
        name: string;
        email: string;
    };
    sharedWith?: Array<{
        id: string;
        name: string;
        email: string;
    }>;
}

export type TransactionType = 'all' | 'RECEITA' | 'DESPESA';