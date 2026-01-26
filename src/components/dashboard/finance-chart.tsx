import {useEffect, useState} from 'react';
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
import {useTheme} from '@/components/theme-provider';
import { Transaction } from '@/model/types/Transaction';
import { IMes } from '@/model/IMes';

interface ChartData {
    name: string;
    receitas: number;
    despesas: number;
    investimentos: number;
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

        // Processamento dos dados por mês
        const monthlyData = IMes.map((monthName, monthIndex) => {
            const monthNumber = monthIndex + 1;
            const monthTransactions = transactions.filter(t => t.month === monthNumber);

            const receitas = monthTransactions
                .filter(t => t.type === 'RECEITA')
                .reduce((sum, t) => sum + t.amount, 0);

            const despesas = monthTransactions
                .filter(t => t.type === 'DESPESA')
                .reduce((sum, t) => sum + t.amount, 0);

            return {
                name: monthName.substring(0, 3),
                receitas,
                despesas,
                investimentos: 0 // Para futura implementação
            };
        });

        setChartData(monthlyData);
    }, [transactions, view, month, year]);

    const getColors = () => {
        return theme === 'dark'
            ? {
                receitas: 'hsl(var(--chart-2))',
                despesas: 'hsl(var(--chart-1))',
                investimentos: 'hsl(var(--chart-3))',
                grid: 'hsl(var(--muted))',
                text: 'hsl(var(--muted-foreground))'
            }
            : {
                receitas: 'hsl(var(--chart-2))',
                despesas: 'hsl(var(--chart-1))',
                investimentos: 'hsl(var(--chart-3))',
                grid: 'hsl(var(--muted))',
                text: 'hsl(var(--muted-foreground))'
            };
    };

    const colors = getColors();

    const renderChart = () => {
        switch (chartType) {
            case 'area':
                return (
                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorreceitas" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={colors.receitas} stopOpacity={0.8}/>
                                <stop offset="95%" stopColor={colors.receitas} stopOpacity={0.2}/>
                            </linearGradient>
                            <linearGradient id="colordespesas" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={colors.despesas} stopOpacity={0.8}/>
                                <stop offset="95%" stopColor={colors.despesas} stopOpacity={0.2}/>
                            </linearGradient>
                            <linearGradient id="colorinvestimentos" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={colors.investimentos} stopOpacity={0.8}/>
                                <stop offset="95%" stopColor={colors.investimentos} stopOpacity={0.2}/>
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="name" stroke={colors.text} fontSize={12} />
                        <YAxis stroke={colors.text} fontSize={12} />
                        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                        <Tooltip
                            formatter={(value: number) => formatCurrency(value)}
                            labelFormatter={(label) => `Mês: ${label}`}
                        />
                        <Legend />
                        <Area
                            type="monotone"
                            dataKey="receitas"
                            stroke={colors.receitas}
                            fillOpacity={1}
                            fill="url(#colorreceitas)"
                            animationDuration={1500}
                        />
                        <Area
                            type="monotone"
                            dataKey="despesas"
                            stroke={colors.despesas}
                            fillOpacity={1}
                            fill="url(#colordespesas)"
                            animationDuration={1500}
                        />
                        <Area
                            type="monotone"
                            dataKey="investimentos"
                            stroke={colors.investimentos}
                            fillOpacity={1}
                            fill="url(#colorinvestimentos)"
                            animationDuration={1500}
                        />
                    </AreaChart>

                );
            case 'bar':
                return (
                    <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                        <XAxis dataKey="name" stroke={colors.text} fontSize={12} />
                        <YAxis stroke={colors.text} fontSize={12} />
                        <Tooltip
                            formatter={(value: number) => formatCurrency(value)}
                            labelFormatter={(label) => `Mês: ${label}`}
                        />
                        <Legend />
                        <Bar
                            dataKey="receitas"
                            fill={colors.receitas}
                            animationDuration={1500}
                            radius={[4, 4, 0, 0]}
                        />
                        <Bar
                            dataKey="despesas"
                            fill={colors.despesas}
                            animationDuration={1500}
                            radius={[4, 4, 0, 0]}
                        />
                        <Bar
                            dataKey="investimentos"
                            fill={colors.investimentos}
                            animationDuration={1500}
                            radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                );
            case 'line':
                return (
                    <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                        <XAxis dataKey="name" stroke={colors.text} fontSize={12} />
                        <YAxis stroke={colors.text} fontSize={12} />
                        <Tooltip
                            formatter={(value: number) => formatCurrency(value)}
                            labelFormatter={(label) => `Mês: ${label}`}
                        />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="receitas"
                            stroke={colors.receitas}
                            activeDot={{ r: 8 }}
                            animationDuration={1500}
                        />
                        <Line
                            type="monotone"
                            dataKey="despesas"
                            stroke={colors.despesas}
                            animationDuration={1500}
                        />
                        <Line
                            type="monotone"
                            dataKey="investimentos"
                            stroke={colors.investimentos}
                            animationDuration={1500}
                        />
                    </LineChart>
                );
            default:
                return <></>;

        }
    };

    return (
        <div className="h-full w-full">
            <div className="mb-3 flex items-center justify-end space-x-2">
                <div className="text-sm font-medium">Gráfico:</div>
                <div className="flex items-center rounded-md bg-muted p-1 text-muted-foreground">
                    <button
                        onClick={() => setChartType('area')}
                        className={`rounded px-2 py-1 text-xs transition-colors ${
                            chartType === 'area' ? 'bg-background text-foreground' : 'hover:text-foreground'
                        }`}
                    >
                        Area
                    </button>
                    <button
                        onClick={() => setChartType('bar')}
                        className={`rounded px-2 py-1 text-xs transition-colors ${
                            chartType === 'bar' ? 'bg-background text-foreground' : 'hover:text-foreground'
                        }`}
                    >
                        Bar
                    </button>
                    <button
                        onClick={() => setChartType('line')}
                        className={`rounded px-2 py-1 text-xs transition-colors ${
                            chartType === 'line' ? 'bg-background text-foreground' : 'hover:text-foreground'
                        }`}
                    >
                        Line
                    </button>
                </div>
            </div>
            <div className="h-[250px] w-full animate-in fade-in zoom-in-95 duration-700">
                <ResponsiveContainer width="100%" height="100%">
                    {renderChart()}
                </ResponsiveContainer>
            </div>
        </div>
    );
};