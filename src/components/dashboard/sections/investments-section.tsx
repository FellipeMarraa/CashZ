"use client"

import {useMemo, useState} from 'react';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Progress} from '@/components/ui/progress';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {
    ArrowUpCircle,
    Banknote,
    BrainCircuit,
    Landmark,
    List,
    PieChart,
    Plus,
    ShieldCheck,
    Target,
    TrendingUp,
    Zap,
    Info
} from 'lucide-react';
import {cn} from "@/lib/utils";
import {formatTransactionAmount} from '@/hooks/useTransactions';
import {useDialogManager} from "@/context/DialogManagerContext";
import {TutorialWizard} from "@/components/tutorial-wizard";
import {AddInvestmentForm} from "@/components/add-Investment-form.tsx";

// --- TIPAGEM ---
type InvestmentClass = 'fixed' | 'stocks' | 'international' | 'crypto';

export interface InvestmentItem {
    id: string;
    name: string;
    category: InvestmentClass;
    amountInvested: number;
    currentValue: number;
    institution: string;
    indexador?: string;
    taxa?: number;
    quantity?: number;
    averagePrice?: number;
}

const INVESTMENT_PROFILES = {
    conservative: {
        label: "Conservador",
        icon: ShieldCheck,
        color: "text-blue-500",
        description: "Foco em proteção de capital e liquidez.",
        allocation: { fixed: 80, stocks: 15, international: 5, crypto: 0 }
    },
    moderate: {
        label: "Moderado",
        icon: TrendingUp,
        color: "text-emerald-500",
        description: "Equilíbrio entre segurança e crescimento.",
        allocation: { fixed: 50, stocks: 35, international: 10, crypto: 5 }
    },
    aggressive: {
        label: "Arrojado",
        icon: Zap,
        color: "text-purple-500",
        description: "Busca máxima rentabilidade aceitando riscos.",
        allocation: { fixed: 20, stocks: 50, international: 20, crypto: 10 }
    }
};

