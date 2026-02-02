"use client"

import {useEffect, useState} from "react"
import {AnimatePresence, motion} from "framer-motion"
import {
    BrainCircuit,
    Check,
    ChevronRight,
    Clock,
    LogInIcon,
    MapPin,
    Menu,
    Phone,
    PieChart,
    Users,
    X
} from "lucide-react"
import {Player} from "@lottiefiles/react-lottie-player";
import {LoginForm} from "./login-form";
import {Button} from "./ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "./ui/card";
import {RegisterForm} from "./register-form";
import {ForgotPasswordForm} from "@/components/forgot-password-form.tsx";
import {LegalModal} from "@/components/legal-modal.tsx";

interface LandingPageProps {
    onNavigateToDashboard: () => void;
}

export const LandingPage = ({ onNavigateToDashboard }: LandingPageProps) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [, setActiveTestimonial] = useState(0);
    const [legalModal, setLegalModal] = useState<{ isOpen: boolean; type: "terms" | "privacy" }>({
        isOpen: false,
        type: "terms",
    });

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveTestimonial((prev) => (prev + 1) % testimonials.length)
        }, 5000)
        return () => clearInterval(interval)
    }, [])

    const testimonials = [
        {
            name: "Carlos Silva",
            role: "Usuário Premium",
            content:
                "Finalmente consegui organizar as finanças de casa junto com minha esposa. O sistema de convites e o compartilhamento mudaram nosso planejamento.",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos&backgroundColor=b6e3f4&mouth=smile",
        },
        {
            name: "Lucas Oliveira",
            role: "Planejadora",
            content:
                "As metas por categoria são intuitivas. Agora sei exatamente quanto posso gastar com os limites de orçamento do mês.",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ana&backgroundColor=ffdfbf&mouth=smile",
        },
        {
            name: "Roberta Martins",
            role: "Usuário Premium",
            content:
                "A análise de IA me economiza horas revisando meus ativos anuais e me ajuda a decidir onde aportar melhor.",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Roberto&backgroundColor=c0aede&mouth=smile",
        },
    ]

    const features = [
        {
            title: "Gestão por Convite",
            description: "Envie solicitações de compartilhamento e gerencie orçamentos em conjunto após o aceite do parceiro.",
            icon: <Users className="h-10 w-10 text-emerald-500" />,
        },
        {
            title: "Controle de Metas",
            description: "Defina limites de gastos por categoria e mantenha sua saúde financeira sob controle.",
            icon: <PieChart className="h-10 w-10 text-emerald-500" />,
        },
        {
            title: "Análise com IA",
            description: "Inteligência Artificial que analisa sua carteira de investimentos e sugere ajustes automáticos.",
            icon: <BrainCircuit className="h-10 w-10 text-emerald-500" />,
        },
        {
            title: "Automação Financeira",
            description: "Agende transações fixas e gerencie parcelamentos para prever seu saldo nos próximos meses.",
            icon: <Clock className="h-10 w-10 text-emerald-500" />,
        },
    ]

    return (
        <div className="light min-h-screen bg-white overflow-x-hidden">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center text-left">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="flex items-center"
                    >
                        <div className="h-8 w-8 rounded-md mr-2"><img src="/cashz.svg" alt="Logo"/></div>
                        <span className="text-xl font-bold text-gray-900">CashZ</span>
                    </motion.div>

                    <nav className="hidden md:flex items-center space-x-8">
                        <a href="#features" className="text-gray-600 hover:text-emerald-500 transition-colors">Recursos</a>
                        <a href="#pricing" className="text-gray-600 hover:text-emerald-500 transition-colors">Preços</a>
                        <LoginForm onNavigateToDashboard={onNavigateToDashboard} dialogTrigger={
                            <Button variant="outline" className="mr-2 bg-gradient-to-r from-emerald-500 to-teal-500 border-none cursor-pointer px-4 py-2 text-white font-bold">
                                <LogInIcon className="w-4 h-4 mr-2"/> Login
                            </Button>
                        } />
                    </nav>

                    <div className="md:hidden cursor-pointer">
                        <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                            {isMenuOpen ? <X /> : <Menu />}
                        </Button>
                    </div>
                </div>

                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="md:hidden bg-white border-t border-gray-100 overflow-hidden"
                        >
                            <div className="container mx-auto px-4 py-4 flex flex-col space-y-4">
                                <a href="#features" className="text-gray-600 hover:text-emerald-500 transition-colors py-2" onClick={() => setIsMenuOpen(false)}>Recursos</a>
                                <a href="#pricing" className="text-gray-600 hover:text-emerald-500 transition-colors py-2" onClick={() => setIsMenuOpen(false)}>Preços</a>
                                <div className="pt-2">
                                    <LoginForm onNavigateToDashboard={onNavigateToDashboard} dialogTrigger={
                                        <Button variant="outline" className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 border-none cursor-pointer text-white justify-center font-bold">
                                            <LogInIcon className="w-4 h-4 mr-2"/> Login
                                        </Button>
                                    } />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            {/* Hero Section */}
            <section className="pt-28 pb-16 md:pb-28 px-4 md:px-8">
                <div className="container mx-auto px-4 text-left">
                    <div className="flex flex-col md:flex-row items-center">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full md:w-1/2 mb-10 md:mb-0 text-center md:text-left">
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                                Tome o controle da sua <span className="text-emerald-500">liberdade</span> financeira
                            </h1>
                            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-lg mx-auto md:mx-0">
                                Gerencie gastos, analise ativos com IA e compartilhe sua jornada com quem você ama.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                                <Button size="lg" variant="outline" className="w-full sm:w-auto cursor-pointer hover:text-emerald-500 transition-colors dark:hover:text-emerald-500 dark:bg-white dark:border-gray-300 font-bold">
                                    <RegisterForm onNavigateToDashboard={onNavigateToDashboard} dialogTrigger={
                                        <span className="flex items-center justify-center w-full">Começar Gratuitamente <ChevronRight className="ml-2 h-4 w-4" /></span>
                                    }/>
                                </Button>
                            </div>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }} className="w-full md:w-1/2 mt-8 md:mt-0 md:ml-10">
                            <div className="relative">
                                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg blur-lg opacity-30"></div>
                                <div className="relative bg-white rounded-lg shadow-xl overflow-hidden">
                                    <Player autoplay loop src="/animationLandingPage.json" className="w-full h-auto max-h-[400px] md:max-h-full" />
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-12 md:py-16 bg-gray-50 px-4 md:px-8 text-left">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div className="text-center"><p className="text-3xl md:text-4xl font-bold text-emerald-500 mb-2">Simples</p><p className="text-sm text-gray-600">Interface Intuitiva</p></div>
                        <div className="text-center"><p className="text-3xl md:text-4xl font-bold text-emerald-500 mb-2">Seguro</p><p className="text-sm text-gray-600">Dados Criptografados</p></div>
                        <div className="text-center"><p className="text-3xl md:text-4xl font-bold text-emerald-500 mb-2">IA</p><p className="text-sm text-gray-600">Análise Inteligente</p></div>
                        <div className="text-center"><p className="text-3xl md:text-4xl font-bold text-emerald-500 mb-2">Grátis</p><p className="text-sm text-gray-600">Plano Individual</p></div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-16 md:py-28 px-4 md:px-8">
                <div className="container mx-auto px-4 text-left">
                    <div className="text-center mb-12 md:mb-16">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Recursos Essenciais</h2>
                        <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">Praticidade para organizar sua vida financeira com precisão</p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                        {features.map((feature, index) => (
                            <motion.div key={index} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.1 }}>
                                <Card className="h-full border-none shadow-lg hover:shadow-xl dark:bg-white text-left">
                                    <CardHeader><div className="mb-4">{feature.icon}</div><CardTitle className="dark:text-gray-600 font-bold">{feature.title}</CardTitle></CardHeader>
                                    <CardContent><p className="text-gray-600 text-sm md:text-base">{feature.description}</p></CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Sharing Section */}
            <section className="py-16 md:py-28 px-4 md:px-8 bg-white text-left">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col-reverse md:flex-row items-center">
                        <div className="w-full md:w-1/2 mt-10 md:mt-0">
                            <div className="relative">
                                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg blur-lg opacity-30"></div>
                                <div className="relative bg-white rounded-lg shadow-xl overflow-hidden">
                                    <Player autoplay loop src="/sharedAnimationLandingPage.json" className="w-full h-auto max-h-[300px] md:max-h-[400px]" />
                                </div>
                            </div>
                        </div>
                        <div className="w-full md:w-1/2 md:ml-10 text-center md:text-left">
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-6">
                                <span className="text-emerald-500">Planejem</span> o futuro em conjunto
                            </h1>
                            <p className="text-lg text-gray-600 mb-8 max-w-lg mx-auto md:mx-0">
                                Convide seu parceiro para gerenciar as finanças da casa. No plano Premium, a gestão compartilhada via convites é ilimitada.
                            </p>
                            <RegisterForm onNavigateToDashboard={onNavigateToDashboard} dialogTrigger={
                                <Button variant="outline" className="w-full sm:w-auto cursor-pointer dark:hover:text-emerald-500 dark:bg-white dark:border-gray-300 font-bold">
                                    Começar a compartilhar <ChevronRight className="ml-2 h-4 w-4" />
                                </Button>
                            } />
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-16 md:py-28 px-4 md:px-8 bg-gray-50 text-left">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12"><h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Escolha seu plano</h2></div>
                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        <Card className="h-full border border-gray-100 shadow-lg rounded-2xl bg-white">
                            <CardHeader><CardTitle className="text-gray-900">Básico</CardTitle><CardDescription>Controle Pessoal</CardDescription><div className="mt-4 font-bold text-gray-900 text-4xl">R$0<span className="text-gray-500 text-base font-normal">/sempre</span></div></CardHeader>
                            <CardContent><ul className="space-y-3 text-gray-600 text-sm">
                                <li className="flex items-center"><ChevronRight className="h-4 w-4 text-emerald-500 mr-2" /><span>Até 10 transações/mês</span></li>
                                <li className="flex items-center"><ChevronRight className="h-4 w-4 text-emerald-500 mr-2" /><span>Até 2 metas mensais</span></li>
                                <li className="flex items-center opacity-40"><ChevronRight className="h-4 w-4 text-gray-400 mr-2" /><span>Gestão compartilhada</span></li>
                                <li className="flex items-center opacity-40"><ChevronRight className="h-4 w-4 text-gray-400 mr-2" /><span>Acompanhamento de Ativos</span></li>
                            </ul></CardContent>
                        </Card>
                        <Card className="h-full border-none shadow-lg text-white rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 scale-105">
                            <CardHeader><CardTitle>Premium</CardTitle><CardDescription className="text-white opacity-90">Acesso Completo</CardDescription><div className="mt-4 font-bold text-4xl">R$14,90<span className="opacity-90 text-base font-normal">/mês</span></div></CardHeader>
                            <CardContent><ul className="space-y-3 text-sm">
                                <li className="flex items-center"><ChevronRight className="h-4 w-4 text-white mr-2" /><span>Transações e Metas Ilimitadas</span></li>
                                <li className="flex items-center"><ChevronRight className="h-4 w-4 text-white mr-2" /><span>Gestão compartilhada e Convites</span></li>
                                <li className="flex items-center"><ChevronRight className="h-4 w-4 text-white mr-2" /><span>Análise de Investimentos com IA</span></li>
                                <li className="flex items-center"><ChevronRight className="h-4 w-4 text-white mr-2" /><span>Transações Fixas e Parceladas</span></li>
                            </ul></CardContent>
                        </Card>
                        <Card className="h-full border border-emerald-100 shadow-lg rounded-2xl bg-white">
                            <CardHeader><CardTitle className="text-emerald-600">Anual</CardTitle><CardDescription>Custo-benefício</CardDescription><div className="mt-4 font-bold text-gray-900 text-4xl">R$129,90<span className="text-gray-500 text-base font-normal">/ano</span></div></CardHeader>
                            <CardContent><ul className="space-y-3 text-gray-600 text-sm">
                                <li className="flex items-center"><ChevronRight className="h-4 w-4 text-emerald-500 mr-2" /><span>Tudo do Plano Premium</span></li>
                                <li className="flex items-center text-emerald-600 font-bold"><ChevronRight className="h-4 w-4 text-emerald-500 mr-2" /><span>Economize R$48,90 no ano</span></li>
                                <li className="flex items-center"><ChevronRight className="h-4 w-4 text-emerald-500 mr-2" /><span>Acesso prioritário a IA</span></li>
                            </ul></CardContent>
                        </Card>
                    </div>

                    {/* Diagrama Comparativo */}
                    <div className="mt-20 max-w-4xl mx-auto overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm text-left">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200"><h3 className="font-bold text-gray-900">Comparativo Detalhado</h3></div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead><tr className="bg-gray-50/50"><th className="px-6 py-4 text-left font-semibold text-gray-600">Recurso</th><th className="px-6 py-4 text-center font-semibold text-gray-600">Básico</th><th className="px-6 py-4 text-center font-semibold text-emerald-600">Premium</th></tr></thead>
                                <tbody className="divide-y divide-gray-100">
                                <tr><td className="px-6 py-4 text-gray-700">Limite de Transações</td><td className="px-6 py-4 text-center text-gray-500">10 / mês</td><td className="px-6 py-4 text-center font-bold text-emerald-600">Ilimitado</td></tr>
                                <tr><td className="px-6 py-4 text-gray-700">Metas e Orçamentos</td><td className="px-6 py-4 text-center text-gray-500">2 / mês</td><td className="px-6 py-4 text-center font-bold text-emerald-600">Ilimitado</td></tr>
                                <tr><td className="px-6 py-4 text-gray-700">Ativos e Investimentos</td><td className="px-6 py-4 text-center"><X className="h-4 w-4 text-gray-300 mx-auto" /></td><td className="px-6 py-4 text-center"><Check className="h-4 w-4 text-emerald-500 mx-auto" /></td></tr>
                                <tr><td className="px-6 py-4 text-gray-700">Compartilhamento de Conta</td><td className="px-6 py-4 text-center"><X className="h-4 w-4 text-gray-300 mx-auto" /></td><td className="px-6 py-4 text-center"><Check className="h-4 w-4 text-emerald-500 mx-auto" /></td></tr>
                                <tr><td className="px-6 py-4 text-gray-700">Análise de IA</td><td className="px-6 py-4 text-center"><X className="h-4 w-4 text-gray-300 mx-auto" /></td><td className="px-6 py-4 text-center"><Check className="h-4 w-4 text-emerald-500 mx-auto" /></td></tr>
                                <tr><td className="px-6 py-4 text-gray-700">Parcelamentos</td><td className="px-6 py-4 text-center"><X className="h-4 w-4 text-gray-300 mx-auto" /></td><td className="px-6 py-4 text-center"><Check className="h-4 w-4 text-emerald-500 mx-auto" /></td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section id="testimonials" className="py-16 md:py-28 px-4 md:px-8 text-left bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16"><h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">O que dizem nossos usuários</h2></div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {testimonials.map((t, i) => (
                            <Card key={i} className="border-none shadow-md bg-white">
                                <CardContent className="pt-6">
                                    <p className="italic text-gray-600 mb-4">"{t.content}"</p>
                                    <div className="flex items-center">
                                        <img src={t.avatar} alt={t.name} className="h-12 w-12 rounded-full mr-3 shrink-0 object-cover border-2 border-emerald-100" />
                                        <div><p className="font-bold text-gray-900">{t.name}</p><p className="text-xs text-emerald-500">{t.role}</p></div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Call to Action */}
            <section className="py-20 px-4 md:px-8 bg-white text-center">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Simplifique hoje sua vida financeira</h2>
                    <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">Junte-se a usuários que já transformaram a forma como lidam com o dinheiro.</p>
                </div>
                <div className="flex justify-center">
                    <RegisterForm onNavigateToDashboard={onNavigateToDashboard} dialogTrigger={
                        <Button variant="outline" className="w-full sm:w-auto dark:hover:text-emerald-500 dark:bg-white dark:border-gray-300 px-12 py-6 font-bold text-lg">
                            Começar Agora <ChevronRight className="ml-2 h-5 w-5" />
                        </Button>
                    } />
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-300 py-16 px-6 md:px-12 text-left border-t border-gray-800">
                <div className="container mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                        <div className="col-span-1">
                            <div className="flex items-center mb-6 text-white">
                                <img src="/cashz.svg" alt="CashZ" className="h-8 w-8 mr-2 opacity-90" />
                                <span className="text-xl font-bold">CashZ</span>
                            </div>
                            <p className="text-sm leading-relaxed mb-6">Sua liberdade financeira começa com organização. O CashZ oferece as melhores ferramentas para gerenciar seus gastos e investimentos com inteligência.</p>
                            <div className="flex space-x-4">
                                {/*<Twitter className="h-5 w-5 text-gray-400 hover:text-emerald-500 cursor-pointer transition-colors" />*/}
                                {/*<Instagram className="h-5 w-5 text-gray-400 hover:text-emerald-500 cursor-pointer transition-colors" />*/}
                                {/*<Linkedin className="h-5 w-5 text-gray-400 hover:text-emerald-500 cursor-pointer transition-colors" />*/}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-white font-semibold mb-6 text-lg">Navegação</h3>
                            <ul className="space-y-4 text-sm">
                                <li><a href="#" className="hover:text-emerald-400 transition-colors">Início</a></li>
                                <li><a href="#features" className="hover:text-emerald-400 transition-colors">Recursos</a></li>
                                <li><a href="#pricing" className="hover:text-emerald-400 transition-colors">Preços</a></li>
                                <li><a href="#testimonials" className="hover:text-emerald-400 transition-colors">Depoimentos</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-white font-semibold mb-6 text-lg">Suporte e Legal</h3>
                            <ul className="space-y-4 text-sm">
                                <li>
                                    <button
                                        onClick={() => setLegalModal({ isOpen: true, type: "privacy" })}
                                        className="hover:text-emerald-400 transition-colors"
                                    >
                                        Privacidade
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => setLegalModal({ isOpen: true, type: "terms" })}
                                        className="hover:text-emerald-400 transition-colors"
                                    >
                                        Termos de Uso
                                    </button>
                                </li>
                                <LegalModal
                                    isOpen={legalModal.isOpen}
                                    type={legalModal.type}
                                    onClose={() => setLegalModal({ ...legalModal, isOpen: false })}
                                />
                                {/*<li><a href="#" className="hover:text-emerald-400 transition-colors">Ajuda & FAQ</a></li>*/}
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-white font-semibold mb-6 text-lg">Contato</h3>
                            <ul className="space-y-4 text-sm">
                                {/*<li className="flex items-center gap-3"><Mail className="h-4 w-4 text-emerald-500" /><span>suporte@cashz.com.br</span></li>*/}
                                <li className="flex items-center gap-3"><Phone className="h-4 w-4 text-emerald-500" /><span>(34) 99884-2288</span></li>
                                <li className="flex items-center gap-3"><MapPin className="h-4 w-4 text-emerald-500" /><span>Minas gerais, MG</span></li>
                            </ul>
                        </div>
                    </div>
                    <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center text-xs opacity-60">
                        <p>© {new Date().getFullYear()} CashZ Finance. Todos os direitos reservados.</p>
                        <p className="mt-4 md:mt-0">Desenvolvido para sua prosperidade financeira.</p>
                    </div>
                </div>
            </footer>
            <ForgotPasswordForm />
        </div>
    )
}

export default LandingPage