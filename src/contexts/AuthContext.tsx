import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { toast } from "@/components/ui/use-toast";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string,
    onSuccess?: () => void
  ) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    onSuccess?: () => void
  ) => Promise<void>;
  signOut: (onSuccess?: () => void) => Promise<void>;
  updateUser: (data: { 
    email?: string; 
    password?: string;
    currentPassword?: string;
  }) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthProvider: Iniciando carregamento da sessão');
    
    // Get session from storage and set state if exists
    const setSessionFromStorage = async () => {
      try {
        console.log('AuthProvider: Buscando sessão do storage');
        const {
          data: { session: initialSession },
          error
        } = await supabase.auth.getSession();
        
        if (error) {
          console.error('AuthProvider: Erro ao buscar sessão:', error);
          throw error;
        }
        
        console.log('AuthProvider: Sessão encontrada:', initialSession ? 'Sim' : 'Não');
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
      } catch (error) {
        console.error('AuthProvider: Erro ao buscar sessão:', error);
        setUser(null);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    // Call the function to set initial session
    setSessionFromStorage();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      console.log('AuthProvider: Mudança no estado de autenticação:', _event);
      setLoading(true);
      
      try {
        if (_event === 'SIGNED_IN') {
          console.log('AuthProvider: Usuário autenticado');
          setUser(newSession?.user ?? null);
          setSession(newSession);
        } else if (_event === 'SIGNED_OUT') {
          console.log('AuthProvider: Usuário deslogado');
          setUser(null);
          setSession(null);
        }
      } catch (error) {
        console.error('AuthProvider: Erro ao atualizar estado:', error);
        setUser(null);
        setSession(null);
      } finally {
        setLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string, onSuccess?: () => void) => {
    setLoading(true);
    try {
      console.log('AuthProvider: Tentando fazer login com:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('AuthProvider: Erro no login:', error);
        throw error;
      }

      console.log('AuthProvider: Login bem-sucedido');
      setUser(data.user);
      setSession(data.session);

      toast({
        title: "Sucesso",
        description: "Login realizado com sucesso!",
      });

      onSuccess?.();
    } catch (error: any) {
      console.error('AuthProvider: Erro no login:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao fazer login",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, onSuccess?: () => void) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Conta criada com sucesso! Verifique seu email para confirmar o cadastro.",
      });

      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar conta",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (onSuccess?: () => void) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Logout realizado com sucesso!",
      });

      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao fazer logout",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (data: { 
    email?: string; 
    password?: string;
    currentPassword?: string;
  }) => {
    try {
      // Se houver senha atual, validar primeiro
      if (data.currentPassword && user?.email) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: data.currentPassword,
        });

        if (signInError) {
          throw new Error("Senha atual incorreta");
        }
      }

      const updates: { email?: string; password?: string } = {};
      
      if (data.email) {
        updates.email = data.email;
      }
      
      if (data.password) {
        updates.password = data.password;
      }

      const { error } = await supabase.auth.updateUser(updates);
      
      if (error) throw error;

      // Atualizar o estado do usuário com o novo email
      if (data.email && user) {
        setUser({
          ...user,
          email: data.email,
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar dados do usuário",
        variant: "destructive",
      });
      throw error;
    }
  };

  const value = {
    session,
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
