"use client"

import {useEffect, useRef, useState} from 'react';
import {AnimatePresence} from '@/components/ui/animate-presence';
import {DashboardHeader} from '@/components/dashboard/dashboard-header';
import {DashboardSidebar} from '@/components/dashboard/dashboard-sidebar';
import {OverviewSection} from '@/components/dashboard/sections/overview-section';
import {TransactionsSection} from '@/components/dashboard/sections/transactions-section';
import {BudgetSection} from '@/components/dashboard/sections/budget-section';
import {InvestmentsSection} from '@/components/dashboard/sections/investments-section';
import {ProfileSection} from "@/pages/profile/profile.tsx";
import {SettingsSection} from "@/pages/settings/settings.tsx";
import {AdminSection} from "@/pages/admin/admin.tsx";

interface DashboardProps {
  onNavigateToLanding: () => void;
}

export const Dashboard = ({ onNavigateToLanding }: DashboardProps) => {
  // Inicializamos como true (colapsado) para que a barra comece oculta
  const [collapsed, setCollapsed] = useState(true);
  const [activeSection, setActiveSection] = useState<'overview' | 'transactions' | 'budget' | 'investments' | 'profile' | 'settings' | 'admin'>('overview');
  const sidebarRef = useRef<HTMLDivElement>(null);

  const sectionMeta = {
    overview: {
      title: "Visão Geral",
      subtitle: "Resumo de suas finanças",
      active: true,
    },
    transactions: {
      title: "Transações",
      subtitle: "Histórico de entradas e saídas",
      active: true,
    },
    accounts: {
      title: "Carteira",
      subtitle: "Gerencie suas contas e saldos",
      active: false,
    },
    budget: {
      title: "Orçamentos",
      subtitle: "Acompanhe seus limites de gastos",
      active: true,
    },
    investments: {
      title: "Investimentos",
      subtitle: "Veja sua evolução patrimonial",
      active: false,
    },
    profile: {
      title: "Perfil",
      subtitle: "Acesse e edite suas informações pessoais",
      active: true,
    },
    settings: {
      title: "Configurações",
      subtitle: "Acesse suas configurações e preferências",
      active: true,
    },
    admin: {
      title: "Painel de administração",
      subtitle: "Acesse o painel de administração",
      active: true,
    },
  };

  const currentMeta = sectionMeta[activeSection];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
          sidebarRef.current &&
          !sidebarRef.current.contains(event.target as Node) &&
          !collapsed
      ) {
        setCollapsed(true);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [collapsed]);


  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return <OverviewSection />;
      case 'transactions':
        return <TransactionsSection />;
      case 'budget':
        return <BudgetSection />;
      case 'investments':
        return <InvestmentsSection />;
      case 'profile':
        return <ProfileSection />;
      case 'settings':
        return <SettingsSection />;
      case 'admin':
        return <AdminSection />;
      default:
        return <OverviewSection />;
    }
  };

  return (
      <div className="flex h-screen w-full overflow-hidden bg-background">
        {/* A Sidebar agora ocupa espaço fixo no desktop (md:block) */}
        <DashboardSidebar
            ref={sidebarRef}
            collapsed={collapsed}
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            onNavigateToLanding={onNavigateToLanding}
            onToggleSidebar={() => setCollapsed(!collapsed)}
        />

        {/* O container de conteúdo preenche o resto da tela */}
        <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
          <DashboardHeader
              // Passamos o collapsed apenas para o header saber se mostra o botão hambúrguer no mobile
              collapsed={collapsed}
              toggleSidebar={() => setCollapsed(prev => !prev)}
              onNavigateToLanding={onNavigateToLanding}
              sectionTitle={currentMeta.title}
              sectionSubtitle={currentMeta.subtitle}
              onSectionChange={setActiveSection}
          />

          <main className="flex-1 overflow-y-auto p-3 md:p-6">
            <AnimatePresence mode="wait">
              <div key={activeSection} className="container mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                {renderSection()}
              </div>
            </AnimatePresence>
          </main>
        </div>
      </div>
  );
};