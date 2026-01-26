"use client"

import React, { useState } from "react"
import { Loader2, Mail } from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog.tsx"
import { useDialogManager } from "@/context/DialogManagerContext.tsx"
import { resetPassword } from "../../firebase" // Ajuste o caminho

export const ForgotPasswordForm = () => {
    const [isLoading, setIsLoading] = useState(false)
    const [email, setEmail] = useState("")
    const { activeDialog, setActiveDialog } = useDialogManager()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            await resetPassword(email)
            setActiveDialog("login") // Volta para o login após enviar
        } catch (error) {
            // Erro tratado na função resetPassword
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={activeDialog === "forgot-password"} onOpenChange={(open) => setActiveDialog(open ? "forgot-password" : "login")}>
            <DialogContent className="w-[calc(100%-2rem)] sm:max-w-[400px] bg-white rounded-lg">
                <DialogHeader>
                    <DialogTitle className="dark:text-gray-600">Recuperar Senha</DialogTitle>
                    <DialogDescription className="dark:text-gray-600">
                        Enviaremos um link de redefinição para o seu email.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="reset-email">Seu Email</Label>
                        <Input
                            id="reset-email"
                            type="email"
                            placeholder="seu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 py-6 text-white font-semibold"
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                        Enviar link de recuperação
                    </Button>
                    <Button
                        variant="ghost"
                        type="button"
                        className="w-full text-sm"
                        onClick={() => setActiveDialog("login")}
                    >
                        Voltar para o Login
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}