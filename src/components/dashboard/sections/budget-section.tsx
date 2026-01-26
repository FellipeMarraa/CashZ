import {useState} from 'react';
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from '@/components/ui/card';
import {Progress} from '@/components/ui/progress';
import {Button} from '@/components/ui/button';
import {Tabs, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {
    ArrowRight,
    BarChart,
    Car,
    Coffee,
    Home,
    MoreHorizontal,
    PiggyBank,
    Plane,
    Plus,
    ShoppingBag,
    Utensils,
    Zap
} from 'lucide-react';
import {IMes} from "@/model/IMes.ts";

interface BudgetCategory {
    id: string;
    name: string;
    allocated: number;
    spent: number;
    color: string;
    icon: JSX.Element;
}

export const BudgetSection = () => {
    const [activeMonth, setActiveMonth] = useState(IMes[new Date().getMonth()]);
    const [exibePage] = useState(false);

    const categories: BudgetCategory[] = [
        {
            id: '1',
            name: 'Housing',
            allocated: 1500,
            spent: 1500,
            color: 'bg-chart-1 text-white',
            icon: <Home className="h-4 w-4"/>,
        },
        {
            id: '2',
            name: 'Groceries',
            allocated: 600,
            spent: 423.45,
            color: 'bg-chart-2 text-white',
            icon: <ShoppingBag className="h-4 w-4"/>,
        },
        {
            id: '3',
            name: 'Dining Out',
            allocated: 300,
            spent: 286.20,
            color: 'bg-chart-3 text-white',
            icon: <Utensils className="h-4 w-4"/>,
        },
        {
            id: '4',
            name: 'Transportation',
            allocated: 250,
            spent: 180.75,
            color: 'bg-chart-4 text-white',
            icon: <Car className="h-4 w-4"/>,
        },
        {
            id: '5',
            name: 'Utilities',
            allocated: 200,
            spent: 185.32,
            color: 'bg-chart-5 text-white',
            icon: <Zap className="h-4 w-4"/>,
        },
        {
            id: '6',
            name: 'Entertainment',
            allocated: 150,
            spent: 132.80,
            color: 'bg-primary text-white',
            icon: <Coffee className="h-4 w-4"/>,
        },
        {
            id: '7',
            name: 'Travel',
            allocated: 400,
            spent: 0,
            color: 'bg-muted text-foreground',
            icon: <Plane className="h-4 w-4"/>,
        },
        {
            id: '8',
            name: 'Savings',
            allocated: 800,
            spent: 800,
            color: 'bg-success text-white',
            icon: <PiggyBank className="h-4 w-4"/>,
        },
    ];

    const totalAllocated = categories.reduce((sum, category) => sum + category.allocated, 0);
    const totalSpent = categories.reduce((sum, category) => sum + category.spent, 0);
    const remainingBudget = totalAllocated - totalSpent;

    const categoryPercentages = categories.map(category => ({
        ...category,
        percentage: (category.allocated / totalAllocated) * 100
    }));

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
                    {/*  <h2 className="text-3xl font-bold tracking-tight">Budget</h2>*/}
                    {/*  <p className="text-muted-foreground">Track and manage your spending categories.</p>*/}
                    {/*</div>*/}

                    <div className="flex items-center justify-between">
                        <Tabs defaultValue={activeMonth} onValueChange={(value) => setActiveMonth(value)}
                              className="w-full">
                            <div className="flex items-center justify-between">
                                <TabsList>
                                    <TabsTrigger value="may">May</TabsTrigger>
                                    <TabsTrigger value="june">June</TabsTrigger>
                                    <TabsTrigger value="july">July</TabsTrigger>
                                    <TabsTrigger value="august">August</TabsTrigger>
                                </TabsList>
                                <Select value="monthly">
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Monthly Budget"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="monthly">Monthly Budget</SelectItem>
                                        <SelectItem value="annual">Annual Budget</SelectItem>
                                        <SelectItem value="custom">Custom Period</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </Tabs>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">${totalAllocated.toFixed(2)}</div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Across {categories.length} categories
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">${totalSpent.toFixed(2)}</div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {((totalSpent / totalAllocated) * 100).toFixed(1)}% of total budget
                                </p>
                                <Progress
                                    value={(totalSpent / totalAllocated) * 100}
                                    className="h-2 mt-2"
                                />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Remaining</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">${remainingBudget.toFixed(2)}</div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    ${(remainingBudget / (new Date(2025, 6, 31).getDate() - new Date().getDate())).toFixed(2)} per
                                    day
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Largest Category</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">Housing</div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    ${categories.find(c => c.name === 'Housing')?.allocated.toFixed(2)} ({((categories.find(c => c.name === 'Housing')?.allocated || 0) / totalAllocated * 100).toFixed(1)}%
                                    of budget)
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-4 md:grid-cols-7">
                        <Card className="col-span-7 md:col-span-4">
                            <CardHeader>
                                <CardTitle>Category Breakdown</CardTitle>
                                <CardDescription>Your budget allocation by category.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    {categories.map((category) => {
                                        const percentSpent = (category.spent / category.allocated) * 100;
                                        return (
                                            <div key={category.id} className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-2">
                                                        <div
                                                            className={`flex items-center justify-center rounded-full p-1.5 ${category.color}`}>
                                                            {category.icon}
                                                        </div>
                                                        <span className="text-sm font-medium">{category.name}</span>
                                                    </div>
                                                    <div className="text-sm">
                        <span className={percentSpent > 90 ? 'text-destructive font-medium' : 'font-medium'}>
                          ${category.spent.toFixed(2)}
                        </span>
                                                        <span
                                                            className="text-muted-foreground"> / ${category.allocated.toFixed(2)}</span>
                                                    </div>
                                                </div>
                                                <div className="relative pt-1">
                                                    <Progress
                                                        value={percentSpent > 100 ? 100 : percentSpent}
                                                        className={`h-2 ${percentSpent > 90 ? 'bg-destructive/20 text-destructive' : ''}`}
                                                        indicatorClassName={percentSpent > 100 ? 'bg-destructive' : ''}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button variant="outline" className="w-full">
                                    <Plus className="mr-2 h-4 w-4"/>
                                    Add New Category
                                </Button>
                            </CardFooter>
                        </Card>

                        <Card className="col-span-7 md:col-span-3">
                            <CardHeader>
                                <CardTitle>Budget Allocation</CardTitle>
                                <CardDescription>Visual breakdown of your budget.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex items-center justify-center">
                                <div className="relative h-60 w-60">
                                    <div className="absolute inset-0 flex items-center justify-center rounded-full">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold">${totalAllocated.toFixed(0)}</div>
                                            <div className="text-xs text-muted-foreground">Total Budget</div>
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
                                        {categoryPercentages.reduce((acc, category, i) => {
                                            const prevPercentage = i === 0 ? 0 : categoryPercentages
                                                .slice(0, i)
                                                .reduce((sum, c) => sum + c.percentage, 0);

                                            const strokeDasharray = 2 * Math.PI * 40;
                                            // const strokeDashoffset = strokeDasharray * (1 - category.percentage / 100);

                                            return [
                                                ...acc,
                                                <circle
                                                    key={category.id}
                                                    cx="50"
                                                    cy="50"
                                                    r="40"
                                                    fill="none"
                                                    stroke={`hsl(var(--${category.color.split(' ')[0].substring(3)}))`}
                                                    strokeWidth="10"
                                                    strokeDasharray={`${category.percentage * strokeDasharray / 100} ${strokeDasharray}`}
                                                    strokeDashoffset={`-${prevPercentage * strokeDasharray / 100}`}
                                                    style={{transition: 'stroke-dashoffset 0.5s ease'}}
                                                />
                                            ];
                                        }, [] as JSX.Element[])}
                                    </svg>
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <div className="grid gap-2">
                                    <Button variant="outline" size="sm" className="h-8 w-full justify-between">
                                        <div className="flex items-center">
                                            <BarChart className="mr-2 h-4 w-4"/>
                                            <span>View Reports</span>
                                        </div>
                                        <ArrowRight className="h-4 w-4"/>
                                    </Button>
                                    <Button variant="outline" size="sm" className="h-8 w-full justify-between">
                                        <div className="flex items-center">
                                            <MoreHorizontal className="mr-2 h-4 w-4"/>
                                            <span>More Options</span>
                                        </div>
                                        <ArrowRight className="h-4 w-4"/>
                                    </Button>
                                </div>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            )}
        </>
    );
};