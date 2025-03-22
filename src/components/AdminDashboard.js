import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import Button from "../components/ui/button.js";

const socket = io("http://localhost:5000");

const AdminDashboard = ({ token }) => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [listings, setListings] = useState([]);
    const [error, setError] = useState("");
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        if (!token) {
            navigate("/login");
        } else {
            fetchUsers();
            fetchListings();
        }
    }, [token, navigate]);

    useEffect(() => {
        // Escutar notificações em tempo real
        socket.on("adminNotification", (message) => {
            setNotifications((prev) => [...prev, message]);
        });

        return () => socket.off("adminNotification");
    }, []);

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

    const deleteUser = async (id) => {
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <motion.h2 initial={{ x: -20 }} animate={{ x: 0 }} className="text-3xl font-bold">Painel Administrativo</motion.h2>
                <Button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={() => navigate("/")}>Voltar ao Início</Button>
            </div>

            {/* 🔔 Notificações em Tempo Real */}
            <div className="mb-6">
                <h3 className="text-xl font-semibold">🔔 Notificações</h3>
                <div className="bg-gray-100 p-3 rounded shadow-md max-h-40 overflow-auto">
                    {notifications.length === 0 ? (
                        <p className="text-gray-500">Sem novas notificações</p>
                    ) : (
                        notifications.map((note, index) => (
                            <motion.div key={index} className="bg-yellow-200 p-2 rounded my-1">
                                {note}
                            </motion.div>
                        ))
                    )}
                </div>
            </div>

            {error && <p className="text-red-500 text-center">{error}</p>}

            {/* Tabela de Utilizadores */}
            <motion.div className="mb-8">
                <h3 className="text-xl font-semibold mb-2">Utilizadores registados</h3>
                <table className="w-full border-collapse border border-gray-300 shadow-lg">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="border p-2">Username</th>
                            <th className="border p-2">Email</th>
                            <th className="border p-2">Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <motion.tr key={user._id} whileHover={{ scale: 1.02 }} className="text-center">
                                <td className="border p-2">{user.username}</td>
                                <td className="border p-2">{user.email}</td>
                                <td className="border p-2">
                                    {user.role !== "admin" && (
                                        <Button onClick={() => deleteUser(user._id)} className="bg-red-500 text-white px-3 py-1 rounded">
                                            Eliminar
                                        </Button>
                                    )}
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </motion.div>

            {/* Tabela de Listagens */}
            <motion.div>
                <h3 className="text-xl font-semibold mb-2">Listagens de Websites</h3>
                <table className="w-full border-collapse border border-gray-300 shadow-lg">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="border p-2">URL</th>
                            <th className="border p-2">Preço (€)</th>
                            <th className="border p-2">Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {listings.map((listing) => (
                            <motion.tr key={listing._id} whileHover={{ scale: 1.02 }} className="text-center">
                                <td className="border p-2">{listing.url}</td>
                                <td className="border p-2">{listing.price}</td>
                                <td className="border p-2">
                                    <Button onClick={() => deleteListing(listing._id)} className="bg-red-500 text-white px-3 py-1 rounded">
                                        Remover
                                    </Button>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </motion.div>
        </motion.div>
    );
};

export default AdminDashboard;