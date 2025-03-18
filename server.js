import dotenv from 'dotenv';
import mongoose from 'mongoose';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import multer from 'multer';
import path from 'path';
import fetch from 'node-fetch';
import morgan from 'morgan';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { Server } from "socket.io";
import http from 'http';
import Listing from './src/models/Listing.js';
import User from './src/models/User.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB ligado'))
    .catch(err => console.error('❌ Erro ao ligar o MongoDB:', err));

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = http.createServer(app); // Criar um servidor HTTP
const io = new Server(server, {
  cors: { origin: "*" },
});

let messages = []; // Array para armazenar mensagens temporariamente

io.on("connection", (socket) => {
  console.log("Novo utilizador ligado!");

  /// Enviar mensagens armazenadas para o utilizador conectado
  socket.emit("loadMessages", messages);

  // Receber e armazenar novas mensagens
  socket.on("sendMessage", (data) => {
    messages.push(data); // Guardar mensagem no array (pode ser guardado na base de dados mais tarde)
    io.emit("receiveMessage", data); // Enviar mensagem a todos os utilizadores ligados
  });

  socket.on("disconnect", () => {
    console.log("Utilizador desligado");
  });
});

// Configurações do Express
app.use(express.json());
app.use(morgan('dev')); // Monitoriza pedidos no console

// CORS Seguro
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'], // ✅ Garante que "Authorization" é permitido
    credentials: true,
}));

// Segurança com Helmet
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            imgSrc: ["'self'", "http://localhost:5000", "http://localhost:3000"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
        },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// Limitar os pedidos para evitar ataques DDoS
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Demasiados pedidos. Tente novamente mais tarde."
});
app.use(limiter);

// Middleware de autenticação JWT
const authenticateToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; 
    if (!token) return res.status(401).json({ error: "Acesso negado" });

    jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: "Token inválido" });
        req.user = user;
        next();
    });
};

// Middleware para verificar se o utilizador é admin
const isAdmin = async (req, res, next) => {
    try {
        const user = await User.findOne({ email: req.user.email });
        if (!user || user.role !== "admin") {
            return res.status(403).json({ error: "Acesso negado. Apenas os administradores podem aceder." });
        }
        next();
    } catch (error) {
        res.status(500).json({ error: "Erro ao verificar privilégios." });
    }
};

// ✅ Listar todos os utilizadores (apenas admin)
app.get("/api/admin/users", authenticateToken, isAdmin, async (req, res) => {
    try {
        const users = await User.find({}, "username email role createdAt");
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: "Erro ao procurar utilizadores." });
    }
});

// // ✅ Eliminar utilizador (apenas para admin)
app.delete("/api/admin/users/:id", authenticateToken, isAdmin, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ error: "Utilizador não encontrado." });
        res.json({ message: "Utilizador eliminado com sucesso." });
    } catch (error) {
        res.status(500).json({ error: "Erro ao apagar o utilizador." });
    }
});

// ✅ Eliminar listagem (apenas para admin)
app.delete("/api/admin/listings/:id", authenticateToken, isAdmin, async (req, res) => {
    try {
        const listing = await Listing.findByIdAndDelete(req.params.id);
        if (!listing) return res.status(404).json({ error: "Listagem não encontrada." });
        res.json({ message: "Listagem removida com sucesso." });
    } catch (error) {
        res.status(500).json({ error: "Erro ao remover listagem." });
    }
});

// Middleware de validação de input (Proteção extra)
const validateInput = (req, res, next) => {
    const { username, email, password, identifier } = req.body;
    if (username && !/^[a-zA-Z0-9_]{3,20}$/.test(username)) return res.status(400).json({ error: "Username inválido" });
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Email inválido" });
    if (password && password.length < 6) return res.status(400).json({ error: "A password deve ter pelo menos 6 caracteres." });
    if (identifier && identifier.length < 3) return res.status(400).json({ error: "Identificador inválido." });
    next();
};

// Armazenamento de imagens com limite de tamanho (5MB)
const storage = multer.diskStorage({
    destination: path.join(__dirname, "uploads"),
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// ✅ Registo do utilizador com reCAPTCHA e validação
app.post('/api/register', validateInput, async (req, res) => {
    const { username, email, password, token } = req.body;

    // Verifica reCAPTCHA
    const response = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET}&response=${token}`, {
        method: 'POST',
    });
    const data = await response.json();
    if (!data.success) return res.status(400).json({ error: "A verificação do reCAPTCHA falhou" });

    // Verifica se o email ou username já existem
    const existingUser  = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser ) return res.status(400).json({ error: "Utilizador já registrado" });

    // Cria um novo utilizador com papel padrão "user"
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser  = new User({ username, email, password: hashedPassword, role: "user" }); // Papel padrão "user"
    await newUser .save();
    res.status(201).json({ message: "Utilizador registado com sucesso" });
});

// Pode executar isto num script separado ou em um endpoint protegido
const updateAdminRole = async (email) => {
    try {
        await User.updateOne({ email }, { role: "admin" });
        console.log(`Função de utilizador ${email} atualizado para admin.`);
    } catch (error) {
        console.error("Erro ao atualizar o função do utilizador:", error);
    }
};

// ✅ Login do utilizador
app.post('/api/login', validateInput, async (req, res) => {
    const { identifier, password } = req.body;
    const user = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] });

    if (!user) return res.status(401).json({ error: "Utilizador não encontrado" });

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return res.status(401).json({ error: "Password incorreta" });

    // 🔹 Adiciona role no token
    const token = jwt.sign(
        { email: user.email, username: user.username, role: user.role }, 
        process.env.SECRET_KEY, 
        { expiresIn: "1h" }
    );

    res.json({ message: "Login bem-sucedido!", token });
});


// ✅ Criar listagem com paginação
app.post("/api/listings", authenticateToken, upload.single("image"), async (req, res) => {
    const { url, price, description } = req.body;
    if (!url || !price || !description) return res.status(400).json({ error: "Todos os campos são obrigatórios" });

    try {
        const listing = new Listing({
            url,
            price: parseFloat(price),
            description,
            image: req.file ? `/uploads/${req.file.filename}` : null,
            owner: req.user.email,
        });
        await listing.save();
        res.status(201).json(listing);
    } catch (error) {
        res.status(500).json({ error: "Erro ao guardar a listagem" });
    }
});

// Serve ficheiros estáticos da pasta 'uploads'
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Obter listagens com paginação
app.get("/api/listings", async (req, res) => {
    let { search, sort, page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    let query = {};
    if (search) query.$or = [{ url: new RegExp(search, "i") }, { description: new RegExp(search, "i") }];

    let sortOption = {};
    if (sort === "price_asc") {
        sortOption = { price: 1 }; // Ordem crescente
    } else if (sort === "price_desc") {
        sortOption = { price: -1 }; // Ordem decrescente
    }

    try {
        let listings = await Listing.find(query)
            .sort(sortOption) // Aplica a ordenação correta
            .skip((page - 1) * limit)
            .limit(limit);

        res.json(listings);
    } catch (error) {
        res.status(500).json({ error: "Erro ao obter listagens" });
    }
});

// ✅ Validação de token
app.get("/api/validate-token", (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(200).json({ valid: false });
    }

    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ valid: false });
        res.json({ valid: true });
    });
});

// Middleware para tratamento de erros
app.use((err, req, res, next) => {
    res.status(500).json({ error: "Erro interno do servidor." });
});

// Inicializa o servidor
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Servidor a correr na porta ${PORT}`));