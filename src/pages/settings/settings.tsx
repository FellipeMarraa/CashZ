"use client"

import {useEffect, useMemo, useState} from 'react';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from "@/components/ui/input";
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {
    Check,
    Crown,
    Eye,
    EyeOff,
    HelpCircle,
    Lock,
    LogOut,
    Mail,
    Plus,
    RefreshCcw,
    Search,
    Settings2,
    Share2,
    Tag,
    Trash2,
    UserPlus,
    Users,
    X,
    Zap,
    Moon, Sun, CalendarDays, ExternalLink, AlertTriangle
} from 'lucide-react';
import {useAuth} from '@/context/AuthContext';
import {useToast} from '@/hooks/use-toast';
import {TutorialWizard} from '@/components/tutorial-wizard';
import {
    useCategories,
    useCreateCategory,
    useDeleteCategory,
    useHiddenCategories,
    useToggleCategoryVisibility
} from "@/hooks/useCategories";
import {ConfirmDialog} from "@/components/confirm-dialog";
import {useDialogManager} from "@/context/DialogManagerContext";
import {cn} from "@/lib/utils";
import {useSharing} from "@/hooks/useSharing";
import {Label} from "@/components/ui/label";
import {UpgradePlanModal} from "@/components/upgrade-plan-modal";
import {useUserPreferences} from "@/hooks/useUserPreferences";
import {useTheme} from "@/components/theme-provider.tsx";
import {sendNotification} from "@/service/notificationService.ts";
import {SubscriptionDetailsDialog} from "@/components/subscription-details-dialog.tsx";

