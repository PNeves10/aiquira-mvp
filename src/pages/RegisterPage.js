import React, { useState } from "react";
import Card from "../components/ui/card"; // Ajuste o caminho se necessário
import CardContent from "../components/ui/cardContent"; // Ajuste o caminho se necessário
import Input from "../components/ui/input"; // Ajuste o caminho se necessário
import Button from "../components/ui/button"; // Ajuste o caminho se necessário
import { useNavigate } from "react-router-dom"; // Importando useNavigate

const RegisterPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate(); // Hook para navegação

  const handleRegister = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Falha ao registrar");
      }

      alert("Usuário registrado com sucesso! Você pode fazer login agora.");
      navigate("/login"); // Redireciona para a página de login após o registro
    } catch (err) {
      console.error("Erro ao registrar:", err);
      setError(err.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-4">Registrar</h1>
      {error && <p className="text-red-500">{error}</p>}
      <Card className="w-full max-w-md p-4 mb-6">
        <CardContent>
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
          <Button className="mt-4 w-full" onClick={handleRegister}>Registrar</Button>
          <p className="mt-2 text-sm">
            Já tem uma conta?{" "}
            <button onClick={() => navigate("/login")} className="text-blue-500">Entrar</button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterPage;