import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/ui/card.js";
import CardContent from "../components/ui/cardContent.js";
import Button from "../components/ui/button.js";
import { ClipLoader } from "react-spinners";

const ProfilePage = ({ token }) => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }

        const fetchProfile = async () => {
            try {
                const response = await fetch("http://localhost:5000/api/profile", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!response.ok) throw new Error("Erro ao carregar perfil.");
                const data = await response.json();
                setProfile(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [token, navigate]);

    if (loading) return <ClipLoader size={35} color={"#123abc"} loading={loading} />;

    return (
        <div className="p-6 flex flex-col items-center bg-gray-100 min-h-screen">
            <Card className="w-full max-w-lg p-4">
                <CardContent>
                    <h2 className="text-2xl font-bold mb-4">Perfil de {profile?.user?.username}</h2>
                    <p><strong>Email:</strong> {profile?.user?.email}</p>
                    <p><strong>Registrado em:</strong> {new Date(profile?.user?.createdAt).toLocaleDateString()}</p>

                    <h3 className="text-xl font-bold mt-6">Histórico de Compras</h3>
                    {profile?.transactions.length ? (
                        profile.transactions.map((t, index) => (
                            <p key={index}><strong>{t.listing.url}</strong> - {t.listing.price} €</p>
                        ))
                    ) : <p>Nenhuma compra realizada.</p>}

                    <h3 className="text-xl font-bold mt-6">Avaliações Feitas</h3>
                    {profile?.reviews.length ? (
                        profile.reviews.map((r, index) => (
                            <p key={index}><strong>{r.listing.url}</strong> - {r.rating}⭐ - "{r.comment}"</p>
                        ))
                    ) : <p>Nenhuma avaliação feita.</p>}

                    {/* Botão de Voltar para a Página Principal */}
                    <div className="mt-6">
                        <Button className="bg-blue-500 text-white" onClick={() => navigate("/")}>
                            🔙 Voltar à Página Principal</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ProfilePage;