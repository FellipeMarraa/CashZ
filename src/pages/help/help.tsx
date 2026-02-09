"use client"

import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from '@/components/ui/accordion';
import {FileText, Mail, MessageCircle, ShieldCheck} from 'lucide-react';
import {useState} from "react";
import {LegalModal} from "@/components/legal-modal.tsx";

export const HelpSection = () => {
    const phone = "5534998842288";
    const openWhatsApp = () => {
        const message = encodeURIComponent("Olá, preciso de ajuda com o CashZ");
        window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
    };

    const faqs = [
        {
            q: "Como funciona o compartilhamento de conta?",
            a: "No plano Premium, você pode enviar um convite por e-mail através da aba de Perfil. Assim que seu parceiro aceitar, vocês compartilharão os mesmos dados de transações e orçamentos em tempo real."
        },
        {
            q: "Os meus dados bancários estão seguros?",
            a: "O CashZ não se conecta diretamente à sua conta bancária. Você insere os dados manualmente ou via exportação, e todas as informações são protegidas com criptografia de ponta a ponta em nossa nuvem."
        },
        {
            q: "Como cancelar minha assinatura?",
            a: "Você pode gerenciar ou cancelar sua assinatura a qualquer momento na aba de Configurações. O acesso Premium permanecerá ativo até o fim do período já pago."
        },
        {
            q: "O que acontece se eu atingir o limite do plano gratuito?",
            a: "No plano gratuito, você tem um limite de 10 transações mensais. Ao atingir o limite, você ainda poderá visualizar seus dados, mas precisará migrar para o Premium para adicionar novas movimentações."
        }
    ];

    const [legalView, setLegalView] = useState<{ isOpen: boolean; type: "terms" | "privacy" }>({
        isOpen: false,
        type: "terms",
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-700 pb-10 text-left">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-sm md:border">
                    <CardHeader className="pb-3">
                        <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-2">
                            <MessageCircle className="h-5 w-5 text-emerald-600" />
                        </div>
                        <CardTitle className="text-base">WhatsApp</CardTitle>
                        <CardDescription>Atendimento humanizado</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={openWhatsApp} variant="outline" className="w-full gap-2 border-emerald-200 hover:bg-emerald-50 text-emerald-700 dark:text-emerald-400">
                            Iniciar Chat
                        </Button>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm md:border">
                    <CardHeader className="pb-3">
                        <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-2">
                            <Mail className="h-5 w-5 text-blue-600" />
                        </div>
                        <CardTitle className="text-base">E-mail</CardTitle>
                        <CardDescription>Suporte técnico oficial</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" className="w-full gap-2" onClick={() => window.location.href = "mailto:fellipemarra.fm@gmail.com"}>
                            Enviar E-mail
                        </Button>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm md:border">
                    <CardHeader className="pb-3 text-left">
                        <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2">
                            <FileText className="h-5 w-5 text-slate-600" />
                        </div>
                        <CardTitle className="text-base">Documentação</CardTitle>
                        <CardDescription>Termos e Privacidade</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col sm:flex-row gap-2">
                        <Button
                            variant="outline"
                            className="w-full gap-2"
                            onClick={() => setLegalView({ isOpen: true, type: "terms" })}
                        >
                            Termos
                        </Button>

                        <Button
                            variant="outline"
                            className="w-full gap-2"
                            onClick={() => setLegalView({ isOpen: true, type: "privacy" })}
                        >
                            Privacidade
                        </Button>
                    </CardContent>
                </Card>
                <LegalModal
                    isOpen={legalView.isOpen}
                    type={legalView.type}
                    onClose={() => setLegalView(prev => ({ ...prev, isOpen: false }))}
                />
            </div>

            <Card className="border-none shadow-sm md:border">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-emerald-500" />
                        Perguntas Frequentes (FAQ)
                    </CardTitle>
                    <CardDescription>Tire suas dúvidas rapidamente antes de entrar em contato.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                        {faqs.map((faq, i) => (
                            <AccordionItem key={i} value={`item-${i}`}>
                                <AccordionTrigger className="text-left hover:no-underline font-medium text-slate-700 dark:text-slate-300">
                                    {faq.q}
                                </AccordionTrigger>
                                <AccordionContent className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                    {faq.a}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>

            <div className="flex flex-col items-center justify-center py-6 space-y-2 opacity-60">
                <p className="text-xs">CashZ Finance - Versão 2.1.0</p>
                <p className="text-[10px]">Minas Gerais, Brasil 🇧🇷</p>
            </div>
        </div>
    );
};