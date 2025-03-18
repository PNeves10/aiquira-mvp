import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000"); // Conecta ao backend

const Chat = ({ user }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    socket.on("loadMessages", (msgs) => setMessages(msgs)); // Carregar mensagens ao conectar
    socket.on("receiveMessage", (msg) => setMessages((prev) => [...prev, msg])); // Receber novas mensagens

    return () => {
      socket.off("loadMessages");
      socket.off("receiveMessage");
    };
  }, []);

  const sendMessage = () => {
    if (newMessage.trim() === "") return;

    const messageData = {
      user: user.email,
      text: newMessage,
      timestamp: new Date().toLocaleTimeString(),
    };

    socket.emit("sendMessage", messageData); // Enviar mensagem para o servidor
    setNewMessage(""); // Limpar campo de texto
  };

  return (
    <div className="border p-4 w-full max-w-md">
      <h2 className="text-lg font-bold">Chat</h2>
      <div className="h-48 overflow-y-auto border p-2">
        {messages.map((msg, index) => (
          <p key={index} className={msg.user === user.email ? "text-blue-500" : "text-gray-700"}>
            <strong>{msg.user}:</strong> {msg.text} <small>({msg.timestamp})</small>
          </p>
        ))}
      </div>
      <input
        type="text"
        placeholder="Escreva uma mensagem..."
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        className="border p-2 w-full mt-2"
      />
      <button onClick={sendMessage} className="bg-blue-500 text-white p-2 mt-2 w-full">
        Enviar
      </button>
    </div>
  );
};

export default Chat;
