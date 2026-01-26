import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from '@/components/ui/card';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Button} from '@/components/ui/button';
import {Progress} from '@/components/ui/progress';
import {BadgeDollarSign, ChevronRight, CreditCard, Landmark, Wallet} from 'lucide-react';
import {useState} from "react";

interface Account {
    id: string;
    name: string;
    type: 'checking' | 'savings' | 'credit' | 'investment';
    institution: string;
    balance: number;
    lastActivity: string;
    icon: JSX.Element;
    color: string;
    limit?: number;
}

export const AccountsSection = () => {

    const [exibePage] = useState(false);

    const accounts: Account[] = [
        {
            id: '1',
            name: 'Primary Checking',
            type: 'checking',
            institution: 'Capital One',
            balance: 8453.21,
            lastActivity: 'Today',
            icon: <Landmark className="h-5 w-5"/>,
            color: 'bg-primary/10 text-primary',
        },
        {
            id: '2',
            name: 'High-Yield Savings',
            type: 'savings',
            institution: 'Ally Bank',
            balance: 15750.80,
            lastActivity: 'Yesterday',
            icon: <Wallet className="h-5 w-5"/>,
            color: 'bg-chart-2/10 text-chart-2',
        },
        {
            id: '3',
            name: 'Rewards Credit Card',
            type: 'credit',
            institution: 'Chase',
            balance: 1432.50,
            limit: 10000,
            lastActivity: '2 days ago',
            icon: <CreditCard className="h-5 w-5"/>,
            color: 'bg-chart-3/10 text-chart-3',
        },
        {
            id: '4',
            name: 'Investment Portfolio',
            type: 'investment',
            institution: 'Vanguard',
            balance: 34120.75,
            lastActivity: 'Today',
            icon: <BadgeDollarSign className="h-5 w-5"/>,
            color: 'bg-chart-4/10 text-chart-4',
        },
    ];

    return (
        <>
            {!exibePage ? (
                <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-in fade-in slide-in-from-top-8 duration-700">
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
            ):(
                <div className="space-y-6 animate-in fade-in duration-700">
                    {/*<div>*/}
                    {/*  <h2 className="text-3xl font-bold tracking-tight">Accounts</h2>*/}
                    {/*  <p className="text-muted-foreground">Manage your financial accounts in one place.</p>*/}
                    {/*</div>*/}

                    <Tabs defaultValue="all" className="space-y-4">
                        <div className="flex items-center justify-between">
                            <TabsList>
                                <TabsTrigger value="all">All Accounts</TabsTrigger>
                                <TabsTrigger value="checking">Checking</TabsTrigger>
                                <TabsTrigger value="savings">Savings</TabsTrigger>
                                <TabsTrigger value="credit">Credit</TabsTrigger>
                                <TabsTrigger value="investment">Investments</TabsTrigger>
                            </TabsList>
                            <Button variant="outline">+ Link Account</Button>
                        </div>

                        <TabsContent value="all" className="mt-0 space-y-4">
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <Card className="overflow-hidden">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            ${accounts.reduce((sum, account) => sum + (account.type !== 'credit' ? account.balance : 0), 0).toFixed(2)}
                                        </div>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Across {accounts.length} accounts
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card className="overflow-hidden">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">Available Credit</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            ${accounts.filter(a => a.type === 'credit')
                                            .reduce((sum, account) => sum + ((account.limit || 0) - account.balance), 0).toFixed(2)}
                                        </div>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            ${accounts.filter(a => a.type === 'credit')
                                            .reduce((sum, account) => sum + (account.limit || 0), 0).toFixed(2)} total
                                            credit
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card className="overflow-hidden">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">Liquid Assets</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            ${accounts.filter(a => a.type === 'checking' || a.type === 'savings')
                                            .reduce((sum, account) => sum + account.balance, 0).toFixed(2)}
                                        </div>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Immediately available funds
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card className="overflow-hidden">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">Investments</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            ${accounts.filter(a => a.type === 'investment')
                                            .reduce((sum, account) => sum + account.balance, 0).toFixed(2)}
                                        </div>
                                        <p className="mt-1 text-xs text-success">
                                            ↗ $5,432.10 (18.9%)
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <Card className="col-span-1 md:col-span-2">
                                    <CardHeader>
                                        <CardTitle>Your Accounts</CardTitle>
                                        <CardDescription>Monitor all your financial accounts in one place.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid gap-4">
                                            {accounts.map((account) => (
                                                <div key={account.id}
                                                     className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                                                    <div className="flex items-center space-x-4">
                                                        <div className={`rounded-full p-2 ${account.color}`}>
                                                            {account.icon}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">{account.name}</p>
                                                            <p className="text-sm text-muted-foreground">{account.institution}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <div className="mr-4 text-right">
                                                            <p className="font-medium">${account.balance.toFixed(2)}</p>
                                                            <p className="text-xs text-muted-foreground">Last
                                                                activity: {account.lastActivity}</p>
                                                        </div>
                                                        <Button variant="ghost" size="icon">
                                                            <ChevronRight className="h-4 w-4"/>
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                {accounts.find(a => a.type === 'credit') && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Credit Utilization</CardTitle>
                                            <CardDescription>Track your credit usage across accounts.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-8">
                                            {accounts.filter(a => a.type === 'credit').map((account) => {
                                                const utilization = (account.balance / (account.limit || 1)) * 100;
                                                return (
                                                    <div key={account.id} className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <div className="space-y-1">
                                                                <p className="text-sm font-medium leading-none">{account.name}</p>
                                                                <p className="text-xs text-muted-foreground">{account.institution}</p>
                                                            </div>
                                                            <div className="text-sm text-right">
                                                                <p className="font-medium">${account.balance} /
                                                                    ${account.limit}</p>
                                                                <p className={`text-xs ${utilization > 30 ? 'text-warning' : 'text-success'}`}>
                                                                    {utilization.toFixed(1)}% utilized
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <Progress value={utilization} className="h-2"/>
                                                    </div>
                                                );
                                            })}
                                        </CardContent>
                                        <CardFooter>
                                            <p className="text-xs text-muted-foreground">
                                                Keep utilization below 30% for optimal credit health.
                                            </p>
                                        </CardFooter>
                                    </Card>
                                )}

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Account Activity</CardTitle>
                                        <CardDescription>Recent updates across your accounts.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div className="flex items-center space-x-4">
                                                <div className="rounded-full bg-success/20 p-2 text-success">
                                                    <BadgeDollarSign className="h-4 w-4"/>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium leading-none">Interest Deposit</p>
                                                    <p className="text-xs text-muted-foreground">High-Yield Savings</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-medium text-success">+$12.47</p>
                                                    <p className="text-xs text-muted-foreground">Today</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-4">
                                                <div className="rounded-full bg-chart-3/20 p-2 text-chart-3">
                                                    <CreditCard className="h-4 w-4"/>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium leading-none">Credit Card Payment</p>
                                                    <p className="text-xs text-muted-foreground">From Primary Checking</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-medium">-$500.00</p>
                                                    <p className="text-xs text-muted-foreground">Yesterday</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-4">
                                                <div className="rounded-full bg-chart-4/20 p-2 text-chart-4">
                                                    <Landmark className="h-4 w-4"/>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium leading-none">Salary Deposit</p>
                                                    <p className="text-xs text-muted-foreground">Direct Deposit</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-medium text-success">+$3,750.00</p>
                                                    <p className="text-xs text-muted-foreground">Jul 1</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-4">
                                                <div className="rounded-full bg-primary/20 p-2 text-primary">
                                                    <BadgeDollarSign className="h-4 w-4"/>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium leading-none">Investment Purchase</p>
                                                    <p className="text-xs text-muted-foreground">Vanguard Index Fund</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-medium">-$1,000.00</p>
                                                    <p className="text-xs text-muted-foreground">Jun 28</p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <Button variant="outline" className="w-full">View all activity</Button>
                                    </CardFooter>
                                </Card>
                            </div>
                        </TabsContent>

                        {['checking', 'savings', 'credit', 'investment'].map((type) => (
                            <TabsContent key={type} value={type} className="mt-0">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="capitalize">{type} Accounts</CardTitle>
                                        <CardDescription>Manage your {type} accounts.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid gap-4">
                                            {accounts.filter(a => a.type === type).map((account) => (
                                                <div key={account.id}
                                                     className="flex items-center justify-between rounded-lg border p-4">
                                                    <div className="flex items-center space-x-4">
                                                        <div className={`rounded-full p-2 ${account.color}`}>
                                                            {account.icon}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">{account.name}</p>
                                                            <p className="text-sm text-muted-foreground">{account.institution}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <div className="mr-4 text-right">
                                                            <p className="font-medium">${account.balance.toFixed(2)}</p>
                                                            <p className="text-xs text-muted-foreground">Last
                                                                activity: {account.lastActivity}</p>
                                                        </div>
                                                        <Button variant="ghost" size="icon">
                                                            <ChevronRight className="h-4 w-4"/>
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        ))}
                    </Tabs>
                </div>
            )}
        </>
    );
};