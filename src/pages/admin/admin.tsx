"use client"

import * as React from "react";
import {useEffect, useState} from "react";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Badge} from "@/components/ui/badge";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {
    collection,
    deleteDoc,
    doc,
    getCountFromServer,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where
} from "firebase/firestore";
import {useAuth} from "@/context/AuthContext";
import {
    CalendarClock,
    Edit2,
    History,
    Info,
    Loader2,
    Plus,
    Power,
    Search,
    Send,
    ShieldAlert,
    Ticket,
    Trash2,
    Users,
    X
} from "lucide-react";
import {toast} from "@/hooks/use-toast";
import {db} from "../../../firebase.ts";
import * as SwitchPrimitives from '@radix-ui/react-switch';
import {cn} from '@/lib/utils';

// --- COMPONENTE SWITCH (Corrigido para evitar erro de import) ---
const Switch = React.forwardRef<
    React.ElementRef<typeof SwitchPrimitives.Root>,
    React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
    <SwitchPrimitives.Root
        className={cn(
            'peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input',
            className
        )}
        {...props}
        ref={ref}
    >
        <SwitchPrimitives.Thumb
            className={cn(
                'pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0'
            )}
        />
    </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

interface AdminUserData {
    id: string;
    email: string;
    plan?: string;
    planExpiresAt?: string;
    lastPaymentId?: string;
    couponUsed?: string;
    [key: string]: any;
}

