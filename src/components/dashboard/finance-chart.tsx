"use client"

import { useEffect, useState } from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import { useTheme } from '@/components/theme-provider';
import { Transaction } from '@/model/types/Transaction';
import { IMes } from '@/model/IMes';
import { cn } from '@/lib/utils';

interface ChartData {
    name: string;
    receitas: number;
    despesas: number;
}

interface FinanceChartProps {
    transactions?: Transaction[];
    view: 'month' | 'year';
    month?: string;
    year: number;
}

export const FinanceChart = ({
                                 transactions,
                                 view,
                                 month,
                                 year
                             }: FinanceChartProps) => {
    const { theme } = useTheme();
    const [chartType, setChartType] = useState<'area' | 'bar' | 'line'>('area');
    const [chartData, setChartData] = useState<ChartData[]>([]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    useEffect(() => {
        if (!transactions) return;

        if (view === 'year') {
            const monthlyData = IMes.map((monthName, monthIndex) => {
                const monthNumber = monthIndex + 1;
                const monthTransactions = transactions.filter(t => t.month === monthNumber);

                return {
                    name: monthName.substring(0, 3),
                    receitas: monthTransactions.filter(t => t.type === 'RECEITA').reduce((acc, t) => acc + t.amount, 0),
                    despesas: monthTransactions.filter(t => t.type === 'DESPESA').reduce((acc, t) => acc + t.amount, 0),
                };
            });
            setChartData(monthlyData);
        } else {
            // VISÃO MENSAL: Somatória única do mês selecionado
            const receitas = transactions
                .filter(t => t.type === 'RECEITA')
                .reduce((acc, t) => acc + t.amount, 0);

            const despesas = transactions
                .filter(t => t.type === 'DESPESA')
                .reduce((acc, t) => acc + t.amount, 0);

            setChartData([{
                name: month || "Mês Selecionado",
                receitas,
                despesas,
            }]);
        }
    }, [transactions, view, month, year]);

    const colors = {
        receitas: 'hsl(var(--success))',
        despesas: 'hsl(var(--destructive))',
        grid: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        text: 'hsl(var(--muted-foreground))'
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="rounded-lg border bg-background p-3 shadow-xl dark:bg-[#282a36] dark:border-slate-700 min-w-[160px]">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {label}
                    </p>
                    <div className="space-y-1.5">
                        {payload.map((entry: any, index: number) => (
                            <div key={index} className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                    <span className="text-xs text-foreground">{entry.name}:</span>
                                </div>
                                <span className="text-xs font-mono font-bold text-foreground">
                                    {formatCurrency(entry.value)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return null;
    };

    const renderChart = () => {
        const commonProps = {
            data: chartData,
            margin: { top: 10, right: 10, left: -10, bottom: 0 }
        };

        const axes = (
            <>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.grid} />
                <XAxis
                    dataKey="name"
                    stroke={colors.text}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                />
                <YAxis
                    stroke={colors.text}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `R$${value}`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    wrapperStyle={{ paddingTop: '0', paddingBottom: '20px' }}
                    formatter={(value) => <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{value}</span>}
                />
            </>
        );

        if (view === 'month') {
            return (
                <BarChart {...commonProps}>
                    {axes}
                    <Bar
                        name="Receitas"
                        dataKey="receitas"
                        fill={colors.receitas}
                        animationDuration={1500}
                        radius={[4, 4, 0, 0]}
                        barSize={60}
                    />
                    <Bar
                        name="Despesas"
                        dataKey="despesas"
                        fill={colors.despesas}
                        animationDuration={1500}
                        radius={[4, 4, 0, 0]}
                        barSize={60}
                    />
                </BarChart>
            );
        }

        switch (chartType) {
            case 'area':
                return (
                    <AreaChart {...commonProps}>
                        <defs>
                            <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={colors.receitas} stopOpacity={0.3}/>
                                <stop offset="95%" stopColor={colors.receitas} stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorDes" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={colors.despesas} stopOpacity={0.3}/>
                                <stop offset="95%" stopColor={colors.despesas} stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        {axes}
                        <Area name="Receitas" type="monotone" dataKey="receitas" stroke={colors.receitas} fill="url(#colorRec)" strokeWidth={2} />
                        <Area name="Despesas" type="monotone" dataKey="despesas" stroke={colors.despesas} fill="url(#colorDes)" strokeWidth={2} />
                    </AreaChart>
                );
            case 'line':
                return (
                    <LineChart {...commonProps}>
                        {axes}
                        <Line name="Receitas" type="monotone" dataKey="receitas" stroke={colors.receitas} strokeWidth={3} dot={{ r: 4 }} />
                        <Line name="Despesas" type="monotone" dataKey="despesas" stroke={colors.despesas} strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                );
            case 'bar':
                return (
                    <BarChart {...commonProps}>
                        {axes}
                        <Bar name="Receitas" dataKey="receitas" fill={colors.receitas} radius={[4, 4, 0, 0]} barSize={15} />
                        <Bar name="Despesas" dataKey="despesas" fill={colors.despesas} radius={[4, 4, 0, 0]} barSize={15} />
                    </BarChart>
                );
            default:
                return <></>;
        }
    };

    return (
        <div className="h-full w-full">
            <div className="mb-4 flex items-center justify-between">
                <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    {view === 'month' ? `Resumo de ${month}` : `Evolução ${year}`}
                </div>

                {view === 'year' && (
                    <div className="flex items-center rounded-lg bg-muted/50 p-1">
                        {(['area', 'bar', 'line'] as const).map((type) => (
                            <button
                                key={type}
                                onClick={() => setChartType(type)}
                                className={cn(
                                    "rounded-md px-3 py-1 text-[10px] font-bold uppercase transition-all",
                                    chartType === type
                                        ? "bg-background text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <div className="h-[250px] w-full animate-in fade-in zoom-in-95 duration-1000">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        {renderChart()}
                    </ResponsiveContainer>
                ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground italic">
                        Nenhuma movimentação neste período.
                    </div>
                )}
            </div>
        </div>
    );
};