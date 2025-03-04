import { useState, useEffect } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import Card from "../components/ui/card"; // Ajuste o caminho se necessário
import CardContent from "../components/ui/cardContent"; // Ajuste o caminho se necessário
import Input from "../components/ui/input"; // Ajuste o caminho se necessário
import Button from "../components/ui/button"; // Ajuste o caminho se necessário
import MainPage from "./MainPage"; // Importando o novo componente
import RegisterPage from "./RegisterPage"; // Importando a nova página de registro

export default function Home() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  const handleLogin = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Falha na autenticação");
      }

      localStorage.setItem("token", data.token);
      setToken(data.token);
    } catch (err) {
      console.error("Erro ao fazer login:", err);
      setError(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken("");
  };

  return (
    <Routes>
      <Route path="/login" element={
        !token ? (
          <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <h1 className="text-3xl font-bold mb-4">AIQuira - Avaliação de Websites</h1>
            {error && <p className="text-red-500">{error}</p>}
            <Card className="w-full max-w-md p-4 mb-6">
              <CardContent>
                <h2 className="text-xl font-bold mb-2">Login</h2>
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Input
                  type="password"
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button className="mt-4 w-full" onClick={handleLogin}>Entrar</Button>
                <p className="mt-2 text-sm">
                  Não tem uma conta?{" "}
                  <Button onClick={() => window.location.href = "/register"} className="text-blue-500">
                    Registrar
                  </Button>
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Navigate to="/" />
        )
      } />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={
        token ? (
          <MainPage token={token} setToken={setToken} handleLogout={handleLogout} />
        ) : (
          <Navigate to="/login" />
        )
      } />
    </Routes>
  );
}