export const InvestmentsSection = () => {
    const { setActiveDialog } = useDialogManager();
    const [profile, setProfile] = useState<keyof typeof INVESTMENT_PROFILES>('moderate');
    const [investmentToEdit, setInvestmentToEdit] = useState<InvestmentItem | null>(null);

    const [investmentsList, setInvestmentsList] = useState<InvestmentItem[]>([
        { id: '1', name: 'Tesouro Selic 2027', category: 'fixed', amountInvested: 10000, currentValue: 10850, institution: 'XP Investimentos', indexador: 'SELIC', taxa: 100 },
        { id: '2', name: 'ITUB4 (Itaú)', category: 'stocks', amountInvested: 4000, currentValue: 4200, institution: 'NuInvest', quantity: 100, averagePrice: 40 },
        { id: '3', name: 'Ethereum', category: 'crypto', amountInvested: 1000, currentValue: 1400, institution: 'Binance', quantity: 0.05, averagePrice: 20000 }
    ]);

    const totalsByCategory = useMemo(() => {
        return investmentsList.reduce((acc, inv) => {
            acc[inv.category] = (acc[inv.category] || 0) + inv.currentValue;
            return acc;
        }, { fixed: 0, stocks: 0, international: 0, crypto: 0 } as Record<InvestmentClass, number>);
    }, [investmentsList]);

    const totalPortfolio = useMemo(() =>
            Object.values(totalsByCategory).reduce((a, b) => a + b, 0),
        [totalsByCategory]);

    const agentInsight = useMemo(() => {
        const target = INVESTMENT_PROFILES[profile].allocation;
        const currentPct = totalPortfolio > 0 ? (totalsByCategory.fixed / totalPortfolio) * 100 : 0;

        if (currentPct < target.fixed) {
            const diffAmount = (target.fixed / 100 * totalPortfolio) - totalsByCategory.fixed;
            return {
                class: "Renda Fixa",
                amount: diffAmount,
                reason: "Sua segurança está abaixo da meta do seu perfil."
            };
        }
        return null;
    }, [profile, totalsByCategory, totalPortfolio]);

    const handleSaveInvestment = (data: any) => {
        if (investmentToEdit) {
            setInvestmentsList(prev => prev.map(inv => {
                if (inv.id === investmentToEdit.id) {
                    const custoTotalAntigo = inv.amountInvested;
                    const custoNovoAporte = data.amountInvested;
                    let novoPrecoMedio = inv.averagePrice || 0;
                    let novaQuantidade = inv.quantity || 0;

                    if (inv.category !== 'fixed') {
                        novaQuantidade = (inv.quantity || 0) + (data.quantity || 0);
                        novoPrecoMedio = (custoTotalAntigo + custoNovoAporte) / novaQuantidade;
                    }

                    return {
                        ...inv,
                        amountInvested: custoTotalAntigo + custoNovoAporte,
                        currentValue: data.currentValue,
                        quantity: novaQuantidade,
                        averagePrice: novoPrecoMedio,
                        indexador: data.indexador || inv.indexador,
                        taxa: data.taxa || inv.taxa
                    };
                }
                return inv;
            }));
        } else {
            const newItem = { ...data, id: Math.random().toString() };
            setInvestmentsList(prev => [...prev, newItem]);
        }
        setInvestmentToEdit(null);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-700 pb-10">
            <TutorialWizard
                tutorialKey="investments-page"
                steps={[
                    { element: '#investment-tabs-list', title: 'Modos de Visão', description: 'Alterne entre estratégia e lista de ativos.' },
                    { element: '#agent-insight-card', title: 'Agente Financeiro', description: 'Nossa inteligência sugere onde aportar.' },
                    { element: '#portfolio-card', title: 'Patrimônio Total', description: 'O valor total que você tem investido.' },
                    { element: '#btn-add-investment', title: 'Novo Ativo', description: 'Adicione novos ativos ou atualize existentes.' }
                ]}
            />

            <Tabs defaultValue="overview" className="space-y-6 text-left">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <TabsList id="investment-tabs-list" className="grid w-full grid-cols-2 md:w-auto">
                        <TabsTrigger value="overview" className="flex gap-2"><PieChart className="h-4 w-4" /> Estratégia</TabsTrigger>
                        <TabsTrigger value="assets" className="flex gap-2"><List className="h-4 w-4" /> Ativos</TabsTrigger>
                    </TabsList>

                    <Button
                        id="btn-add-investment"
                        onClick={() => { setInvestmentToEdit(null); setActiveDialog("add-investment"); }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                    >
                        <Plus className="mr-2 h-4 w-4" /> Novo Ativo
                    </Button>
                </div>

                <TabsContent value="overview" className="space-y-6">
                    {/* ... (Seu conteúdo de Overview se mantém igual, pois já é responsivo) ... */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card id="agent-insight-card" className="md:col-span-2 border-emerald-500/20 bg-emerald-500/5 shadow-none text-left">
                            <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-4">
                                <div className="p-3 bg-emerald-500 rounded-2xl"><BrainCircuit className="h-6 w-6 text-white" /></div>
                                <div>
                                    <CardTitle className="text-emerald-900 text-lg">Agente de Investimentos</CardTitle>
                                    <CardDescription className="text-emerald-700/80">Analisando perfil <strong>{INVESTMENT_PROFILES[profile].label}</strong></CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {agentInsight ? (
                                    <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-emerald-100 shadow-sm animate-in slide-in-from-left">
                                        <ArrowUpCircle className="h-5 w-5 text-emerald-600 mt-1 shrink-0" />
                                        <div>
                                            <p className="text-sm font-bold text-emerald-900 text-left">Oportunidade de Aporte!</p>
                                            <p className="text-xs text-emerald-800 leading-relaxed text-left">Sugerimos <strong>{formatTransactionAmount(agentInsight.amount)}</strong> em <strong>{agentInsight.class}</strong>. {agentInsight.reason}</p>
                                        </div>
                                    </div>
                                ) : <p className="text-sm text-emerald-800 italic">Carteira equilibrada!</p>}
                            </CardContent>
                        </Card>

                        <Card id="profile-tabs-selector" className="shadow-none border-dashed border-2">
                            <CardHeader className="pb-2 text-left"><CardTitle className="text-sm font-bold">Estratégia Alvo</CardTitle></CardHeader>
                            <CardContent>
                                <Tabs value={profile} onValueChange={(v) => setProfile(v as any)} className="w-full">
                                    <TabsList className="grid grid-cols-3 w-full h-10">
                                        <TabsTrigger value="conservative"><ShieldCheck className="h-4 w-4" /></TabsTrigger>
                                        <TabsTrigger value="moderate"><TrendingUp className="h-4 w-4" /></TabsTrigger>
                                        <TabsTrigger value="aggressive"><Zap className="h-4 w-4" /></TabsTrigger>
                                    </TabsList>
                                </Tabs>
                                <p className={cn("text-[10px] mt-4 font-bold uppercase text-center tracking-wider", INVESTMENT_PROFILES[profile].color)}>{INVESTMENT_PROFILES[profile].description}</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="shadow-none text-left">
                            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Target className="h-5 w-5 text-emerald-500" /> Alocação Atual vs Alvo</CardTitle></CardHeader>
                            <CardContent className="space-y-6">
                                {Object.entries(INVESTMENT_PROFILES[profile].allocation).map(([key, targetPct]) => {
                                    const currentAmt = totalsByCategory[key as InvestmentClass] || 0;
                                    const currentPct = totalPortfolio > 0 ? (currentAmt / totalPortfolio) * 100 : 0;
                                    return (
                                        <div key={key} className="space-y-2 text-left">
                                            <div className="flex justify-between text-xs font-bold text-left"><span className="capitalize">{key === 'fixed' ? 'Renda Fixa' : key}</span><span>{currentPct.toFixed(1)}% de {targetPct}%</span></div>
                                            <Progress value={currentPct} className="h-2" />
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>

                        <Card id="portfolio-card" className="bg-slate-900 text-white border-none shadow-xl flex flex-col justify-center items-center">
                            <CardHeader><CardTitle className="text-white/70 text-sm font-medium">Patrimônio Investido</CardTitle></CardHeader>
                            <CardContent className="flex flex-col items-center py-2 text-center">
                                <p className="text-4xl font-bold tracking-tighter mb-6">{formatTransactionAmount(totalPortfolio)}</p>
                                <div className="flex gap-2"><div className="flex items-center gap-1 text-emerald-400 text-xs bg-emerald-400/10 px-2 py-1 rounded-full"><TrendingUp className="h-3 w-3" /><span>Lucro positivo</span></div><div className="flex items-center gap-1 text-blue-300 text-xs bg-blue-400/10 px-2 py-1 rounded-full"><Banknote className="h-3 w-3" /><span>{investmentsList.length} ativos</span></div></div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="assets" className="animate-in slide-in-from-bottom-2 duration-300">
                    <Card className="border-none shadow-none md:border text-left">
                        <CardHeader className="hidden md:block">
                            <CardTitle>Meus Ativos</CardTitle>
                            <CardDescription>Gerencie suas posições e realize novos aportes.</CardDescription>
                        </CardHeader>

                        {/* CONTÊINER DA LISTA:
                            - Tabela no Desktop
                            - Cards no Mobile
                        */}
                        <CardContent className="p-0 md:p-6">
                            <div className="max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20">

                                {/* VIEW: DESKTOP TABLE */}
                                <div className="hidden md:block">
                                    <table className="w-full text-sm">
                                        <thead className="sticky top-0 bg-background z-10 shadow-sm">
                                        <tr className="text-left border-b text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                                            <th className="pb-3 px-2">Ativo</th>
                                            <th className="pb-3 px-2">Classe</th>
                                            <th className="pb-3 px-2 text-right">Aplicado</th>
                                            <th className="pb-3 px-2 text-right">Atual</th>
                                            <th className="pb-3 px-2 text-right">Resultado</th>
                                            <th className="pb-3 px-2 text-right">Ações</th>
                                        </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                        {investmentsList.map((inv) => {
                                            const profit = inv.currentValue - inv.amountInvested;
                                            const profitPct = inv.amountInvested > 0 ? (profit / inv.amountInvested) * 100 : 0;
                                            return (
                                                <tr key={inv.id} className="group hover:bg-muted/30 transition-colors">
                                                    <td className="py-4 px-2 text-left">
                                                        <div className="flex items-center gap-3 text-left">
                                                            <div className="p-2 bg-muted rounded-lg group-hover:bg-background"><Landmark className="h-4 w-4 text-muted-foreground" /></div>
                                                            <div className="text-left"><p className="font-bold text-sm leading-tight">{inv.name}</p><p className="text-[10px] text-muted-foreground">{inv.institution}</p></div>
                                                        </div>
                                                    </td>
                                                    <td className="px-2 text-left"><span className="text-[10px] bg-muted px-2 py-1 rounded-full font-bold uppercase whitespace-nowrap">{inv.category === 'fixed' ? 'Renda Fixa' : inv.category}</span></td>
                                                    <td className="px-2 text-right text-muted-foreground whitespace-nowrap">{formatTransactionAmount(inv.amountInvested)}</td>
                                                    <td className="px-2 text-right font-bold whitespace-nowrap">{formatTransactionAmount(inv.currentValue)}</td>
                                                    <td className={cn("px-2 text-right font-bold whitespace-nowrap", profit >= 0 ? "text-emerald-600" : "text-rose-600")}>
                                                        <div className="flex flex-col items-end text-right"><span>{profitPct > 0 ? "+" : ""}{profitPct.toFixed(2)}%</span><span className="text-[10px] font-normal opacity-70">{formatTransactionAmount(profit)}</span></div>
                                                    </td>
                                                    <td className="px-2 text-right"><Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50" onClick={() => { setInvestmentToEdit(inv); setActiveDialog("add-investment"); }}><Plus className="h-4 w-4" /></Button></td>
                                                </tr>
                                            );
                                        })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* VIEW: MOBILE CARDS */}
                                <div className="grid grid-cols-1 gap-3 p-4 md:hidden">
                                    {investmentsList.map((inv) => {
                                        const profit = inv.currentValue - inv.amountInvested;
                                        const profitPct = inv.amountInvested > 0 ? (profit / inv.amountInvested) * 100 : 0;
                                        return (
                                            <div
                                                key={inv.id}
                                                className="bg-muted/30 border rounded-xl p-4 space-y-3 active:scale-[0.98] transition-transform"
                                                onClick={() => { setInvestmentToEdit(inv); setActiveDialog("add-investment"); }}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="flex gap-3">
                                                        <div className="p-2 bg-white rounded-lg border shadow-sm"><Landmark className="h-5 w-5 text-emerald-600" /></div>
                                                        <div>
                                                            <p className="font-bold text-sm leading-tight">{inv.name}</p>
                                                            <p className="text-[10px] text-muted-foreground">{inv.institution}</p>
                                                        </div>
                                                    </div>
                                                    <span className="text-[9px] bg-white border px-2 py-0.5 rounded-full font-bold uppercase text-muted-foreground">
                                                        {inv.category === 'fixed' ? 'Renda Fixa' : inv.category}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-dashed">
                                                    <div>
                                                        <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-tighter">Valor Atual</p>
                                                        <p className="text-sm font-bold text-slate-900">{formatTransactionAmount(inv.currentValue)}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-tighter">Resultado</p>
                                                        <p className={cn("text-sm font-bold", profit >= 0 ? "text-emerald-600" : "text-rose-600")}>
                                                            {profitPct > 0 ? "+" : ""}{profitPct.toFixed(1)}%
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between pt-1">
                                                    <p className="text-[10px] text-muted-foreground italic">
                                                        Custo: {formatTransactionAmount(inv.amountInvested)}
                                                    </p>
                                                    <div className="flex items-center gap-1 text-emerald-600 text-[10px] font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                                                        <Plus className="h-3 w-3" /> Aporte
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {investmentsList.length === 0 && (
                                    <div className="py-10 text-center">
                                        <Info className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-20" />
                                        <p className="text-sm text-muted-foreground">Você ainda não possui investimentos registrados.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <AddInvestmentForm initialData={investmentToEdit} onAdd={handleSaveInvestment} />
        </div>
    );
};