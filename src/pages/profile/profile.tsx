"use client"

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {useAuth} from "@/context/AuthContext";
import {useEffect, useState} from "react";
import {auth} from "../../../firebase";
import {
    EmailAuthProvider,
    reauthenticateWithCredential,
    updateEmail,
    updatePassword,
    updateProfile
} from "firebase/auth";
import {useToast} from "@/hooks/use-toast";
import {Loader2, ShieldCheck, User} from "lucide-react";

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

    useEffect(() => {
        if (user) {
            setName(user.name || "");
            setEmail(user.email || "");
        }
    }, [user]);

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
                <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-flex">
                    <TabsTrigger value="info" className="flex gap-2">
                        <User className="h-4 w-4" /> <span>Informações</span>
                    </TabsTrigger>
                    <TabsTrigger value="security" className="flex gap-2">
                        <ShieldCheck className="h-4 w-4" /> <span>Segurança</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="info">
                    <Card className="border-none shadow-none md:border md:shadow-sm">
                        <CardHeader><CardTitle>Meu Perfil</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center space-x-4">
                                <Avatar className="h-20 w-20 border-2 border-primary/10">
                                    <AvatarImage src={user?.photo || undefined} alt={user?.name || "Avatar"} />
                                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                                        {user?.name?.[0]?.toUpperCase()}
                                    </AvatarFallback>
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

                <TabsContent value="security">
                    <Card className="border-none shadow-none md:border md:shadow-sm">
                        <CardHeader><CardTitle>Segurança da Conta</CardTitle></CardHeader>
                        <CardContent className="space-y-4 max-w-md">
                            <div className="space-y-2"><label className="text-sm font-bold">Senha Atual</label><Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} /></div>
                            <div className="space-y-2"><label className="text-sm font-bold">Nova Senha</label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></div>
                            <div className="space-y-2"><label className="text-sm font-bold">Confirmar Nova Senha</label><Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></div>
                            <Button onClick={handleUpdatePassword} disabled={loadingSecurity} className="bg-emerald-600 hover:bg-emerald-700">Atualizar Senha</Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};