
import { LoginForm } from "@/components/LoginForm";

export const Login = () => {
  const handleLogin = (email: string, password: string) => {
    console.log('Login:', { email, password });
    // Nach Supabase-Integration: Hier erfolgt die echte Authentifizierung
  };

  const handleRegister = (email: string, password: string, name: string) => {
    console.log('Register:', { email, password, name });
    // Nach Supabase-Integration: Hier erfolgt die echte Registrierung
  };

  return (
    <LoginForm 
      onLogin={handleLogin}
      onRegister={handleRegister}
    />
  );
};
