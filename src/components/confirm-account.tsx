"use client"

import React, {useEffect, useState} from "react"
import {Loader2} from "lucide-react"
import {Button} from "./ui/button"
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
import {useToast} from "@/hooks/use-toast.ts";
import {InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot} from "@/components/ui/input-otp.tsx";
import {Input} from "@/components/ui/input.tsx";

interface ConfirmAccountProps {
  dialogTrigger: React.ReactNode;
  onNavigateToDashboard: () => void;
  email: string;
  autoSendCode?: boolean;
}

export const ConfirmAccount: React.FC<ConfirmAccountProps> = ({ dialogTrigger, onNavigateToDashboard, email, autoSendCode = false }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const { toast } = useToast();
  const { activeDialog, setActiveDialog, dialogSource } = useDialogManager();
  const [formData, setFormData] = useState({
    code: "",
    email: email || "",
  });

  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [resendCooldown]);


  useEffect(() => {
    if (email) {
      setFormData((prev) => ({ ...prev, email }));
    }
  }, [email]);

  useEffect(() => {
    if (
        activeDialog === "confirm-account" &&
        dialogSource === "login" &&
        formData.email &&
        !codeSent &&
        autoSendCode
    ) {
      handleResendCode();
    }
  }, [activeDialog, dialogSource, formData.email, autoSendCode]);


  useEffect(() => {
    if (activeDialog === "confirm-account") {
      setFormData({ code: "", email: email || "" });
    }
  }, [activeDialog]);

  const handleChange = (value: string) => {
    setFormData((prev) => ({ ...prev, code: value.toUpperCase() }));
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData((prev) => ({ ...prev, email: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8080/auth/confirm-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: formData.code,
          email: formData.email,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      // const message = await response.text();

      setActiveDialog(null);
      onNavigateToDashboard();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao confirmar a conta",
        description: `${error instanceof Error ? error.message : String(error)}`,
        duration: 3000,
      });
      console.error("Erro ao confirmar a conta:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!formData.email) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Digite um email para reenviar o código.",
      });
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/auth/send-confirmation-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: formData.email }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      toast({
        variant: "default",
        title: "Código reenviado",
        description: "Verifique seu email.",
      });

      setCodeSent(true);
      setResendCooldown(60);

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao reenviar o código",
        description: `${error instanceof Error ? error.message : String(error)}`,
      });
    }
  };
  return (
      <Dialog open={activeDialog === "confirm-account"} onOpenChange={(open) => setActiveDialog(open ? "confirm-account" : null)}>
        <DialogTrigger asChild>
          <div className="text-emerald-600 hover:text-emerald-500 font-medium cursor-pointer flex items-center justify-center dark:text-emerald-600 dark:hover:text-emerald-500">
            {dialogTrigger}
          </div>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] bg-white">
          <DialogHeader>
            <DialogTitle className="dark:text-gray-600">Confirmar conta</DialogTitle>
            {dialogSource == '' || dialogSource == null ? (
                <DialogDescription className="dark:text-gray-600 flex items-center justify-center">
                  Código enviado para: {formData.email}
                </DialogDescription>
            ) : (
                <DialogDescription className="dark:text-gray-600">
                  Informe seu email para receber o código de confirmação.
                </DialogDescription>
            )}
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {(!formData.email || !codeSent) && (
                <div className="space-y-2 dark:text-gray-600">
                  <Label htmlFor="email">Email</Label>
                  <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={handleEmailChange}
                      required
                  />
                </div>
            )}

            <div className="space-y-2 flex flex-col items-center dark:text-gray-600">
              <Label htmlFor="code">Código de confirmação</Label>
              <div className="flex gap-2">
                <InputOTP maxLength={6} onChange={handleChange}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
                <Button
                    type="button"
                    variant="outline"
                    className="text-sm"
                    onClick={handleResendCode}
                    disabled={resendCooldown > 0}
                >
                  {resendCooldown > 0 ? `Reenviar (${resendCooldown}s)` : "Reenviar"}
                </Button>

              </div>
            </div>
            <Button
                variant="outline"
                type="submit"
                className="w-full cursor-pointer bg-gradient-to-r from-emerald-500 to-teal-500 mt-2 text-white"
                disabled={isLoading}
            >
              {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Confirmando conta...
                  </>
              ) : (
                  "Confirmar conta"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
  );
};
