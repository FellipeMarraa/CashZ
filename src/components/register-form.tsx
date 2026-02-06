"use client"

import React, {useEffect, useState} from "react"
import {Eye, EyeOff, Loader2} from "lucide-react"
import {Button} from "./ui/button"
import {Input} from "./ui/input"
import {Label} from "./ui/label"
import {Checkbox} from "./ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog.tsx";
import {useDialogManager} from "@/context/DialogManagerContext.tsx";
import {auth, loginWithGoogle, register} from "../../firebase";
import {updateProfile} from "firebase/auth";
import {useAuth} from "@/context/AuthContext";
import {LegalModal} from "@/components/legal-modal";
import {sendNotification} from "@/service/notificationService"; // Importação necessária

interface RegisterFormProps {
  dialogTrigger: React.ReactNode;
  onNavigateToDashboard: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ dialogTrigger, onNavigateToDashboard }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { refreshUser } = useAuth();

  const [legalView, setLegalView] = useState<{ isOpen: boolean; type: "terms" | "privacy" }>({
    isOpen: false,
    type: "terms",
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    agreeTerms: false,
  });

  useEffect(() => {
    setFormData({
      name: "",
      email: "",
      password: "",
      agreeTerms: false,
    })
  }, []);

  const { activeDialog, setActiveDialog } = useDialogManager();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, agreeTerms: checked }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await register(formData.email, formData.password);

      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: formData.name
        });

        // Envia notificação de boas-vindas
        await sendNotification(
            auth.currentUser.uid,
            "Bem-vindo ao CashZ! 🚀",
            "Sua jornada para o controle financeiro começou. Explore as abas de Orçamentos e Investimentos para começar.",
            "SUCCESS"
        );

        await auth.currentUser.reload();

        if (refreshUser) {
          await refreshUser();
        }
      }

      setActiveDialog(null);

      setTimeout(() => {
        onNavigateToDashboard();
      }, 500);

    } catch (error: any) {
      console.error("Erro no fluxo de registro:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result: any = await loginWithGoogle();

      if (result?.user) {
        const isNewUser = result.user.metadata.creationTime === result.user.metadata.lastSignInTime;

        if (isNewUser) {
          await sendNotification(
              result.user.uid,
              "Bem-vindo ao CashZ! 🚀",
              "Que bom ter você aqui! Comece organizando suas categorias e definindo suas primeiras metas.",
              "SUCCESS"
          );
        }
      }

      setActiveDialog(null);
      onNavigateToDashboard();
    } catch (error) {
      console.error("Erro no login Google:", error);
    }
  }

  return (
      <>
        <Dialog open={activeDialog === "register"} onOpenChange={(open) => setActiveDialog(open ? "register" : null)}>
          <DialogTrigger asChild>
            <div className="text-emerald-600 hover:text-emerald-500 font-medium cursor-pointer flex items-center justify-center" onClick={() => setActiveDialog("register")}>{dialogTrigger}</div>
          </DialogTrigger>

          {/* Blindagem com ! importante para manter light mode absoluto */}
          <DialogContent className="light w-[calc(100%-2rem)] sm:max-w-[425px] max-h-[95vh] overflow-y-auto !bg-white !text-slate-900 rounded-lg border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="!text-slate-900">Criar Conta</DialogTitle>
              <DialogDescription className="!text-slate-500">Registre-se para começar a gerenciar suas finanças</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="!text-slate-700">Nome completo</Label>
                <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Seu nome"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full !bg-white !border-slate-200 !text-slate-900 focus:!ring-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-email" className="!text-slate-700">Email</Label>
                <Input
                    id="register-email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full !bg-white !border-slate-200 !text-slate-900 focus:!ring-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-password" className="!text-slate-700">Senha</Label>
                <div className="relative">
                  <Input
                      id="register-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="w-full !bg-white !border-slate-200 !text-slate-900 focus:!ring-emerald-500"
                  />
                  <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 !text-slate-400 hover:!text-slate-600 hover:!bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-[10px] !text-slate-400">A senha deve ter pelo menos 6 caracteres.</p>
              </div>

              <div className="flex items-start space-x-2 py-1">
                <Checkbox
                    id="terms"
                    className="cursor-pointer !border-slate-300 data-[state=checked]:!bg-emerald-600 data-[state=checked]:!border-emerald-600"
                    checked={formData.agreeTerms}
                    onCheckedChange={handleCheckboxChange}
                    required
                />
                <Label htmlFor="terms" className="text-xs font-normal leading-tight cursor-pointer !text-slate-600">
                  Eu concordo com os{" "}
                  <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setLegalView({ isOpen: true, type: "terms" })}}
                      className="text-emerald-600 hover:text-emerald-500 "
                  >
                    Termos de Serviço
                  </button>
                  {" "}e{" "}
                  <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setLegalView({ isOpen: true, type: "privacy" })}}
                      className="text-emerald-600 hover:text-emerald-500 "
                  >
                    Política de Privacidade
                  </button>
                </Label>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button
                    type="button"
                    variant="outline"
                    className="w-full !border-slate-200 !text-slate-700 hover:!bg-slate-50 !bg-white"
                    onClick={handleGoogleLogin}
                    disabled={!formData.agreeTerms}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </Button>

                <Button
                    variant="default"
                    type="submit"
                    className="w-full !bg-emerald-600 hover:!bg-emerald-700 !text-white  shadow-lg shadow-emerald-200 border-none"
                    disabled={isLoading || !formData.agreeTerms || !formData.name || !formData.email || !formData.password || formData.password.length < 6}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar Conta"}
                </Button>
              </div>

              <div className="text-center text-sm pt-4">
                <span className="!text-slate-500">Já tem uma conta? </span>
                <span className="text-emerald-600 hover:text-emerald-500  cursor-pointer" onClick={() => setActiveDialog("login")}>
                 Faça o Login
              </span>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <LegalModal
            isOpen={legalView.isOpen}
            type={legalView.type}
            onClose={() => setLegalView(prev => ({ ...prev, isOpen: false }))}
        />
      </>
  )
}