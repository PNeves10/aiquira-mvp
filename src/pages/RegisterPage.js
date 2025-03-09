import React, { useState } from "react";
import Card from "../components/ui/card.js"; // Adicione a extensão .js
import CardContent from "../components/ui/cardContent.js"; // Adicione a extensão .js
import Input from "../components/ui/input.js"; // Adicione a extensão .js
import Button from "../components/ui/button.js"; // Adicione a extensão .js
import { useNavigate } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha"; // Importando o reCAPTCHA v2

const RegisterPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false); // Estado de carregamento
    const [token, setToken] = useState(""); // Estado para o token do reCAPTCHA
    const navigate = useNavigate();

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validatePassword = (password) => {
        const trimmedPassword = password.trim();
        const hasUpperCase = /[A-Z]/.test(trimmedPassword);
        const hasLowerCase = /[a-z]/.test(trimmedPassword);
        const hasNumber = /\d/.test(trimmedPassword);
        const hasSpecialChar = /[!@#$%^&*()_+[\]{};':"\\|,.<>/?]/.test(trimmedPassword);
        const isValidLength = trimmedPassword.length >= 6;
        return hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar && isValidLength;
    };

    const handleRegister = async () => {
        setLoading(true); // Inicia o carregamento
        if (!validateEmail(email)) {
            setLoading(false);
            return setError("Por favor, insira um email válido no formato utilizador@dominio.com");
        }
        if (!validatePassword(password)) {
            setLoading(false);
            return setError("A senha deve ter pelo menos 6 caracteres, incluindo uma letra maiúscula, uma minúscula, um número e um caractere especial (!@#$%^&*)");
        }

        try {
            const response = await fetch("http://localhost:5000/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, token }), // Enviando o token do reCAPTCHA
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Ocorreu um erro ao tentar registrar-se.");
            }

            alert("Utilizador registrado com sucesso! Agora pode fazer login.");
            navigate("/login");
        } catch (err) {
            console.error("Erro ao registrar:", err);
            setError(err.message);
        } finally {
            setLoading(false); // Finaliza o carregamento
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <h1 className="text-3xl font-bold mb-4">Registrar</h1>
            {error && <p className="text-red-500 bg-red-100 border border-red-400 p-2 rounded-md">{error}</p>}
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
                    <div className="flex justify-center mt-4"> {/* Centraliza o reCAPTCHA */}
                        <ReCAPTCHA
                            sitekey="6Ld64esqAAAAAD1oIKOA-0XDhZ_sfElomQwWGg0k" // Chave do site
                            onChange={(value) => setToken(value)} // Captura o token do reCAPTCHA
                        />
                    </div>
                    <Button className="mt-4 w-full" onClick={handleRegister} disabled={loading || !token}>
                        {loading ? "Registrando..." : " Registrar"}
                    </Button>
                    <p className="mt-2 text-sm">
                        Já tem uma conta? {" "}
                        <button onClick={() => navigate("/login")} className="text-blue-500">Entrar</button>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default RegisterPage;