export const AdminSection = () => {
    const { user } = useAuth();
    const [referrals, setReferrals] = useState<any[]>([]);
    const [adminLogs, setAdminLogs] = useState<any[]>([]);
    const [scheduledQueue, setScheduledQueue] = useState<any[]>([]);
    const [isCronActive, setIsCronActive] = useState(false);
    const [totalUsers, setTotalUsers] = useState(0);
    const [isProcessing, setIsProcessing] = useState<string | null>(null);

    const [searchEmail, setSearchEmail] = useState("");
    const [foundUser, setFoundUser] = useState<AdminUserData | null>(null);
    const [userReferralHistory, setUserReferralHistory] = useState<any[]>([]);
    const [loadingUser, setLoadingUser] = useState(false);

    const [scheduledDate, setScheduledDate] = useState("");

    const [notifTitle, setNotifTitle] = useState("");
    const [notifMsg, setNotifMsg] = useState("");
    const [notifType, setNotifType] = useState<'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR'>('INFO');

    const [allCoupons, setAllCoupons] = useState<any[]>([]);
    const [editingCoupon, setEditingCoupon] = useState<string | null>(null);
    const [newCoupon, setNewCoupon] = useState({
        code: "",
        days: 30,
        usageLimit: -1,
        planType: "premium"
    });

    useEffect(() => {
        getCountFromServer(collection(db, "user_preferences")).then(snap => setTotalUsers(snap.data().count));

        const unsubConfig = onSnapshot(doc(db, "system_configs", "notifications"), (doc) => {
            if (doc.exists()) setIsCronActive(doc.data().isCronActive);
        });

        const qRefs = query(collection(db, "referrals"), orderBy("createdAt", "desc"), limit(50));
        const unsubRefs = onSnapshot(qRefs, (snap) => {
            setReferrals(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        const qLogs = query(collection(db, "admin_logs"), orderBy("createdAt", "desc"), limit(50));
        const unsubLogs = onSnapshot(qLogs, (snap) => {
            setAdminLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        const unsubCoupons = onSnapshot(collection(db, "coupons"), (snap) => {
            setAllCoupons(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        const qSched = query(collection(db, "scheduled_notifications"), where("status", "==", "PENDING"), orderBy("scheduledAt", "asc"));
        const unsubSched = onSnapshot(qSched, (snap) => {
            setScheduledQueue(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        return () => { unsubConfig(); unsubRefs(); unsubLogs(); unsubCoupons(); unsubSched(); };
    }, []);

    // CORREÇÃO: Função para o Switch usar onCheckedChange
    const toggleCron = async (checked: boolean) => {
        try {
            await setDoc(doc(db, "system_configs", "notifications"), { isCronActive: checked }, { merge: true });
            toast({ title: checked ? "Agendamento ATIVADO" : "Agendamento DESATIVADO" });
        } catch (e) { toast({ title: "Erro ao alterar config", variant: "destructive" }); }
    };

    const handleDeleteScheduled = async (id: string) => {
        if (!confirm("Cancelar este envio agendado?")) return;
        try {
            await deleteDoc(doc(db, "scheduled_notifications", id));
            toast({ title: "Agendamento removido" });
        } catch (e) { toast({ title: "Erro ao deletar", variant: "destructive" }); }
    };

    const handleSearchUser = async () => {
        if (!searchEmail) return;
        setLoadingUser(true);
        setFoundUser(null);
        setUserReferralHistory([]);
        try {
            const q = query(collection(db, "user_preferences"), where("email", "==", searchEmail.trim().toLowerCase()), limit(1));
            const snap = await getDocs(q);

            if (!snap.empty) {
                const uData = { id: snap.docs[0].id, ...snap.docs[0].data() } as AdminUserData;
                setFoundUser(uData);
                const qRef = query(collection(db, "referrals"), where("referrerEmail", "==", uData.email), limit(10));
                const refSnap = await getDocs(qRef);
                setUserReferralHistory(refSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            } else {
                toast({ title: "Usuário não encontrado", variant: "destructive" });
            }
        } catch (e) {
            console.error(e);
            toast({ title: "Erro na busca", variant: "destructive" });
        } finally { setLoadingUser(false); }
    };

    const handleSaveCoupon = async () => {
        if (!newCoupon.code) return;
        const couponId = newCoupon.code.toUpperCase().trim();
        try {
            if (editingCoupon) {
                await updateDoc(doc(db, "coupons", editingCoupon), {
                    days: Number(newCoupon.days),
                    usageLimit: Number(newCoupon.usageLimit),
                    planType: newCoupon.planType
                });
                toast({ title: "Cupom atualizado!" });
            } else {
                await setDoc(doc(db, "coupons", couponId), {
                    days: Number(newCoupon.days),
                    isActive: true,
                    planType: newCoupon.planType,
                    usageLimit: Number(newCoupon.usageLimit),
                    usedCount: 0,
                    createdAt: serverTimestamp()
                });
                toast({ title: `Cupom ${couponId} criado!`, variant: "success" });
            }
            setNewCoupon({ code: "", days: 30, usageLimit: -1, planType: "premium" });
            setEditingCoupon(null);
        } catch (e) { toast({ title: "Erro ao salvar cupom", variant: "destructive" }); }
    };

    const handleEditClick = (coupon: any) => {
        setEditingCoupon(coupon.id);
        setNewCoupon({
            code: coupon.id,
            days: coupon.days,
            usageLimit: coupon.usageLimit,
            planType: coupon.planType
        });
    };

    const handleDeleteCoupon = async (id: string) => {
        if(!confirm("Deseja realmente excluir este cupom?")) return;
        try {
            await deleteDoc(doc(db, "coupons", id));
            toast({ title: "Cupom excluído" });
        } catch (e) { toast({ title: "Erro ao excluir", variant: "destructive" }); }
    };

    const handleAction = async (action: string, data: any) => {
        setIsProcessing(action);
        try {
            const res = await fetch('/api/actions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, data, adminId: user?.id })
            });
            if (res.ok) {
                toast({ title: "Sucesso!", variant: "success" });
                if(action === 'SEND_GLOBAL_NOTIFICATION') {
                    setNotifTitle("");
                    setNotifMsg("");
                    setScheduledDate("");
                }
            }
            else throw new Error();
        } catch (e) {
            toast({ title: "Erro na operação", variant: "destructive" });
        } finally { setIsProcessing(null); }
    };

    return (
        <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500 pb-10 text-left px-2 md:px-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                    <ShieldAlert className="text-blue-500 h-5 w-5 md:h-6 md:w-6" /> Painel Admin
                </h2>
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end gap-1">
                        {/*<span className="text-[9px] font-bold uppercase text-muted-foreground">Status do Cron</span>*/}
                        <div className="flex items-center gap-2 bg-background px-2 py-1 rounded-md border">
                            <Power className={`h-3 w-3 ${isCronActive ? "text-emerald-500" : "text-rose-500"}`} />
                            <Switch checked={isCronActive} onCheckedChange={toggleCron} />
                        </div>
                    </div>
                    <Badge variant="outline" className="text-sm md:text-lg px-3 py-1 bg-background/50 backdrop-blur-sm">
                        <Users className="h-4 w-4 mr-2 text-primary" /> {totalUsers} Usuários
                    </Badge>
                </div>
            </div>

            <Tabs defaultValue="referrals" className="space-y-4">
                <div className="overflow-x-auto pb-1 -mx-2 px-2 md:mx-0 md:px-0 scrollbar-hide">
                    <TabsList className="flex h-auto w-max md:w-full bg-muted/50 p-1">
                        <TabsTrigger value="referrals" className="flex gap-2 py-2 px-3 text-xs md:text-sm"><Users className="h-4 w-4" /> <span className="hidden sm:inline">Indicações</span></TabsTrigger>
                        <TabsTrigger value="users" className="flex gap-2 py-2 px-3 text-xs md:text-sm"><Search className="h-4 w-4" /> <span className="hidden sm:inline">Assinaturas</span></TabsTrigger>
                        <TabsTrigger value="coupons_tab" className="flex gap-2 py-2 px-3 text-xs md:text-sm"><Ticket className="h-4 w-4" /> <span className="hidden sm:inline">Cupons</span></TabsTrigger>
                        <TabsTrigger value="notifications" className="flex gap-2 py-2 px-3 text-xs md:text-sm"><Send className="h-4 w-4" /> <span className="hidden sm:inline">Comunicação</span></TabsTrigger>
                        <TabsTrigger value="audit" className="flex gap-2 py-2 px-3 text-xs md:text-sm"><History className="h-4 w-4" /> <span className="hidden sm:inline">Auditoria</span></TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="users" className="space-y-4">
                    <Card className="border-none shadow-sm md:border text-left overflow-hidden">
                        <CardHeader className="p-4 md:p-6"><CardTitle className="text-sm uppercase font-bold">Auditoria de Assinante</CardTitle></CardHeader>
                        <CardContent className="p-4 md:p-6 space-y-4">
                            <div className="flex flex-col sm:flex-row gap-2">
                                <Input
                                    placeholder="E-mail do assinante"
                                    className="h-11"
                                    value={searchEmail}
                                    onChange={(e) => setSearchEmail(e.target.value)}
                                />
                                <Button onClick={handleSearchUser} disabled={loadingUser} className="h-11 w-full sm:w-auto">
                                    {loadingUser ? <Loader2 className="animate-spin h-4 w-4" /> : <Search className="h-4 w-4 mr-2" />}
                                    Buscar
                                </Button>
                            </div>

                            {foundUser && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 animate-in slide-in-from-top-2">
                                    <div className="p-4 rounded-lg border bg-muted/20 space-y-3 text-xs md:text-sm">
                                        <div className="flex justify-between border-b pb-2 text-left">
                                            <span className="text-muted-foreground font-bold uppercase text-[10px]">Status Atual</span>
                                            <Badge variant={foundUser.plan !== 'free' ? 'default' : 'secondary'}>{foundUser.plan || 'free'}</Badge>
                                        </div>
                                        <p className="flex justify-between"><strong>ID:</strong> <span className="text-[10px] font-mono break-all ml-4">{foundUser.id}</span></p>
                                        <p className="flex justify-between"><strong>Expira em:</strong> <span>{foundUser.planExpiresAt ? new Date(foundUser.planExpiresAt).toLocaleDateString('pt-BR') : 'N/A'}</span></p>
                                        <p className="flex justify-between items-center"><strong>Pagamento:</strong> <span className="text-blue-600 font-mono text-[10px]">{foundUser.lastPaymentId || 'Nenhum'}</span></p>
                                        <div className="pt-2 border-t flex items-center justify-between">
                                            <span className="text-[10px] font-bold uppercase text-amber-600">Cupom Utilizado</span>
                                            <Badge variant="outline" className="text-[10px] h-5 border-amber-200 bg-amber-50 text-amber-700">
                                                {foundUser.couponUsed || "Nenhum"}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="p-4 rounded-lg border bg-muted/5 space-y-2 text-xs text-left">
                                            <p className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1"><History className="h-3 w-3" /> Indicações feitas</p>
                                            {userReferralHistory.length > 0 ? userReferralHistory.map((ref: any) => (
                                                <div key={ref.id} className="flex justify-between text-[10px] border-b pb-1">
                                                    <span className="truncate max-w-[180px]">{ref.targetEmail}</span>
                                                    <Badge variant="outline" className="text-[9px] h-4">{ref.status}</Badge>
                                                </div>
                                            )) : <p className="text-[10px] italic opacity-50">Sem bônus ganhos.</p>}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="coupons_tab" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <Card className="lg:col-span-1 border-none shadow-sm md:border text-left">
                            <CardHeader className="p-4 md:p-6">
                                <CardTitle className="text-sm uppercase flex items-center justify-between font-bold">
                                    <div className="flex items-center gap-2">
                                        {editingCoupon ? <Edit2 className="h-4 w-4 text-blue-500" /> : <Plus className="h-4 w-4" />}
                                        {editingCoupon ? "Editar Cupom" : "Novo Cupom"}
                                    </div>
                                    {editingCoupon && (
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => { setEditingCoupon(null); setNewCoupon({code: "", days: 30, usageLimit: -1, planType: "premium"}); }}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 md:p-6 space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold mb-1 block">CÓDIGO {editingCoupon && "(Fixado)"}</label>
                                    <Input placeholder="EX: CASHZ30" value={newCoupon.code} disabled={!!editingCoupon} onChange={e => setNewCoupon({...newCoupon, code: e.target.value})} className="h-11" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold mb-1 block uppercase">Dias</label>
                                        <Input type="number" value={newCoupon.days === 0 ? "" : newCoupon.days} onChange={e => setNewCoupon({...newCoupon, days: e.target.value === "" ? 0 : Number(e.target.value)})} className="h-11" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold mb-1 block uppercase">Limite</label>
                                        <Input type="number" value={newCoupon.usageLimit === 0 ? "" : newCoupon.usageLimit} onChange={e => setNewCoupon({...newCoupon, usageLimit: e.target.value === "" ? 0 : Number(e.target.value)})} className="h-11" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold mb-1 block uppercase">Plano</label>
                                    <Select value={newCoupon.planType} onValueChange={(v) => setNewCoupon({...newCoupon, planType: v})}>
                                        <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="premium">Premium</SelectItem>
                                            <SelectItem value="annual">Anual</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button onClick={handleSaveCoupon} className={`w-full h-11 ${editingCoupon ? "bg-blue-600 hover:bg-blue-700" : "bg-emerald-600 hover:bg-emerald-700"}`}>
                                    {editingCoupon ? "Salvar Alterações" : "Criar Cupom"}
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="lg:col-span-2 border-none shadow-sm md:border text-left">
                            <CardHeader className="p-4 md:p-6"><CardTitle className="text-sm uppercase font-bold">Cupons Ativos</CardTitle></CardHeader>
                            <CardContent className="p-0 md:p-6">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-muted/30"><TableRow><TableHead className="text-[10px] uppercase">Código</TableHead><TableHead className="text-[10px] uppercase">Detalhes</TableHead><TableHead className="text-[10px] uppercase">Uso</TableHead><TableHead className="text-right text-[10px] uppercase">Ação</TableHead></TableRow></TableHeader>
                                        <TableBody>
                                            {allCoupons.map(c => (
                                                <TableRow key={c.id} className="text-xs hover:bg-muted/10 transition-colors">
                                                    <TableCell className="font-bold">{c.id}</TableCell>
                                                    <TableCell className="whitespace-nowrap">{c.days}d <span className="opacity-50">({c.planType})</span></TableCell>
                                                    <TableCell className="whitespace-nowrap">{c.usedCount} / {c.usageLimit === -1 ? '∞' : c.usageLimit}</TableCell>
                                                    <TableCell className="text-right flex items-center justify-end">
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEditClick(c)}><Edit2 className="h-3 w-3 text-blue-500" /></Button>
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleDeleteCoupon(c.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="notifications">
                    <Card className="border-none shadow-sm md:border max-w-2xl text-left">
                        <CardHeader className="p-4 md:p-6">
                            <CardTitle className="text-sm uppercase font-bold flex items-center gap-2">
                                <Info className="h-4 w-4 text-blue-500" /> Comunicado Global
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 md:p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-bold mb-1 block uppercase">Título</label>
                                    <Input
                                        placeholder="Título do comunicado"
                                        value={notifTitle}
                                        onChange={e => setNotifTitle(e.target.value)}
                                        className="h-11"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold mb-1 block uppercase">Tipo</label>
                                    <Select value={notifType} onValueChange={(v: any) => setNotifType(v)}>
                                        <SelectTrigger className="h-11 font-bold text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="INFO" className="text-blue-600 font-bold">🔵 INFO</SelectItem>
                                            <SelectItem value="SUCCESS" className="text-emerald-600 font-bold">🟢 SUCESSO</SelectItem>
                                            <SelectItem value="WARNING" className="text-amber-600 font-bold">🟡 AVISO</SelectItem>
                                            <SelectItem value="ERROR" className="text-rose-600 font-bold">🔴 ERRO</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold mb-1 block uppercase">Mensagem</label>
                                <textarea
                                    className="w-full h-32 p-3 rounded-md bg-muted/50 text-xs md:text-sm border border-input focus:ring-1 focus:ring-primary outline-none transition-all"
                                    placeholder="Descreva aqui o aviso para todos os usuários..."
                                    value={notifMsg}
                                    onChange={e => setNotifMsg(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold mb-1 block uppercase text-amber-600">
                                    Agendar envio
                                </label>
                                <Input
                                    type="datetime-local"
                                    value={scheduledDate}
                                    onChange={(e) => setScheduledDate(e.target.value)}
                                    className="h-11"
                                />
                                <p className="text-[9px] text-muted-foreground mt-1">
                                    Deixe vazio para enviar agora.
                                </p>
                            </div>

                            <Button
                                className="w-full h-11 bg-blue-600 hover:bg-blue-700 shadow-md group"
                                onClick={() => handleAction("SEND_GLOBAL_NOTIFICATION", {
                                    title: notifTitle,
                                    message: notifMsg,
                                    type: notifType,
                                    scheduledAt: scheduledDate || null
                                })}
                                disabled={!notifTitle || !notifMsg || !!isProcessing}
                            >
                                {isProcessing === "SEND_GLOBAL_NOTIFICATION" ? (
                                    <Loader2 className="animate-spin h-4 w-4" />
                                ) : (
                                    <Send className="h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                )}
                                <span className="ml-2 uppercase text-[11px] font-black tracking-wider">
                                    {scheduledDate ? "Agendar Notificação" : "Disparar Notificações"}
                                </span>
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="referrals">
                    <Card className="border-none shadow-sm md:border text-left overflow-hidden">
                        <CardHeader className="p-4 md:p-6"><CardTitle className="text-sm uppercase font-bold">Indicações Pendentes</CardTitle></CardHeader>
                        <CardContent className="p-0 md:p-6">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-muted/30"><TableRow><TableHead className="text-[10px] uppercase">Padrinho</TableHead><TableHead className="text-[10px] uppercase">Status</TableHead><TableHead className="text-right text-[10px] uppercase">Ação</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {referrals.map(ref => (
                                            <TableRow key={ref.id} className="text-[11px]">
                                                <TableCell className="max-w-[120px] truncate py-3">{ref.referrerEmail}</TableCell>
                                                <TableCell className="py-3"><Badge variant={ref.status === 'COMPLETED' ? 'default' : 'secondary'} className="text-[9px] h-4">{ref.status}</Badge></TableCell>
                                                <TableCell className="text-right py-3">
                                                    {ref.status !== 'COMPLETED' && (
                                                        <Button size="sm" className="h-7 px-2 text-[9px] font-bold" onClick={() => handleAction("FORCE_ACTIVATE_BONUS", { referralId: ref.id })} disabled={!!isProcessing}>
                                                            {isProcessing === "FORCE_ACTIVATE_BONUS" ? <Loader2 className="h-3 w-3 animate-spin" /> : "ATIVAR"}
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="audit" className="space-y-6">
                    {scheduledQueue.length > 0 && (
                        <Card className="border-amber-200 bg-amber-50/30 text-left overflow-hidden">
                            <CardHeader className="p-4 bg-amber-100/50">
                                <CardTitle className="text-sm uppercase font-black flex items-center gap-2 text-amber-700">
                                    <CalendarClock className="h-4 w-4" /> Fila de Envio Agendado
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableBody>
                                            {scheduledQueue.map(item => (
                                                <TableRow key={item.id} className="text-[11px] border-amber-100">
                                                    <TableCell className="font-bold py-3">{item.title}</TableCell>
                                                    <TableCell className="py-3 whitespace-nowrap italic text-amber-700 font-mono">
                                                        {new Date(item.scheduledAt).toLocaleString('pt-BR')}
                                                    </TableCell>
                                                    <TableCell className="text-right py-3">
                                                        <Button variant="ghost" size="sm" onClick={() => handleDeleteScheduled(item.id)}>
                                                            <Trash2 className="h-3 w-3 text-destructive" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card className="border-none shadow-sm md:border text-left overflow-hidden">
                        <CardHeader className="p-4 md:p-6"><CardTitle className="text-sm uppercase font-bold">Logs do Sistema</CardTitle></CardHeader>
                        <CardContent className="p-0 md:p-6">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-muted/30"><TableRow><TableHead className="text-[10px] uppercase">Evento</TableHead><TableHead className="text-[10px] uppercase">Data</TableHead><TableHead className="text-right text-[10px] uppercase">Detalhes</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {adminLogs.length > 0 ? adminLogs.map(log => (
                                            <TableRow key={log.id} className="text-[10px] md:text-xs">
                                                <TableCell className="py-3"><Badge variant="outline" className="text-[9px] font-bold uppercase">{log.action}</Badge></TableCell>
                                                <TableCell className="py-3 whitespace-nowrap opacity-60 font-mono text-[9px]">{new Date(log.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                                                <TableCell className="max-w-[150px] md:max-w-[300px] py-3 text-right">
                                                    <span className="italic opacity-80 break-words">{log.details}</span>
                                                </TableCell>
                                            </TableRow>
                                        )) : <TableRow><TableCell colSpan={3} className="text-center py-10 text-muted-foreground italic text-[11px]">Nenhum registro encontrado.</TableCell></TableRow>}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};