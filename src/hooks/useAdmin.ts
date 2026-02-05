import { useAuth } from "@/context/AuthContext";
import { useUserPreferences } from "@/hooks/useUserPreferences";

export const useAdmin = () => {
    const { user } = useAuth();
    const { preferences } = useUserPreferences(user?.id);
    return { isAdmin: !!preferences?.isAdmin, isLoading: !preferences };
};