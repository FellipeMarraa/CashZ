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
    X,
    LayoutDashboard,
    TrendingUp,
    Star,
    Ban,
    RefreshCcw,
    AlertCircle
} from "lucide-react";
import {toast} from "@/hooks/use-toast";
import {db} from "../../../firebase.ts";
import * as SwitchPrimitives from '@radix-ui/react-switch';
import {cn} from '@/lib/utils';

// --- COMPONENTE SWITCH ---
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
    isBanned?: boolean;
    [key: string]: any;
}

export const AdminSection = () => {
    const { user } = useAuth();
    const [referrals, setReferrals] = useState<any[]>([]);
    const [adminLogs, setAdminLogs] = useState<any[]>([]);
    const [clientErrors, setClientErrors] = useState<any[]>([]); // Novo: Logs de Erros
    const [scheduledQueue, setScheduledQueue] = useState<any[]>([]);
    const [isCronActive, setIsCronActive] = useState(false);
    const [totalUsers, setTotalUsers] = useState(0);
    const [isProcessing, setIsProcessing] = useState<string | null>(null);

    const [stats, setStats] = useState({ premium: 0, annual: 0, today: 0 });
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
    const [newCoupon, setNewCoupon] = useState({ code: "", days: 30, usageLimit: -1, planType: "premium" });

    useEffect(() => {
        getCountFromServer(collection(db, "user_preferences")).then(snap => setTotalUsers(snap.data().count));

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayISO = today.toISOString();

        getDocs(query(collection(db, "user_preferences"), where("createdAt", ">=", todayISO)))
            .then(snap => setStats(prev => ({ ...prev, today: snap.size })));
        getDocs(query(collection(db, "user_preferences"), where("plan", "==", "premium")))
            .then(snap => setStats(prev => ({ ...prev, premium: snap.size })));
        getDocs(query(collection(db, "user_preferences"), where("plan", "==", "annual")))
            .then(snap => setStats(prev => ({ ...prev, annual: snap.size })));

        const unsubConfig = onSnapshot(doc(db, "system_configs", "notifications"), (doc) => {
            if (doc.exists()) setIsCronActive(doc.data().isCronActive);
        });

        const qRefs = query(collection(db, "referrals"), orderBy("createdAt", "desc"), limit(50));
        const unsubRefs = onSnapshot(qRefs, (snap) => setReferrals(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

        const qLogs = query(collection(db, "admin_logs"), orderBy("createdAt", "desc"), limit(50));
        const unsubLogs = onSnapshot(qLogs, (snap) => setAdminLogs(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

        // Novo: Listener de Erros do Cliente
        const qErrors = query(collection(db, "client_logs"), orderBy("createdAt", "desc"), limit(30));
        const unsubErrors = onSnapshot(qErrors, (snap) => setClientErrors(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

        const unsubCoupons = onSnapshot(collection(db, "coupons"), (snap) => setAllCoupons(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

        const qSched = query(collection(db, "scheduled_notifications"), where("status", "==", "PENDING"), orderBy("scheduledAt", "asc"));
        const unsubSched = onSnapshot(qSched, (snap) => setScheduledQueue(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

        return () => { unsubConfig(); unsubRefs(); unsubLogs(); unsubCoupons(); unsubSched(); unsubErrors(); };
    }, []);

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
            } else { toast({ title: "Usuário não encontrado", variant: "destructive" }); }
        } catch (e) { toast({ title: "Erro na busca", variant: "destructive" }); }
        finally { setLoadingUser(false); }
    };

    const handleUserAction = async (action: "BAN_USER" | "RESET_CATEGORIES", targetUserId: string) => {
        if (!confirm(`Tem certeza que deseja executar: ${action}?`)) return;
        setIsProcessing(action);
        try {
            const res = await fetch('/api/actions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, data: { targetUserId }, adminId: user?.id })
            });
            if (res.ok) {
                toast({ title: "Operação realizada com sucesso!", variant: "success" });
                handleSearchUser(); // Atualiza os dados do usuário na tela
            } else throw new Error();
        } catch (e) {
            toast({ title: "Erro na operação", variant: "destructive" });
        } finally { setIsProcessing(null); }
    };

    const handleSaveCoupon = async () => {
        if (!newCoupon.code) return;
        const couponId = newCoupon.code.toUpperCase().trim();
        try {
            if (editingCoupon) {
                await updateDoc(doc(db, "coupons", editingCoupon), { days: Number(newCoupon.days), usageLimit: Number(newCoupon.usageLimit), planType: newCoupon.planType });
                toast({ title: "Cupom atualizado!" });
            } else {
                await setDoc(doc(db, "coupons", couponId), { days: Number(newCoupon.days), isActive: true, planType: newCoupon.planType, usageLimit: Number(newCoupon.usageLimit), usedCount: 0, createdAt: serverTimestamp() });
                toast({ title: `Cupom ${couponId} criado!`, variant: "success" });
            }
            setNewCoupon({ code: "", days: 30, usageLimit: -1, planType: "premium" });
            setEditingCoupon(null);
        } catch (e) { toast({ title: "Erro ao salvar", variant: "destructive" }); }
    };

    const handleEditClick = (coupon: any) => {
        setEditingCoupon(coupon.id);
        setNewCoupon({ code: coupon.id, days: coupon.days, usageLimit: coupon.usageLimit, planType: coupon.planType });
    };

    const handleDeleteCoupon = async (id: string) => {
        if(!confirm("Excluir cupom?")) return;
        try {
            await deleteDoc(doc(db, "coupons", id));
            toast({ title: "Cupom excluído" });
        } catch (e) { toast({ title: "Erro ao excluir", variant: "destructive" }); }
    };

    const handleAction = async (action: string, data: any) => {
        setIsProcessing(action);
        try {
            const res = await fetch('/api/actions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, data, adminId: user?.id }) });
            if (res.ok) {
                toast({ title: "Sucesso!", variant: "success" });
                if(action === 'SEND_GLOBAL_NOTIFICATION') { setNotifTitle(""); setNotifMsg(""); setScheduledDate(""); }
            } else throw new Error();
        } catch (e) { toast({ title: "Erro na operação", variant: "destructive" }); }
        finally { setIsProcessing(null); }
    };

    return (
        <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500 pb-10 text-left px-2 md:px-0 max-w-full overflow-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 overflow-hidden">
                <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                    <ShieldAlert className="text-blue-500 h-5 w-5 md:h-6 md:w-6" /> Painel Admin
                </h2>
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2 bg-background px-2 py-1 rounded-md border">
                            <Power className={`h-3 w-3 ${isCronActive ? "text-emerald-500" : "text-rose-500"}`} />
                            <Switch checked={isCronActive} onCheckedChange={toggleCron} />
                        </div>
                    </div>
                    <Badge variant="outline" className="text-sm md:text-lg px-3 py-1 bg-background/50 backdrop-blur-sm font-bold whitespace-nowrap">
                        <Users className="h-4 w-4 mr-2 text-primary" /> {totalUsers}
                    </Badge>
                </div>
            </div>

            <Tabs defaultValue="metrics" className="space-y-4 w-full overflow-hidden">
                <div className="overflow-x-auto pb-1 -mx-2 px-2 md:mx-0 md:px-0 scrollbar-hide">
                    <TabsList className="flex h-auto w-max md:w-full bg-muted/50 p-1">
                        <TabsTrigger value="metrics" className="flex gap-2 py-2 px-3 text-xs md:text-sm"><LayoutDashboard className="h-4 w-4" /> <span className="hidden sm:inline">Métricas</span></TabsTrigger>
                        <TabsTrigger value="referrals" className="flex gap-2 py-2 px-3 text-xs md:text-sm"><Users className="h-4 w-4" /> <span className="hidden sm:inline">Indicações</span></TabsTrigger>
                        <TabsTrigger value="users" className="flex gap-2 py-2 px-3 text-xs md:text-sm"><Search className="h-4 w-4" /> <span className="hidden sm:inline">Assinaturas</span></TabsTrigger>
                        <TabsTrigger value="coupons_tab" className="flex gap-2 py-2 px-3 text-xs md:text-sm"><Ticket className="h-4 w-4" /> <span className="hidden sm:inline">Cupons</span></TabsTrigger>
                        <TabsTrigger value="notifications" className="flex gap-2 py-2 px-3 text-xs md:text-sm"><Send className="h-4 w-4" /> <span className="hidden sm:inline">Comunicação</span></TabsTrigger>
                        <TabsTrigger value="error_logs" className="flex gap-2 py-2 px-3 text-xs md:text-sm"><AlertCircle className="h-4 w-4 text-rose-500" /> <span className="hidden sm:inline">Erros App</span></TabsTrigger>
                        <TabsTrigger value="audit" className="flex gap-2 py-2 px-3 text-xs md:text-sm"><History className="h-4 w-4" /> <span className="hidden sm:inline">Auditoria</span></TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="metrics" className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="border-none shadow-sm md:border">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between space-y-0 pb-2">
                                    <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Total Geral</p>
                                    <Users className="h-4 w-4 text-blue-500" />
                                </div>
                                <div className="text-2xl font-black">{totalUsers}</div>
                                <p className="text-[10px] text-muted-foreground mt-1">Cadastrados</p>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-sm md:border">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between space-y-0 pb-2">
                                    <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Novos Hoje</p>
                                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                                </div>
                                <div className="text-2xl font-black text-emerald-600">+{stats.today}</div>
                                <p className="text-[10px] text-muted-foreground mt-1">Registros hoje</p>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-sm md:border">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between space-y-0 pb-2">
                                    <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Premium</p>
                                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                                </div>
                                <div className="text-2xl font-black">{stats.premium}</div>
                                <p className="text-[10px] text-muted-foreground mt-1">Mensais ativos</p>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-sm md:border">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between space-y-0 pb-2">
                                    <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Anual</p>
                                    <Star className="h-4 w-4 text-amber-600 fill-amber-600" />
                                </div>
                                <div className="text-2xl font-black">{stats.annual}</div>
                                <p className="text-[10px] text-muted-foreground mt-1">VIPs ativos</p>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="users" className="space-y-4">
                    <Card className="border-none shadow-sm md:border text-left overflow-hidden">
                        <CardHeader className="p-4 md:p-6"><CardTitle className="text-sm uppercase font-bold">Auditoria de Assinante</CardTitle></CardHeader>
                        <CardContent className="p-4 md:p-6 space-y-4">
                            <div className="flex flex-col sm:flex-row gap-2">
                                <Input placeholder="E-mail do assinante" className="h-11" value={searchEmail} onChange={(e) => setSearchEmail(e.target.value)} />
                                <Button onClick={handleSearchUser} disabled={loadingUser} className="h-11 w-full sm:w-auto">
                                    {loadingUser ? <Loader2 className="animate-spin h-4 w-4" /> : <Search className="h-4 w-4 mr-2" />} Buscar
                                </Button>
                            </div>
                            {foundUser && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 animate-in slide-in-from-top-2">
                                    <div className="p-4 rounded-lg border bg-muted/20 space-y-3 text-xs md:text-sm">
                                        <div className="flex justify-between border-b pb-2">
                                            <span className="text-muted-foreground font-bold uppercase text-[10px]">Status</span>
                                            <div className="flex gap-1">
                                                {foundUser.isBanned && <Badge variant="destructive" className="text-[8px] h-4 uppercase">Banido</Badge>}
                                                <Badge variant={foundUser.plan !== 'free' ? 'default' : 'secondary'}>{foundUser.plan || 'free'}</Badge>
                                            </div>
                                        </div>
                                        <p className="flex justify-between gap-2"><strong>ID:</strong> <span className="text-[9px] font-mono break-all">{foundUser.id}</span></p>
                                        <p className="flex justify-between"><strong>Expira:</strong> <span>{foundUser.planExpiresAt ? new Date(foundUser.planExpiresAt).toLocaleDateString('pt-BR') : 'N/A'}</span></p>

                                        <div className="pt-4 grid grid-cols-2 gap-2 border-t">
                                            <Button
                                                variant={foundUser.isBanned ? "outline" : "destructive"}
                                                size="sm"
                                                className="text-[10px] h-8"
                                                onClick={() => handleUserAction("BAN_USER", foundUser.id)}
                                                disabled={!!isProcessing}
                                            >
                                                {isProcessing === "BAN_USER" ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Ban className="h-3 w-3 mr-1" />}
                                                {foundUser.isBanned ? "Desbanir" : "Banir"}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-[10px] h-8"
                                                onClick={() => handleUserAction("RESET_CATEGORIES", foundUser.id)}
                                                disabled={!!isProcessing}
                                            >
                                                {isProcessing === "RESET_CATEGORIES" ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RefreshCcw className="h-3 w-3 mr-1" />}
                                                Reset Dados
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-lg border bg-muted/5 space-y-2 text-xs text-left">
                                        <p className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1"><History className="h-3 w-3" /> Indicações</p>
                                        <div className="max-h-[120px] overflow-y-auto pr-1">
                                            {userReferralHistory.length > 0 ? userReferralHistory.map((ref: any) => (
                                                <div key={ref.id} className="flex justify-between text-[10px] border-b pb-1">
                                                    <span className="truncate max-w-[120px]">{ref.targetEmail}</span>
                                                    <Badge variant="outline" className="text-[8px] h-4">{ref.status}</Badge>
                                                </div>
                                            )) : <p className="text-[10px] italic opacity-50">Sem bônus.</p>}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="error_logs">
                    <Card className="border-none shadow-sm md:border text-left overflow-hidden">
                        <CardHeader className="p-4 md:p-6 flex flex-row items-center justify-between bg-rose-50/30 dark:bg-rose-900/10">
                            <CardTitle className="text-sm uppercase font-bold text-rose-600 flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" /> Erros Reportados
                            </CardTitle>
                            {clientErrors.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-rose-600 hover:bg-rose-100 hover:text-rose-700 font-bold text-[10px]"
                                    onClick={() => {
                                        if(confirm("Deseja apagar TODOS os logs de erro definitivamente?")) {
                                            handleAction("CLEAR_ERROR_LOGS", {});
                                        }
                                    }}
                                    disabled={!!isProcessing}
                                >
                                    {isProcessing === "CLEAR_ERROR_LOGS" ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Trash2 className="h-3 w-3 mr-1" />}
                                    LIMPAR LOGS
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="p-0 md:p-6 overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead className="text-[10px]">DATA</TableHead>
                                        <TableHead className="text-[10px]">USUÁRIO</TableHead>
                                        <TableHead className="text-[10px]">ERRO</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {clientErrors.length > 0 ? clientErrors.map(log => (
                                        <TableRow key={log.id} className="text-[10px] hover:bg-rose-50/20">
                                            <TableCell className="whitespace-nowrap font-mono opacity-60">
                                                {new Date(log.createdAt).toLocaleString('pt-BR')}
                                            </TableCell>
                                            <TableCell className="max-w-[120px] truncate">
                                                <span className="font-bold">{log.userEmail || 'Visitante'}</span>
                                            </TableCell>
                                            <TableCell className="max-w-[200px] break-words text-rose-700 dark:text-rose-400 font-medium">
                                                {log.error}
                                                <p className="text-[8px] opacity-50 font-mono mt-1 truncate">{log.url}</p>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center py-10 text-muted-foreground italic text-xs">
                                                Nenhum erro registrado. Tudo operando normalmente!
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ABA COUPO_TAB, NOTIFICATIONS, REFERRALS E AUDIT PRESERVADAS COM O LAYOUT MOBILE */}
                <TabsContent value="coupons_tab" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-left">
                        <Card className="lg:col-span-1 border-none shadow-sm md:border">
                            <CardHeader className="p-4 md:p-6">
                                <CardTitle className="text-sm uppercase flex items-center justify-between font-bold">
                                    <div className="flex items-center gap-2">{editingCoupon ? <Edit2 className="h-4 w-4 text-blue-500" /> : <Plus className="h-4 w-4" />} {editingCoupon ? "Editar" : "Novo"}</div>
                                    {editingCoupon && <Button variant="ghost" size="sm" onClick={() => { setEditingCoupon(null); setNewCoupon({code: "", days: 30, usageLimit: -1, planType: "premium"}); }}><X className="h-4 w-4" /></Button>}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 md:p-6 space-y-4">
                                <Input placeholder="CÓDIGO" value={newCoupon.code} disabled={!!editingCoupon} onChange={e => setNewCoupon({...newCoupon, code: e.target.value})} className="h-11" />
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1"><label className="text-[10px] font-bold uppercase">Dias</label><Input type="number" value={newCoupon.days === 0 ? "" : newCoupon.days} onChange={e => setNewCoupon({...newCoupon, days: e.target.value === "" ? 0 : Number(e.target.value)})} className="h-11" /></div>
                                    <div className="space-y-1"><label className="text-[10px] font-bold uppercase">Limite</label><Input type="number" value={newCoupon.usageLimit === 0 ? "" : newCoupon.usageLimit} onChange={e => setNewCoupon({...newCoupon, usageLimit: e.target.value === "" ? 0 : Number(e.target.value)})} className="h-11" /></div>
                                </div>
                                <Select value={newCoupon.planType} onValueChange={(v) => setNewCoupon({...newCoupon, planType: v})}><SelectTrigger className="h-11"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="premium">Premium</SelectItem><SelectItem value="annual">Anual</SelectItem></SelectContent></Select>
                                <Button onClick={handleSaveCoupon} className={`w-full h-11 ${editingCoupon ? "bg-blue-600" : "bg-emerald-600"}`}>{editingCoupon ? "Salvar" : "Criar"}</Button>
                            </CardContent>
                        </Card>
                        <Card className="lg:col-span-2 border-none shadow-sm md:border text-left overflow-hidden">
                            <CardHeader className="p-4 md:p-6"><CardTitle className="text-sm uppercase font-bold">Cupons Ativos</CardTitle></CardHeader>
                            <CardContent className="p-0 md:p-6 overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-muted/30"><TableRow><TableHead className="text-[10px]">CÓDIGO</TableHead><TableHead className="text-[10px]">DIAS</TableHead><TableHead className="text-[10px]">USOS</TableHead><TableHead className="text-right text-[10px]">AÇÃO</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {allCoupons.map(c => (
                                            <TableRow key={c.id} className="text-xs hover:bg-muted/10 transition-colors">
                                                <TableCell className="font-bold">{c.id}</TableCell>
                                                <TableCell className="whitespace-nowrap">{c.days}d</TableCell>
                                                <TableCell className="whitespace-nowrap">{c.usedCount} / {c.usageLimit === -1 ? '∞' : c.usageLimit}</TableCell>
                                                <TableCell className="text-right flex items-center justify-end gap-1"><Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEditClick(c)}><Edit2 className="h-3 w-3 text-blue-500" /></Button><Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleDeleteCoupon(c.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="notifications">
                    <Card className="border-none shadow-sm md:border max-w-2xl text-left overflow-hidden">
                        <CardHeader className="p-4 md:p-6"><CardTitle className="text-sm uppercase font-bold flex gap-2"><Info className="h-4 w-4 text-blue-500" /> Comunicado</CardTitle></CardHeader>
                        <CardContent className="p-4 md:p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="md:col-span-2"><Input placeholder="Título" value={notifTitle} onChange={e => setNotifTitle(e.target.value)} className="h-11" /></div>
                                <Select value={notifType} onValueChange={(v: any) => setNotifType(v)}><SelectTrigger className="h-11"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="INFO">🔵 INFO</SelectItem><SelectItem value="SUCCESS">🟢 SUCESSO</SelectItem><SelectItem value="WARNING">🟡 AVISO</SelectItem><SelectItem value="ERROR">🔴 ERRO</SelectItem></SelectContent></Select>
                            </div>
                            <textarea className="w-full h-32 p-3 rounded-md bg-muted/50 text-xs md:text-sm border outline-none focus:ring-1 focus:ring-primary" placeholder="Mensagem..." value={notifMsg} onChange={e => setNotifMsg(e.target.value)} />
                            <Input type="datetime-local" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} className="h-11" />
                            <Button className="w-full h-11 bg-blue-600" onClick={() => handleAction("SEND_GLOBAL_NOTIFICATION", { title: notifTitle, message: notifMsg, type: notifType, scheduledAt: scheduledDate || null })} disabled={!notifTitle || !notifMsg || !!isProcessing}>
                                {isProcessing === "SEND_GLOBAL_NOTIFICATION" ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Send className="h-4 w-4 mr-2" />} Disparar
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="referrals">
                    <Card className="border-none shadow-sm md:border text-left overflow-hidden">
                        <CardHeader className="p-4 md:p-6"><CardTitle className="text-sm uppercase font-bold tracking-tighter">Indicações Pendentes</CardTitle></CardHeader>
                        <CardContent className="p-0 md:p-6 overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/30"><TableRow><TableHead className="text-[10px]">PADRINHO</TableHead><TableHead className="text-[10px]">STATUS</TableHead><TableHead className="text-right text-[10px]">AÇÃO</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {referrals.map(ref => (
                                        <TableRow key={ref.id} className="text-[11px]"><TableCell className="max-w-[120px] truncate">{ref.referrerEmail}</TableCell><TableCell><Badge variant={ref.status === 'COMPLETED' ? 'default' : 'secondary'} className="text-[9px]">{ref.status}</Badge></TableCell><TableCell className="text-right">{ref.status !== 'COMPLETED' && <Button size="sm" className="h-7 px-2 text-[9px] font-bold" onClick={() => handleAction("FORCE_ACTIVATE_BONUS", { referralId: ref.id })} disabled={!!isProcessing}>ATIVAR</Button>}</TableCell></TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="audit" className="space-y-6">
                    {scheduledQueue.length > 0 && (
                        <Card className="border-amber-200 bg-amber-50/30 text-left overflow-hidden">
                            <CardHeader className="p-3 "><CardTitle className="text-[10px] uppercase font-black flex items-center gap-2 text-amber-700"><CalendarClock className="h-3 w-3" /> Fila de Envio</CardTitle></CardHeader>
                            <CardContent className="p-0 overflow-x-auto">
                                <Table><TableBody>{scheduledQueue.map(item => (<TableRow key={item.id} className="text-[10px] border-amber-100"><TableCell className="font-bold">{item.title}</TableCell><TableCell className="whitespace-nowrap italic text-amber-700">{new Date(item.scheduledAt).toLocaleString('pt-BR')}</TableCell><TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => handleDeleteScheduled(item.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button></TableCell></TableRow>))}</TableBody></Table>
                            </CardContent>
                        </Card>
                    )}
                    <Card className="border-none shadow-sm md:border text-left overflow-hidden">
                        <CardHeader className="p-4 md:p-6"><CardTitle className="text-sm uppercase font-bold">Audit Logs</CardTitle></CardHeader>
                        <CardContent className="p-0 md:p-6 overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/30"><TableRow><TableHead className="text-[10px]">EVENTO</TableHead><TableHead className="text-[10px]">DATA</TableHead><TableHead className="text-right text-[10px]">DETALHES</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {adminLogs.map(log => (
                                        <TableRow key={log.id} className="text-[10px]"><TableCell><Badge variant="outline" className="text-[9px] uppercase">{log.action}</Badge></TableCell><TableCell className="opacity-60 font-mono text-[9px] whitespace-nowrap">{new Date(log.createdAt).toLocaleDateString('pt-BR')}</TableCell><TableCell className="text-right italic truncate max-w-[150px]">{log.details}</TableCell></TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};