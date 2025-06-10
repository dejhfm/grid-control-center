
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { LoginForm } from "@/components/LoginForm";
import { useToast } from "@/hooks/use-toast";

export const Login = () => {
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await signIn(email, password);
      toast({
        title: "Erfolgreich angemeldet",
        description: "Willkommen zurück!",
      });
    } catch (error: any) {
      toast({
        title: "Anmeldung fehlgeschlagen",
        description: error.message || "Ein Fehler ist aufgetreten",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      await signUp(email, password, name);
      toast({
        title: "Registrierung erfolgreich",
        description: "Bitte überprüfen Sie Ihre E-Mail für die Bestätigung.",
      });
    } catch (error: any) {
      toast({
        title: "Registrierung fehlgeschlagen",
        description: error.message || "Ein Fehler ist aufgetreten",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LoginForm 
      onLogin={handleLogin}
      onRegister={handleRegister}
      isLoading={isLoading}
    />
  );
};
