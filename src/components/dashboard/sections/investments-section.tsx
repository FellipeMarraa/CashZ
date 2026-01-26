import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from '@/components/ui/card';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Button} from '@/components/ui/button';
import {Progress} from '@/components/ui/progress';
import {DollarSign, RefreshCcw, TrendingDown, TrendingUp} from 'lucide-react';
import {FinanceChart} from '@/components/dashboard/finance-chart';
import {useState} from "react";

interface Investment {
    id: string;
    name: string;
    symbol: string;
    shares: number;
    price: number;
    previousPrice: number;
    valueChange: number;
    percentChange: number;
}

export const InvestmentsSection = () => {

    const [exibePage] = useState(false);

    const investments: Investment[] = [
        {
            id: '1',
            name: 'Vanguard Total Stock Market ETF',
            symbol: 'VTI',
            shares: 45.2,
            price: 253.48,
            previousPrice: 251.22,
            valueChange: 102.18,
            percentChange: 0.9,
        },
        {
            id: '2',
            name: 'Apple Inc.',
            symbol: 'AAPL',
            shares: 28,
            price: 187.05,
            previousPrice: 185.92,
            valueChange: 31.64,
            percentChange: 0.6,
        },
        {
            id: '3',
            name: 'Amazon.com Inc.',
            symbol: 'AMZN',
            shares: 12,
            price: 178.15,
            previousPrice: 180.75,
            valueChange: -31.2,
            percentChange: -1.4,
        },
        {
            id: '4',
            name: 'Microsoft Corporation',
            symbol: 'MSFT',
            shares: 15,
            price: 420.55,
            previousPrice: 418.20,
            valueChange: 35.25,
            percentChange: 0.5,
        },
        {
            id: '5',
            name: 'Berkshire Hathaway Inc.',
            symbol: 'BRK.B',
            shares: 8,
            price: 412.89,
            previousPrice: 410.15,
            valueChange: 21.92,
            percentChange: 0.7,
        },
    ];

    const totalValue = investments.reduce((sum, inv) => sum + (inv.price * inv.shares), 0);
    const totalValueChange = investments.reduce((sum, inv) => sum + inv.valueChange, 0);
    const totalPercentChange = (totalValueChange / (totalValue - totalValueChange)) * 100;

    // Portfolio allocation data
    const allocation = [
        {name: 'US Stocks', value: 65},
        {name: 'International Stocks', value: 20},
        {name: 'Bonds', value: 10},
        {name: 'Cash', value: 5},
    ];

    return (

        <>
            {!exibePage ? (
                <div
                    className="flex flex-col items-center justify-center h-[60vh] text-center animate-in fade-in slide-in-from-top-8 duration-700">
                    <svg
                        className="w-16 h-16 mb-4 text-muted-foreground animate-bounce"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v3.75m0 3.75h.008v-.008H12v.008zM21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    <h2 className="text-2xl font-semibold">Página em manutenção</h2>
                    <p className="mt-2 text-muted-foreground">Estamos trabalhando nisso. Em breve estará disponível!</p>
                </div>
            ) : (

                <div className="space-y-6 animate-in fade-in duration-700">
                    {/*<div>*/}
                    {/*  <h2 className="text-3xl font-bold tracking-tight">Investments</h2>*/}
                    {/*  <p className="text-muted-foreground">Track and manage your investment portfolio.</p>*/}
                    {/*</div>*/}

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">${totalValue.toFixed(2)}</div>
                                <p className={`mt-1 text-xs ${totalPercentChange > 0 ? 'text-success' : totalPercentChange < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                                    {totalPercentChange > 0 ? '↗' : '↘'} ${Math.abs(totalValueChange).toFixed(2)} ({totalPercentChange.toFixed(2)}%)
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Day's Change</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div
                                    className={`text-2xl font-bold ${totalValueChange > 0 ? 'text-success' : totalValueChange < 0 ? 'text-destructive' : ''}`}>
                                    {totalValueChange > 0 ? '+' : ''}{totalValueChange.toFixed(2)}
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {totalPercentChange.toFixed(2)}% today
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Portfolio Diversity</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{investments.length}</div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Positions across various sectors
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {investments.sort((a, b) => b.percentChange - a.percentChange)[0].symbol}
                                </div>
                                <p className="mt-1 text-xs text-success">
                                    ↗ {investments.sort((a, b) => b.percentChange - a.percentChange)[0].percentChange.toFixed(2)}%
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <Tabs defaultValue="holdings" className="space-y-4">
                        <div className="flex items-center justify-between">
                            <TabsList>
                                <TabsTrigger value="holdings">Holdings</TabsTrigger>
                                <TabsTrigger value="performance">Performance</TabsTrigger>
                                <TabsTrigger value="allocation">Allocation</TabsTrigger>
                            </TabsList>
                            <div className="flex items-center space-x-2">
                                <Button variant="outline" size="sm" className="h-8">
                                    <RefreshCcw className="mr-2 h-4 w-4"/>
                                    <span>Refresh</span>
                                </Button>
                                <Button variant="outline" size="sm" className="h-8">
                                    <DollarSign className="mr-2 h-4 w-4"/>
                                    <span>Trade</span>
                                </Button>
                            </div>
                        </div>

                        <TabsContent value="holdings" className="space-y-4 mt-0">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Investment Holdings</CardTitle>
                                    <CardDescription>Your current investment positions.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="rounded-md border">
                                        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 p-4 font-medium">
                                            <div>Name</div>
                                            <div>Shares</div>
                                            <div>Price</div>
                                            <div>Value</div>
                                            <div>Change</div>
                                        </div>
                                        {investments.map((investment) => (
                                            <div
                                                key={investment.id}
                                                className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] items-center gap-4 border-t p-4 hover:bg-muted/50 transition-colors"
                                            >
                                                <div>
                                                    <div className="font-medium">{investment.symbol}</div>
                                                    <div
                                                        className="text-xs text-muted-foreground truncate max-w-[200px]">{investment.name}</div>
                                                </div>
                                                <div>{investment.shares.toFixed(2)}</div>
                                                <div>${investment.price.toFixed(2)}</div>
                                                <div>${(investment.price * investment.shares).toFixed(2)}</div>
                                                <div
                                                    className={`flex items-center ${investment.percentChange > 0 ? 'text-success' : investment.percentChange < 0 ? 'text-destructive' : ''}`}>
                                                    {investment.percentChange > 0 ? (
                                                        <TrendingUp className="mr-1 h-4 w-4"/>
                                                    ) : investment.percentChange < 0 ? (
                                                        <TrendingDown className="mr-1 h-4 w-4"/>
                                                    ) : null}
                                                    <span>{investment.percentChange > 0 ? '+' : ''}{investment.percentChange.toFixed(2)}%</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="performance" className="space-y-4 mt-0">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Portfolio Performance</CardTitle>
                                    <CardDescription>Track your investment returns over time.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[300px]">
                                        <FinanceChart view={'month'} year={new Date().getFullYear()}/>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-between">
                                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                                        <div>
                                            <div className="text-xs font-medium uppercase text-muted-foreground">
                                                Day
                                            </div>
                                            <div className="text-lg font-bold text-success">+1.2%</div>
                                        </div>
                                        <div>
                                            <div className="text-xs font-medium uppercase text-muted-foreground">
                                                Week
                                            </div>
                                            <div className="text-lg font-bold text-success">+3.8%</div>
                                        </div>
                                        <div>
                                            <div className="text-xs font-medium uppercase text-muted-foreground">
                                                Month
                                            </div>
                                            <div className="text-lg font-bold text-success">+12.3%</div>
                                        </div>
                                        <div>
                                            <div className="text-xs font-medium uppercase text-muted-foreground">
                                                Year
                                            </div>
                                            <div className="text-lg font-bold text-success">+24.7%</div>
                                        </div>
                                    </div>
                                </CardFooter>
                            </Card>
                        </TabsContent>

                        <TabsContent value="allocation" className="space-y-4 mt-0">
                            <div className="grid gap-4 md:grid-cols-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Asset Allocation</CardTitle>
                                        <CardDescription>Distribution of your investment portfolio.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex h-[300px] items-center justify-center">
                                            <div className="relative h-60 w-60">
                                                <div
                                                    className="absolute inset-0 flex items-center justify-center rounded-full">
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold">100%</div>
                                                        <div className="text-xs text-muted-foreground">Total</div>
                                                    </div>
                                                </div>
                                                <svg viewBox="0 0 100 100" className="transform -rotate-90">
                                                    <circle
                                                        cx="50"
                                                        cy="50"
                                                        r="40"
                                                        fill="none"
                                                        stroke="hsl(var(--muted))"
                                                        strokeWidth="10"
                                                    />
                                                    {allocation.reduce((acc, item, i) => {
                                                        const prevPercentage = i === 0 ? 0 : allocation
                                                            .slice(0, i)
                                                            .reduce((sum, c) => sum + c.value, 0);

                                                        const strokeDasharray = 2 * Math.PI * 40;
                                                        // const strokeDashoffset = strokeDasharray * (1 - item.value / 100);

                                                        // Use chart colors from our theme
                                                        const colors = ['--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5'];

                                                        return [
                                                            ...acc,
                                                            <circle
                                                                key={item.name}
                                                                cx="50"
                                                                cy="50"
                                                                r="40"
                                                                fill="none"
                                                                stroke={`hsl(var(${colors[i % colors.length]}))`}
                                                                strokeWidth="10"
                                                                strokeDasharray={`${item.value * strokeDasharray / 100} ${strokeDasharray}`}
                                                                strokeDashoffset={`-${prevPercentage * strokeDasharray / 100}`}
                                                                style={{transition: 'stroke-dashoffset 0.5s ease'}}
                                                            />
                                                        ];
                                                    }, [] as JSX.Element[])}
                                                </svg>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <div className="grid w-full grid-cols-2 gap-2">
                                            {allocation.map((item, i) => {
                                                const colors = ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5'];
                                                return (
                                                    <div key={item.name} className="flex items-center space-x-2">
                                                        <div
                                                            className={`h-3 w-3 rounded-full bg-${colors[i % colors.length]}`}/>
                                                        <div className="flex items-center space-x-2">
                                                            <span className="text-sm font-medium">{item.name}</span>
                                                            <span
                                                                className="text-sm text-muted-foreground">{item.value}%</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </CardFooter>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Sector Breakdown</CardTitle>
                                        <CardDescription>Distribution of investments by sector.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <div className="h-3 w-3 rounded-full bg-chart-1"/>
                                                    <span className="text-sm font-medium">Technology</span>
                                                </div>
                                                <span className="text-sm font-medium">38%</span>
                                            </div>
                                            <Progress value={38} className="h-2"/>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <div className="h-3 w-3 rounded-full bg-chart-2"/>
                                                    <span className="text-sm font-medium">Financial Services</span>
                                                </div>
                                                <span className="text-sm font-medium">22%</span>
                                            </div>
                                            <Progress value={22} className="h-2"/>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <div className="h-3 w-3 rounded-full bg-chart-3"/>
                                                    <span className="text-sm font-medium">Healthcare</span>
                                                </div>
                                                <span className="text-sm font-medium">15%</span>
                                            </div>
                                            <Progress value={15} className="h-2"/>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <div className="h-3 w-3 rounded-full bg-chart-4"/>
                                                    <span className="text-sm font-medium">Consumer Cyclical</span>
                                                </div>
                                                <span className="text-sm font-medium">12%</span>
                                            </div>
                                            <Progress value={12} className="h-2"/>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <div className="h-3 w-3 rounded-full bg-chart-5"/>
                                                    <span className="text-sm font-medium">Communication Services</span>
                                                </div>
                                                <span className="text-sm font-medium">8%</span>
                                            </div>
                                            <Progress value={8} className="h-2"/>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <div className="h-3 w-3 rounded-full bg-primary"/>
                                                    <span className="text-sm font-medium">Other Sectors</span>
                                                </div>
                                                <span className="text-sm font-medium">5%</span>
                                            </div>
                                            <Progress value={5} className="h-2"/>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            )}
        </>
    );
};