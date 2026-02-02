"use client"

import {useMemo, useState} from 'react';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Progress} from '@/components/ui/progress';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
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
    Zap,
    Lock,
    Info
} from 'lucide-react';
import {cn} from "@/lib/utils";
import {formatTransactionAmount} from '@/hooks/useTransactions';
import {useDialogManager} from "@/context/DialogManagerContext";
import {TutorialWizard} from "@/components/tutorial-wizard";
import {AddInvestmentForm} from "@/components/add-Investment-form.tsx";
import {useAuth} from "@/context/AuthContext.tsx";
import {useDeleteInvestment, useInvestments, useSaveInvestment} from "@/hooks/useInvestments.ts";
import {getDeepAnalysis} from "@/service/aiService.ts";
import {ConfirmDialog} from "@/components/confirm-dialog";
import {useToast} from "@/hooks/use-toast";
import {useUserPreferences} from "@/hooks/useUserPreferences.ts";
import {UpgradePlanModal} from "@/components/upgrade-plan-modal.tsx";

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
        description: "Foco em proteção e liquidez.",
        allocation: { fixed: 80, stocks: 15, international: 5, crypto: 0 }
    },
    moderate: {
        label: "Moderado",
        icon: TrendingUp,
        color: "text-emerald-500",
        description: "Equilíbrio entre segurança e crescimento.",
        allocation: { fixed: 50, stocks: 30, international: 15, crypto: 5 }
    },
    aggressive: {
        label: "Arrojado",
        icon: Zap,
        color: "text-purple-500",
        description: "Busca rentabilidade aceitando riscos.",
        allocation: { fixed: 20, stocks: 45, international: 25, crypto: 10 }
    }
};

const CATEGORY_LABELS: Record<InvestmentClass, string> = {
    fixed: "Renda Fixa",
    stocks: "Ações / FIIs",
    international: "Internacional",
    crypto: "Cripto"
};

