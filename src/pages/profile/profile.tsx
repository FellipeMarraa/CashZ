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
import {CheckCircle2, Clock, Gift, Loader2, ShieldCheck, Ticket, User, Users} from "lucide-react";
import {useReferrals} from "@/hooks/useReferrals"; // Certifique-se de criar este hook conforme enviado anteriormente

export const ProfileSection = () => {
    const { user, setUser } = useAuth();
    const { toast } = useToast();
    const { referrals, stats } = useReferrals(); // Consumindo os dados de indicação

    // Estados do Perfil
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [loadingProfile, setLoadingProfile] = useState(false);

    // Estados da Senha
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loadingSecurity, setLoadingSecurity] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopyEmail = () => {
        if (!user?.email) return;
        navigator.clipboard.writeText(user.email);
        setCopied(true);
        toast({ title: "Copiado!", description: "E-mail de indicação copiado para a área de transferência." });
        setTimeout(() => setCopied(false), 2000);
    };
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

    const handleShareWhatsApp = () => {
        if (!user?.email) return;

        const message = encodeURIComponent(
            `Oi! Estou usando o CashZ para organizar minhas finanças e é incrível. 🚀\n\n` +
            `Se você assinar o Premium usando meu e-mail de indicação, nós dois ganhamos +30 dias grátis!\n\n` +
            `Meu e-mail: ${user.email}\n` +
            `Acesse aqui: https://cashz.vercel.app`
        );

        window.open(`https://wa.me/?text=${message}`, '_blank');
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-700 pb-10">
            <Tabs defaultValue="info" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-flex">
                    <TabsTrigger value="info" className="flex gap-2">
                        <User className="h-4 w-4" /> <span>Informações</span>
                    </TabsTrigger>
                    <TabsTrigger value="security" className="flex gap-2">
                        <ShieldCheck className="h-4 w-4" /> <span>Segurança</span>
                    </TabsTrigger>
                    <TabsTrigger value="referrals" className="flex gap-2">
                        <Gift className="h-4 w-4" /> <span>Indicações</span>
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

                {/* Nova Tab de Indicações */}
                <TabsContent value="referrals">
                    {/* Banner de Compartilhamento */}
                    <Card className="mb-6 border-none bg-gradient-to-br from-emerald-600 to-emerald-800 text-white shadow-lg shadow-emerald-500/20">
                        <CardContent className="pt-6">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="space-y-2 text-center md:text-left flex-1">
                                    <h3 className="text-xl font-bold flex items-center justify-center md:justify-start gap-2">
                                        Indique e Ganhe! 🚀
                                    </h3>
                                    <p className="text-xs opacity-90 leading-relaxed max-w-[320px]">
                                        Convide seus amigos e, quando eles assinarem, <span className="font-bold underline">ambos ganham 30 dias</span> de Premium grátis.
                                    </p>
                                    <Button
                                        onClick={handleShareWhatsApp}
                                        size="sm"
                                        className="bg-[#25D366] hover:bg-[#20ba56] text-white border-none font-bold mt-2 shadow-lg"
                                    >
                                        <Users className="h-4 w-4 mr-2" /> Indicar no WhatsApp
                                    </Button>
                                </div>

                                <div className="flex flex-col gap-2 w-full md:w-auto">
                                    <div className="flex items-center gap-2 bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/20">
                                        <div className="px-1 flex-1">
                                            <p className="text-[9px] uppercase opacity-70 font-black tracking-wider">E-mail de indicação</p>
                                            <p className="text-sm font-mono font-bold truncate max-w-[160px] md:max-w-[200px]">
                                                {user?.email}
                                            </p>
                                        </div>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-9 w-9 text-white hover:bg-white/20"
                                            onClick={handleCopyEmail}
                                        >
                                            {copied ? <CheckCircle2 className="h-5 w-5" /> : <Ticket className="h-5 w-5" />}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Cards de Resumo */}
                    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 mb-6">
                        <Card className="bg-emerald-500/10 border-emerald-500/20 shadow-none">
                            <CardContent className="pt-4 px-4">
                                <p className="text-[10px] font-bold text-emerald-600 uppercase">Dias Ganhos</p>
                                <h3 className="text-2xl font-black text-emerald-700">+{stats.totalEarnedDays}</h3>
                            </CardContent>
                        </Card>
                        <Card className="bg-blue-500/10 border-blue-500/20 shadow-none">
                            <CardContent className="pt-4 px-4">
                                <p className="text-[10px] font-bold text-blue-600 uppercase">Pendentes</p>
                                <h3 className="text-2xl font-black text-blue-700">{stats.pendingCount}</h3>
                            </CardContent>
                        </Card>
                        <Card className="bg-slate-500/10 border-slate-500/20 shadow-none hidden md:block">
                            <CardContent className="pt-4 px-4">
                                <p className="text-[10px] font-bold text-slate-600 uppercase">Total</p>
                                <h3 className="text-2xl font-black text-slate-700">{referrals.length}</h3>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Lista de Indicações */}
                    <Card className="border-none shadow-none md:border md:shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Users className="h-4 w-4 text-emerald-500" /> Amigos Indicados
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {referrals.length > 0 ? (
                                referrals.map((ref) => (
                                    <div key={ref.id} className="flex items-center justify-between p-3 rounded-xl border bg-muted/20">
                                        <div className="flex items-center gap-3">
                                            <div className={ref.status === 'COMPLETED' ? "bg-emerald-500/20 p-1.5 rounded-full" : "bg-amber-500/20 p-1.5 rounded-full"}>
                                                {ref.status === 'COMPLETED' ?
                                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> :
                                                    <Clock className="h-3.5 w-3.5 text-amber-600" />
                                                }
                                            </div>
                                            <div className="text-sm">
                                                <p className="font-bold leading-none mb-1">{ref.targetEmail}</p>
                                                <p className="text-[10px] text-muted-foreground">
                                                    {ref.status === 'COMPLETED' ? 'Assinatura Ativa' : 'Aguardando Assinatura'}
                                                </p>
                                            </div>
                                        </div>
                                        {ref.status === 'COMPLETED' && (
                                            <div className="flex flex-col items-end">
                                                <span className="text-[9px] font-black text-emerald-600">+30 DIAS</span>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 opacity-40">
                                    <Users className="h-8 w-8 mx-auto mb-2" />
                                    <p className="text-xs">Você ainda não possui indicações registradas.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};