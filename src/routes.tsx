
import { Dashboard } from '@/pages/dashboard/dashboard';
import LandingPage from './components/landing-page';
import { DialogManagerProvider } from "@/context/DialogManagerContext.tsx";
import { useAuth } from '@/context/AuthContext';

export const Routes = () => {
    const { isAuthenticated, logout } = useAuth();

    return (
        <DialogManagerProvider>
            <div className="min-h-screen">
                {isAuthenticated ? (
                    <Dashboard onNavigateToLanding={() => logout()} />
                ) : (
                    <LandingPage onNavigateToDashboard={() => {}} />
                )}
            </div>
        </DialogManagerProvider>
    );
};