export const InvestmentsSection = () => {
    const { user } = useAuth();
    const { isPremium } = useUserPreferences(user?.id);
    const { toast } = useToast();
    const { activeDialog, setActiveDialog } = useDialogManager();
    const { data: investmentsList = [], isLoading } = useInvestments();
    const { mutate: saveInvestment } = useSaveInvestment();
    const { mutate: deleteInvestment, isPending: isDeleting } = useDeleteInvestment();

    const [profile, setProfile] = useState<keyof typeof INVESTMENT_PROFILES>('moderate');
    const [investmentToEdit, setInvestmentToEdit] = useState<InvestmentItem | null>(null);
    const [investmentToDelete, setInvestmentToDelete] = useState<InvestmentItem | null>(null);

    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const investmentSteps = useMemo(() => [
        {
            element: "#investment-tabs-list",
            title: "Planejamento vs Realidade",
            description: "Aqui você alterna entre a sua estratégia de alocação e a lista detalhada de cada ativo que você possui.",
            side: "bottom" as const
        },
        {
            element: "#agent-insight-card",
            title: "Mentor de Investimentos",
            description: "Nossa IA analisa onde você deve colocar dinheiro hoje para manter sua carteira equilibrada e segura.",
            side: "bottom" as const
        },
        {
            element: "#profile-tabs-selector",
            title: "Seu Perfil de Risco",
            description: "Escolha como você quer investir. Isso mudará automaticamente suas metas de alocação sugeridas.",
            side: "left" as const
        },
        {
            element: "#allocation-target-card",
            title: "Equilíbrio da Carteira",
            description: "Acompanhe se você tem ativos demais em uma categoria. O segredo do bom investidor é a diversificação!",
            side: "top" as const
        }
    ], []);

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

    const handleConfirmDeleteInvestment = () => {
        if (investmentToDelete) {
            deleteInvestment(investmentToDelete.id, {
                onSuccess: () => {
                    setActiveDialog(null);
                    setInvestmentToDelete(null);
                    toast({ title: "Removido", description: "Ativo excluído da sua carteira." });
                }
            });
        }
    };

    const handleDeepAnalysis = async () => {
        if (!isPremium) {
            setActiveDialog("upgrade-plan");
            return;
        }

        setIsAnalyzing(true);
        setAiAnalysis(null);
        const summary = {
            perfil: INVESTMENT_PROFILES[profile].label,
            total: totalPortfolio,
            distribuicao: totalsByCategory,
            ativos: investmentsList.map(i => ({ nome: i.name, valor: i.currentValue }))
        };
        try {
            const result = await getDeepAnalysis(summary);
            setAiAnalysis(result);
        } catch (error) {
            setAiAnalysis("Sistemas sobrecarregados. Tente novamente em instantes.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleNewAssetClick = () => {
        if (!isPremium) {
            setActiveDialog("upgrade-plan");
            return;
        }
        setInvestmentToEdit(null);
        setActiveDialog("add-investment");
    };

    if (isLoading) {
        return (
            <div className="flex flex-col h-[400px] items-center justify-center gap-4 animate-pulse">
                <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
                <p className="text-sm font-medium text-muted-foreground">Sincronizando sua carteira...</p>
            </div>
        );
    }

    return (
        <TooltipProvider>
            <div className="space-y-6 animate-in fade-in duration-700 pb-10 text-left">
                <TutorialWizard tutorialKey="investments-didactic-v2" steps={investmentSteps} />

                <Tabs defaultValue="overview" className="space-y-6 text-left">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <TabsList id="investment-tabs-list" className="grid w-full grid-cols-2 md:w-auto">
                            <TabsTrigger value="overview" className="flex gap-2"><PieChart className="h-4 w-4" /> Estratégia</TabsTrigger>
                            <TabsTrigger value="assets" className="flex gap-2"><List className="h-4 w-4" /> Ativos</TabsTrigger>
                        </TabsList>

                        <Button
                            id="btn-add-investment"
                            onClick={handleNewAssetClick}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                        >
                            {!isPremium && <Lock className="mr-2 h-3 w-3" />}
                            <Plus className="mr-2 h-4 w-4" /> Novo Ativo
                        </Button>
                    </div>

                    <TabsContent value="overview" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* AREA DE IA AJUSTADA PARA O TEMA DARK */}
                            <Card id="agent-insight-card" className="md:col-span-2 border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10 shadow-none text-left overflow-hidden relative">
                                <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-emerald-500 rounded-2xl">
                                            <BrainCircuit className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-emerald-900 dark:text-emerald-400 text-lg">Agente de Investimentos</CardTitle>
                                            <CardDescription className="text-emerald-700/80 dark:text-emerald-500/80">
                                                Perfil <strong>{INVESTMENT_PROFILES[profile].label}</strong>
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 gap-2 hidden sm:flex"
                                        onClick={handleDeepAnalysis}
                                        disabled={isAnalyzing}
                                    >
                                        {!isPremium && <Lock className="h-3 w-3" />}
                                        {isAnalyzing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3 fill-current" />}
                                        Análise Profunda
                                    </Button>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {aiAnalysis ? (
                                        <div className="p-4 bg-white dark:bg-slate-900/50 rounded-xl border border-emerald-100 dark:border-emerald-900/30 shadow-sm animate-in zoom-in-95 duration-300 relative text-left">
                                            <p className="text-xs text-emerald-900 dark:text-emerald-100 leading-relaxed italic pr-6 whitespace-pre-wrap">{aiAnalysis}</p>
                                            <button onClick={() => setAiAnalysis(null)} className="absolute top-2 right-2 text-emerald-300 hover:text-emerald-500 text-[10px]">Limpar</button>
                                        </div>
                                    ) : agentInsight ? (
                                        <div className="flex items-start gap-3 p-4 bg-white dark:bg-slate-900/50 rounded-xl border border-emerald-100 dark:border-emerald-900/30 shadow-sm animate-in slide-in-from-left text-left">
                                            <ArrowUpCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-1 shrink-0" />
                                            <div>
                                                <p className="text-sm font-bold text-emerald-900 dark:text-emerald-400">Sugestão de Aporte</p>
                                                <p className="text-xs text-emerald-800 dark:text-emerald-100 leading-relaxed text-balance italic">
                                                    Considere alocar <strong>{formatTransactionAmount(agentInsight.amount)}</strong> em <strong>{agentInsight.class}</strong>. {agentInsight.reason}
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-emerald-800 dark:text-emerald-400 italic">Sua carteira está equilibrada seguindo seu perfil.</p>
                                    )}
                                </CardContent>
                            </Card>

                            <Card id="profile-tabs-selector" className="shadow-none border-dashed border-2 dark:border-slate-800">
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                            <Card id="allocation-target-card" className="shadow-none text-left">
                                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Target className="h-5 w-5 text-emerald-500" /> Alocação Atual vs Alvo</CardTitle></CardHeader>
                                <CardContent className="space-y-6">
                                    {Object.entries(INVESTMENT_PROFILES[profile].allocation).map(([key, targetPct]) => {
                                        const currentAmt = totalsByCategory[key as InvestmentClass] || 0;
                                        const currentPct = totalPortfolio > 0 ? (currentAmt / totalPortfolio) * 100 : 0;
                                        const isOver = currentPct > targetPct;

                                        return (
                                            <div key={key} className="space-y-2 text-left">
                                                <div className="flex justify-between items-center text-xs font-bold text-left">
                                                    <span className="capitalize">{CATEGORY_LABELS[key as InvestmentClass]}</span>
                                                    <Tooltip>
                                                        <TooltipTrigger className="flex items-center gap-1 cursor-help">
                                                        <span className={cn(isOver && "text-amber-500")}>
                                                            {currentPct.toFixed(1)}% de {targetPct}%
                                                        </span>
                                                            {isOver && <Info className="h-3 w-3 text-amber-500" />}
                                                        </TooltipTrigger>
                                                        <TooltipContent className="max-w-[200px] text-xs">
                                                            {isOver
                                                                ? `Você está sobre-exposto em ${CATEGORY_LABELS[key as InvestmentClass]}. Isso significa que esta categoria ocupa mais espaço do que o planejado na sua estratégia.`
                                                                : `Sua meta ideal é manter ${targetPct}% nesta classe de ativos.`}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </div>
                                                <Progress
                                                    value={currentPct > 100 ? 100 : currentPct}
                                                    className="h-2"
                                                    indicatorClassName={isOver ? "bg-amber-500" : "bg-emerald-500"}
                                                />
                                            </div>
                                        );
                                    })}
                                </CardContent>
                            </Card>

                            <Card id="portfolio-card" className="bg-slate-900 dark:bg-[#1e1f29] text-white border-none shadow-xl flex flex-col justify-center items-center p-4 min-h-[200px]">
                                <CardHeader className="p-0 mb-4 text-center">
                                    <CardTitle className="text-white/70 text-sm font-medium">Patrimônio Investido</CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-col items-center p-0 text-center">
                                    <p className="text-4xl font-bold tracking-tighter mb-6">{formatTransactionAmount(totalPortfolio)}</p>
                                    <div className="flex gap-2">
                                        <div className="flex items-center gap-1 text-emerald-400 text-[10px] bg-emerald-400/10 px-2 py-1 rounded-full border border-emerald-400/20">
                                            <TrendingUp className="h-3 w-3" />
                                            <span>Patrimônio Ativo</span>
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
                                <CardDescription>Gerencie suas posições e realize novos aportes.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0 md:p-6">
                                <div className="max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 px-4 md:px-0">
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
                                                                    <p className="font-bold text-sm leading-tight text-foreground">{inv.name}</p>
                                                                    <p className="text-[10px] text-muted-foreground">{inv.institution}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-2">
                                                        <span className="text-[10px] bg-muted px-2 py-1 rounded-full font-bold uppercase whitespace-nowrap text-foreground">
                                                            {CATEGORY_LABELS[inv.category]}
                                                        </span>
                                                        </td>
                                                        <td className="px-2 text-right text-muted-foreground whitespace-nowrap">{formatTransactionAmount(inv.amountInvested)}</td>
                                                        <td className="px-2 text-right font-bold whitespace-nowrap text-foreground">{formatTransactionAmount(inv.currentValue)}</td>
                                                        <td className={cn("px-2 text-right font-bold whitespace-nowrap", profit >= 0 ? "text-emerald-600" : "text-rose-600")}>
                                                            <span>{profitPct > 0 ? "+" : ""}{profitPct.toFixed(2)}%</span>
                                                        </td>
                                                        <td className="px-2 text-right">
                                                            <div className="flex justify-end gap-1">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                                                                    onClick={() => {
                                                                        if (!isPremium) { setActiveDialog("upgrade-plan"); return; }
                                                                        setInvestmentToEdit(inv); setActiveDialog("add-investment");
                                                                    }}
                                                                >
                                                                    <Plus className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
                                                                    onClick={() => {
                                                                        setInvestmentToDelete(inv);
                                                                        setActiveDialog("confirm-dialog");
                                                                    }}
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
                                        {investmentsList.map((inv) => (
                                            <div
                                                key={inv.id}
                                                className="bg-muted/30 border dark:border-slate-800 rounded-xl p-4 space-y-3 active:scale-[0.98] transition-all cursor-pointer relative"
                                                onClick={() => {
                                                    if (!isPremium) { setActiveDialog("upgrade-plan"); return; }
                                                    setInvestmentToEdit(inv); setActiveDialog("add-investment");
                                                }}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="flex gap-3">
                                                        <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border dark:border-slate-700 shadow-sm"><Landmark className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /></div>
                                                        <div className="text-left">
                                                            <p className="font-bold text-sm leading-tight text-foreground">{inv.name}</p>
                                                            <p className="text-[10px] text-muted-foreground">{inv.institution}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={(e) => {
                                                            e.stopPropagation();
                                                            setInvestmentToDelete(inv);
                                                            setActiveDialog("confirm-dialog");
                                                        }}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-dashed dark:border-slate-800">
                                                    <div className="text-left">
                                                        <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-tighter">Valor Atual</p>
                                                        <p className="text-sm font-bold text-foreground">{formatTransactionAmount(inv.currentValue)}</p>
                                                    </div>
                                                    <div className="text-right flex flex-col justify-end">
                                                    <span className="text-[9px] bg-white dark:bg-slate-800 border dark:border-slate-700 px-2 py-0.5 rounded-full font-bold uppercase text-muted-foreground inline-block">
                                                        {CATEGORY_LABELS[inv.category]}
                                                    </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                <AddInvestmentForm initialData={investmentToEdit} onAdd={handleSaveInvestment} />

                <ConfirmDialog
                    title="Excluir Investimento?"
                    description={`Tem certeza que deseja remover ${investmentToDelete?.name}? Esta ação não pode ser desfeita.`}
                    onConfirm={handleConfirmDeleteInvestment}
                    isLoading={isDeleting}
                    variant="destructive"
                />

                {activeDialog === "upgrade-plan" && (
                    <UpgradePlanModal isOpen={true} onClose={() => setActiveDialog(null)} />
                )}
            </div>
        </TooltipProvider>
    );
};