import React, { useState, useEffect } from "react";
import Card from "../components/ui/card.js";
import CardContent from "../components/ui/cardContent.js";
import Input from "../components/ui/input.js";
import Button from "../components/ui/button.js";
import { useNavigate } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import { ClipLoader } from "react-spinners";

const RegisterPage = () => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [token, setToken] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isButtonEnabled, setIsButtonEnabled] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Verifica se todos os campos estão preenchidos e se o reCAPTCHA foi completado
        setIsButtonEnabled(username && validateEmail(email) && validatePassword(password) && token);
    }, [username, email, password, token]);

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
            return setError("Introduza um username.");
        }
        if (!validateEmail(email)) {
            setLoading(false);
            return setError("Introduza um email válido.");
        }
        if (!validatePassword(password)) {
            setLoading(false);
            return setError("A password deve ter pelo menos 6 caracteres, incluindo maiúscula, minúscula, número e caracteres especiais.");
        }
        if (!token) {
            setLoading(false);
            return setError("Complete o reCAPTCHA antes de continuar.");
        }

        try {
            const response = await fetch("http://localhost:5000/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password, token }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Erro de registo.");
            }

            setUsername("");
            setEmail("");
            setPassword("");
            setToken("");
            alert("Registo bem-sucedido! Faça login agora.");
            navigate("/login");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
            <h1 className="text-3xl font-bold mb-4 text-gray-800">Registar</h1>

            {error && <div role="alert" className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-md mb-4">{error}</div>}
            
            <Card className="w-full max-w-sm p-4">
                <CardContent>
                    <Input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        aria-label="Nome de usuário"
                    />
                    
                    <Input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        aria-label="Endereço de email"
                    />
                    
                    <div className="relative">
                        <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Senha"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            aria-label="Senha"
                        />
                        <button
                            type="button"
                            className="absolute inset-y-0 right-3 flex items-center px-2 text-gray-600"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? "🙈" : "👁️"}
                        </button> 
                    </div>

                    <p className={`text-sm mt-2 ${validatePassword(password) ? "text-green-600" : "text-red-500"}`}>
                        A password deve ter pelo menos 6 caracteres, incluindo uma letra maiúscula, uma minúscula, um número e um carácter especial.
                    </p>

                    <div className="flex justify-center mt-4">
                        <ReCAPTCHA
                            sitekey="6LfZHO8qAAAAAPS_iNPgBNOcm3SkZWRxg8cdOg5W"
                            onChange={(value) => setToken(value)}
                        />
                    </div>

                    <Button className={`mt-4 w-full ${isButtonEnabled ? "bg-blue-500 text-white" : "bg-gray-400 text-gray-700"}`} onClick={handleRegister} disabled={loading || !isButtonEnabled}>
                        {loading ? <ClipLoader size={20} color={"#fff"} /> : "Registrar"}
                    </Button>

                    <p className="mt-2 text-sm text-center">
                        Já tem uma conta? <button onClick={() => navigate("/login")} className="text-blue-500 underline">Entrar</button>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default RegisterPage;