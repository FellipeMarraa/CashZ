import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { auth } from "../../../firebase";
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider, updateEmail } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export const ProfileSection = () => {
    const { user, setUser } = useAuth();
    const { toast } = useToast();

    // Estados do Perfil
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [loadingProfile, setLoadingProfile] = useState(false);

    // Estados da Senha
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loadingSecurity, setLoadingSecurity] = useState(false);

    // Carrega dados iniciais
    useEffect(() => {
        if (user) {
            setName(user.name || "");
            setEmail(user.email || "");
        }
    }, [user]);

    // --- ATUALIZAR PERFIL (NOME) ---
    const handleUpdateProfile = async () => {
        if (!auth.currentUser) return;
        setLoadingProfile(true);

        try {
            // 1. Atualizar Nome
            if (name !== user?.name) {
                await updateProfile(auth.currentUser, {
                    displayName: name
                });
            }

            // 2. Atualizar Email (Requer cuidado, pois pode deslogar ou pedir verificação)
            // Para simplificar, só tentamos atualizar se mudou
            if (email !== user?.email) {
                await updateEmail(auth.currentUser, email);
            }

            // Atualiza o contexto local para refletir na UI imediatamente
            setUser({
                ...user!,
                name: name,
                email: email
            });

            toast({
                title: "Sucesso",
                description: "Perfil atualizado com sucesso.",
                variant: "success"
            });

        } catch (error: any) {
            console.error(error);
            let msg = "Erro ao atualizar perfil.";
            if (error.code === 'auth/requires-recent-login') {
                msg = "Por segurança, faça logout e login novamente para alterar o email.";
            }
            toast({
                title: "Erro",
                description: msg,
                variant: "destructive"
            });
        } finally {
            setLoadingProfile(false);
        }
    };

    // --- ATUALIZAR SENHA ---
    const handleUpdatePassword = async () => {
        if (!auth.currentUser || !user?.email) return;

        if (newPassword !== confirmPassword) {
            toast({
                title: "Erro",
                description: "A nova senha e a confirmação não coincidem.",
                variant: "destructive"
            });
            return;
        }

        if (newPassword.length < 6) {
            toast({
                title: "Erro",
                description: "A senha deve ter no mínimo 6 caracteres.",
                variant: "destructive"
            });
            return;
        }

        setLoadingSecurity(true);

        try {
            // 1. Reautenticar o usuário (Obrigatório no Firebase para operações sensíveis)
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(auth.currentUser, credential);

            // 2. Atualizar a senha
            await updatePassword(auth.currentUser, newPassword);

            toast({
                title: "Sucesso",
                description: "Senha alterada com sucesso!",
                variant: "success"
            });

            // Limpar campos
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");

        } catch (error: any) {
            console.error(error);
            let msg = "Erro ao alterar senha.";
            if (error.code === 'auth/wrong-password') {
                msg = "A senha atual está incorreta.";
            } else if (error.code === 'auth/too-many-requests') {
                msg = "Muitas tentativas falhas. Tente novamente mais tarde.";
            }

            toast({
                title: "Erro",
                description: msg,
                variant: "destructive"
            });
        } finally {
            setLoadingSecurity(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            <Tabs defaultValue="info" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="info">Informações</TabsTrigger>
                    <TabsTrigger value="security">Segurança</TabsTrigger>
                </TabsList>

                {/* Informações Pessoais */}
                <TabsContent value="info" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Perfil</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center space-x-4">
                                <Avatar className="h-16 w-16">
                                    <AvatarImage src={user?.photo} />
                                    <AvatarFallback className="text-xl bg-primary/10 text-primary">
                                        {user?.name?.[0]?.toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                {/* Nota: Upload de foto requer Firebase Storage configurado.
                                    Por enquanto deixamos desabilitado ou visual apenas. */}
                                <Button variant="outline" disabled title="Upload de imagem requer configuração de Storage">
                                    Alterar Foto
                                </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Nome</label>
                                    <Input value={name} onChange={(e) => setName(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Email</label>
                                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Alterar o email pode exigir novo login.
                                    </p>
                                </div>
                            </div>
                            <Button className="mt-4" onClick={handleUpdateProfile} disabled={loadingProfile}>
                                {loadingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Salvar alterações
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Segurança */}
                <TabsContent value="security" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Segurança</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Senha atual</label>
                                <Input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="Necessário para confirmar a alteração"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Nova senha</label>
                                <Input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Confirmar nova senha</label>
                                <Input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                            <Button className="mt-4" onClick={handleUpdatePassword} disabled={loadingSecurity}>
                                {loadingSecurity && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Alterar senha
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};