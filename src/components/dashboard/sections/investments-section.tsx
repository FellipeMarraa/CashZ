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
    Loader2,
    PieChart,
    Plus,
    ShieldCheck,
    Target,
    Trash2,
    TrendingUp,
    Zap
} from 'lucide-react';
import {cn} from "@/lib/utils";
import {formatTransactionAmount} from '@/hooks/useTransactions';
import {useDialogManager} from "@/context/DialogManagerContext";
import {TutorialWizard} from "@/components/tutorial-wizard";
import {AddInvestmentForm} from "@/components/add-Investment-form.tsx";
import {useAuth} from "@/context/AuthContext.tsx";
import {useDeleteInvestment, useInvestments, useSaveInvestment} from "@/hooks/useInvestments.ts";
import {getDeepAnalysis} from "@/service/aiService.ts";

// ... TIPAGEM E CONSTANTES MANTIDAS ...
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

const CATEGORY_LABELS: Record<InvestmentClass, string> = {
    fixed: "Renda Fixa",
    stocks: "Ações / FIIs",
    international: "Internacional",
    crypto: "Cripto"
};

export const InvestmentsSection = () => {
    useAuth();
    const { setActiveDialog } = useDialogManager();

    // Capturamos o isLoading aqui
    const { data: investmentsList = [], isLoading } = useInvestments();

    const { mutate: saveInvestment } = useSaveInvestment();
    const { mutate: deleteInvestment } = useDeleteInvestment();

    const [profile, setProfile] = useState<keyof typeof INVESTMENT_PROFILES>('moderate');
    const [investmentToEdit, setInvestmentToEdit] = useState<InvestmentItem | null>(null);

    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

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
        if (totalPortfolio === 0) return null;
        const targetAllocation = INVESTMENT_PROFILES[profile].allocation;
        let biggestGap = 0;
        let suggestedCategory: InvestmentClass | null = null;

        (Object.keys(targetAllocation) as InvestmentClass[]).forEach((cat) => {
            const targetPct = targetAllocation[cat];
            const currentAmt = totalsByCategory[cat] || 0;
            const currentPct = (currentAmt / totalPortfolio) * 100;
            const gap = targetPct - currentPct;
            if (gap > biggestGap) {
                biggestGap = gap;
                suggestedCategory = cat;
            }
        });

        if (suggestedCategory && biggestGap > 1) {
            const diffAmount = (biggestGap / 100) * totalPortfolio;
            return {
                class: CATEGORY_LABELS[suggestedCategory],
                amount: diffAmount,
                reason: `Sua exposição em ${CATEGORY_LABELS[suggestedCategory]} está ${biggestGap.toFixed(1)}% abaixo do ideal.`
            };
        }
        return null;
    }, [profile, totalsByCategory, totalPortfolio]);

    const handleSaveInvestment = async (data: any) => {
        try {
            let payload;
            if (investmentToEdit) {
                const custoTotalAntigo = investmentToEdit.amountInvested;
                const custoNovoAporte = data.amountInvested;
                let novaQuantidade = investmentToEdit.quantity || 0;
                let novoPrecoMedio = investmentToEdit.averagePrice || 0;

                if (investmentToEdit.category !== 'fixed') {
                    novaQuantidade = (investmentToEdit.quantity || 0) + (data.quantity || 0);
                    novoPrecoMedio = (custoTotalAntigo + custoNovoAporte) / novaQuantidade;
                }

                payload = {
                    id: investmentToEdit.id,
                    name: investmentToEdit.name,
                    category: investmentToEdit.category,
                    institution: investmentToEdit.institution,
                    amountInvested: custoTotalAntigo + custoNovoAporte,
                    currentValue: data.currentValue,
                    quantity: novaQuantidade,
                    averagePrice: novoPrecoMedio,
                    indexador: data.indexador || investmentToEdit.indexador,
                    taxa: data.taxa || investmentToEdit.taxa
                };
            } else {
                payload = data;
            }
            await saveInvestment(payload);
            setInvestmentToEdit(null);
        } catch (error) {
            console.error("Erro ao salvar:", error);
        }
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm("Deseja realmente remover este ativo?")) {
            deleteInvestment(id);
        }
    };

    const handleDeepAnalysis = async () => {
        setIsAnalyzing(true);
        setAiAnalysis(null);
        try {
            const summary = {
                perfil: INVESTMENT_PROFILES[profile].label,
                total: totalPortfolio,
                distribuicao: totalsByCategory,
                ativos: investmentsList.map(i => ({ nome: i.name, valor: i.currentValue }))
            };
            const result = await getDeepAnalysis(summary);
            setAiAnalysis(result);
        } catch (error) {
            setAiAnalysis("Erro na análise. Tente novamente.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    // TELA DE CARREGAMENTO (Resolve a percepção de demora)
    if (isLoading) {
        return (
            <div className="flex flex-col h-[400px] items-center justify-center gap-4 animate-pulse">
                <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
                <p className="text-sm font-medium text-muted-foreground">Sincronizando sua carteira...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-700 pb-10 text-left">
            {/* ... CONTEÚDO MANTIDO ... */}
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card id="agent-insight-card" className="md:col-span-2 border-emerald-500/20 bg-emerald-500/5 shadow-none text-left overflow-hidden relative">
                            <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-emerald-500 rounded-2xl">
                                        <BrainCircuit className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-emerald-900 text-lg">Agente de Investimentos</CardTitle>
                                        <CardDescription className="text-emerald-700/80">
                                            Perfil <strong>{INVESTMENT_PROFILES[profile].label}</strong>
                                        </CardDescription>
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50 gap-2 hidden sm:flex"
                                    onClick={handleDeepAnalysis}
                                    disabled={isAnalyzing}
                                >
                                    {isAnalyzing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3 fill-current" />}
                                    Análise Profunda
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {aiAnalysis ? (
                                    <div className="p-4 bg-white rounded-xl border border-emerald-100 shadow-sm animate-in zoom-in-95 duration-300 relative text-left">
                                        <p className="text-xs text-emerald-900 leading-relaxed italic pr-6 whitespace-pre-wrap">
                                            {aiAnalysis}
                                        </p>
                                        <button
                                            onClick={() => setAiAnalysis(null)}
                                            className="absolute top-2 right-2 text-emerald-300 hover:text-emerald-500 text-[10px]"
                                        >
                                            Limpar
                                        </button>
                                    </div>
                                ) : agentInsight ? (
                                    <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-emerald-100 shadow-sm animate-in slide-in-from-left text-left">
                                        <ArrowUpCircle className="h-5 w-5 text-emerald-600 mt-1 shrink-0" />
                                        <div>
                                            <p className="text-sm font-bold text-emerald-900">Sugestão de Aporte</p>
                                            <p className="text-xs text-emerald-800 leading-relaxed text-balance">
                                                Invista aproximadamente <strong>{formatTransactionAmount(agentInsight.amount)}</strong> em <strong>{agentInsight.class}</strong>. {agentInsight.reason}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-emerald-800 italic">Sua carteira está equilibrada seguindo seu perfil.</p>
                                )}

                                {/* Botão Mobile */}
                                {!aiAnalysis && (
                                    <Button
                                        size="sm"
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2 flex sm:hidden h-10 font-bold"
                                        onClick={handleDeepAnalysis}
                                        disabled={isAnalyzing}
                                    >
                                        {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4 fill-current" />}
                                        Solicitar Análise Profunda IA
                                    </Button>
                                )}
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
                                            <div className="flex justify-between text-xs font-bold text-left">
                                                <span className="capitalize">{key === 'fixed' ? 'Renda Fixa' : key}</span>
                                                <span>{currentPct.toFixed(1)}% de {targetPct}%</span>
                                            </div>
                                            <Progress value={currentPct} className="h-2" />
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>

                        <Card id="portfolio-card" className="bg-slate-900 text-white border-none shadow-xl flex flex-col justify-center items-center p-4">
                            <CardHeader className="p-0 mb-4 text-center">
                                <CardTitle className="text-white/70 text-sm font-medium">Patrimônio Investido</CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center p-0 text-center">
                                <p className="text-4xl font-bold tracking-tighter mb-6">{formatTransactionAmount(totalPortfolio)}</p>
                                <div className="flex gap-2">
                                    <div className="flex items-center gap-1 text-emerald-400 text-[10px] bg-emerald-400/10 px-2 py-1 rounded-full border border-emerald-400/20">
                                        <TrendingUp className="h-3 w-3" />
                                        <span>Lucro positivo</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-blue-300 text-[10px] bg-blue-400/10 px-2 py-1 rounded-full border border-blue-400/20">
                                        <Banknote className="h-3 w-3" />
                                        <span>{investmentsList.length} ativos</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="assets" className="animate-in slide-in-from-bottom-2 duration-300">
                    <Card className="border-none shadow-none md:border text-left">
                        <CardHeader className="hidden md:block">
                            <CardTitle>Meus Ativos</CardTitle>
                        </CardHeader>

                        <CardContent className="p-0 md:p-6">
                            <div className="max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 px-4 md:px-0">
                                {/* TABELAS E CARDS MANTIDOS IGUAIS ... */}
                                <div className="hidden md:block text-left">
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
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-muted rounded-lg group-hover:bg-background"><Landmark className="h-4 w-4 text-muted-foreground" /></div>
                                                            <div>
                                                                <p className="font-bold text-sm leading-tight">{inv.name}</p>
                                                                <p className="text-[10px] text-muted-foreground">{inv.institution}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-2">
                                                        <span className="text-[10px] bg-muted px-2 py-1 rounded-full font-bold uppercase whitespace-nowrap">
                                                            {inv.category === 'fixed' ? 'Renda Fixa' : inv.category}
                                                        </span>
                                                    </td>
                                                    <td className="px-2 text-right text-muted-foreground whitespace-nowrap">{formatTransactionAmount(inv.amountInvested)}</td>
                                                    <td className="px-2 text-right font-bold whitespace-nowrap">{formatTransactionAmount(inv.currentValue)}</td>
                                                    <td className={cn("px-2 text-right font-bold whitespace-nowrap", profit >= 0 ? "text-emerald-600" : "text-rose-600")}>
                                                        <div className="flex flex-col items-end">
                                                            <span>{profitPct > 0 ? "+" : ""}{profitPct.toFixed(2)}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-2 text-right">
                                                        <div className="flex justify-end gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-emerald-600 hover:bg-emerald-50"
                                                                onClick={() => { setInvestmentToEdit(inv); setActiveDialog("add-investment"); }}
                                                            >
                                                                <Plus className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-rose-500 hover:bg-rose-50"
                                                                onClick={(e) => handleDelete(inv.id, e)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="grid grid-cols-1 gap-3 p-4 md:hidden">
                                    {investmentsList.map((inv) => {
                                        const profit = inv.currentValue - inv.amountInvested;
                                        const profitPct = inv.amountInvested > 0 ? (profit / inv.amountInvested) * 100 : 0;
                                        return (
                                            <div
                                                key={inv.id}
                                                className="bg-muted/30 border rounded-xl p-4 space-y-3 active:scale-[0.98] transition-all cursor-pointer relative"
                                                onClick={() => { setInvestmentToEdit(inv); setActiveDialog("add-investment"); }}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="flex gap-3">
                                                        <div className="p-2 bg-white rounded-lg border shadow-sm"><Landmark className="h-5 w-5 text-emerald-600" /></div>
                                                        <div className="text-left">
                                                            <p className="font-bold text-sm leading-tight">{inv.name}</p>
                                                            <p className="text-[10px] text-muted-foreground">{inv.institution}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-2">
                                                        <span className="text-[9px] bg-white border px-2 py-0.5 rounded-full font-bold uppercase text-muted-foreground">
                                                            {inv.category === 'fixed' ? 'Renda Fixa' : inv.category}
                                                        </span>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-rose-400"
                                                            onClick={(e) => handleDelete(inv.id, e)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-dashed">
                                                    <div className="text-left">
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
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <AddInvestmentForm initialData={investmentToEdit} onAdd={handleSaveInvestment} />
        </div>
    );
};