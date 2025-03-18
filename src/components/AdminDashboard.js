import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/button.js";

const AdminDashboard = ({ token }) => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [listings, setListings] = useState([]);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!token) {
            navigate("/login"); // Redireciona se não estiver autenticado
        } else {
            fetchUsers();
            fetchListings();
        }
    }, [token, navigate]);

    // Buscar utilizadores
    const fetchUsers = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/admin/users", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error("Erro ao carregar utilizadores");
            const data = await response.json();
            setUsers(data);
        } catch (err) {
            setError(err.message);
        }
    };

    // Buscar listagens
    const fetchListings = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/listings", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error("Erro ao carregar listagens");
            const data = await response.json();
            setListings(data);
        } catch (err) {
            setError(err.message);
        }
    };

    // Apagar utilizador
    const deleteUser  = async (id) => {
        if (!window.confirm("Tem a certeza de que pretende apagar este utilizador?")) return;
        try {
            await fetch(`http://localhost:5000/api/admin/users/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            setUsers(users.filter((user) => user._id !== id));
        } catch {
            alert("Erro ao apagar o utilizador");
        }
    };

    // Apagar listagem
    const deleteListing = async (id) => {
        if (!window.confirm("Tem a certeza que pretende apagar esta listagem?")) return;
        try {
            await fetch(`http://localhost:5000/api/admin/listings/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            setListings(listings.filter((listing) => listing._id !== id));
        } catch {
            alert("Erro ao apagar a listagem");
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* 🔹 Barra superior do Admin Panel */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold">Painel Administrativo</h2>
                <Button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={() => navigate("/")}>
                    Voltar ao Início
                </Button>
            </div>

            {error && <p className="text-red-500 text-center">{error}</p>}

            {/* 🔹 Utilizadores registados */}
            <div className="mb-8">
                <h3 className="text-xl font-semibold mb-2">Utilizadores registados</h3>
                <table className="w-full border-collapse border border-gray-300">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="border p-2">Username</th>
                            <th className="border p-2">Email</th>
                            <th className="border p-2">Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user._id} className="text-center">
                                <td className="border p-2">{user.username}</td>
                                <td className="border p-2">{user.email}</td>
                                <td className="border p-2">
                                    {/* Verifica se o utilizador não é um admin antes de mostrar o botão de eliminar */}
                                    {user.role !== "admin" && (
                                        <Button onClick={() => deleteUser (user._id)} className="bg-red-500 text-white px-3 py-1 rounded">
                                            Eliminar
                                        </Button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Listagens de Websites */}
            <div>
                <h3 className="text-xl font-semibold mb-2">Listagens de Websites</h3>
                <table className="w-full border-collapse border border-gray-300">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="border p-2">URL</th>
                            <th className="border p-2">Preço (€)</th>
                            <th className="border p-2">Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {listings.map((listing) => (
                            <tr key={listing._id} className="text-center">
                                <td className="border p-2">
                                    <a href={listing.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                                        {listing.url}
                                    </a>
                                </td>
                                <td className="border p-2">{listing.price}</td>
                                <td className="border p-2">
                                    <Button onClick={() => deleteListing(listing._id)} className="bg-red-500 text-white px-3 py-1 rounded">
                                        Remover
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminDashboard;