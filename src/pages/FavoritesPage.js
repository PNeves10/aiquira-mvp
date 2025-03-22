import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Notifications from "../components/ui/Notifications.js";
import Button from "../components/ui/button.js";

const FavoritesPage = ({ token }) => {
    const navigate = useNavigate();
    const [favorites, setFavorites] = useState([]);
    const [notification, setNotification] = useState(""); // ✅ Estado para notificações

    // ✅ Buscar favoritos ao carregar a página
    useEffect(() => {
        if (!token) {
            navigate("/login"); // Redireciona se não estiver autenticado
        } else {
            fetchFavorites();
        }
    }, [token, navigate]);

    const fetchFavorites = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/favorites", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            setFavorites(data);
        } catch {
            setNotification("Erro ao carregar favoritos.");
        }
    };

    // ✅ Remover favoritos diretamente na página
    const removeFavorite = async (listingId) => {
        try {
            const response = await fetch(`http://localhost:5000/api/favorites/${listingId}`, {
                method: "POST", // ✅ A mesma rota usada para adicionar/remover favoritos
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await response.json();
            setFavorites(data.favorites);
            setNotification("Removido dos favoritos!");
        } catch {
            setNotification("Erro ao remover favorito.");
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 flex flex-col items-center bg-gray-100 min-h-screen">
            <h2 className="text-3xl font-bold mb-4">⭐ Meus Favoritos</h2>

            {notification && <Notifications message={notification} onClose={() => setNotification("")} />}

            {favorites.length === 0 ? (
                <p className="text-gray-500">Nenhum favorito ainda.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
                    {favorites.map((fav, index) => (
                        <motion.div key={index} className="p-4 border rounded shadow-md bg-yellow-100 relative">
                            {/* 🔹 Ícone de Coração Vermelho */}
                            <span className="absolute top-2 right-2 text-2xl text-red-500">❤️</span>

                            <h3 className="text-lg font-bold">{fav.url}</h3>
                            <p>💰 Preço: {fav.price}€</p>
                            <p>{fav.description}</p>
                            <Button className="mt-2 bg-red-500 text-white px-3 py-1 rounded" onClick={() => removeFavorite(fav._id)}>
                                ❌ Remover Favorito
                            </Button>
                        </motion.div>
                    ))}
                </div>
            )}

            <Button className="mt-6 bg-blue-500 text-white px-4 py-2 rounded" onClick={() => navigate("/")}>
                🔙 Voltar à Página Principal
            </Button>
        </motion.div>
    );
};

export default FavoritesPage;