"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import {Button} from "@/components/ui/button.tsx";

interface LegalModalProps {
    isOpen: boolean
    onClose: () => void
    type: "terms" | "privacy"
}

export const LegalModal = ({ isOpen, onClose, type }: LegalModalProps) => {
    const content = {
        terms: {
            title: "Termos de Uso",
            description: "Última atualização: Fevereiro de 2026",
            text: (
                <div className="space-y-4 text-sm text-slate-600">
                    <section>
                        <h4 className="font-bold text-slate-900">1. Aceitação dos Termos</h4>
                        <p>Ao acessar o CashZ, você concorda em cumprir estes termos de serviço, todas as leis e regulamentos aplicáveis.</p>
                    </section>
                    <section>
                        <h4 className="font-bold text-slate-900">2. Uso de Licença</h4>
                        <p>O plano gratuito permite uso pessoal limitado (10 transações e 2 metas). O plano Premium é individual e intransferível, exceto pela funcionalidade de compartilhamento por convite.</p>
                    </section>
                    <section>
                        <h4 className="font-bold text-slate-900">3. Responsabilidade Financeira</h4>
                        <p>O CashZ é uma ferramenta de auxílio organizacional. Não nos responsabilizamos por decisões financeiras tomadas com base nos dados ou análises de IA fornecidos pela plataforma.</p>
                    </section>
                    <section>
                        <h4 className="font-bold text-slate-900">4. Pagamentos e Assinaturas</h4>
                        <p>Assinaturas Premium são processadas via parceiros de pagamento seguros. O cancelamento interrompe a renovação, mas não gera estorno de períodos já utilizados.</p>
                    </section>
                </div>
            ),
        },
        privacy: {
            title: "Política de Privacidade",
            description: "Como protegemos seus dados financeiros",
            text: (
                <div className="space-y-4 text-sm text-slate-600">
                    <section>
                        <h4 className="font-bold text-slate-900">1. Coleta de Dados</h4>
                        <p>Coletamos seu e-mail para autenticação e os dados financeiros que você insere voluntariamente para fins de organização pessoal.</p>
                    </section>
                    <section>
                        <h4 className="font-bold text-slate-900">2. Segurança (LGPD)</h4>
                        <p>Seus dados são armazenados em nuvem com criptografia de ponta a ponta. Não vendemos seus dados para terceiros ou instituições financeiras.</p>
                    </section>
                    <section>
                        <h4 className="font-bold text-slate-900">3. Compartilhamento entre Usuários</h4>
                        <p>Seus dados só serão visíveis para outros usuários se você enviar e eles aceitarem explicitamente um convite de compartilhamento.</p>
                    </section>
                    <section>
                        <h4 className="font-bold text-slate-900">4. Seus Direitos</h4>
                        <p>Você pode excluir sua conta e todos os dados vinculados a ela a qualquer momento através das configurações do perfil.</p>
                    </section>
                </div>
            ),
        },
    }

    const activeContent = content[type]

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="w-[95vw] sm:max-w-[600px] max-h-[85vh] flex flex-col p-0 overflow-hidden bg-white border-none shadow-2xl rounded-2xl">
                <DialogHeader className="p-6 pb-2 text-left">
                    <DialogTitle className="text-2xl font-bold text-slate-900">{activeContent.title}</DialogTitle>
                    <DialogDescription>{activeContent.description}</DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 p-6 pt-2">
                    {activeContent.text}
                    <div className="h-4" />
                </ScrollArea>

                <div className="p-4 border-t bg-slate-50 flex justify-end">
                    <Button onClick={onClose} className="bg-emerald-600 hover:bg-emerald-700">
                        Compreendi
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}