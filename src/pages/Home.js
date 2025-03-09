import React, { useState, useEffect } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import Card from "../components/ui/card.js"; // Adicione a extensão .js
import CardContent from "../components/ui/cardContent.js"; // Adicione a extensão .js
import Input from "../components/ui/input.js"; // Adicione a extensão .js
import Button from "../components/ui/button.js"; // Adicione a extensão .js
import MainPage from "./MainPage.js"; // Adicione a extensão .js
import RegisterPage from "./RegisterPage.js"; // Adicione a extensão .js

export default function Home() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // Estado de carregamento

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      fetch("http://localhost:5000/api/validate-token", {
        headers: { Authorization: storedToken },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Token inválido");
          return res.json();
        })
        .then((data) => {
          if (data.valid) {
            setToken(storedToken);
          } else {
            localStorage.removeItem("token");
            setToken("");
          }
        })
        .catch((err) => {
          localStorage.removeItem("token");
          setToken("");
        });
    }
  }, []);

  const handleLogin = async () => {
    setLoading(true); // Inicia o carregamento
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
      setError(err.message);
    } finally {
      setLoading(false); // Finaliza o carregamento
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token"); // Remove o token do localStorage
    setToken(""); // Limpa o estado do token
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
                <Button className="mt-4 w-full" onClick={handleLogin} disabled={loading}>
                  {loading ? "Carregando..." : "Entrar"}
                </Button>
                <p className="mt-2 text-sm">
                  Não tem uma conta?{" "}
                  <Button 
                    onClick={() => window.location.href = "/register"} 
                    className="mt-2 text-sm text-white bg-blue-500" // Apenas text-white
                  >
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