import React from "react";
import { useNavigate } from "react-router-dom";

const CancelPage = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-red-100">
            <h1 className="text-2xl font-bold text-red-700">❌ Pagamento Cancelado</h1>
            <button className="mt-4 bg-blue-500 text-white px-4 py-2 rounded" onClick={() => navigate("/")}>
                🔙 Voltar ao Marketplace
            </button>
        </div>
    );
};

export default CancelPage;