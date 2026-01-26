import {ThemeProvider} from '@/components/theme-provider';
import {Routes} from '@/routes';
import './App.css';
import {Toaster} from './components/ui/toaster';
import {AuthProvider} from "@/context/AuthContext.tsx";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {ReactQueryDevtools} from "@tanstack/react-query-devtools";
import {TooltipProvider} from "@/components/ui/tooltip.tsx";

const queryClient = new QueryClient();

function App() {

    return (
        <QueryClientProvider client={queryClient}>
            <TooltipProvider>
                <ThemeProvider defaultTheme="light">
                    <AuthProvider>
                        <Routes />
                        <Toaster />
                    </AuthProvider>
                </ThemeProvider>
                <ReactQueryDevtools initialIsOpen={false} />
            </TooltipProvider>
        </QueryClientProvider>
    );
}

export default App;