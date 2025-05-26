import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Toaster } from "./components/ui/toaster";
import Login from "./components/Login";
import Register from "./components/Register";
import Home from "./components/home";
import Profile from "./components/Profile";
import { useAuth } from "./contexts/AuthContext";
import { useEffect } from "react";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  console.log('PrivateRoute: Estado de autenticação:', { user: !!user, loading });

  useEffect(() => {
    if (!loading && !user) {
      console.log('PrivateRoute: Usuário não autenticado, redirecionando para login');
      navigate('/login', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    console.log('PrivateRoute: Carregando autenticação...');
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('PrivateRoute: Usuário não autenticado, aguardando redirecionamento');
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Redirecionando...</p>
        </div>
      </div>
    );
  }

  console.log('PrivateRoute: Usuário autenticado, renderizando conteúdo protegido');
  return <>{children}</>;
}

function App() {
  console.log('App: Renderizando aplicação');
  
  return (
    <div className="min-h-screen bg-background">
      <Router>
        <div className="container mx-auto p-4">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Home />
                </PrivateRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              }
            />
          </Routes>
          <Toaster />
        </div>
      </Router>
    </div>
  );
}

export default App;
