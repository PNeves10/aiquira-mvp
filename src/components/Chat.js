import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { io } from "socket.io-client";
import Notifications from "./Notifications.js"; // Importar notificações

const socket = io("http://localhost:5000");

const Chat = ({ user }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [notification, setNotification] = useState(""); // Estado para notificação
    const messagesEndRef = useRef(null);

    useEffect(() => {
        socket.on("loadMessages", (msgs) => setMessages(msgs)); // Carregar mensagens ao conectar
        socket.on("receiveMessage", (msg) => setMessages((prev) => [...prev, msg])); // Receber novas mensagens

        // Escutar notificações de novas mensagens
        socket.on("newMessageNotification", (notificationMessage) => {
            setNotification(notificationMessage); // Atualiza o estado da notificação
        });

        return () => {
            socket.off("loadMessages");
            socket.off("receiveMessage");
            socket.off("newMessageNotification"); // Limpar o listener
        };
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); // Rolagem automática para a última mensagem
    }, [messages]);

    const sendMessage = () => {
        if (newMessage.trim() === "") return;

        const messageData = {
            sender: user.username || user.email, // Use username ou email como fallback
            text: newMessage,
            timestamp: new Date().toLocaleTimeString(),
        };

        socket.emit("sendMessage", messageData); // Enviar mensagem para o servidor
        setNewMessage(""); // Limpar campo de texto
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border rounded-lg shadow-lg p-4 w-full max-w-md bg-white">
            {notification && <Notifications message={notification} onClose={() => setNotification("")} />} {/* Exibe a notificação */}
            <h2 className="text-lg font-bold mb-2">Chat</h2>
            <div className="h-60 overflow-y-auto border p-2 bg-gray-100 rounded-lg">
                {messages.map((msg, index) => (
                    <motion.p key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className={`p-2 my-1 rounded-lg ${msg.sender === (user.username || user.email) ? "bg-blue-500 text-white text-right" : "bg-gray-200 text-gray-800 text-left"}`}>
                        <strong>{msg.sender}:</strong> {msg.text} <small className="block text-xs opacity-70">({msg.timestamp})</small>
                    </motion.p>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div className="flex mt-2">
                <input
                    type="text"
                    placeholder="Escreva uma mensagem..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-grow border rounded-l-lg p-2"
                />
                <button onClick={sendMessage} className="bg-blue-500 text-white rounded-r-lg p-2">Enviar</button>
            </div>
        </motion.div>
    );
};

export default Chat;