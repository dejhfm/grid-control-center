
import { LogOut, Plus, Settings, User, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

interface HeaderProps {
  user?: { name: string; email: string };
  onCreateTable?: () => void;
  onLogout?: () => void;
  onOpenSettings?: () => void;
}

export const Header = ({ user, onCreateTable, onLogout, onOpenSettings }: HeaderProps) => {
  const { isAdmin, userRole } = useAuth();

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/" className="text-2xl font-bold text-primary">
            TableManager
          </Link>
          {isAdmin && (
            <Link to="/admin">
              <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>Admin</span>
              </Button>
            </Link>
          )}
        </div>
        
        {user && (
          <div className="flex items-center space-x-4">
            {onCreateTable && (
              <Button onClick={onCreateTable} className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Neue Tabelle</span>
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>{user.name}</span>
                  {userRole && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded capitalize">
                      {userRole}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-background">
                {isAdmin && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="flex items-center space-x-2">
                        <Shield className="w-4 h-4" />
                        <span>Admin Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {onOpenSettings && (
                  <DropdownMenuItem 
                    onClick={onOpenSettings}
                    className="flex items-center space-x-2"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Einstellungen</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  onClick={onLogout}
                  className="flex items-center space-x-2 text-destructive focus:text-destructive"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Abmelden</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </header>
  );
};
