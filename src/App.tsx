import {ThemeProvider} from '@/components/theme-provider';
import {Routes} from '@/routes';
import './App.css';
import {Toaster} from './components/ui/toaster';
import {AuthProvider} from "@/context/AuthContext.tsx";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {ReactQueryDevtools} from "@tanstack/react-query-devtools";
import {TooltipProvider} from "@/components/ui/tooltip.tsx";
import {GlobalErrorInterceptor} from "@/components/provider/GlobalErrorInterceptor.tsx";
import {PrivacyProvider} from "@/context/PrivacyContext.tsx";

const queryClient = new QueryClient();

function App() {

    return (
        <QueryClientProvider client={queryClient}>
            <TooltipProvider>
                <ThemeProvider defaultTheme="light">
                        <AuthProvider>
                            <PrivacyProvider>
                                <GlobalErrorInterceptor>
                                    <Routes />
                                    <Toaster />
                                </GlobalErrorInterceptor>
                            </PrivacyProvider>
                        </AuthProvider>
                </ThemeProvider>
                <ReactQueryDevtools initialIsOpen={false} />
            </TooltipProvider>
        </QueryClientProvider>
    );
}

export default App;