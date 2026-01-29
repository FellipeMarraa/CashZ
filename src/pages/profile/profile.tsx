"use client"

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import {useAuth} from "@/context/AuthContext";
import {useEffect, useMemo, useState} from "react";
import {auth} from "../../../firebase";
import {
    EmailAuthProvider,
    reauthenticateWithCredential,
    updateEmail,
    updatePassword,
    updateProfile
} from "firebase/auth";
import {useToast} from "@/hooks/use-toast";
import {Eye, EyeOff, Loader2, Lock, Plus, Search, ShieldCheck, Tag, Trash2, User} from "lucide-react";
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

export const ProfileSection = () => {
    const { user, setUser } = useAuth();
    const { toast } = useToast();
    const { setActiveDialog } = useDialogManager();

    // Hooks de Categorias
    const { allCategories: categories = [] } = useCategories();
    const { data: hiddenCategoryIds = [] } = useHiddenCategories();
    const toggleVisibility = useToggleCategoryVisibility();
    const createCategoryMutation = useCreateCategory();
    const deleteCategoryMutation = useDeleteCategory();

    // Estados do Perfil
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [loadingProfile, setLoadingProfile] = useState(false);

    // Estados das Categorias
    const [newCategoryName, setNewCategoryName] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryIdToDelete, setCategoryIdToDelete] = useState<string | null>(null);

    // Estados da Senha
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loadingSecurity, setLoadingSecurity] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.name || "");
            setEmail(user.email || "");
        }
    }, [user]);

    // Função auxiliar para normalizar strings (remover acentos e colocar em lowercase)
    const normalizeString = (str: string) => {
        return str
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    };

    // Lógica de filtragem ignorando acentos e case
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
                toast({ title: "Sucesso", description: "Categoria criada com sucesso!", variant: "success" });
            }
        });
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

    const handleUpdateProfile = async () => {
        if (!auth.currentUser) return;
        setLoadingProfile(true);
        try {
            if (name !== user?.name) await updateProfile(auth.currentUser, { displayName: name });
            if (email !== user?.email) await updateEmail(auth.currentUser, email);
            setUser({ ...user!, name, email });
            toast({ title: "Sucesso", description: "Perfil atualizado.", variant: "success" });
        } catch (error: any) {
            toast({ title: "Erro", description: "Erro ao atualizar perfil.", variant: "destructive" });
        } finally { setLoadingProfile(false); }
    };

    const handleUpdatePassword = async () => {
        if (!auth.currentUser || !user?.email) return;
        setLoadingSecurity(true);
        try {
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(auth.currentUser, credential);
            await updatePassword(auth.currentUser, newPassword);
            toast({ title: "Sucesso", description: "Senha alterada!", variant: "success" });
            setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
        } catch (error: any) {
            toast({ title: "Erro", description: "Erro ao alterar senha.", variant: "destructive" });
        } finally { setLoadingSecurity(false); }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-700 pb-10">
            <Tabs defaultValue="info" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-flex">
                    <TabsTrigger value="info" className="flex gap-2">
                        <User className="h-4 w-4" /> <span className="hidden md:inline">Informações</span>
                    </TabsTrigger>
                    <TabsTrigger value="categories" className="flex gap-2">
                        <Tag className="h-4 w-4" /> <span className="hidden md:inline">Categorias</span>
                    </TabsTrigger>
                    <TabsTrigger value="security" className="flex gap-2">
                        <ShieldCheck className="h-4 w-4" /> <span className="hidden md:inline">Segurança</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="info">
                    <Card className="border-none shadow-none md:border md:shadow-sm">
                        <CardHeader><CardTitle>Meu Perfil</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center space-x-4">
                                <Avatar className="h-20 w-20 border-2 border-primary/10">
                                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">{user?.name?.[0]?.toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <Button variant="outline" size="sm" disabled>Alterar Foto</Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2"><label className="text-sm font-bold">Nome Completo</label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
                                <div className="space-y-2"><label className="text-sm font-bold">E-mail</label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                            </div>
                            <Button onClick={handleUpdateProfile} disabled={loadingProfile} className="bg-emerald-600 hover:bg-emerald-700">
                                {loadingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar Alterações
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="categories">
                    <Card className="border-none shadow-none md:border md:shadow-sm">
                        <CardHeader>
                            <CardTitle>Gerenciar Categorias</CardTitle>
                            <CardDescription>Oculte categorias padrões ou gerencie as suas personalizadas.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex gap-2 flex-1">
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
                                {filteredCategories.length > 0 ? (
                                    filteredCategories.map((cat) => {
                                        const isHidden = hiddenCategoryIds.includes(cat.id);
                                        return (
                                            <div key={cat.id} className={cn(
                                                "flex items-center justify-between p-3 border rounded-xl bg-muted/10 group transition-all",
                                                isHidden ? "opacity-50 grayscale" : "hover:border-emerald-500/30"
                                            )}>
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-background rounded-lg border shadow-sm">
                                                        <Tag className={cn("h-4 w-4", isHidden ? "text-muted-foreground" : "text-emerald-500")} />
                                                    </div>
                                                    <span className={cn("text-sm font-bold", isHidden && "line-through")}>{cat.name}</span>
                                                    {cat.isDefault && <Lock className="h-3 w-3 text-muted-foreground/40" />}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-emerald-500"
                                                        onClick={() => toggleVisibility.mutate(cat.id!)}
                                                        title={isHidden ? "Mostrar nos filtros" : "Ocultar nos filtros"}
                                                    >
                                                        {isHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </Button>
                                                    {!cat.isDefault && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
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
                                    })
                                ) : (
                                    <div className="col-span-full py-10 text-center text-muted-foreground text-sm italic">
                                        Nenhuma categoria encontrada.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="security">
                    <Card className="border-none shadow-none md:border md:shadow-sm">
                        <CardHeader><CardTitle>Segurança da Conta</CardTitle></CardHeader>
                        <CardContent className="space-y-4 max-w-md">
                            <div className="space-y-2"><label className="text-sm font-bold">Senha Atual</label><Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} /></div>
                            <div className="space-y-2"><label className="text-sm font-bold">Nova Senha</label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></div>
                            <div className="space-y-2"><label className="text-sm font-bold">Confirmar Nova Senha</label><Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></div>
                            <Button onClick={handleUpdatePassword} disabled={loadingSecurity} className="w-full md:w-auto">Atualizar Senha</Button>
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