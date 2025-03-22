import React, { useEffect, useState, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import io from "socket.io-client";
import Card from "../components/ui/card.js";
import CardContent from "../components/ui/cardContent.js";
import Input from "../components/ui/input.js";
import Button from "../components/ui/button.js";
import Textarea from "../components/ui/textarea.js";
import { ClipLoader } from "react-spinners";
import Notifications from "../components/ui/Notifications.js"; // Importar notificações
import Chat from "../components/Chat.js";

const socket = io("http://localhost:5000");

const MainPage = ({ token, setToken, handleLogout }) => {
    const navigate = useNavigate();
    const [listings, setListings] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [newListing, setNewListing] = useState({ url: "", price: "", description: "" });
    const [image, setImage] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState("");
    const [username, setUsername] = useState("");
    const [role, setRole] = useState("");
    const [notifications, setNotifications] = useState([]);
    const [notification, setNotification] = useState(""); // Estado para notificações

    useEffect(() => {
        if (token) {
            const decodedToken = jwtDecode(token);
            setUsername(decodedToken.username);
            setRole(decodedToken.role || "user");
        }
    }, [token]);

    const fetchListings = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await fetch(
                `http://localhost:5000/api/listings?search=${search}&sort=${sort}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (!response.ok) {
                if (response.status === 401) throw new Error("A sessão expirou. Iniciar sessão novamente.");
                const errorData = await response.json();
                throw new Error(errorData.error || "Erro ao buscar listagens");
            }

            const data = await response.json();
            setListings(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message || "Falha ao carregar listagens.");
        } finally {
            setLoading(false);
        }
    }, [search, sort, token]);

    useEffect(() => {
        const validateToken = async () => {
            try {
                const response = await fetch("http://localhost:5000/api/validate-token", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!response.ok) {
                    alert("⚠ Sessão expirada! Faça login novamente.");
                    setToken(null);
                    navigate("/login");
                }
            } catch {
                setToken(null);
            }
        };

        if (token) validateToken();
    }, [token, setToken, navigate]);

    useEffect(() => {
        if (token) fetchListings();
    }, [fetchListings, token, sort]);

    // Buscar favoritos do utilizador
    useEffect(() => {
        const fetchFavorites = async () => {
            const response = await fetch("http://localhost:5000/api/favorites", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            setFavorites(data.map((fav) => fav._id));
        };

        if (token) fetchFavorites();
    }, [token]);

    // Função para adicionar/remover favoritos
    const toggleFavorite = async (listingId) => {
        try {
            const response = await fetch(`http://localhost:5000/api/favorites/${listingId}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            });

            const data = await response.json();
            setFavorites(data.favorites);
            setNotification(data.favorites.includes(listingId) ? "Adicionado aos favoritos!" : "Removido dos favoritos."); // Atualiza a notificação
        } catch {
            setNotification("Erro ao atualizar favoritos.");
        }
    };

    const handleImageChange = (e) => setImage(e.target.files[0]);

    const handleListWebsite = async () => {
        if (!token) return alert("Precisa estar autenticado!");
        if (!newListing.url || !newListing.price || !newListing.description || !image) {
            return setError("Todos os campos são obrigatórios.");
        }

        const formData = new FormData();
        formData.append("url", newListing.url);
        formData.append("price", newListing.price);
        formData.append("description", newListing.description);
        formData.append("image", image);

        setLoadingSubmit(true);
        setError("");

        try {
            const response = await fetch("http://localhost:5000/api/listings", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Erro ao publicar o website");
            }

            const data = await response.json();
            setListings((prevListings) => [...prevListings, data]);
            setNewListing({ url: "", price: "", description: "" });
            setImage(null);
            alert("✅ Website publicado com sucesso!");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoadingSubmit(false);
        }
    };

    useEffect(() => {
        socket.on("receiveMessage", (message) => {
            setNotifications((prev) => [...prev, `📩 Nova mensagem de ${message.sender}`]);
        });

        return () => socket.off("receiveMessage");
    }, []);

    return (
        <motion.div className="p-6 flex flex-col items-center relative bg-gray-100 min-h-screen">
            <div className="absolute top-4 right-4 flex items-center gap-4">
                <p className="text-lg font-semibold">Bem-vindo, <span className="text-blue-600">{role === "admin" ? "Admin" : username}</span>!</p>
                {role === "admin" && (
                    <Button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={() => navigate("/admin")}>
                        Painel Administrativo
                    </Button>
                )}
                <Button className="bg-red-500 text-white px-4 py-2 rounded" onClick={handleLogout}>
                    Logout
                </Button>
            </div>

            <div className="absolute top-4 left-4">
                {notification && <Notifications message={notification} onClose={() => setNotification("")} />}
                {notifications.map((note, index) => (
                    <motion.div key={index} className="bg-yellow-200 p-2 rounded mt-2">{note}</motion.div>
                ))}
            </div>

            <motion.h2 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-3xl font-bold mb-4 text-center mt-12">Listar Website para Venda</motion.h2>

            <Button className="bg-yellow-500 text-white px-4 py-2 rounded mb-4" onClick={() => navigate("/favorites")}>
                ⭐ Ver Favoritos
            </Button>

            <Card className="w-full max-w-md p-4 mb-6">
                <CardContent>
                    <Input type="text" placeholder="URL do website" value={newListing.url} onChange={(e) => setNewListing({ ...newListing, url: e.target.value })} />
                    <Input type="number" placeholder="Preço (€)" value={newListing.price} onChange={(e) => setNewListing({ ...newListing, price: e.target.value })} />
                    <Textarea placeholder="Descrição" value={newListing.description} onChange={(e) => setNewListing({ ...newListing, description: e.target.value })} />
                    <input type="file" accept="image/*" onChange={handleImageChange} className="mt-2" />
                    <Button className="mt-4 w-full bg-blue-500 text-white hover:bg-blue-600" onClick={handleListWebsite} disabled={loadingSubmit}>
                        {loadingSubmit ? <ClipLoader size={20} color={"#fff"} /> : "Publicar Website"}
                    </Button>
                </CardContent>
            </Card>

            <div className="flex gap-4 mb-4 justify-center">
                <Input type="text" placeholder="Buscar websites..." value={search} onChange={(e) => setSearch(e.target.value)} />
                <select className="border p-2 rounded" value={sort} onChange={(e) => setSort(e.target.value)}>
                    <option value="">Ordenar</option>
                    <option value="price_asc">Preço: Menor → Maior</option>
                    < option value="price_desc">Preço: Maior → Menor</option>
                </select>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-center">Websites Disponíveis para Compra</h2>

            {loading ? <ClipLoader size={35} color={"#123abc"} loading={loading} /> : 
                listings.length === 0 ? <p className="text-center">Nenhum resultado encontrado.</p> : 
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl justify-center">
                    {listings.map((listing) => (
                        <Card key={listing._id} className="p-4 shadow-lg hover:shadow-xl transition">
                            <CardContent className="flex flex-col items-center text-center">
                                <img src={`http://localhost:5000${listing.image}`} alt={`Imagem de ${listing.url}`} className="w-full max-w-xs h-48 object-cover rounded-lg border shadow-md" />
                                <p><strong>URL:</strong> <a href={listing.url} target="_blank" rel="noopener noreferrer">{listing.url}</a></p>
                                <p><strong>Preço:</strong> {listing.price} €</p>
                                <p><strong>Descrição:</strong> {listing.description}</p>
                                <p><strong>Proprietário:</strong> {listing.owner ? `${listing.owner.username} (${listing.owner.email})` : "Desconhecido"}</p>

                                <Button
                                    className={`mt-2 px-3 py-1 rounded ${favorites.includes(listing._id) ? "bg-red-500" : "bg-gray-500"}`}
                                    onClick={() => toggleFavorite(listing._id)}
                                >
                                    {favorites.includes(listing._id) ? "❤️ Remover" : "🤍 Favorito"}
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            }

            <Chat user={{ email: username }} />
        </motion.div>
    );
};

export default MainPage;