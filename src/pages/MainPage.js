import React, { useEffect, useState } from "react";
import Card from "../components/ui/card"; // Ajuste o caminho se necessário
import CardContent from "../components/ui/cardContent"; // Ajuste o caminho se necessário
import Input from "../components/ui/input"; // Ajuste o caminho se necessário
import Button from "../components/ui/button"; // Ajuste o caminho se necessário
import Textarea from "../components/ui/textarea"; // Ajuste o caminho se necessário

const MainPage = ({ token, setToken, handleLogout }) => {
  const [listings, setListings] = useState([]);
  const [newListing, setNewListing] = useState({ url: "", price: "", description: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true); // Estado de carregamento

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/listings");
        const data = await response.json();
        setListings(data);
      } catch (err) {
        console.error("Erro ao buscar listagens:", err);
        setError("Não foi possível carregar as listagens.");
      } finally {
        setLoading(false); // Finaliza o carregamento
      }
    };

    fetchListings();
  }, []);

  const handleListWebsite = async () => {
    if (!token) return alert("Precisa estar autenticado!");
    if (!newListing.url || !newListing.price || !newListing.description) {
      return setError("Todos os campos são obrigatórios.");
    }

    try {
      const response = await fetch("http://localhost:5000/api/listings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify(newListing),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao publicar website");
      }

      const data = await response.json();
      setListings((prevListings) => [...prevListings, data]);
      setNewListing({ url: "", price: "", description: "" });
      setError(""); // Limpa o erro após sucesso
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Listar Website para Venda</h2>
      <Button className="mb-4" onClick={handleLogout}>Logout</Button> {/* Botão de logout */}
      {error && <p className="text-red-500">{error}</p>} {/* Mensagem de erro */}
      <Card className="w-full max-w-md p-4 mb-6">
        <CardContent>
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
          <Button className="mt-4 w-full" onClick={handleListWebsite}>Publicar Website</Button>
        </CardContent>
      </Card>
      <h2 className="text-2xl font-bold mb-4">Websites Disponíveis para Compra</h2>
      {loading ? ( // Exibe carregador enquanto busca as listagens
        <p>Carregando listagens...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
          {listings.map((listing) => (
            <Card key={listing.id} className="p-4">
              < CardContent>
                <p><strong>URL:</strong> <a href={listing.url} target="_blank" rel="noopener noreferrer" className="text-blue-500">{listing.url}</a></p>
                <p><strong>Preço:</strong> {listing.price} €</p>
                <p><strong>Descrição:</strong> {listing.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MainPage;