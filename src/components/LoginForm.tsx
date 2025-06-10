
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { validatePassword } from "@/utils/passwordValidation";
import { useRateLimit } from "@/hooks/useRateLimit";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Shield } from "lucide-react";

interface LoginFormProps {
  onLogin: (email: string, password: string) => void;
  onRegister: (email: string, password: string, name: string) => void;
}

export const LoginForm = ({ onLogin, onRegister }: LoginFormProps) => {
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  
  const { checkRateLimit } = useRateLimit();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check rate limiting for login attempts
    const isRateLimited = await checkRateLimit({
      operationType: 'login',
      maxAttempts: 5,
      windowMinutes: 15
    });

    if (isRateLimited) {
      toast({
        title: "Zu viele Anmeldeversuche",
        description: "Bitte warten Sie 15 Minuten bevor Sie es erneut versuchen.",
        variant: "destructive",
      });
      return;
    }

    if (loginAttempts >= 5) {
      toast({
        title: "Konto temporär gesperrt",
        description: "Zu viele fehlgeschlagene Anmeldeversuche. Versuchen Sie es später erneut.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await onLogin(loginData.email, loginData.password);
      setLoginAttempts(0); // Reset on successful login
    } catch (error) {
      setLoginAttempts(prev => prev + 1);
      toast({
        title: "Anmeldung fehlgeschlagen",
        description: "Überprüfen Sie Ihre E-Mail und Ihr Passwort.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check rate limiting for registration
    const isRateLimited = await checkRateLimit({
      operationType: 'register',
      maxAttempts: 3,
      windowMinutes: 60
    });

    if (isRateLimited) {
      toast({
        title: "Zu viele Registrierungsversuche",
        description: "Bitte warten Sie eine Stunde bevor Sie es erneut versuchen.",
        variant: "destructive",
      });
      return;
    }

    // Validate password
    const passwordValidation = validatePassword(registerData.password);
    if (!passwordValidation.isValid) {
      toast({
        title: "Passwort zu schwach",
        description: passwordValidation.errors.join(', '),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      await onRegister(registerData.email, registerData.password, registerData.name);
    } catch (error) {
      toast({
        title: "Registrierung fehlgeschlagen",
        description: "Ein Fehler ist aufgetreten. Versuchen Sie es erneut.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const passwordValidation = validatePassword(registerData.password);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-8 h-8 text-primary" />
            <CardTitle className="text-3xl font-bold text-primary">TableManager</CardTitle>
          </div>
          <CardDescription>
            Verwalte deine Tabellen effizient und sicher
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Anmelden</TabsTrigger>
              <TabsTrigger value="register">Registrieren</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">E-Mail</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    placeholder="deine@email.com"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Passwort</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      placeholder="••••••••"
                      required
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                {loginAttempts > 2 && (
                  <div className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                    Warnung: {5 - loginAttempts} Versuche verbleibend
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Anmelden..." : "Anmelden"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name">Name</Label>
                  <Input
                    id="register-name"
                    value={registerData.name}
                    onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                    placeholder="Dein Name"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">E-Mail</Label>
                  <Input
                    id="register-email"
                    type="email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    placeholder="deine@email.com"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Passwort</Label>
                  <div className="relative">
                    <Input
                      id="register-password"
                      type={showRegisterPassword ? "text" : "password"}
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      placeholder="••••••••"
                      required
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      disabled={isLoading}
                    >
                      {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {registerData.password && (
                    <div className="text-xs space-y-1">
                      <div className={`flex items-center gap-2 ${
                        passwordValidation.strength === 'strong' ? 'text-green-600' :
                        passwordValidation.strength === 'medium' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        <div className="flex gap-1">
                          {[1, 2, 3].map((i) => (
                            <div
                              key={i}
                              className={`w-2 h-2 rounded-full ${
                                passwordValidation.strength === 'strong' ? 'bg-green-500' :
                                passwordValidation.strength === 'medium' && i <= 2 ? 'bg-yellow-500' :
                                passwordValidation.strength === 'weak' && i === 1 ? 'bg-red-500' : 'bg-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span>Stärke: {
                          passwordValidation.strength === 'strong' ? 'Stark' :
                          passwordValidation.strength === 'medium' ? 'Mittel' : 'Schwach'
                        }</span>
                      </div>
                      {passwordValidation.errors.length > 0 && (
                        <ul className="text-red-600 space-y-1">
                          {passwordValidation.errors.map((error, i) => (
                            <li key={i}>• {error}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading || !passwordValidation.isValid}
                >
                  {isLoading ? "Registrieren..." : "Registrieren"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
