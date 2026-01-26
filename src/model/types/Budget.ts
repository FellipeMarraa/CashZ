export interface Budget {
    id?: string;
    userId: string;
    categoryId: string; // ID da categoria vinculada
    categoryName: string; // Cache do nome para facilitar exibição
    amount: number; // Limite definido pelo usuário
    month: number; // 1 a 12
    year: number;
}