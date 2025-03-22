import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const SuccessPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get("session_id");

    useEffect(() => {
        if (sessionId) {
            fetch("http://localhost:5000/api/confirm-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionId }),
            })
            .then(res => res.json())
            .then(() => setTimeout(() => navigate("/transactions"), 3000)) // Redireciona após 3s
            .catch(() => navigate("/transactions"));
        }
    }, [sessionId, navigate]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-green-100">
            <h1 className="text-2xl font-bold text-green-700">✅ Pagamento Confirmado!</h1>
            <p>Redirecionando para o histórico de transações...</p>
        </div>
    );
};

export default SuccessPage;