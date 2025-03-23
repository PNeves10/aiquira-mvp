import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Card from "../components/ui/card.js";
import CardContent from "../components/ui/cardContent.js";
import Input from "../components/ui/input.js";
import Button from "../components/ui/button.js";
import { useNavigate } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import { ClipLoader } from "react-spinners";
import Notifications from "../components/Notifications.js"; // ✅ Importar notificações

const RegisterPage = () => {
    const [username, setUsername] = useState("");
    const [usernameError, setUsernameError] = useState(""); // ✅ Novo estado para erros no username
    const [email, setEmail] = useState("");
    const [emailError, setEmailError] = useState(""); // ✅ Novo estado para erros no email
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(""); // ✅ Nova variável para sucesso
    const [loading, setLoading] = useState(false);
    const [token, setToken] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isButtonEnabled, setIsButtonEnabled] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        setIsButtonEnabled(
            username && validateEmail(email) && validatePassword(password) && token && !emailError && !usernameError
        );
    }, [username, email, password, token, emailError, usernameError]);

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

    // Verificação de username em tempo real com debounce
    useEffect(() => {
        if (username.length < 3) {
            setUsernameError("O username deve ter pelo menos 3 caracteres.");
            return;
        }

        const timer = setTimeout(async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/check-username?username=${username}`);
                const data = await response.json();
                if (data.exists) {
                    setUsernameError("Este username já está registado.");
                } else {
                    setUsernameError("");
                }
            } catch {
                setUsernameError("Erro ao verificar o username.");
            }
        }, 500); // Espera 500ms antes de fazer a chamada para evitar chamadas excessivas

        return () => clearTimeout(timer); // Cancela a chamada anterior se o utilizador continuar a digitar
    }, [username]);

    // Verificação de email em tempo real
    useEffect(() => {
        if (!validateEmail(email)) {
            setEmailError(""); // Se não for um email válido, não verifica
            return;
        }

        const timer = setTimeout(async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/check-email?email=${email}`);
                const data = await response.json();
                if (data.exists) {
                    setEmailError("Este email já está registado.");
                } else {
                    setEmailError("");
                }
            } catch {
                setEmailError("Erro ao verificar o email.");
            }
        }, 500); // Aguarda 500ms antes de fazer a chamada (evita chamadas excessivas)

        return () => clearTimeout(timer); // Cancela a chamada anterior se o utilizador continuar a digitar
    }, [email]);

    const handleRegister = async () => {
        if (emailError || usernameError) return; // Bloqueia registo se o email ou username já existir

        setLoading(true);
        setError("");
        setSuccess(""); // Resetar sucesso antes de cada tentativa

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
            setSuccess("Registo bem-sucedido! Redirecionar para o login..."); // Mensagem de sucesso com UI
            setTimeout(() => navigate("/login"), 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
            <motion.h1 initial={{ y: -20 }} animate={{ y: 0 }} className="text-3xl font-bold mb-4 text-gray-800">Registar</motion.h1>
            
            {error && <Notifications message={error} type="error" onClose={() => setError("")} />}
            {success && <Notifications message={success} type="success" onClose={() => setSuccess("")} />}
            
            <Card className="w-full max-w-sm p-4 shadow-lg hover:shadow-xl transition">
                <CardContent>
                    <Input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} aria-label="Nome de usuário" />
                    {usernameError && <p className="text-red-500 text-sm mt-1">{usernameError}</p>}
                    
                    <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Endereço de email" />
                    {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
                    
                    <div className="relative">
                        <Input type={showPassword ? "text" : "password"} placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} aria-label="Senha" />
                        <button type="button" className="absolute inset-y-0 right-3 flex items-center px-2 text-gray-600" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? "🙈" : "👁️"}
                        </button>
                    </div>
                    
                    <p className={`text-sm mt-2 ${validatePassword(password) ? "text-green-600" : "text-red-500"}`}>
                        A senha deve ter pelo menos 6 caracteres, incluindo uma letra maiúscula, uma minúscula, um número e um caractere especial.
                    </p>

                    <div className="flex justify-center mt-4">
                        <ReCAPTCHA sitekey="6LfZHO8qAAAAAPS_iNPgBNOcm3SkZWRxg8cdOg5W" onChange={(value) => setToken(value)} />
                    </div>

                    <Button className={`mt-4 w-full transition-transform transform ${isButtonEnabled ? "bg-blue-500 text-white hover:scale-105" : "bg-gray-400 text-gray-700"}`} onClick={handleRegister} disabled={loading || !isButtonEnabled}>
                        {loading ? <ClipLoader size={20} color={"#fff"} /> : "Registrar"}
                    </Button>

                    <p className="mt-2 text-sm text-center">
                        Já tem uma conta? <button onClick={() => navigate("/login")} className="text-blue-500 underline">Entrar</button>
                    </p>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default RegisterPage;