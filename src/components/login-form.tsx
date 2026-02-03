"use client"

import React, {useState} from "react"
import {Eye, EyeOff, Loader2} from "lucide-react"
import {Button} from "./ui/button"
import {Input} from "./ui/input"
import {Label} from "./ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog.tsx";
import {useDialogManager} from "@/context/DialogManagerContext.tsx";
import {login, loginWithGoogle} from "../../firebase";
import {sendNotification} from "@/service/notificationService.ts"; // Importação restaurada

interface LoginFormProps {
  dialogTrigger: React.ReactNode;
  onNavigateToDashboard: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ dialogTrigger, onNavigateToDashboard }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { activeDialog, setActiveDialog } = useDialogManager();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: true,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // const handleCheckboxChange = (checked: boolean) => {
  //   setFormData((prev) => ({ ...prev, rememberMe: checked }))
  // }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await login(formData.email, formData.password);
      setActiveDialog(null);
      onNavigateToDashboard();
    } catch (error: any) {
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      const result = await loginWithGoogle();

      if (result?.isNewUser) {
        await sendNotification(
            result.user.uid,
            "Boas-vindas ao CashZ! 🚀",
            "Seu cadastro via Google foi concluído. Que tal começar definindo seu orçamento mensal?",
            "SUCCESS"
        );
      }

      setActiveDialog(null);
      onNavigateToDashboard();
    } catch (error) {
      console.error("Falha na autenticação Google");
    }
  }

  return (
      <Dialog open={activeDialog === "login"} onOpenChange={(open) => setActiveDialog(open ? "login" : null)}>
        <DialogTrigger asChild>
          <div className="cursor-pointer" onClick={() => setActiveDialog("login")}>{dialogTrigger}</div>
        </DialogTrigger>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-[425px] max-h-[95vh] overflow-y-auto bg-white rounded-lg">
          <DialogHeader>
            <DialogTitle className="dark:text-gray-600">Entrar</DialogTitle>
            <DialogDescription className="dark:text-gray-600">Acesse sua conta para gerenciar suas finanças</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-2 py-2">
            <div className="space-y-1 dark:text-gray-600">
              <Label htmlFor="email">Email</Label>
              <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
              />
            </div>
            <div className="space-y-2 dark:text-gray-600 pb-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Senha</Label>
                <button
                    type="button"
                    onClick={() => setActiveDialog("forgot-password")}
                    className="text-sm text-emerald-600 hover:text-emerald-500 font-medium bg-transparent border-none p-0 cursor-pointer"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative">
                <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/*<div className="flex items-center space-x-2 py-1">*/}
            {/*  <Checkbox id="remember" checked={formData.rememberMe} onCheckedChange={handleCheckboxChange} />*/}
            {/*  <Label htmlFor="remember" className="text-sm font-normal dark:text-gray-600 cursor-pointer">*/}
            {/*    Lembrar de mim*/}
            {/*  </Label>*/}
            {/*</div>*/}

            <Button variant="outline" type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 py-6 text-white font-semibold" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Entrar"}
            </Button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground font-medium italic">Ou</span>
              </div>
            </div>

            <Button
                type="button"
                variant="outline"
                className="w-full py-6 font-medium"
                onClick={handleGoogleLogin}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Entrar com Google
            </Button>

            <div className="text-center text-sm pt-4">
              <span className="text-gray-500">Não tem uma conta? </span>
              <span onClick={() => setActiveDialog("register")} className="inline-block font-medium text-emerald-600 cursor-pointer">
                Registre-se
              </span>
            </div>
          </form>
        </DialogContent>
      </Dialog>
  )
}