export const SettingsSection = () => {
    const {user: currentUser, logout, deleteAccount} = useAuth();
    const {toast} = useToast();
    const {activeDialog, setActiveDialog} = useDialogManager();
    const {preferences, isPremium, hideTutorial} = useUserPreferences(currentUser?.id);
    const {theme, setTheme} = useTheme();

    const [activeTab, setActiveTab] = useState("general");

    const {allCategories: categories = []} = useCategories();
    const {data: hiddenCategoryIds = []} = useHiddenCategories();
    const toggleVisibility = useToggleCategoryVisibility();
    const createCategoryMutation = useCreateCategory();
    const deleteCategoryMutation = useDeleteCategory();

    const {
        sharedWith,
        sharedToMe,
        shareMutation,
        revokeMutation,
        acceptSharingMutation,
        leaveSharingMutation
    } = useSharing();

    const [newCategoryName, setNewCategoryName] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryIdToDelete, setCategoryIdToDelete] = useState<string | null>(null);
    const [shareEmail, setShareEmail] = useState("");
    const [shareIdToRevoke, setShareIdToRevoke] = useState<string | null>(null);
    const [shareIdToLeave, setShareIdToLeave] = useState<string | null>(null);
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);
    const [isResettingTutorials, setIsResettingTutorials] = useState(false);
    const [isDeletingLoading, setIsDeletingLoading] = useState(false);
    useEffect(() => {
        if (isPremium) {
            const hasWelcomeNotified = localStorage.getItem(`premium_welcome_${currentUser?.id}`);

            if (!hasWelcomeNotified) {
                sendNotification(
                    currentUser!.id,
                    "Premium Ativado! ✨",
                    "Seu pagamento foi confirmado. Agora você tem acesso a relatórios e compartilhamento ilimitado.",
                    "SUCCESS",
                    "settings"
                );
                localStorage.setItem(`premium_welcome_${currentUser?.id}`, "true");
            }
        }
    }, [isPremium, currentUser]);
    useEffect(() => {
        if (isPremium && preferences?.planExpiresAt) {
            const today = new Date();
            const expiration = new Date(preferences.planExpiresAt);
            const diffInDays = Math.ceil((expiration.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            if (diffInDays <= 3 && diffInDays > 0) {
                const lastNotified = localStorage.getItem(`notify_exp_${currentUser?.id}`);
                if (lastNotified !== new Date().toLocaleDateString()) {
                    sendNotification(
                        currentUser!.id,
                        "Assinatura expirando! ⚠️",
                        `Seu plano Premium vence em ${diffInDays} ${diffInDays === 1 ? 'dia' : 'dias'}. Renove agora para manter seus recursos ativos!`,
                        "WARNING",
                        "settings"
                    );
                    localStorage.setItem(`notify_exp_${currentUser?.id}`, new Date().toLocaleDateString());
                }
            }
        }
    }, [isPremium, preferences, currentUser]);

    const expirationDate = useMemo(() => {
        if (!preferences?.planExpiresAt) return null;
        const date = new Date(preferences.planExpiresAt);
        if (isNaN(date.getTime())) return null;
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    }, [preferences]);

    const daysRemaining = useMemo(() => {
        if (!preferences?.planExpiresAt) return null;
        const diff = new Date(preferences.planExpiresAt).getTime() - new Date().getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }, [preferences]);

    const isUrgent = daysRemaining !== null && daysRemaining <= 3;
    const isCritical = daysRemaining !== null && daysRemaining <= 1;

    const settingsSteps = useMemo(() => {
        const steps = [];
        if (activeTab === "general") {
            steps.push(
                { element: "#card-subscription", title: "Sua Assinatura", description: "Aqui você gerencia seu plano e vê seus benefícios Premium.", side: "top" as const },
                { element: "#card-visual-guides", title: "Dicas Visuais", description: "Use este botão para resetar os balões de ajuda em todo o sistema.", side: "top" as const },
                { element: "#card-appearance", title: "Aparência", description: "Personalize o visual do CashZ para o modo escuro ou claro.", side: "top" as const },
                { element: "#card-danger-zone", title: "Zona de Perigo", description: "Cuidado! Aqui você pode excluir sua conta permanentemente.", side: "top" as const }
            );
        } else if (activeTab === "categories") {
            steps.push(
                { element: "#input-group-category", title: "Criar Categoria", description: "Digite o nome e clique no botão de (+) para adicionar.", side: "bottom" as const },
                { element: "#category-list-container", title: "Gerenciar Categorias", description: "Oculte categorias padrões ou exclua as que você criou.", side: "top" as const }
            );
        } else if (activeTab === "sharing") {
            steps.push(
                { element: "#invite-partner-box", title: "Convidar Alguém", description: "Insira o e-mail do seu parceiro para compartilhar seus dados financeiros.", side: "bottom" as const },
                { element: "#sharing-lists-container", title: "Seus Acessos", description: "Controle quem tem acesso aos seus dados e convites recebidos.", side: "top" as const }
            );
        }
        return steps;
    }, [activeTab]);

    const normalizeString = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const filteredCategories = useMemo(() => {
        const normalizedSearch = normalizeString(searchTerm);
        return categories
            .filter(cat => normalizeString(cat.name).includes(normalizedSearch))
            .sort((a, b) => {
                const isAOwner = a.userId === currentUser?.id;
                const isBOwner = b.userId === currentUser?.id;
                if (isAOwner && !isBOwner) return -1;
                if (!isAOwner && isBOwner) return 1;
                return a.name.localeCompare(b.name);
            });
    }, [categories, searchTerm, currentUser]);
    const handleAddCategory = () => {
        if (!isPremium) {
            setActiveDialog("upgrade-plan");
            return;
        }

        if (!newCategoryName.trim()) return;

        createCategoryMutation.mutate({ name: newCategoryName.trim() }, {
            onSuccess: () => {
                setNewCategoryName("");
                toast({ title: "Sucesso", description: "Categoria criada!", variant: "success" });
            },
            onError: (error: any) => {
                if (error.message === "PREMIUM_REQUIRED") {
                    setActiveDialog("upgrade-plan");
                }
            }
        });
    };

    const handleShare = () => {
        if (!isPremium) { setActiveDialog("upgrade-plan"); return; }
        if (!shareEmail.includes("@")) { toast({title: "E-mail inválido", variant: "destructive"}); return; }
        shareMutation.mutate({email: shareEmail, permissions: ['read', 'edit', 'delete']}, {
            onSuccess: () => {
                setShareEmail("");
                toast({ title: "Convite enviado!", description: "O parceiro precisa aceitar para ver os dados.", variant: "success" });
            }
        });
    };

    const handleConfirmAction = () => {
        if (categoryIdToDelete) {
            deleteCategoryMutation.mutate(categoryIdToDelete, { onSuccess: () => { setActiveDialog(null); setCategoryIdToDelete(null); } });
        } else if (shareIdToRevoke) {
            revokeMutation.mutate(shareIdToRevoke, { onSuccess: () => { setActiveDialog(null); setShareIdToRevoke(null); } });
        } else if (shareIdToLeave) {
            leaveSharingMutation.mutate(shareIdToLeave, { onSuccess: () => { setActiveDialog(null); setShareIdToLeave(null); toast({title: "Acesso removido"}); } });
        } else if (isDeletingAccount) {
            handleDeleteAccountAction();
        } else if (isResettingTutorials) {
            hideTutorial("RESET_ALL").then(() => { window.location.reload(); });
            setActiveDialog(null);
            setIsResettingTutorials(false);
        }
    };

    const handleDeleteAccountAction = async () => {
        setIsDeletingLoading(true);
        try {
            await deleteAccount();
            toast({ title: "Conta excluída", description: "Até logo! Seus dados foram removidos." });
            window.location.href = "/";
        } catch (error: any) {
            setIsDeletingLoading(false);

            if (error.message === "REAUTHENTICATION_REQUIRED") {
                toast({
                    title: "Segurança: Relogin necessário",
                    description: "Para deletar sua conta, você precisa ter feito login recentemente. Vamos te deslogar para que você entre novamente e repita a ação.",
                    variant: "destructive"
                });
                setTimeout(() => {
                    logout();
                }, 3000);
            } else {
                toast({
                    title: "Erro ao excluir",
                    description: error.message,
                    variant: "destructive"
                });
            }
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-700 pb-10">
            <TutorialWizard tutorialKey={`settings-${activeTab}-v5`} steps={settingsSteps}/>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <div className="flex justify-start">
                    <TabsList id="settings-tabs-list" className="grid w-full md:w-auto grid-cols-3 h-11 bg-muted/50 dark:bg-slate-800/40 border dark:border-slate-800/50 p-1">
                        <TabsTrigger
                            value="general"
                            className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-tight data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-emerald-400 data-[state=active]:shadow-sm transition-all"
                        >
                            <Settings2 className="h-4 w-4"/><span className="hidden md:inline">Geral</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="categories"
                            className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-tight data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-emerald-400 data-[state=active]:shadow-sm transition-all"
                        >
                            <Tag className="h-4 w-4"/><span className="hidden md:inline">Categorias</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="sharing"
                            className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-tight data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-emerald-400 data-[state=active]:shadow-sm transition-all"
                        >
                            <Share2 className="h-4 w-4"/><span className="hidden md:inline">Compartilhamento</span>
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="general" className="space-y-6 outline-none text-left">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card id="card-subscription" className={cn("shadow-none border-2 transition-colors", isPremium ? "border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10" : "border-slate-200 dark:border-slate-800")}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {isPremium ? <Crown className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> : <Zap className="h-5 w-5 text-slate-400" />}
                                        <CardTitle className="text-lg">
                                            Plano:{" "}
                                            <span
                                                className={cn(
                                                    "capitalize font-bold",
                                                    preferences?.plan === "annual" ? "text-purple-500" : "text-emerald-600"
                                                )}>
                                                {preferences?.plan === "annual"
                                                    ? "Anual"
                                                    : preferences?.plan === "premium"
                                                        ? "Premium"
                                                        : "Grátis"}
                                            </span>
                                        </CardTitle>
                                    </div>
                                    {isPremium && (
                                        <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-full font-bold uppercase tracking-wider border border-emerald-500/20">
                                            Ativo
                                        </span>
                                    )}
                                </div>
                                <CardDescription>Gerencie sua assinatura e recursos premium.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-4 border dark:border-slate-800 rounded-xl bg-background text-left transition-all">
                                    <div className="space-y-1.5 flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                            {isPremium ? "Assinatura Premium" : "Plano Gratuito"}
                                            {isCritical && <AlertTriangle className="h-3.5 w-3.5 text-rose-500 animate-pulse" />}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs">
                                            <CalendarDays className={cn("h-3.5 w-3.5", isUrgent ? "text-amber-500 animate-pulse" : "text-muted-foreground")} />
                                            <span className={cn("truncate", isUrgent ? "text-amber-600 dark:text-amber-400 font-bold" : "text-muted-foreground")}>
                                                {isPremium
                                                    ? `Vence em: ${expirationDate || 'Consultando...'}`
                                                    : 'Acesso vitalício ao plano básico'}
                                            </span>
                                        </div>
                                    </div>

                                    {!isPremium ? (
                                        <Button size="sm" onClick={() => setActiveDialog("upgrade-plan")} className="bg-emerald-600 hover:bg-emerald-700 shrink-0 w-full sm:w-auto">
                                            Fazer Upgrade
                                        </Button>
                                    ) : (
                                        <Button
                                            variant={isCritical ? "destructive" : "outline"}
                                            size="sm"
                                            onClick={() => setActiveDialog("subscription-details")} // MUDOU AQUI
                                            className={cn(
                                                "shrink-0 w-full sm:w-auto gap-2",
                                                !isCritical && "border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/5"
                                            )}
                                        >
                                            {isCritical ? (
                                                <><RefreshCcw className="h-3.5 w-3.5 animate-spin-slow" /> Renovar Agora</>
                                            ) : (
                                                <><ExternalLink className="h-3.5 w-3.5" /> Ver Detalhes</>
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card id="card-visual-guides" className="border-amber-500/20 bg-amber-500/5 dark:bg-amber-900/10 shadow-none text-left">
                            <CardHeader>
                                <div className="flex items-center gap-2"><HelpCircle className="h-5 w-5 text-amber-600 dark:text-amber-400"/><CardTitle className="text-lg">Guias visuais</CardTitle></div>
                                <CardDescription>Gerencie as dicas de navegação do CashZ.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between p-4 border dark:border-slate-800 rounded-xl bg-background text-left">
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Resetar Tutoriais</p>
                                        <p className="text-xs text-muted-foreground leading-relaxed">Isso fará com que os balões de ajuda apareçam novamente.</p>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => {
                                        setIsResettingTutorials(true);
                                        setActiveDialog("confirm-dialog");
                                    }} className="text-amber-700 border-amber-200 dark:border-amber-900/50 dark:text-amber-500 shrink-0">
                                        <RefreshCcw className="mr-2 h-3 w-3"/> Resetar
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card id="card-appearance" className="border-slate-200 dark:border-slate-800 shadow-none text-left">
                            <CardHeader>
                                <div className="flex items-center gap-2"><Moon className="h-5 w-5 text-slate-600 dark:text-slate-400"/><CardTitle className="text-lg">Aparência</CardTitle></div>
                                <CardDescription>Personalize o visual do seu dashboard.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between p-4 border dark:border-slate-800 rounded-xl bg-background">
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Modo {theme === 'dark' ? 'Escuro' : 'Claro'}</p>
                                        <p className="text-xs text-muted-foreground">Alterne entre o tema claro e o tema escuro.</p>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="gap-2">
                                        {theme === 'dark' ? <><Sun className="h-4 w-4"/> Ativar Claro</> : <><Moon className="h-4 w-4"/> Ativar Escuro</>}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card id="card-danger-zone" className="border-rose-200 dark:border-rose-900 bg-rose-50/30 dark:bg-rose-900/10 shadow-none text-left">
                            <CardHeader>
                                <div className="flex items-center gap-2"><Trash2 className="h-5 w-5 text-rose-600 dark:text-rose-400"/><CardTitle className="text-lg text-rose-900 dark:text-rose-400">Zona de Perigo</CardTitle></div>
                                <CardDescription>Ações irreversíveis sobre sua conta.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between p-4 border border-rose-100 dark:border-rose-900/50 rounded-xl bg-background">
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Deletar minha conta</p>
                                        <p className="text-xs text-muted-foreground leading-tight">Apaga permanentemente todos os seus dados.</p>
                                    </div>
                                    <Button variant="destructive" size="sm" onClick={() => {
                                        setIsDeletingAccount(true);
                                        setIsResettingTutorials(false);
                                        setActiveDialog("confirm-dialog");
                                    }} className="bg-rose-600 hover:bg-rose-700">Excluir</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="categories" className="outline-none text-left">
                    <Card className="border-none shadow-none md:border dark:md:border-slate-800 md:shadow-sm text-left">
                        <CardHeader><CardTitle>Suas Categorias</CardTitle><CardDescription>Gerencie como organiza suas finanças.</CardDescription></CardHeader>
                        <CardContent className="space-y-6">
                            <div id="input-group-category" className="flex flex-col md:flex-row gap-4">
                                <div className="flex gap-2 flex-1">
                                    <Input placeholder="Nova categoria..." value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="bg-background"/>
                                    <Button onClick={handleAddCategory} className="bg-emerald-600 hover:bg-emerald-700 shrink-0">
                                        {!isPremium && <Lock className="h-3 w-3 mr-1"/>}
                                        <Plus className="h-4 w-4"/>
                                    </Button>
                                </div>
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                                    <Input placeholder="Pesquisar..." className="pl-10 bg-background" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
                                </div>
                            </div>
                            <div id="category-list-container" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto max-h-[400px] pr-1">
                                {filteredCategories.map((cat) => {
                                    const isHidden = hiddenCategoryIds.includes(cat.id);
                                    const isShared = cat.userId && cat.userId !== currentUser?.id;
                                    return (
                                        <div key={cat.id} className={cn("flex items-center justify-between p-3 border dark:border-slate-800 rounded-xl border-l-4", isHidden ? "bg-muted/10 opacity-60 grayscale" : "bg-background", isShared ? "border-l-blue-400" : "border-l-emerald-400")}>
                                            <div className="flex items-center gap-3 truncate">
                                                <Tag className={cn("h-4 w-4 shrink-0", isHidden ? "text-slate-400" : (isShared ? "text-blue-500" : "text-emerald-500"))}/>
                                                <div className="flex flex-col truncate"><span className={cn("text-sm truncate text-foreground", isHidden && "line-through text-muted-foreground")}>{cat.name}</span>{isShared && <span className="text-[9px] text-blue-500 uppercase tracking-tighter">Compartilhada</span>}</div>
                                            </div>
                                            <div className="flex gap-1 shrink-0 ml-2">
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleVisibility.mutate(cat.id!)}>{isHidden ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4 text-emerald-600"/>}</Button>
                                                {!cat.isDefault && <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:text-rose-600" onClick={() => { setCategoryIdToDelete(cat.id!); setActiveDialog("confirm-dialog"); }}><Trash2 className="h-4 w-4"/></Button>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="sharing" className="outline-none text-left">
                    <Card className="border-none shadow-none md:border dark:md:border-slate-800 md:shadow-sm text-left">
                        <CardHeader className="pb-4"><div className="flex items-center gap-2"><Users className="h-5 w-5 text-emerald-600"/><CardTitle>Compartilhamento</CardTitle></div><CardDescription>Gerencie conexões e acessos.</CardDescription></CardHeader>
                        <CardContent className="space-y-8">
                            <div id="invite-partner-box" className="p-4 md:p-6 border-2 border-emerald-500/10 dark:border-emerald-900/30 rounded-2xl bg-emerald-500/5 dark:bg-emerald-900/5 space-y-6 relative overflow-hidden">
                                {!isPremium && <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-[1px] z-10 flex items-center justify-center">
                                    <Button onClick={() => setActiveDialog("upgrade-plan")} variant="outline" className="bg-white dark:bg-slate-900 gap-2 shadow-xl border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400"><Crown className="h-4 w-4 fill-emerald-500"/> Desbloquear</Button>
                                </div>}
                                <div className="flex-1 space-y-1"><p className="text-sm text-emerald-900 dark:text-emerald-400 flex items-center gap-2 leading-none"><UserPlus className="h-4 w-4"/> Convidar novo parceiro</p></div>
                                <div className="flex flex-col md:flex-row gap-4 items-end">
                                    <div className="flex-1 space-y-2 w-full">
                                        <Label className="text-[10px] uppercase text-slate-500">E-mail do Parceiro</Label>
                                        <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"/><Input placeholder="exemplo@email.com" value={shareEmail} onChange={(e) => setShareEmail(e.target.value)} className="pl-10 h-11 bg-background"/></div>
                                    </div>
                                    <Button onClick={handleShare} className="w-full md:w-auto h-11 bg-emerald-600 hover:bg-emerald-700 font-bold px-8 shadow-lg">Convidar</Button>
                                </div>
                            </div>
                            <div id="sharing-lists-container" className="grid gap-8 md:grid-cols-2">
                                <div className="space-y-4">
                                    <p className="text-[10px] uppercase text-slate-400 tracking-[0.2em]">Convites enviados</p>
                                    {sharedWith.map((share: any) => (
                                        <div key={share.id} className="flex items-center justify-between p-3 border dark:border-slate-800 rounded-xl bg-background group">
                                            <div className="flex items-center gap-3 truncate">
                                                <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-xs shrink-0">{share.email.charAt(0).toUpperCase()}</div>
                                                <div className="flex flex-col truncate"><span className="text-xs truncate text-foreground">{share.email}</span><span className={cn("text-[9px] font-bold uppercase", share.status === 'PENDENTE' ? 'text-amber-500' : 'text-emerald-600')}>{share.status === 'PENDENTE' ? 'Aguardando' : 'Ativo'}</span></div>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500" onClick={() => { setShareIdToRevoke(share.id); setActiveDialog("confirm-dialog"); }}><Trash2 className="h-4 w-4"/></Button>
                                        </div>
                                    ))}
                                </div>
                                <div className="space-y-4">
                                    <p className="text-[10px] uppercase text-slate-400 tracking-[0.2em]">Convites recebidos</p>
                                    {sharedToMe.map((share: any) => (
                                        <div key={share.id} className={cn("flex flex-col p-3 border dark:border-slate-800 rounded-xl group gap-3", share.status === 'PENDENTE' ? "bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900" : "bg-blue-50/20 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900")}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3 truncate">
                                                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-400 flex items-center justify-center text-xs shrink-0">{share.ownerEmail.charAt(0).toUpperCase()}</div>
                                                    <div className="flex flex-col truncate"><span className="text-xs text-slate-900 dark:text-slate-100">{share.ownerEmail}</span><span className="text-[9px] text-blue-600 dark:text-blue-400">{share.status === 'ACEITO' ? 'Acesso Total' : 'Convidou você'}</span></div>
                                                </div>
                                                {share.status === 'ACEITO' && <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-600" onClick={() => { setShareIdToLeave(share.id); setActiveDialog("confirm-dialog"); }}><LogOut className="h-4 w-4"/></Button>}
                                            </div>
                                            {share.status === 'PENDENTE' && (
                                                <div className="flex gap-2">
                                                    <Button size="sm" className="flex-1 bg-emerald-600 text-[11px] h-8" onClick={() => acceptSharingMutation.mutate(share.id)}><Check className="w-3 h-3 mr-1"/> Aceitar</Button>
                                                    <Button size="sm" variant="outline" className="flex-1 text-[11px] h-8 text-rose-600 dark:text-rose-400 dark:border-rose-900" onClick={() => leaveSharingMutation.mutate(share.id)}><X className="w-3 h-3 mr-1"/> Recusar</Button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {activeDialog === "upgrade-plan" && <UpgradePlanModal isOpen={true} onClose={() => setActiveDialog(null)}/>}
            <ConfirmDialog
                title={
                    isResettingTutorials ? "Resetar Tutoriais?" :
                        categoryIdToDelete ? "Excluir Categoria?" :
                            shareIdToLeave ? "Sair do Compartilhamento?" :
                                isDeletingAccount ? "Deletar sua conta?" :
                                    shareIdToRevoke ? "Revogar Acesso?" : "Resetar Tutoriais?"
                }
                description={
                    isResettingTutorials ? "As dicas visuais aparecerão novamente em todas as telas. Será necessário um novo login." :
                        isDeletingAccount ? "Esta ação é irreversível e apagará todos os seus dados." :
                            "Confirmar esta ação?"
                }
                onConfirm={handleConfirmAction}
                isLoading={
                    deleteCategoryMutation.isPending ||
                    revokeMutation.isPending ||
                    leaveSharingMutation.isPending ||
                    isDeletingLoading
                }
            />
            <SubscriptionDetailsDialog
                preferences={preferences}
                userId={currentUser?.id}
            />
        </div>
    );
};