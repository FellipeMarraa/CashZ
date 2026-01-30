"use client"

import {useEffect, useState} from "react"
import {AnimatePresence, motion} from "framer-motion"
import {ChevronRight, FileSpreadsheet, LogInIcon, Menu, PieChart, TrendingUp, Users, X} from "lucide-react"
import {Player} from "@lottiefiles/react-lottie-player";
import {LoginForm} from "./login-form";
import {Button} from "./ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "./ui/card";
import {RegisterForm} from "./register-form";
import {ForgotPasswordForm} from "@/components/forgot-password-form.tsx";

interface LandingPageProps {
    onNavigateToDashboard: () => void;
}

export const LandingPage = ({ onNavigateToDashboard }: LandingPageProps) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [, setActiveTestimonial] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveTestimonial((prev) => (prev + 1) % testimonials.length)
        }, 5000)
        return () => clearInterval(interval)
    }, [])

    const testimonials = [
        {
            name: "Carlos Silva",
            role: "Usuário Pro",
            content:
                "Finalmente consegui organizar as finanças de casa junto com minha esposa. O compartilhamento em tempo real mudou nosso planejamento.",
            avatar: "/placeholder.svg?height=40&width=40",
        },
        {
            name: "Ana Oliveira",
            role: "Planejadora",
            content:
                "As metas por categoria são intuitivas. Agora sei exatamente quanto posso gastar sem comprometer o orçamento do mês.",
            avatar: "/placeholder.svg?height=40&width=40",
        },
        {
            name: "Roberto Martins",
            role: "Usuário Premium",
            content:
                "A facilidade de exportar relatórios detalhados me economiza horas de trabalho na hora de revisar meus gastos anuais.",
            avatar: "/placeholder.svg?height=40&width=40",
        },
    ]

    const features = [
        {
            title: "Gestão Compartilhada",
            description: "Gerencie orçamentos em conjunto com parceiros ou familiares com sincronização instantânea de dados.",
            icon: <Users className="h-10 w-10 text-emerald-500" />,
        },
        {
            title: "Controle de Metas",
            description: "Defina limites de gastos por categoria e receba alertas inteligentes para manter sua saúde financeira.",
            icon: <PieChart className="h-10 w-10 text-emerald-500" />,
        },
        {
            title: "Análises Detalhadas",
            description: "Visualize sua evolução mensal e anual através de gráficos dinâmicos de receitas e despesas.",
            icon: <TrendingUp className="h-10 w-10 text-emerald-500" />,
        },
        {
            title: "Exportação Completa",
            description: "Leve seus dados para onde quiser com exportações rápidas para os formatos CSV e Excel.",
            icon: <FileSpreadsheet className="h-10 w-10 text-emerald-500" />,
        },
    ]

    return (
        <div className="min-h-screen bg-white overflow-x-hidden">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="flex items-center"
                    >
                        <div className="h-8 w-8 rounded-md mr-2"><img src="/cashz.svg" alt="Logo"/></div>
                        <span className="text-xl font-bold text-gray-900">CashZ</span>
                    </motion.div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-8">
                        <a href="#features" className="text-gray-600 hover:text-emerald-500 transition-colors">
                            Recursos
                        </a>
                        <a href="#testimonials" className="text-gray-600 hover:text-emerald-500 transition-colors">
                            Depoimentos
                        </a>
                        <a href="#pricing" className="text-gray-600 hover:text-emerald-500 transition-colors">
                            Preços
                        </a>
                        <LoginForm onNavigateToDashboard={onNavigateToDashboard} dialogTrigger={
                            <>
                                <Button variant="outline" className="mr-2 bg-gradient-to-r from-emerald-500 to-teal-500 border-none cursor-pointer px-4 py-2 text-white">
                                    <LogInIcon className="w-4 h-4 mr-2"/> Login
                                </Button>
                            </>
                        } />
                    </nav>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden cursor-pointer">
                        <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                            {isMenuOpen ? <X /> : <Menu />}
                        </Button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="md:hidden bg-white border-t border-gray-100 overflow-hidden"
                        >
                            <div className="container mx-auto px-4 py-4 flex flex-col space-y-4">
                                <a href="#features" className="text-gray-600 hover:text-emerald-500 transition-colors py-2" onClick={() => setIsMenuOpen(false)}>
                                    Recursos
                                </a>
                                <a href="#testimonials" className="text-gray-600 hover:text-emerald-500 transition-colors py-2" onClick={() => setIsMenuOpen(false)}>
                                    Depoimentos
                                </a>
                                <a href="#pricing" className="text-gray-600 hover:text-emerald-500 transition-colors py-2" onClick={() => setIsMenuOpen(false)}>
                                    Preços
                                </a>
                                <div className="pt-2">
                                    <LoginForm onNavigateToDashboard={onNavigateToDashboard} dialogTrigger={
                                        <Button variant="outline" className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 border-none cursor-pointer text-white justify-center">
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
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row items-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="w-full md:w-1/2 mb-10 md:mb-0 text-center md:text-left"
                        >
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                                Tome o controle da sua <span className="text-emerald-500">liberdade</span> financeira
                            </h1>
                            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-lg mx-auto md:mx-0">
                                Uma plataforma moderna para gerenciar gastos, definir metas e compartilhar sua jornada com quem você ama.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                                <Button size="lg" variant="outline" className="w-full sm:w-auto cursor-pointer hover:text-emerald-500 transition-colors dark:hover:text-emerald-500 dark:transition-colors dark:bg-white dark:border-gray-300 dark:hover:bg-gray-100">
                                    <RegisterForm onNavigateToDashboard={onNavigateToDashboard} dialogTrigger={
                                        <span className="flex items-center justify-center w-full">
                                            Começar Gratuitamente
                                            <ChevronRight className="ml-2 h-4 w-4" />
                                        </span>
                                    }/>
                                </Button>
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="w-full md:w-1/2 mt-8 md:mt-0 md:ml-10"
                        >
                            <div className="relative">
                                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg blur-lg opacity-30"></div>
                                <div className="relative bg-white rounded-lg shadow-xl overflow-hidden">
                                    <Player
                                        autoplay
                                        loop
                                        src="/animationLandingPage.json"
                                        className="w-full h-auto max-h-[400px] md:max-h-full"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-12 md:py-16 bg-gray-50 px-4 md:px-8">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className="text-center"
                        >
                            <p className="text-3xl md:text-4xl font-bold text-emerald-500 mb-2">Simples</p>
                            <p className="text-sm md:text-base text-gray-600">Interface Intuitiva</p>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="text-center"
                        >
                            <p className="text-3xl md:text-4xl font-bold text-emerald-500 mb-2">Seguro</p>
                            <p className="text-sm md:text-base text-gray-600">Dados Criptografados</p>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="text-center"
                        >
                            <p className="text-3xl md:text-4xl font-bold text-emerald-500 mb-2">Nuvem</p>
                            <p className="text-sm md:text-base text-gray-600">Acesso em Qualquer Lugar</p>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="text-center"
                        >
                            <p className="text-3xl md:text-4xl font-bold text-emerald-500 mb-2">Grátis</p>
                            <p className="text-sm md:text-base text-gray-600">Plano Individual</p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-16 md:py-28 px-4 md:px-8">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="text-center mb-12 md:mb-16"
                    >
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Recursos Essenciais</h2>
                        <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
                            Ferramentas práticas para organizar sua vida financeira com precisão
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                            >
                                <Card className="h-full border-none shadow-lg hover:shadow-xl transition-shadow dark:bg-white">
                                    <CardHeader>
                                        <div className="mb-4">{feature.icon}</div>
                                        <CardTitle className="dark:text-gray-600 font-bold">{feature.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-gray-600 text-sm md:text-base">{feature.description}</p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Sharing Section */}
            <section className="py-16 md:py-28 px-4 md:px-8 bg-white">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col-reverse md:flex-row items-center">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="w-full md:w-1/2 mt-10 md:mt-0"
                        >
                            <div className="relative">
                                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg blur-lg opacity-30"></div>
                                <div className="relative bg-white rounded-lg shadow-xl overflow-hidden">
                                    <Player
                                        autoplay
                                        loop
                                        src="/sharedAnimationLandingPage.json"
                                        className="w-full h-auto max-h-[300px] md:max-h-[400px]"
                                    />
                                </div>
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="w-full md:w-1/2 md:ml-10 text-center md:text-left"
                        >
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-6">
                                <span className="text-emerald-500">Planejem</span> o futuro em conjunto
                            </h1>
                            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-lg mx-auto md:mx-0">
                                Convide seu parceiro para visualizar e gerenciar as finanças da casa. No plano Premium, a gestão compartilhada é ilimitada.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                                <RegisterForm onNavigateToDashboard={onNavigateToDashboard} dialogTrigger={
                                    <Button variant="outline" className="w-full sm:w-auto cursor-pointer dark:hover:text-emerald-500 dark:transition-colors dark:bg-white dark:border-gray-300 dark:hover:bg-gray-100">
                                        Começar a compartilhar
                                        <ChevronRight className="ml-2 h-4 w-4" />
                                    </Button>
                                } />
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-16 md:py-28 px-4 md:px-8">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="text-center mb-12 md:mb-16"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Escolha seu plano</h2>
                        <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
                            Planos flexíveis para quem busca organização individual ou em conjunto
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {/* Plano Gratuito */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                        >
                            <Card className="h-full border border-gray-100 shadow-lg hover:shadow-xl transition-shadow rounded-2xl flex flex-col bg-white">
                                <CardHeader>
                                    <CardTitle className="text-gray-900">Básico</CardTitle>
                                    <CardDescription className="text-gray-500">Controle Pessoal</CardDescription>
                                    <div className="mt-4">
                                        <span className="text-4xl font-bold text-gray-900">R$0</span>
                                        <span className="text-gray-500">/sempre</span>
                                    </div>
                                </CardHeader>
                                <CardContent className="h-full w-full">
                                    <ul className="space-y-3 text-gray-600">
                                        <li className="flex items-center">
                                            <ChevronRight className="h-4 w-4 text-emerald-500 mr-2 shrink-0" />
                                            <span>Transações ilimitadas</span>
                                        </li>
                                        <li className="flex items-center">
                                            <ChevronRight className="h-4 w-4 text-emerald-500 mr-2 shrink-0" />
                                            <span>Orçamentos mensais</span>
                                        </li>
                                        <li className="flex items-center opacity-40">
                                            <ChevronRight className="h-4 w-4 text-gray-400 mr-2 shrink-0" />
                                            <span>Gestão compartilhada</span>
                                        </li>
                                        <li className="flex items-center opacity-40">
                                            <ChevronRight className="h-4 w-4 text-gray-400 mr-2 shrink-0" />
                                            <span>Exportação Excel</span>
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Plano Mensal */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                        >
                            <Card className="h-full border-none shadow-lg hover:shadow-xl text-white transition-shadow rounded-2xl flex flex-col bg-gradient-to-r from-emerald-500 to-teal-500">
                                <CardHeader>
                                    <CardTitle>Premium</CardTitle>
                                    <CardDescription className="text-white opacity-90">Acesso Completo</CardDescription>
                                    <div className="mt-4">
                                        <span className="text-4xl font-bold">R$14,90</span>
                                        <span className="text-white opacity-90">/mês</span>
                                    </div>
                                </CardHeader>
                                <CardContent className="h-full w-full">
                                    <ul className="space-y-3">
                                        <li className="flex items-center">
                                            <ChevronRight className="h-4 w-4 text-white mr-2 shrink-0" />
                                            <span>Gestão compartilhada</span>
                                        </li>
                                        <li className="flex items-center">
                                            <ChevronRight className="h-4 w-4 text-white mr-2 shrink-0" />
                                            <span>Exportação para Excel/CSV</span>
                                        </li>
                                        <li className="flex items-center">
                                            <ChevronRight className="h-4 w-4 text-white mr-2 shrink-0" />
                                            <span>Filtros avançados por usuário</span>
                                        </li>
                                        <li className="flex items-center">
                                            <ChevronRight className="h-4 w-4 text-white mr-2 shrink-0" />
                                            <span>Suporte prioritário</span>
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Plano Anual */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                        >
                            <Card className="h-full border border-emerald-100 shadow-lg hover:shadow-xl transition-shadow rounded-2xl flex flex-col bg-white">
                                <CardHeader>
                                    <CardTitle className="text-emerald-600">Anual</CardTitle>
                                    <CardDescription className="text-gray-500">Melhor custo-benefício</CardDescription>
                                    <div className="mt-4">
                                        <span className="text-4xl font-bold text-gray-900">R$129,90</span>
                                        <span className="text-gray-500">/ano</span>
                                    </div>
                                </CardHeader>
                                <CardContent className="h-full w-full">
                                    <ul className="space-y-3 text-gray-600">
                                        <li className="flex items-center">
                                            <ChevronRight className="h-4 w-4 text-emerald-500 mr-2 shrink-0" />
                                            <span>Recursos Premium ilimitados</span>
                                        </li>
                                        <li className="flex items-center text-emerald-600 font-medium">
                                            <ChevronRight className="h-4 w-4 text-emerald-500 mr-2 shrink-0" />
                                            <span>Economize R$48,90 no ano</span>
                                        </li>
                                        <li className="flex items-center">
                                            <ChevronRight className="h-4 w-4 text-emerald-500 mr-2 shrink-0" />
                                            <span>Acesso antecipado a novos recursos</span>
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Testimonials e Call to Action */}
            {/* ... (Seu código de depoimentos e rodapé permanece igual) */}

            {/* Call to Action Final */}
            <section className="py-20 px-4 md:px-8 bg-gray-50">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Simplifique hoje sua vida financeira</h2>
                        <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
                            Junte-se a usuários que já transformaram a forma como lidam com o dinheiro.
                        </p>
                    </div>

                    <div className="flex justify-center">
                        <RegisterForm onNavigateToDashboard={onNavigateToDashboard} dialogTrigger={
                            <Button variant="outline" className="w-full sm:w-auto cursor-pointer dark:hover:text-emerald-500 dark:transition-colors dark:bg-white dark:border-gray-300 dark:hover:bg-gray-100 px-12 py-6">
                                Começar Agora
                                <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        } />
                    </div>
                </motion.div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-300 py-12 px-6 md:px-12">
                <div className="container mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8 border-b border-gray-800 pb-8 text-sm">
                        <div>
                            <h3 className="text-white font-semibold mb-4">Produto</h3>
                            <ul className="space-y-2">
                                <li><a href="#" className="hover:text-white transition-colors">Recursos</a></li>
                                <li><a href="#pricing" className="hover:text-white transition-colors">Preços</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Segurança</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-white font-semibold mb-4">Empresa</h3>
                            <ul className="space-y-2">
                                <li><a href="#" className="hover:text-white transition-colors">Sobre nós</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Contato</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-white font-semibold mb-4">Legal</h3>
                            <ul className="space-y-2">
                                <li><a href="#" className="hover:text-white transition-colors">Privacidade</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Termos</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-white font-semibold mb-4">Social</h3>
                            <ul className="space-y-2">
                                <li><a href="#" className="hover:text-white transition-colors">LinkedIn</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Instagram</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row justify-between items-center text-xs">
                        <div className="flex items-center mb-4 md:mb-0">
                            <img src="/cashz.svg" alt="CashZ" className="h-6 w-6 mr-2 opacity-80" />
                            <span className="text-white">CashZ</span>
                        </div>
                        <p>© {new Date().getFullYear()} CashZ. Todos os direitos reservados.</p>
                    </div>
                </div>
            </footer>
            <ForgotPasswordForm />
        </div>
    )
}

export default LandingPage