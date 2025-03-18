import React, { useState, useEffect } from "react";
import { Route, Routes, Navigate, useNavigate } from "react-router-dom";
import Card from "../components/ui/card.js";
import CardContent from "../components/ui/cardContent.js";
import Input from "../components/ui/input.js";
import Button from "../components/ui/button.js";
import MainPage from "./MainPage.js";
import RegisterPage from "./RegisterPage.js";
import AdminDashboard from "../components/AdminDashboard.js";
import { ClipLoader } from "react-spinners";

export default function Home() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      fetch("http://localhost:5000/api/validate-token", {
        headers: { Authorization: `Bearer ${storedToken}` },
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
        .catch(() => {
          localStorage.removeItem("token");
          setToken("");
        });
    }
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao autenticar.");
      }

      localStorage.setItem("token", data.token);
      setToken(data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken("");
  };

  return (
    <Routes>
      <Route
        path="/login"
        element={
          !token ? (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
              <h1 className="text-3xl font-bold mb-4 text-gray-800">AIQuira - Avaliação de Websites</h1>

              {error && <p role="alert" className="text-red-500 bg-red-100 p-2 rounded">{error}</p>}

              <Card className="w-full max-w-md p-4 mb-6">
                <CardContent>
                  <h2 className="text-xl font-bold mb-2">Login</h2>

                  <Input
                    type="text"
                    placeholder="Username ou Email"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    aria-label="Insira seu username ou email"
                  />

                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      aria-label="Insira sua password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-2 flex items-center px-2 text-gray-600"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>

                  <Button className="bg-blue-500 text-white mt-4 w-full" onClick={handleLogin} disabled={loading}>
                      {loading ? <ClipLoader size={20} color={"#fff"} /> : "Entrar"}
                  </Button>

                  <p className="mt-2 text-sm text-center">
                    Não tem uma conta?{" "}
                    <button
                      onClick={() => navigate("/register")}
                      className="text-blue-500 underline"
                    >
                      Registar
                    </button>
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Navigate to="/" />
          )
        }
      />

      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/admin"
        element={token ? <AdminDashboard token={token} /> : <Navigate to="/login" />}
      />

      <Route
        path="/"
        element={
          token ? (
            <MainPage token={token} setToken={setToken} handleLogout={handleLogout} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />
    </Routes>
  );
}