import { useState, useEffect } from "react";
import Card from "./components/ui/card"; // Ajuste o caminho se necessário
import CardContent from "./components/ui/cardContent"; // Ajuste o caminho se necessário
import Input from "./components/ui/input"; // Ajuste o caminho se necessário
import Button from "./components/ui/button"; // Ajuste o caminho se necessário
import Textarea from "./components/ui/textarea"; // Ajuste o caminho se necessário

export default function Home() {
  const [url, setUrl] = useState("");
  const [evaluation, setEvaluation] = useState(null);
  const [listings, setListings] = useState([]);
  const [newListing, setNewListing] = useState({ url: "", price: "", description: "" });
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  useEffect(() => {
    fetch("/api/listings")
      .then((res) => res.json())
      .then((data) => setListings(data));
  }, []);

  const handleEvaluate = async () => {
    const response = await fetch("/api/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    });
    const data = await response.json();
    setEvaluation(data);
  };

  const handleListWebsite = async () => {
    if (!token) return alert("Precisa estar autenticado!");
    const response = await fetch("/api/listings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token
      },
      body: JSON.stringify(newListing)
    });
    const data = await response.json();
    setListings([...listings, data]);
    setNewListing({ url: "", price: "", description: "" });
  };

  const handleLogin = async () => {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    if (data.token) {
      localStorage.setItem("token", data.token);
      setToken(data.token);
    } else {
      alert("Falha na autenticação");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-4">AIQuira - Avaliação de Websites</h1>
      {!token && (
        <Card className="w-full max-w-md p-4 mb-6">
          <CardContent>
            <h2 className="text-xl font-bold mb-2">Login</h2>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button className="mt-4 w-full" onClick={handleLogin}>Entrar</Button>
          </CardContent>
        </Card>
      )}
      {token && (
        <>
          <h2 className="text-2xl font-bold mb-4">Listar Website para Venda</h2>
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
        </>
      )}
      <h2 className="text-2xl font-bold mb-4">Websites Disponíveis para Compra</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
        {listings.map((listing) => (
          <Card key={listing.id} className="p-4">
            <CardContent>
              <p><strong>URL:</strong> <a href={listing.url} target="_blank" rel="noopener noreferrer" className="text-blue-500">{listing.url}</a></p>
              <p><strong>Preço:</strong> {listing.price} €</p>
              <p><strong>Descrição:</strong> {listing.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}