"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  RefreshCcw,
  HelpCircle,
  Monitor,
  Bell,
  Shield,
  Tag,
  Search,
  Eye,
  EyeOff,
  Lock,
  Trash2,
  Plus,
  Loader2,
  Settings2
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '../../../firebase';
import { doc, updateDoc } from 'firebase/firestore/lite';
import { useToast } from '@/hooks/use-toast';
import { TutorialWizard } from '@/components/tutorial-wizard';
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useHiddenCategories,
  useToggleCategoryVisibility
} from "@/hooks/useCategories";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useDialogManager } from "@/context/DialogManagerContext";
import { cn } from "@/lib/utils";

export const SettingsSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { setActiveDialog } = useDialogManager();

  const [activeTab, setActiveTab] = useState("general");

  // Hooks de Categorias
  const { allCategories: categories = [] } = useCategories();
  const { data: hiddenCategoryIds = [] } = useHiddenCategories();
  const toggleVisibility = useToggleCategoryVisibility();
  const createCategoryMutation = useCreateCategory();
  const deleteCategoryMutation = useDeleteCategory();

  // Estados Locais
  const [loadingReset, setLoadingReset] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryIdToDelete, setCategoryIdToDelete] = useState<string | null>(null);

  const normalizeString = (str: string) => {
    return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  const filteredCategories = useMemo(() => {
    const normalizedSearch = normalizeString(searchTerm);
    return categories.filter(cat => {
      const normalizedCatName = normalizeString(cat.name);
      return normalizedCatName.includes(normalizedSearch);
    });
  }, [categories, searchTerm]);

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    createCategoryMutation.mutate({
      name: newCategoryName.trim(),
      // @ts-ignore
      color: "#10b981"
    }, {
      onSuccess: () => {
        setNewCategoryName("");
        toast({ title: "Sucesso", description: "Categoria criada!", variant: "success" });
      }
    });
  };

  const handleResetAll = async () => {
    if (!user?.id) return;
    setLoadingReset(true);
    try {
      const docRef = doc(db, "user_preferences", user.id);
      await updateDoc(docRef, { hiddenTutorials: [] });

      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('hide-tutorial-')) localStorage.removeItem(key);
      });

      toast({ title: "Configurações Resetadas", description: "Todos os tutoriais foram reativados." });
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao resetar preferências.", variant: "destructive" });
    } finally {
      setLoadingReset(false);
    }
  };

  const handleConfirmDeleteCategory = () => {
    if (categoryIdToDelete) {
      deleteCategoryMutation.mutate(categoryIdToDelete, {
        onSuccess: () => {
          setActiveDialog(null);
          setCategoryIdToDelete(null);
          toast({ title: "Removida", description: "Categoria excluída com sucesso." });
        }
      });
    }
  };

  // PASSOS DO TUTORIAL
  const generalSteps = [
    {
      element: '#settings-tabs-list',
      title: 'Configurações',
      description: 'Navegue entre as configurações do sistema ou gerencie suas categorias.'
    },
    {
      element: '#settings-tutorials',
      title: 'Dicas de Ajuda',
      description: 'Aqui você pode resetar todos os tutoriais para que apareçam novamente nas telas.'
    }
  ];

  const categorySteps = [
    {
      element: '#add-category-input',
      title: 'Personalização',
      description: 'Crie novas categorias personalizadas para organizar melhor seus gastos.'
    },
    {
      element: '#category-visibility-btn',
      title: 'Visibilidade',
      description: 'Use o ícone do olho para ocultar categorias que você não utiliza.'
    },
    {
      element: '#category-lock-icon',
      title: 'Categorias Padrão',
      description: 'O cadeado indica categorias protegidas do sistema que não podem ser deletadas.'
    }
  ];

  return (
      <div className="space-y-6 animate-in fade-in duration-700 pb-10">
        {/* Lógica de Tutorial por Aba */}
        {activeTab === "general" ? (
            <TutorialWizard tutorialKey="settings-general" steps={generalSteps} />
        ) : (
            <TutorialWizard tutorialKey="settings-categories" steps={categorySteps} />
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList id="settings-tabs-list" className="grid w-full grid-cols-2 md:w-auto md:inline-flex">
            <TabsTrigger value="general" className="flex gap-2">
              <Settings2 className="h-4 w-4" /> Geral
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex gap-2">
              <Tag className="h-4 w-4" /> Categorias
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Card id="settings-tutorials" className="border-amber-500/20 bg-amber-500/5">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-amber-600" />
                    <CardTitle>Guias e Tutoriais</CardTitle>
                  </div>
                  <CardDescription>Gerencie como o sistema auxilia sua navegação.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-background">
                    <div>
                      <p className="text-sm font-bold">Resetar todos os guias</p>
                      <p className="text-xs text-muted-foreground">Isso fará com que os tutoriais apareçam novamente em todas as telas.</p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResetAll}
                        disabled={loadingReset}
                        className="text-amber-700 border-amber-200 hover:bg-amber-100"
                    >
                      <RefreshCcw className={`mr-2 h-3 w-3 ${loadingReset && 'animate-spin'}`} />
                      Resetar
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="opacity-60">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Monitor className="h-5 w-5" />
                    <CardTitle>Aparência</CardTitle>
                  </div>
                  <CardDescription>Personalize o tema e cores do dashboard.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs italic text-muted-foreground">Em breve: Suporte a modo escuro e temas personalizados.</p>
                </CardContent>
              </Card>

              <Card className="opacity-60">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    <CardTitle>Notificações</CardTitle>
                  </div>
                  <CardDescription>Configure alertas de vencimento e metas.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs italic text-muted-foreground">Em breve: Alertas via e-mail e push.</p>
                </CardContent>
              </Card>

              <Card className="opacity-60">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    <CardTitle>Privacidade</CardTitle>
                  </div>
                  <CardDescription>Gerencie a visibilidade dos seus dados.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs italic text-muted-foreground">Em breve: Opções de anonimização e exportação de dados.</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="categories">
            <Card className="border-none shadow-none md:border md:shadow-sm">
              <CardHeader>
                <CardTitle>Gerenciar Categorias</CardTitle>
                <CardDescription>Oculte categorias padrões ou gerencie as suas personalizadas.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex gap-2 flex-1" id="add-category-input">
                    <Input
                        placeholder="Nova categoria..."
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                    />
                    <Button onClick={handleAddCategory} disabled={createCategoryMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700">
                      {createCategoryMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Pesquisar categoria..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto max-h-[450px] pr-2 scrollbar-thin">
                  {filteredCategories.map((cat, index) => {
                    const isHidden = hiddenCategoryIds.includes(cat.id);
                    return (
                        <div key={cat.id} className={cn(
                            "flex items-center justify-between p-3 border rounded-xl bg-muted/10 group transition-all",
                            isHidden ? "opacity-50 grayscale" : "hover:border-emerald-500/30"
                        )}>
                          <div className="flex items-center gap-3 overflow-hidden">
                            <Tag className={cn("h-4 w-4 shrink-0", isHidden ? "text-muted-foreground" : "text-emerald-500")} />
                            <span className={cn("text-sm font-bold truncate", isHidden && "line-through")}>{cat.name}</span>
                            {cat.isDefault && (
                                <Lock
                                    id={index === 0 ? "category-lock-icon" : undefined}
                                    className="h-3 w-3 text-muted-foreground/40 shrink-0"
                                />
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                                id={index === 0 ? "category-visibility-btn" : undefined}
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => toggleVisibility.mutate(cat.id!)}
                            >
                              {isHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            {!cat.isDefault && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => {
                                      setCategoryIdToDelete(cat.id!);
                                      setActiveDialog("confirm-dialog");
                                    }}
                                >
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
        </Tabs>

        <ConfirmDialog
            title="Excluir Categoria?"
            description="Tem certeza? Transações vinculadas a esta categoria não serão apagadas, mas ficarão sem classificação."
            onConfirm={handleConfirmDeleteCategory}
            isLoading={deleteCategoryMutation.isPending}
        />
      </div>
  );
};