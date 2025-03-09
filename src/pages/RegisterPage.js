import React, { useState } from "react";
import Card from "../components/ui/card.js";
import CardContent from "../components/ui/cardContent.js";
import Input from "../components/ui/input.js";
import Button from "../components/ui/button.js";
import { useNavigate } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";

const RegisterPage = () => {
    const [username, setUsername] = useState(""); // Novo estado para o username
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [token, setToken] = useState("");
    const [showPassword, setShowPassword] = useState(false); // Estado para visibilidade da senha
    const navigate = useNavigate();

    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const validatePassword = (password) => {
        const trimmedPassword = password.trim();
        return (
            /[A-Z]/.test(trimmedPassword) &&
            /[a-z]/.test(trimmedPassword) &&
            /\d/.test(trimmedPassword) &&
            /[!@#$%^&*()_+[\]{};':"\\|,.<>/?]/.test(trimmedPassword) &&
            trimmedPassword.length >= 6
        );
    };

    const handleRegister = async () => {
        setLoading(true);
        setError("");

        if (!username) {
            setLoading(false);
            return setError("Insira um username.");
        }
        if (!validateEmail(email)) {
            setLoading(false);
            return setError("Insira um email válido no formato utilizador@dominio.com");
        }
        if (!validatePassword(password)) {
            setLoading(false);
            return setError("A senha deve ter pelo menos 6 caracteres, incluindo uma letra maiúscula, uma minúscula, um número e um caractere especial.");
        }
        if (!token) {
            setLoading(false);
            return setError("Complete o reCAPTCHA antes de continuar.");
        }

        try {
            const response = await fetch("http://localhost:5000/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password, token }), // Inclua o username aqui
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Erro inesperado ao registrar-se.");
            }

            setUsername(""); // Limpa o campo de username
            setEmail(""); // Limpa o campo de email
            setPassword(""); // Limpa o campo de senha
            setToken(""); // Limpa o token
            alert("Registro bem-sucedido! Faça login agora.");
            navigate("/login");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <h1 className="text-3xl font-bold mb-4">Registrar</h1>
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-md mb-4">{error}</div>}
            
            <Card className="w-full max-w-md p-4 mb-6">
                <CardContent>
                    <Input
                        type="text"
                        placeholder="Username" // Campo para username
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    
                    <Input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    
                    <div className="relative">
                        <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Senha"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                            type="button"
                            className="absolute inset-y-0 right-2 flex items-center px-2 text-gray-600"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? "🙈" : "👁️"}
                        </button> </div>

                    <div className="flex justify-center mt-4">
                        <ReCAPTCHA
                            sitekey="6LfZHO8qAAAAAPS_iNPgBNOcm3SkZWRxg8cdOg5W"
                            onChange={(value) => setToken(value)}
                        />
                    </div>

                    <Button className="mt-4 w-full" onClick={handleRegister} disabled={loading || !token}>
                        {loading ? "Registrando..." : "Registrar"}
                    </Button>

                    <p className="mt-2 text-sm">
                        Já tem uma conta? <button onClick={() => navigate("/login")} className="text-blue-500">Entrar</button>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default RegisterPage;