"use client"

import {useEffect, useState} from "react"
import {AnimatePresence, motion} from "framer-motion"
import {BarChart3, ChevronRight, LogInIcon, Menu, PieChart, Shield, TrendingUp, X} from "lucide-react"
import {Player} from "@lottiefiles/react-lottie-player";
import {LoginForm} from "./login-form";
import {Button} from "./ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "./ui/card";
import {RegisterForm} from "./register-form";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar.tsx";

interface LandingPageProps {
    onNavigateToDashboard: () => void;
}

export const LandingPage = ({ onNavigateToDashboard }: LandingPageProps) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [activeTestimonial, setActiveTestimonial] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveTestimonial((prev) => (prev + 1) % testimonials.length)
        }, 5000)
        return () => clearInterval(interval)
    }, [])

    const testimonials = [
        {
            name: "Carlos Silva",
            role: "Empresário",
            content:
                "Esta plataforma transformou completamente a maneira como gerencio as finanças da minha empresa. Altamente recomendado!",
            avatar: "/placeholder.svg?height=40&width=40",
        },
        {
            name: "Ana Oliveira",
            role: "Investidora",
            content:
                "As ferramentas de análise são excepcionais. Consegui otimizar meu portfólio e aumentar meus retornos em 15%.",
            avatar: "/placeholder.svg?height=40&width=40",
        },
        {
            name: "Roberto Martins",
            role: "Diretor Financeiro",
            content:
                "A interface intuitiva e os relatórios detalhados nos ajudaram a identificar oportunidades que não víamos antes.",
            avatar: "/placeholder.svg?height=40&width=40",
        },
    ]

    const features = [
        {
            title: "Análise de Mercado",
            description: "Acompanhe tendências e movimentos do mercado com gráficos interativos e análises em tempo real.",
            icon: <BarChart3 className="h-10 w-10 text-emerald-500" />,
        },
        {
            title: "Gestão de Portfólio",
            description: "Organize e otimize seus investimentos com ferramentas avançadas de gestão de portfólio.",
            icon: <PieChart className="h-10 w-10 text-emerald-500" />,
        },
        {
            title: "Previsões Inteligentes",
            description: "Algoritmos avançados que preveem tendências de mercado com base em dados históricos e atuais.",
            icon: <TrendingUp className="h-10 w-10 text-emerald-500" />,
        },
        {
            title: "Segurança Avançada",
            description: "Seus dados financeiros protegidos com a mais alta tecnologia de criptografia e segurança.",
            icon: <Shield className="h-10 w-10 text-emerald-500" />,
        },
    ]

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="flex items-center"
                    >
                        <div className="h-8 w-8 rounded-md mr-2"><img src="/cashz.svg"/></div>
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
                                <Button variant="outline" className="mr-2 bg-gradient-to-r from-emerald-500 to-teal-500 border-none cursor-pointer px-2 text-white ">
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
                            className="md:hidden bg-white border-t border-gray-100"
                        >
                            <div className="container mx-auto px-4 py-4 flex flex-col space-y-4">
                                <a href="#features" className="text-gray-600 hover:text-emerald-500 transition-colors py-2">
                                    Recursos
                                </a>
                                <a href="#testimonials" className="text-gray-600 hover:text-emerald-500 transition-colors py-2">
                                    Depoimentos
                                </a>
                                <a href="#pricing" className="text-gray-600 hover:text-emerald-500 transition-colors py-2">
                                    Preços
                                </a>
                                <LoginForm onNavigateToDashboard={onNavigateToDashboard} dialogTrigger={
                                    <>
                                        <Button variant="outline" className="mr-2 bg-gradient-to-r from-emerald-500 to-teal-500 border-none cursor-pointer px-2 text-white ">
                                            <LogInIcon className="w-4 h-4 mr-2"/> Login
                                        </Button>
                                    </>
                                } />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            {/* Hero Section */}
            <section className="pt-24 pb-20 md:pb-28 p-8">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row items-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="md:w-1/2 mb-10 md:mb-0"
                        >
                            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6 md:text-2xl">
                                Transforme suas <span className="text-emerald-500">finanças</span> com inteligência
                            </h1>
                            <p className="text-xl text-gray-600 mb-8 max-w-lg">
                                Plataforma completa para análise financeira, gestão de gastos e tomada de decisões inteligentes.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Button size="lg" variant="outline" className="cursor-pointer hover:text-emerald-500 transition-colors dark:hover:text-emerald-500 dark:transition-colors dark:bg-white dark:border-gray-300 dark:hover:bg-gray-100">
                                    <RegisterForm onNavigateToDashboard={onNavigateToDashboard} dialogTrigger={
                                        <>
                                            Começar Agora
                                            <ChevronRight className="ml-2 h-4 w-4" />
                                        </>
                                    }/>
                                </Button>
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="md:w-1/2 ml-10"
                        >
                            <div className="relative">
                                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg blur-lg opacity-30"></div>
                                <div className="relative bg-white rounded-lg shadow-xl overflow-hidden">
                                    <Player
                                        autoplay
                                        loop
                                        src="/animationLandingPage.json"
                                        className="w-full h-auto"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 bg-gray-50 p-8">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className="text-center"
                        >
                            <p className="text-4xl font-bold text-emerald-500 mb-2">+500K</p>
                            <p className="text-gray-600">Usuários Ativos</p>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="text-center"
                        >
                            <p className="text-4xl font-bold text-emerald-500 mb-2">R$10B+</p>
                            <p className="text-gray-600">Ativos Gerenciados</p>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="text-center"
                        >
                            <p className="text-4xl font-bold text-emerald-500 mb-2">98%</p>
                            <p className="text-gray-600">Satisfação</p>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="text-center"
                        >
                            <p className="text-4xl font-bold text-emerald-500 mb-2">24/7</p>
                            <p className="text-gray-600">Suporte</p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 md:py-28 p-8">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-2xl md:text-2xl font-bold text-gray-900 mb-4">Recursos Poderosos</h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Ferramentas avançadas para impulsionar seu sucesso financeiro
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
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
                                        <CardTitle className="dark:text-gray-600">{feature.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-gray-600">{feature.description}</p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Hero Section */}
            <section className="pt-24 pb-20 md:pb-28 p-8">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row items-center">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="md:w-1/2 mb-10 md:mb-0"
                        >
                            <div className="relative">
                                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg blur-lg opacity-30"></div>
                                <div className="relative bg-white rounded-lg shadow-xl overflow-hidden">
                                    <Player
                                        autoplay
                                        loop
                                        src="/sharedAnimationLandingPage.json"
                                        className="w-full h-96"
                                    />
                                </div>
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="md:w-1/2 ml-10"
                        >
                            <h1 className="text-3xl md:text-3xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                                <span className="text-emerald-500">Compartilhe</span> suas finanças com seus amigos e familiares
                            </h1>
                            <p className="text-xl text-gray-600 mb-8 max-w-lg">
                                A partir do plano Básico Mensal você pode compartilhar suas finanças.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 ">
                                <RegisterForm onNavigateToDashboard={onNavigateToDashboard} dialogTrigger={
                                    <>
                                        <Button variant="outline" className="cursor-pointer dark:hover:text-emerald-500 dark:transition-colors dark:bg-white dark:border-gray-300 dark:hover:bg-gray-100">
                                            Começar a compartilhar
                                            <ChevronRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </>
                                } />
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section id="testimonials" className="py-20 bg-gray-50 p-8">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">O Que Nossos Clientes Dizem</h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Histórias de sucesso de quem transformou suas finanças com nossa plataforma
                        </p>
                    </motion.div>

                    <div className="max-w-3xl mx-auto">
                        <div className="relative h-64 md:h-48">
                            {testimonials.map((testimonial, index) => (
                                <AnimatePresence key={index} initial={false}>
                                    {activeTestimonial === index && (
                                        <motion.div
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.5 }}
                                            className="absolute inset-0"
                                        >
                                            <Card className="h-full border-none shadow-lg dark:bg-white">
                                                <CardContent className="pt-6">
                                                    <p className="text-gray-600 italic mb-6">"{testimonial.content}"</p>
                                                    <div className="flex items-center">
                                                        <Avatar className="h-10 w-10 mr-4">
                                                            <AvatarImage src={testimonial.avatar || "/placeholder.svg"} alt={testimonial.name} />
                                                            <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-semibold text-gray-900">{testimonial.name}</p>
                                                            <p className="text-sm text-gray-500">{testimonial.role}</p>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            ))}
                        </div>
                        <div className="flex justify-center mt-8">
                            {testimonials.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setActiveTestimonial(index)}
                                    className={`h-2 w-2 rounded-full mx-1 ${
                                        activeTestimonial === index ? "bg-emerald-500" : "bg-gray-300"
                                    }`}
                                    aria-label={`Testimonial ${index + 1}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-20 md:py-28 p-8">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Planos Simples e Transparentes</h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Escolha o plano ideal para suas necessidades financeiras
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto h-full">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                        >
                            <Card className="h-full border-none shadow-lg hover:shadow-xl text-white transition-shadow rounded-2xl flex flex-col bg-gradient-to-r from-emerald-500 to-teal-500">
                                <CardHeader>
                                    <CardTitle>Mensal</CardTitle>
                                    <CardDescription className="dark:text-white text-white">Plano Básico Mensal</CardDescription>
                                    <div className="mt-4">
                                        <span className="text-4xl font-bold">R$29</span>
                                        <span className="text-white">/mês</span>
                                    </div>
                                </CardHeader>
                                <CardContent className="h-full w-full">
                                    <ul className="space-y-2">
                                        <li className="flex items-center">
                                            <ChevronRight className="h-4 w-4 text-white mr-2" />
                                            <span>Análises básicas de mercado</span>
                                        </li>
                                        <li className="flex items-center">
                                            <ChevronRight className="h-4 w-4 text-white mr-2" />
                                            <span>Gestão de até 5 investimentos</span>
                                        </li>
                                        <li className="flex items-center">
                                            <ChevronRight className="h-4 w-4 text-white mr-2" />
                                            <span>Relatórios mensais</span>
                                        </li>
                                        <li className="flex items-center">
                                            <ChevronRight className="h-4 w-4 text-white mr-2" />
                                            <span>Suporte por email</span>
                                        </li>
                                    </ul>
                                </CardContent>
                                {/*<CardFooter className="w-full flex items-center justify-center">*/}
                                {/*    <RegisterForm dialogTrigger={*/}
                                {/*        <>*/}
                                {/*            <Button variant="outline" className="w-full text-white cursor-pointer">*/}
                                {/*                Começar Grátis*/}
                                {/*            </Button>*/}
                                {/*        </>*/}
                                {/*    } />*/}
                                {/*</CardFooter>*/}
                            </Card>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                        >
                            <Card className="h-full border-none shadow-lg hover:shadow-xl text-white transition-shadow rounded-2xl flex flex-col bg-gradient-to-r from-emerald-500 to-teal-500">
                                <CardHeader>
                                    <CardTitle>Trimestral</CardTitle>
                                    <CardDescription className="dark:text-white text-white">Plano Básico Trimestral</CardDescription>
                                    <div className="mt-4">
                                        <span className="text-4xl font-bold">R$85</span>
                                        <span className="text-white">/trimestre</span>
                                    </div>
                                </CardHeader>
                                <CardContent className="h-full w-full">
                                    <ul className="space-y-2">
                                        <li className="flex items-center">
                                            <ChevronRight className="h-4 w-4 text-white mr-2" />
                                            <span>Análises básicas de mercado</span>
                                        </li>
                                        <li className="flex items-center">
                                            <ChevronRight className="h-4 w-4 text-white mr-2" />
                                            <span>Gestão de até 5 investimentos</span>
                                        </li>
                                        <li className="flex items-center">
                                            <ChevronRight className="h-4 w-4 text-white mr-2" />
                                            <span>Relatórios mensais</span>
                                        </li>
                                        <li className="flex items-center">
                                            <ChevronRight className="h-4 w-4 text-white mr-2" />
                                            <span>Suporte por email</span>
                                        </li>
                                    </ul>
                                </CardContent>
                                {/*<CardFooter className="w-full flex items-center justify-center">*/}
                                {/*    <RegisterForm dialogTrigger={*/}
                                {/*        <>*/}
                                {/*            <Button variant="outline" className="w-full text-white cursor-pointer">*/}
                                {/*                Começar Grátis*/}
                                {/*            </Button>*/}
                                {/*        </>*/}
                                {/*    } />*/}
                                {/*</CardFooter>*/}
                            </Card>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                        >
                            <Card className="h-full border-none shadow-lg hover:shadow-xl text-white transition-shadow rounded-2xl flex flex-col bg-gradient-to-r from-emerald-500 to-teal-500">
                                <CardHeader>
                                    <CardTitle>Anual</CardTitle>
                                    <CardDescription className="dark:text-white text-white">Plano Básico Anual</CardDescription>
                                    <div className="mt-4">
                                        <span className="text-4xl font-bold">R$350</span>
                                        <span className="text-white">/anual</span>
                                    </div>
                                </CardHeader>
                                <CardContent className="h-full w-full">
                                    <ul className="space-y-2">
                                        <li className="flex items-center">
                                            <ChevronRight className="h-4 w-4 text-white mr-2" />
                                            <span>Análises básicas de mercado</span>
                                        </li>
                                        <li className="flex items-center">
                                            <ChevronRight className="h-4 w-4 text-white mr-2" />
                                            <span>Gestão de até 5 investimentos</span>
                                        </li>
                                        <li className="flex items-center">
                                            <ChevronRight className="h-4 w-4 text-white mr-2" />
                                            <span>Relatórios mensais</span>
                                        </li>
                                        <li className="flex items-center">
                                            <ChevronRight className="h-4 w-4 text-white mr-2" />
                                            <span>Suporte por email</span>
                                        </li>
                                    </ul>
                                </CardContent>
                                {/*<CardFooter className="w-full flex items-center justify-center">*/}
                                {/*    <RegisterForm dialogTrigger={*/}
                                {/*        <>*/}
                                {/*            <Button variant="outline" className="w-full text-white cursor-pointer">*/}
                                {/*                Começar Grátis*/}
                                {/*            </Button>*/}
                                {/*        </>*/}
                                {/*    } />*/}
                                {/*</CardFooter>*/}
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </section>

            <section className="py-20 p-8">

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Pronto para começar?</h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Junte-se a milhares de usuários satisfeitos e comece a transformar suas finanças hoje mesmo!
                        </p>
                    </div>

                    <div className="flex justify-center">
                        <RegisterForm onNavigateToDashboard={onNavigateToDashboard} dialogTrigger={
                            <>
                                <Button variant="outline" className="cursor-pointer dark:hover:text-emerald-500 dark:transition-colors dark:bg-white dark:border-gray-300 dark:hover:bg-gray-100">
                                    Começar Agora
                                    <ChevronRight className="ml-2 h-4 w-4" />
                                </Button>
                            </>
                        } />
                    </div>
                </motion.div>

            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-300 py-12">
                <div className="container mx-auto px-12 flex flex-col justify-between">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
                        <div>
                            <h3 className="text-white font-semibold mb-4">Produto</h3>
                            <ul className="space-y-2">
                                <li>
                                    <a href="#" className="hover:text-white transition-colors">
                                        Recursos
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="hover:text-white transition-colors">
                                        Preços
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="hover:text-white transition-colors">
                                        Demonstração
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="hover:text-white transition-colors">
                                        Atualizações
                                    </a>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-white font-semibold mb-4">Empresa</h3>
                            <ul className="space-y-2">
                                <li>
                                    <a href="#" className="hover:text-white transition-colors">
                                        Sobre nós
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="hover:text-white transition-colors">
                                        Carreiras
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="hover:text-white transition-colors">
                                        Blog
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="hover:text-white transition-colors">
                                        Imprensa
                                    </a>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-white font-semibold mb-4">Recursos</h3>
                            <ul className="space-y-2">
                                <li>
                                    <a href="#" className="hover:text-white transition-colors">
                                        Documentação
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="hover:text-white transition-colors">
                                        Guias
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="hover:text-white transition-colors">
                                        Webinars
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="hover:text-white transition-colors">
                                        API
                                    </a>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-white font-semibold mb-4">Legal</h3>
                            <ul className="space-y-2">
                                <li>
                                    <a href="#" className="hover:text-white transition-colors">
                                        Privacidade
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="hover:text-white transition-colors">
                                        Termos
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="hover:text-white transition-colors">
                                        Segurança
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="hover:text-white transition-colors">
                                        Cookies
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="pt-8 mt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
                        <div className="flex items-center mb-4 md:mb-0">
                            <div className="h-8 w-8 rounded-md mr-2"><img src="/cashz.svg"/></div>
                            <span className="text-xl font-bold text-white">CashZ</span>
                        </div>
                        <p className="text-sm">© {new Date().getFullYear()} CashZ. Todos os direitos reservados.</p>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default LandingPage
