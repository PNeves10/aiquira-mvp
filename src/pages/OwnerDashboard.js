import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom"; // Importar useNavigate

const OwnerDashboard = ({ token }) => {
    const [stats, setStats] = useState([]);
    const navigate = useNavigate(); // Inicializar o hook useNavigate

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch("http://localhost:5000/api/my-stats", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!response.ok) throw new Error("Erro ao buscar estatísticas.");

                const data = await response.json();
                setStats(data);
            } catch (err) {
                console.error("Erro ao carregar estatísticas:", err);
            }
        };

        if (token) fetchStats();
    }, [token]);

    return (
        <motion.div className="p-6 flex flex-col items-center bg-gray-100 min-h-screen">
            <h2 className="text-3xl font-bold mb-4 text-center">📊 Painel do Proprietário</h2>

            {stats.length > 0 ? (
                <>
                    {/* 🔹 Gráfico de Vendas */}
                    <h3 className="text-2xl font-semibold mt-6">💰 Suas Vendas</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={stats}>
                            <XAxis dataKey="url" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="salesCount" fill="#4CAF50" />
                        </BarChart>
                    </ResponsiveContainer>

                    {/* 🔹 Gráfico de Popularidade */}
                    <h3 className="text-2xl font-semibold mt-6">🔥 Suas Visualizações</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={stats}>
                            <XAxis dataKey="url" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="views" stroke="#FF9800" strokeWidth={3} />
                        </LineChart>
                    </ResponsiveContainer>

                    {/* 🔹 Gráfico de Avaliação Média */}
                    <h3 className="text-2xl font-semibold mt-6">⭐ Avaliação Média dos Seus Websites</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={stats} dataKey="rating" nameKey="url" cx="50%" cy="50%" outerRadius={80}>
                                {stats.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={["#FFEE58", "#FFC107", "#FF9800", "#FF5722", "#F44336"][index]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </>
            ) : (
                <p>Você ainda não possui websites listados.</p>
            )}

            {/* Botão de Voltar */}
            <button 
                onClick={() => navigate("/")} 
                className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
                🔙 Voltar à Página Principal
            </button>
        </motion.div>
    );
};

export default OwnerDashboard;