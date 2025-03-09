import React, { useEffect, useState, useRef } from "react";
import { jwtDecode } from "jwt-decode"; // Corrigido para importação nomeada
import Card from "../components/ui/card.js"; // Adicione a extensão .js
import CardContent from "../components/ui/cardContent.js"; // Adicione a extensão .js
import Input from "../components/ui/input.js"; // Adicione a extensão .js
import Button from "../components/ui/button.js"; // Adicione a extensão .js
import Textarea from "../components/ui/textarea.js"; // Adicione a extensão .js

const MainPage = ({ token, setToken, handleLogout }) => {
    const [listings, setListings] = useState([]);
    const [newListing, setNewListing] = useState({ url: "", price: "", description: "" });
    const [image, setImage] = useState(null); // Estado para a imagem
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true); // Estado de carregamento das listagens
    const [loadingSubmit, setLoadingSubmit] = useState(false); // Estado de carregamento para submissão
    const [search, setSearch] = useState(""); // Estado para pesquisa
    const [sort, setSort] = useState(""); // Estado para ordenação
    const [username, setUsername] = useState(""); // Estado para o username

    // Decodificar o token para obter o username
    useEffect(() => {
        if (token) {
            const decodedToken = jwtDecode(token);
            setUsername(decodedToken.username); // Armazena o username
        }
    }, [token]);

    // Debounce para a pesquisa
    const [debouncedSearch, setDebouncedSearch] = useState(search);
    const hasFetched = useRef(false); // Evita múltiplos fetchs

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
        }, 300); // 300ms de debounce

        return () => {
            clearTimeout(handler);
        };
    }, [search]);

    // Função para buscar listagens
    const fetchListings = async () => {
        console.log("Fetching listings with search:", debouncedSearch, "and sort:", sort); // Log de debug
        
        setLoading(true);
        setError(""); // Limpar erros anteriores
        try {
            const response = await fetch(`http://localhost:5000/api/listings?search=${debouncedSearch}&sort=${sort}`, {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` },
            });
    
            if (!response.ok) {
                if (response.status === 401) throw new Error("Sessão expirada. Faça login novamente.");
                const errorData = await response.json();
                throw new Error(errorData.error || "Erro ao buscar listagens");
            }
    
            const data = await response.json();
            console.log("Listings received:", data); // Log da resposta da API
    
            if (Array.isArray(data)) {
                setListings(data);
            } else {
                setError("Os dados retornados não são válidos.");
            }
        } catch (err) {
            setError(err.message || "Falha ao carregar listagens. Verifique sua conexão.");
        } finally {
            setLoading(false);
        }
    };    

    // UseEffect para validar o token
    useEffect(() => {
        const validateToken = async () => {
            try {
                const response = await fetch("http://localhost:5000/api/validate-token", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!response.ok) {
                    setToken(null); // Remove o token inválido
                }
            } catch (err) {
                console.error("Erro ao validar token:", err);
                setToken(null);
            }
        };

        if (token) validateToken();
    }, [token]);

    // UseEffect para buscar listagens
    useEffect(() => {
        if (token === null) return; // Não faz fetch se não houver token
        if (search === "" && sort === "" && listings.length > 0) return; // Evita refetch desnecessário

        fetchListings();
    }, [search, sort, token]); // Dispara a busca sempre que um desses mudar

    const handleImageChange = (e) => {
        setImage(e.target.files[0]); // Atualiza o estado da imagem
    };

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
        setError(""); // Limpar erros anteriores
        try {
            const response = await fetch("http://localhost:5000/api/listings", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Erro ao publicar website");
            }
    
            const data = await response.json();
            setListings((prevListings) => [...prevListings, data]);
            
            // Limpar formulário e exibir mensagem de sucesso
            setNewListing({ url: "", price: "", description: "" });
            setImage(null);
            alert("Website publicado com sucesso!");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoadingSubmit(false);
        }
    };    

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Listar Website para Venda</h2>
            <p>Bem-vindo, {username}!</p> {/* Exibe o username */}
            <Button className="mb-4" onClick={handleLogout}>Logout</Button> {/* Botão de logout */}
            {error && <p className="text-red-500 bg-red-100 p-2 rounded">{error}</p>} {/* Mensagem de erro */}

            <div className="flex gap-4 mb-4">
                <input
                    type="text"
                    placeholder="Buscar websites..."
                    className="border p-2 rounded w-full"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <select
                    className="border p-2 rounded"
                    value={sort}
                    onChange={(e) => {
                        setSort(e.target.value);
                    }}
                >
                    <option value="">Ordenar</option>
                    <option value="price_asc">Preço: Menor → Maior</option>
                    <option value="price_desc">Preço: Maior → Menor</option>
                </select>
            </div>

            <div className="w-full max-w-md p-4 mb-6 border">
                <Input
                    type="text"
                    placeholder="URL do website"
                    value={newListing.url}
                    onChange={(e) => setNewListing({ ...newListing, url: e.target.value })}
                />
                <Input
                    type="number"
                    placeholder="Preço (€)"
                    value={newListing.price}
                    onChange={(e) => setNewListing({ ...newListing, price: e.target.value })}
                />
                <Textarea
                    placeholder="Descrição"
                    value={newListing.description}
                    onChange={(e) => setNewListing({ ...newListing, description: e.target.value })}
                />
                <input type="file" accept="image/*" onChange={handleImageChange} className="mt-2" />
                <Button className="mt-4 w-full" onClick={handleListWebsite} disabled={loadingSubmit}>
                    {loadingSubmit ? "Publicando..." : "Publicar Website"}
                </Button>
            </div>

            <h2 className="text-2xl font-bold mb-4">Websites Disponíveis para Compra</h2>
            {loading ? (
                <p>Carregando listagens...</p>
            ) : listings.length === 0 ? (
                <p>Nenhum resultado encontrado.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
                    {listings.map((listing) => {
                        const imagePath = `http://localhost:5000${listing.image}`;

                        return (
                            <Card key={listing.id} className="p-4">
                                <CardContent>
                                    {listing.image && (
                                        <img
                                            src={imagePath}
                                            alt="Website"
                                            className="w-full max-w-xs h-48 object-contain rounded-lg border border-gray-300 shadow-md"
                                            onError={(e) => {
                                                if (!e.target.dataset.failed) {
                                                    e.target.dataset.failed = true; // Marca como falha para evitar recarregar
                                                    e.target.src = "/placeholder.png"; // Usa imagem alternativa
                                                }
                                            }}
                                        />
                                    )}
                                    <p><strong>URL:</strong> <a href={listing.url} target="_blank" rel="noopener noreferrer">{listing.url}</a></p>
                                    <p><strong>Preço:</strong> {listing.price} €</p>
                                    <p><strong>Descrição:</strong> {listing.description}</p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MainPage;