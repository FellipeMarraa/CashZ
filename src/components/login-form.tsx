"use client"

import React, {useEffect, useState} from "react"
import {Eye, EyeOff, Loader2} from "lucide-react"
import {Button} from "./ui/button"
import {Input} from "./ui/input"
import {Label} from "./ui/label"
import {Checkbox} from "./ui/checkbox"
import {RegisterForm} from "@/components/register-form.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog.tsx";
import {useDialogManager} from "@/context/DialogManagerContext.tsx";
import type {LoginResponse} from "@/model/LoginResponse"
import {useToast} from "@/hooks/use-toast.ts";
import {useAuth} from "@/context/AuthContext.tsx";
import {jwtDecode} from "jwt-decode";

interface LoginFormProps {
  dialogTrigger: React.ReactNode;
  onNavigateToDashboard: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ dialogTrigger, onNavigateToDashboard }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const {toast} = useToast();
  const { setUser } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  })

  useEffect(() => {
    setFormData({
      email: "",
      password: "",
      rememberMe: true,
    })
  }, []);

  const { activeDialog, setActiveDialog } = useDialogManager();


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, rememberMe: checked }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("http://localhost:8080/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        toast({
          variant: "destructive",
          title: "Erro ao fazer login",
          description: errorText,
        });
      }

      const data: LoginResponse = await response.json();

      const decoded: any = jwtDecode(data.token);
      setUser({
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        photo: decoded.photo || "",
        roles: decoded.roles || [],
      });

      localStorage.setItem("token", data.token)
      onNavigateToDashboard();

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao fazer login",
        description: `${error instanceof Error ? error.message : String(error)}`,
        duration: 3000,
      });
    } finally {
      setIsLoading(false)
    }
  }


  return (
<>
      <Dialog open={activeDialog === "login"} onOpenChange={(open) => setActiveDialog(open ? "login" : null)}>
        <DialogTrigger asChild>
            <div className="cursor-pointer" onClick={() => setActiveDialog("login")}>{dialogTrigger}</div>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]  overscroll-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="dark:text-gray-600">Entrar</DialogTitle>
            <DialogDescription className="dark:text-gray-600">Acesse sua conta para gerenciar suas finanças</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2 dark:text-gray-600">
              <Label htmlFor="email" className="dark:text-gray-600">Email</Label>
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
            <div className="space-y-2 dark:text-gray-600">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Senha</Label>
                <a href="#" className="text-sm text-emerald-600 hover:text-emerald-500">
                  Esqueceu a senha?
                </a>
              </div>
              <div className="relative dark:text-gray-600">
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
                    className="absolute right-0 top-0 h-full px-3 py-2 text-gray-400 dark:hover:bg-transparent hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-2 ">
              <Checkbox className="cursor-pointer dark:text-gray-600 dark:border-gray-600" id="remember" checked={formData.rememberMe} onCheckedChange={handleCheckboxChange} />
              <Label htmlFor="remember" className="text-sm font-normal dark:text-gray-600">
                Lembrar de mim
              </Label>
            </div>
            <Button variant="outline" type="submit" className="w-full cursor-pointer bg-gradient-to-r from-emerald-500 to-teal-500 mt-2 text-white" disabled={isLoading}>
              {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
              ) : (
                  "Entrar"
              )}
            </Button>
            <div className="text-center text-sm">
              <span className="text-gray-500">Não tem uma conta? </span>
              <span onClick={() => setActiveDialog("register")}>
                <RegisterForm onNavigateToDashboard={onNavigateToDashboard} dialogTrigger="Registre-se" />
              </span>
            </div>
            {/*<div className="text-center text-sm">*/}
            {/*  <span className="text-gray-500">Precisa confirmar a conta? </span>*/}
            {/*  <span*/}
            {/*      className="text-emerald-600 hover:text-emerald-500 font-medium cursor-pointer"*/}
            {/*      onClick={() => {*/}
            {/*        setActiveDialog(null);*/}
            {/*        setTimeout(() => setActiveDialog("confirm-account", "login"), 100);*/}
            {/*      }}>*/}
            {/*      Confirmar conta*/}
            {/*    </span>*/}
            {/*</div>*/}

          </form>
        </DialogContent>
      </Dialog>
      {/*<ConfirmAccount*/}
      {/*    email={formData.email}*/}
      {/*    onNavigateToDashboard={onNavigateToDashboard}*/}
      {/*    autoSendCode={true}*/}
      {/*    dialogTrigger={<></>}*/}
      {/*/>*/}

</>
  )
}
