"use client"

import React, { useEffect, useState } from "react"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Checkbox } from "./ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog.tsx";
import { LoginForm } from "@/components/login-form.tsx";
import { useDialogManager } from "@/context/DialogManagerContext.tsx";
import { useToast } from "@/hooks/use-toast.ts";
import { register, auth } from "../../firebase"; // Ajuste o caminho
import { updateProfile } from "firebase/auth";

interface RegisterFormProps {
  dialogTrigger: React.ReactNode;
  onNavigateToDashboard: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ dialogTrigger, onNavigateToDashboard }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { toast } = useToast();

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
      // 1. Cria a conta no Firebase
      await register(formData.email, formData.password);

      // 2. Atualiza o perfil com o nome digitado (Opcional, mas recomendado)
      // O register faz login automático, então auth.currentUser já deve estar disponível
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: formData.name
        });
      }

      // 3. Sucesso! Navega para a dashboard
      setActiveDialog(null);
      onNavigateToDashboard();

    } catch (error: any) {
      // Erros são tratados no firebase.ts (toast), mas se falhar o updateProfile pode cair aqui
      console.error("Erro no fluxo de registro:", error);
    } finally {
      setIsLoading(false);
    }
  };


  return (
      <Dialog open={activeDialog === "register"} onOpenChange={(open) => setActiveDialog(open ? "register" : null)}>
        <DialogTrigger asChild>
          <div className="text-emerald-600 hover:text-emerald-500 font-medium cursor-pointer flex items-center justify-center dark:text-emerald-600 dark:hover:text-emerald-500" onClick={() => setActiveDialog("register")}>{dialogTrigger}</div>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] bg-white">
          <DialogHeader>
            <DialogTitle className="dark:text-gray-600">Criar Conta</DialogTitle>
            <DialogDescription className="dark:text-gray-600">Registre-se para começar a gerenciar suas finanças</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2 dark:text-gray-600">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Seu nome"
                  value={formData.name}
                  onChange={handleChange}
                  required
              />
            </div>
            <div className="space-y-2 dark:text-gray-600">
              <Label htmlFor="register-email">Email</Label>
              <Input
                  id="register-email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
              />
            </div>
            <div className="space-y-2 dark:text-gray-600">
              <Label htmlFor="register-password">Senha</Label>
              <div className="relative">
                <Input
                    id="register-password"
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
                    className="absolute right-0 top-0 h-full px-3 py-2 text-gray-400 dark:hover:bg-transparent hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-gray-500">A senha deve ter pelo menos 6 caracteres.</p>
            </div>
            <div className="flex items-center space-x-2 dark:text-gray-600">
              <Checkbox id="terms" className="cursor-pointer dark:text-gray-600 dark:border-gray-600" checked={formData.agreeTerms} onCheckedChange={handleCheckboxChange} required />
              <Label htmlFor="terms" className="text-sm font-normal">
                Eu concordo com os{" "}
                <a href="#" className="text-emerald-600 hover:text-emerald-500 font-medium">
                  Termos de Serviço{" "}
                </a>
                e{" "}
                <a href="#" className="text-emerald-600 hover:text-emerald-500 font-medium">
                  Política de Privacidade
                </a>
              </Label>
            </div>
            <Button variant="outline" type="submit" className="w-full cursor-pointer bg-gradient-to-r from-emerald-500 to-teal-500 mt-2 text-white" disabled={isLoading}>
              {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando conta...
                  </>
              ) : (
                  "Criar conta"
              )}
            </Button>
            <div className="text-center text-sm">
              <span className="text-gray-500">Já tem uma conta? </span>
              <span className="text-emerald-600 hover:text-emerald-500 font-medium cursor-pointer" onClick={() => setActiveDialog("login")}>
              <LoginForm onNavigateToDashboard={onNavigateToDashboard} dialogTrigger="Faça o Login"/>
            </span>
            </div>
          </form>
        </DialogContent>
      </Dialog>
  )
}