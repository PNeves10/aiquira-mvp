import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const TransactionsPage = ({ token }) => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const response = await fetch("http://localhost:5000/api/transactions/buyer", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!response.ok) throw new Error("Erro ao carregar histórico.");
                
                const data = await response.json();
                setTransactions(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, [token]);

    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            <h2 className="text-3xl font-bold mb-4 text-center">📜 Histórico de Compras</h2>
            <button 
                className="bg-blue-500 text-white px-4 py-2 rounded mb-4" 
                onClick={() => navigate(-1)}
            >
                🔙 Voltar à Página Principal
            </button>

            {loading ? (
                <p>Carregando...</p>
            ) : error ? (
                <p className="text-red-500">{error}</p>
            ) : transactions.length === 0 ? (
                <p>Sem compras registradas.</p>
            ) : (
                <ul className="bg-white p-4 rounded shadow-lg">
                    {transactions.map((tx) => (
                        <li key={tx._id} className="border-b p-2">
                            <strong>Website:</strong> {tx.listing.url} | 
                            <strong> Valor:</strong> {tx.amount.toFixed(2)} € | 
                            <strong> Status:</strong> 
                            <span className={`ml-2 px-2 py-1 rounded ${tx.status === "concluído" ? "bg-green-500 text-white" : tx.status === "cancelado" ? "bg-red-500 text-white" : "bg-yellow-500 text-black"}`}>
                                {tx.status}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default TransactionsPage;