import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom"; // Importa o hook useNavigate
import Card from "../components/ui/card.js";
import CardContent from "../components/ui/cardContent.js";

const TopRankings = ({ token }) => {
    const [rankings, setRankings] = useState(null);
    const navigate = useNavigate(); // Inicializa o hook useNavigate

    useEffect(() => {
        const fetchRankings = async () => {
            try {
                const response = await fetch("http://localhost:5000/api/top-websites", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!response.ok) throw new Error("Erro ao buscar rankings.");

                const data = await response.json();
                setRankings(data);
            } catch (err) {
                console.error("Erro ao carregar rankings:", err);
            }
        };

        if (token) fetchRankings();
    }, [token]);

    return (
        <motion.div className="p-6 flex flex-col items-center bg-gray-100 min-h-screen">
            <h2 className="text-3xl font-bold mb-4 text-center">🏆 Ranking de Websites</h2>

            {rankings ? (
                <>
                    {/* 🔹 Top Vendidos */}
                    <h3 className="text-2xl font-semibold mt-6">💰 Top 10 Mais Vendidos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
                        {rankings.topSold.map((listing, index) => (
                            <Card key={listing._id} className="p-4 shadow-lg">
                                <CardContent className="text-center">
                                    <span className="ranking-badge">{index + 1}️⃣</span>
                                    <p><strong>URL:</strong> {listing.url}</p>
                                    <p>💵 {listing.salesCount} vendas</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* 🔹 Top Populares */}
                    <h3 className="text-2xl font-semibold mt-6">🔥 Top 10 Mais Populares</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
                        {rankings.topViewed.map((listing, index) => (
                            <Card key={listing._id} className="p-4 shadow-lg">
                                <CardContent className="text-center">
                                    <span className="ranking-badge">{index + 1}️⃣</span>
                                    <p><strong>URL:</strong> {listing.url}</p>
                                    <p>👀 {listing.views} visualizações</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* 🔹 Top Melhor Avaliados */}
                    <h3 className="text-2xl font-semibold mt-6">⭐ Top 10 Melhor Avaliados</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
                        {rankings.topRated.map((listing, index) => (
                            <Card key={listing._id} className="p-4 shadow-lg">
                                <CardContent className="text-center">
                                    <span className="ranking-badge">{index + 1}️⃣</span>
                                    <p><strong>URL:</strong> {listing.url}</p>
                                    <p>⭐ {listing.rating.toFixed(1)}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </>
            ) : (
                <p>Carregando...</p>
            )}

            {/* Botão de Voltar */}
            <button
                onClick={() => navigate("/")} // Navega para a página principal
                className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
                🔙 Voltar à Página Principal
            </button>

            <style>
                {`
                    .ranking-badge {
                        background: gold;
                        color: black;
                        font-weight: bold;
                        padding: 5px 10px;
                        border-radius: 10px;
                        display: inline-block;
                        margin-bottom: 5px;
                    }
                `}
            </style>
        </motion.div>
    );
};

export default TopRankings;