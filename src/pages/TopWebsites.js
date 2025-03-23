import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom"; // Importar useNavigate
import Card from "../components/ui/card.js";
import CardContent from "../components/ui/cardContent.js";
import Button from "../components/ui/button.js";

const TopWebsites = ({ token }) => {
    const navigate = useNavigate(); // Inicializar useNavigate
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTopWebsites = async () => {
            try {
                const response = await fetch("http://localhost:5000/api/listings?minRating=5", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!response.ok) throw new Error("Erro ao buscar websites.");

                const data = await response.json();
                setListings(data);
            } catch (err) {
                console.error("Erro ao carregar websites:", err);
            } finally {
                setLoading(false);
            }
        };

        if (token) fetchTopWebsites();
    }, [token]);

    return (
        <motion.div className="p-6 flex flex-col items-center bg-gray-100 min-h-screen">
            <h2 className="text-3xl font-bold mb-4 text-center">🏆 Top Websites ⭐⭐⭐⭐⭐</h2>

            {loading ? <p>Carregando...</p> : listings.length === 0 ? (
                <p>Nenhum website com 5⭐ ainda!</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl justify-center">
                    {listings.map((listing) => (
                        <Card key={listing._id} className="p-4 shadow-lg hover:shadow-xl transition highlight">
                            <CardContent className="flex flex-col items-center text-center">
                                <span className="vip-badge">🏆 Destaque VIP</span>
                                <img src={`http://localhost:5000${listing.image}`} alt={`Imagem de ${listing.url}`} className="w-full max-w-xs h-48 object-cover rounded-lg border shadow-md" />
                                <p><strong>URL:</strong> <a href={listing.url} target="_blank" rel="noopener noreferrer">{listing.url}</a></p>
                                <p><strong>Preço:</strong> {listing.price} €</p>
                                <p><strong>Descrição:</strong> {listing.description}</p>
                                <p><strong>Avaliação:</strong> {listing.rating.toFixed(1)}⭐</p>
                                <Button className="mt-2 bg-green-500 text-white px-4 py-2 rounded">
                                    💳 Comprar
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Botão para voltar à página principal */}
            <Button className="mt-4 bg-blue-500 text-white px-4 py-2 rounded" onClick={() => navigate("/")}>
                🔙 Voltar à Página Principal
            </Button>

            <style>
                {`
                    .highlight {
                        background-color: #fffae6;
                        border: 2px solid gold;
                        padding: 10px;
                        border-radius: 10px;
                        box-shadow: 0px 0px 10px rgba(255, 215, 0, 0.5);
                    }
                    .vip-badge {
                        background: gold;
                        color: black;
                        font-weight: bold;
                        padding: 5px 10px;
                        border-radius: 5px;
                        display: inline-block;
                        margin-bottom: 5px;
                    }
                `}
            </style>
        </motion.div>
    );
};

export default TopWebsites;