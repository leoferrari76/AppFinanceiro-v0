import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [email, setEmail] = useState(user?.email || "");
  
  // Estados para o formulário de email
  const [emailCurrentPassword, setEmailCurrentPassword] = useState("");
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  
  // Estados para o formulário de senha
  const [passwordCurrentPassword, setPasswordCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      await updateUser({ 
        email,
        currentPassword: emailCurrentPassword 
      });
      
      toast({
        title: "Sucesso",
        description: "Email atualizado com sucesso",
      });
      
      setEmailCurrentPassword("");
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o email",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (newPassword !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await updateUser({ 
        password: newPassword,
        currentPassword: passwordCurrentPassword 
      });
      
      toast({
        title: "Sucesso",
        description: "Senha atualizada com sucesso",
      });
      
      setPasswordCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar a senha",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="email" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email" className="gap-2">
                <Mail className="h-4 w-4" />
                Email
              </TabsTrigger>
              <TabsTrigger value="password" className="gap-2">
                <Lock className="h-4 w-4" />
                Senha
              </TabsTrigger>
            </TabsList>

            <TabsContent value="email">
              <form onSubmit={handleEmailUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Atual</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emailCurrentPassword">Senha Atual</Label>
                  <div className="relative">
                    <Input
                      id="emailCurrentPassword"
                      type={showEmailPassword ? "text" : "password"}
                      value={emailCurrentPassword}
                      onChange={(e) => setEmailCurrentPassword(e.target.value)}
                      placeholder="Digite sua senha atual"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => setShowEmailPassword(!showEmailPassword)}
                    >
                      {showEmailPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Atualizando..." : "Atualizar Email"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="password">
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="passwordCurrentPassword">Senha Atual</Label>
                  <div className="relative">
                    <Input
                      id="passwordCurrentPassword"
                      type={showPassword ? "text" : "password"}
                      value={passwordCurrentPassword}
                      onChange={(e) => setPasswordCurrentPassword(e.target.value)}
                      placeholder="Digite sua senha atual"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Digite sua nova senha"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirme sua nova senha"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Atualizando..." : "Atualizar Senha"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile; 