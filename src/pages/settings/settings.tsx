"use client"

import {useMemo, useState} from 'react';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from "@/components/ui/input";
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {
  Eye,
  EyeOff,
  HelpCircle,
  Loader2,
  LogOut,
  Mail,
  Plus,
  RefreshCcw,
  Search,
  Settings2,
  Share2,
  ShieldCheck,
  Tag,
  Trash2,
  UserPlus,
  Users,
  ShieldAlert
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

export const SettingsSection = () => {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const { setActiveDialog } = useDialogManager();

  const [activeTab, setActiveTab] = useState("general");

  const { allCategories: categories = [] } = useCategories();
  const { data: hiddenCategoryIds = [] } = useHiddenCategories();
  const toggleVisibility = useToggleCategoryVisibility();
  const createCategoryMutation = useCreateCategory();
  const deleteCategoryMutation = useDeleteCategory();

  const {
    sharedWith,
    sharedToMe,
    shareMutation,
    revokeMutation,
    leaveSharingMutation
  } = useSharing();

  const [newCategoryName, setNewCategoryName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryIdToDelete, setCategoryIdToDelete] = useState<string | null>(null);
  const [shareEmail, setShareEmail] = useState("");
  const [shareIdToRevoke, setShareIdToRevoke] = useState<string | null>(null);
  const [shareIdToLeave, setShareIdToLeave] = useState<string | null>(null);

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
    if (!newCategoryName.trim()) return;
    createCategoryMutation.mutate({ name: newCategoryName.trim()}, {
      onSuccess: () => {
        setNewCategoryName("");
        toast({ title: "Sucesso", description: "Categoria criada!", variant: "success" });
      }
    });
  };

  const handleShare = () => {
    if (!shareEmail.includes("@")) {
      toast({ title: "E-mail inválido", variant: "destructive" });
      return;
    }
    const fullPermissions = ['read', 'edit', 'delete'];
    shareMutation.mutate({ email: shareEmail, permissions: fullPermissions }, {
      onSuccess: () => {
        setShareEmail("");
        toast({ title: "Sucesso", description: "Acesso total compartilhado!", variant: "success" });
      }
    });
  };

  const handleConfirmAction = () => {
    if (categoryIdToDelete) {
      deleteCategoryMutation.mutate(categoryIdToDelete, {
        onSuccess: () => { setActiveDialog(null); setCategoryIdToDelete(null); }
      });
    } else if (shareIdToRevoke) {
      revokeMutation.mutate(shareIdToRevoke, {
        onSuccess: () => { setActiveDialog(null); setShareIdToRevoke(null); }
      });
    } else if (shareIdToLeave) {
      leaveSharingMutation.mutate(shareIdToLeave, {
        onSuccess: () => {
          setActiveDialog(null);
          setShareIdToLeave(null);
          toast({ title: "Acesso removido", description: "Você não visualiza mais estas finanças." });
        }
      });
    }
  };

  return (
      <div className="space-y-6 animate-in fade-in duration-700 pb-10">
        <TutorialWizard
            tutorialKey={`settings-${activeTab}`}
            steps={activeTab === "general" ? [
              { element: '#settings-tabs-list', title: 'Navegação', description: 'Gerencie seu perfil, categorias ou compartilhe acessos.' },
              { element: '#settings-tutorials', title: 'Ajuda', description: 'Resete os tutoriais para vê-los novamente.' }
            ] : activeTab === "sharing" ? [
              { element: '#share-form', title: 'Conceder Acesso', description: 'Convide parceiros para gerenciarem as finanças com você.' },
              { element: '#received-shares', title: 'Acessos Recebidos', description: 'Aqui você pode visualizar e sair de contas que compartilharam dados com você.' }
            ] : []}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          {/* TabsList ajustado para flexbox e centralização no mobile */}
          <TabsList id="settings-tabs-list" className="flex w-full md:w-auto h-12 bg-muted/50 p-1">
            <TabsTrigger value="general" className="flex-1 flex items-center justify-center gap-2 text-xs uppercase tracking-tight py-2">
              <Settings2 className="h-4 w-4" />
              <span className="hidden md:inline">Geral</span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex-1 flex items-center justify-center gap-2 text-xs uppercase tracking-tight py-2">
              <Tag className="h-4 w-4" />
              <span className="hidden md:inline">Categorias</span>
            </TabsTrigger>
            <TabsTrigger value="sharing" className="flex-1 flex items-center justify-center gap-2 text-xs uppercase tracking-tight py-2">
              <Share2 className="h-4 w-4" />
              <span className="hidden md:inline">Compartilhamento</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6 outline-none">
            <div className="grid gap-4 md:grid-cols-2">
              <Card id="settings-tutorials" className="border-amber-500/20 bg-amber-500/5 shadow-none">
                <CardHeader>
                  <div className="flex items-center gap-2"><HelpCircle className="h-5 w-5 text-amber-600" /><CardTitle className="text-lg">Guias visuais</CardTitle></div>
                  <CardDescription>Gerencie as dicas de navegação do CashZ.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 border rounded-xl bg-background text-left">
                    <div className="space-y-1">
                      <p className="text-sm text-slate-900">Resetar Tutoriais</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">Isso fará com que os balões de ajuda apareçam novamente em todas as telas.</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setActiveDialog("confirm-dialog")} className="text-amber-700 border-amber-200 hover:bg-amber-100 hover:text-amber-800 transition-colors shrink-0">
                      <RefreshCcw className="mr-2 h-3 w-3" /> Resetar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="categories" className="outline-none">
            <Card className="border-none shadow-none md:border md:shadow-sm text-left">
              <CardHeader><CardTitle>Suas Categorias</CardTitle><CardDescription>Gerencie como organiza suas finanças.</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex gap-2 flex-1">
                    <Input placeholder="Nova categoria..." value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} />
                    <Button onClick={handleAddCategory} className="bg-emerald-600 hover:bg-emerald-700 shrink-0"><Plus className="h-4 w-4" /></Button>
                  </div>
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Pesquisar..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto max-h-[400px] pr-1">
                  {filteredCategories.map((cat) => {
                    const isHidden = hiddenCategoryIds.includes(cat.id);
                    const isShared = cat.userId && cat.userId !== currentUser?.id;

                    return (
                        <div key={cat.id} className={cn(
                            "flex items-center justify-between p-3 border rounded-xl transition-all border-l-4",
                            isHidden ? "bg-muted/10 opacity-60 grayscale" : "bg-background",
                            isShared ? "border-l-blue-400" : "border-l-emerald-400"
                        )}>
                          <div className="flex items-center gap-3 truncate">
                            <Tag className={cn("h-4 w-4 shrink-0", isHidden ? "text-slate-400" : (isShared ? "text-blue-500" : "text-emerald-500"))} />
                            <div className="flex flex-col truncate">
                              <span className={cn("text-sm truncate", isHidden && "line-through text-muted-foreground")}>{cat.name}</span>
                              {isShared && <span className="text-[9px] text-blue-500 uppercase tracking-tighter">Compartilhada</span>}
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0 ml-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleVisibility.mutate(cat.id!)}>
                              {isHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4 text-emerald-600" />}
                            </Button>
                            {!cat.isDefault && (
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:text-rose-600" onClick={() => { setCategoryIdToDelete(cat.id!); setShareIdToLeave(null); setShareIdToRevoke(null); setActiveDialog("confirm-dialog"); }}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                          </div>
                        </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sharing" className="outline-none">
            <Card className="border-none shadow-none md:border md:shadow-sm text-left">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2"><Users className="h-5 w-5 text-emerald-600" /><CardTitle>Compartilhamento</CardTitle></div>
                <CardDescription>Gerencie conexões e acessos.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">

                <div id="share-form" className="p-4 md:p-6 border-2 border-emerald-500/10 rounded-2xl bg-emerald-500/5 space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-emerald-900 flex items-center gap-2 leading-none"><UserPlus className="h-4 w-4" /> Conceder acesso</p>
                      <p className="text-[11px] text-emerald-700/70 font-medium">O parceiro poderá gerenciar seus registros.</p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 rounded-lg text-emerald-700 border border-emerald-200 w-fit">
                      <ShieldCheck className="h-4 w-4" />
                      <span className="text-[10px] uppercase tracking-tight">Acesso Total</span>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 space-y-2 w-full">
                      <Label className="text-[10px] uppercase text-slate-500">E-mail</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="exemplo@email.com"
                            value={shareEmail}
                            onChange={(e) => setShareEmail(e.target.value)}
                            className="pl-10 h-11 bg-background"
                        />
                      </div>
                    </div>
                    <Button
                        onClick={handleShare}
                        disabled={shareMutation.isPending || !shareEmail}
                        className="w-full md:w-auto h-11 bg-emerald-600 hover:bg-emerald-700 font-bold px-8 shadow-lg shadow-emerald-600/10"
                    >
                      {shareMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Conceder"}
                    </Button>
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
                    <ShieldAlert className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      <b>Aviso:</b> O convidado terá permissão para excluir registros.
                    </p>
                  </div>
                </div>

                <div className="grid gap-8 md:grid-cols-2">
                  <div className="space-y-4">
                    <p className="text-[10px] uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                      Concedidos
                    </p>
                    {sharedWith.length === 0 ? (
                        <p className="text-xs italic text-muted-foreground p-4 bg-muted/5 rounded-xl border border-dashed text-center">Nenhum parceiro.</p>
                    ) : (
                        <div className="grid gap-2">
                          {sharedWith.map((share: any) => (
                              <div key={share.id} className="flex items-center justify-between p-3 border rounded-xl bg-background group">
                                <div className="flex items-center gap-3 truncate">
                                  <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs shrink-0">{share.email.charAt(0).toUpperCase()}</div>
                                  <span className="text-xs truncate">{share.email}</span>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:bg-rose-50" onClick={() => { setShareIdToRevoke(share.id); setShareIdToLeave(null); setCategoryIdToDelete(null); setActiveDialog("confirm-dialog"); }}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                          ))}
                        </div>
                    )}
                  </div>

                  <div className="space-y-4" id="received-shares">
                    <p className="text-[10px] uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                      Recebidos
                    </p>
                    {sharedToMe.length === 0 ? (
                        <p className="text-xs italic text-muted-foreground p-4 bg-muted/5 rounded-xl border border-dashed text-center">Nenhum acesso.</p>
                    ) : (
                        <div className="grid gap-2">
                          {sharedToMe.map((share: any) => (
                              <div key={share.id} className="flex items-center justify-between p-3 border border-blue-100 bg-blue-50/20 rounded-xl group">
                                <div className="flex items-center gap-3 truncate">
                                  <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs shrink-0">{share.ownerEmail.charAt(0).toUpperCase()}</div>
                                  <div className="flex flex-col truncate">
                                    <span className="text-xs truncate text-slate-900">{share.ownerEmail}</span>
                                    <span className="text-[9px] text-blue-600">Acesso Total</span>
                                  </div>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-600 hover:bg-rose-50" onClick={() => { setShareIdToLeave(share.id); setShareIdToRevoke(null); setCategoryIdToDelete(null); setActiveDialog("confirm-dialog"); }}>
                                  <LogOut className="h-4 w-4" />
                                </Button>
                              </div>
                          ))}
                        </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <ConfirmDialog
            title={categoryIdToDelete ? "Excluir Categoria?" : shareIdToLeave ? "Sair do Compartilhamento?" : "Revogar Acesso?"}
            description={
              categoryIdToDelete ? "As transações vinculadas ficarão sem categoria." :
                  shareIdToLeave ? "Você deixará de visualizar esta conta." :
                      "O convidado perderá o acesso imediatamente."
            }
            onConfirm={handleConfirmAction}
            isLoading={deleteCategoryMutation.isPending || revokeMutation.isPending || leaveSharingMutation.isPending}
        />
      </div>
  );
};