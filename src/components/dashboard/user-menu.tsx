import {useState} from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {HelpCircle, LogOut, Settings, UserCircle} from 'lucide-react';
import {useAuth} from "@/context/AuthContext.tsx";

type DashboardSection = 'overview' | 'transactions' | 'accounts' | 'budget' | 'investments' | 'profile' | 'settings';

export const UserMenu = ({
                           onNavigateToLanding,
                           onSectionChange,
                         }: {
  onNavigateToLanding: () => void;
  onSectionChange: (section: DashboardSection) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const {user, logout} = useAuth();

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger className="focus:outline-none" asChild>
        <button className="relative h-8 w-8 rounded-full bottom-0">
          <Avatar className="h-8 w-8 transition duration-300 hover:ring hover:ring-primary/20">
            {user?.photo ? (
                <>
                  <AvatarImage src={user.photo} alt="User" />
                  <AvatarFallback>{user?.name}</AvatarFallback>
                </>

            ) : (
                <>
                  <AvatarImage
                      src={`https://ui-avatars.com/api/?name=${user?.name ?? "User"}&background=random`}
                      alt="User"
                  />
                  <AvatarFallback>{user?.name}</AvatarFallback>
                </>
            )}
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 animate-in zoom-in-90 duration-200">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.name}</p>
            <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
            className="cursor-pointer hover:bg-muted/50 focus:bg-muted/50 focus:text-primary"
            onClick={() => onSectionChange("profile")}
        >
          <UserCircle className="mr-2 h-4 w-4" />
          <span>Perfil</span>
        </DropdownMenuItem>

        <DropdownMenuItem className="cursor-pointer hover:bg-muted/50 focus:bg-muted/50 focus:text-primary" onClick={() => onSectionChange("settings")}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Configurações</span>
        </DropdownMenuItem>

        <DropdownMenuItem className="cursor-pointer hover:bg-muted/50 focus:bg-muted/50 focus:text-primary">
          <HelpCircle className="mr-2 h-4 w-4" />
          <span>Ajuda & Suporte</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive hover:bg-muted/50" onClick={() => logout(onNavigateToLanding)}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />

      </DropdownMenuContent>
    </DropdownMenu>
  );
};