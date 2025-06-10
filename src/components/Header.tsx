
import { LogOut, Plus, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  user?: { name: string; email: string };
  onCreateTable?: () => void;
  onLogout?: () => void;
}

export const Header = ({ user, onCreateTable, onLogout }: HeaderProps) => {
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-primary">TableManager</h1>
        </div>
        
        {user && (
          <div className="flex items-center space-x-4">
            <Button onClick={onCreateTable} className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Neue Tabelle</span>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>{user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-background">
                <DropdownMenuItem className="flex items-center space-x-2">
                  <Settings className="w-4 h-4" />
                  <span>Einstellungen</span>
                </DropdownMenuItem>
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
