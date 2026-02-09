"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button.tsx";

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
                <div className="space-y-4 text-sm text-muted-foreground pr-4 text-left">
                    <section>
                        <h4 className="font-bold text-foreground">1. Aceitação e Elegibilidade</h4>
                        <p>Ao acessar o CashZ, você declara ter mais de 18 anos ou ser emancipado, e concorda com estes termos e todas as leis aplicáveis.</p>
                    </section>
                    <section>
                        <h4 className="font-bold text-foreground">2. Isenção de Consultoria Financeira</h4>
                        <p>O CashZ fornece ferramentas de organização e análises via Inteligência Artificial. **Não realizamos consultoria de investimentos.** Toda decisão financeira tomada com base nas informações da plataforma é de inteira responsabilidade do usuário.</p>
                    </section>
                    <section>
                        <h4 className="font-bold text-foreground">3. Uso de Licença e Limites</h4>
                        <p>O plano Gratuito é limitado. O plano Premium é para uso pessoal e familiar (via compartilhamento). É proibida a revenda de acesso ou o uso da plataforma para fins comerciais sem autorização prévia.</p>
                    </section>
                    <section>
                        <h4 className="font-bold text-foreground">4. Compartilhamento de Conta</h4>
                        <p>Ao utilizar o sistema de convites, você autoriza que o parceiro visualize e edite dados. O CashZ não intervém em disputas entre usuários que compartilham contas.</p>
                    </section>
                    <section>
                        <h4 className="font-bold text-foreground">5. Assinaturas e Reembolsos</h4>
                        <p>Assinaturas podem ser canceladas a qualquer momento. Estornos são garantidos em até 7 dias após a compra inicial. Após esse prazo, o serviço será mantido até o final do período contratado sem devolução de valores.</p>
                    </section>
                    <section>
                        <h4 className="font-bold text-foreground">6. Integridade e Backup de Dados</h4>
                        <p>
                            O usuário é o único responsável pela precisão e veracidade dos dados inseridos.
                            O CashZ **não realiza serviços de backup individualizado** ou restauração de dados deletados acidentalmente pelo usuário.
                            Embora utilizemos infraestrutura de nuvem segura, recomendamos que o usuário realize exportações periódicas (CSV/Excel) de seus dados para segurança pessoal.
                        </p>
                    </section>
                    <section>
                        <h4 className="font-bold text-foreground">7. Limitação de Responsabilidade</h4>
                        <p>
                            Em nenhuma circunstância o CashZ será responsável por perdas financeiras, lucros cessantes ou danos decorrentes da perda de dados ou instabilidade técnica da plataforma.
                            O serviço é fornecido "como está" (as is), sem garantias de disponibilidade ininterrupta.
                        </p>
                    </section>
                </div>
            ),
        },
        privacy: {
            title: "Política de Privacidade",
            description: "Conformidade com a LGPD e Segurança de Dados",
            text: (
                <div className="space-y-4 text-sm text-muted-foreground pr-4 text-left">
                    <section>
                        <h4 className="font-bold text-foreground">1. Dados Coletados</h4>
                        <p>Coletamos seu nome e e-mail (via Google Auth ou Cadastro) para identificação, e dados de transações/ativos inseridos por você para o funcionamento das métricas.</p>
                    </section>
                    <section>
                        <h4 className="font-bold text-foreground">2. Uso de Dados e IA</h4>
                        <p>Seus dados financeiros são processados de forma anonimizada por modelos de IA para gerar insights. **Nunca vendemos seus dados para anunciantes ou bancos.**</p>
                    </section>
                    <section>
                        <h4 className="font-bold text-foreground">3. Retenção e Exclusão</h4>
                        <p>Os dados permanecem em nossos servidores enquanto sua conta estiver ativa. Ao solicitar a exclusão da conta, todos os seus dados financeiros são apagados permanentemente de nossos bancos de dados em até 30 dias.</p>
                    </section>
                    <section>
                        <h4 className="font-bold text-foreground">4. Cookies e Rastreamento</h4>
                        <p>Utilizamos apenas cookies essenciais para manter sua sessão ativa e ferramentas de análise de performance (como logs de erro) para garantir a estabilidade do app.</p>
                    </section>
                </div>
            ),
        },
    }

    const activeContent = content[type]

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="w-[95vw] sm:max-w-[600px] h-[85vh] flex flex-col p-0 overflow-hidden bg-background border-border shadow-2xl rounded-2xl">
                <DialogHeader className="p-6 pb-2 text-left shrink-0">
                    <DialogTitle className="text-2xl font-bold text-foreground">{activeContent.title}</DialogTitle>
                    <DialogDescription className="text-foreground">{activeContent.description}</DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-grow px-6 py-4 border-y border-border">
                    {activeContent.text}
                </ScrollArea>

                <div className="p-4 bg-muted/30 flex justify-end shrink-0">
                    <Button onClick={onClose} className="bg-emerald-600 hover:bg-emerald-700 px-8 text-white">
                        Compreendi
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}