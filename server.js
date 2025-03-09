import dotenv from 'dotenv'; // Importando dotenv
import mongoose from 'mongoose'; // Importando o mongoose
import express from 'express';
import cors from 'cors'; // Importando o cors
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet'; // Importando helmet
import multer from "multer"; // Importando multer
import path from "path"; // Importando path
import fetch from 'node-fetch'; // Importando node-fetch
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import Listing from './Listing.js'; // Importando o modelo Listing
import User from './src/models/User.js'; // Importando o modelo User

// Carregar variáveis de ambiente do arquivo .env
dotenv.config();

// Conectar ao MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB conectado'))
    .catch(err => console.error('Erro ao conectar MongoDB:', err));

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());

// Configuração do CORS
app.use(cors({
    origin: 'http://localhost:3000', // Permite requisições do frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // Permite o uso de cookies e autenticação via CORS
}));

// Configuração do Helmet com CSP personalizada
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            imgSrc: ["'self'", "http://localhost:5000", "http://localhost:3000"], // Permite imagens do backend e do frontend
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"], // Permite estilos inline
        },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Permite recursos de origens cruzadas
}));

// Rota para a raiz
app.get("/", (req, res) => {
    res.send("API funcionando!");
});

// Configuração do armazenamento de imagens
const storage = multer.diskStorage({
    destination: path.join(__dirname, "uploads"), // Pasta onde as imagens serão salvas
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Nome único para cada imagem
    },
});

const upload = multer({ storage });

// Limite de requisições para evitar ataques DDoS
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Máximo de 100 requisições por IP
    message: "Muitas requisições. Tente novamente mais tarde."
});
app.use(limiter);

// Middleware para autenticar JWT
const authenticateToken = (req, res, next) => {
    const token = req.headers["authorization"];
    if (!token) return res.status(401).json({ error: "Acesso negado" });
    
    jwt.verify(token.split(' ')[1], process.env.SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ error: "Token inválido" });
        }
        req.user = user;
        next();
    });
};

// Função de validação de email
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Função de validação de senha
const isValidPassword = (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*_])[A-Za-z\d!@#$%^&*_]{6,}$/;
    return passwordRegex.test(password);
};

// Registar utilizador com validação
// Registar utilizador com validação
app.post('/api/register', async (req, res) => {
    const { username, email, password, token } = req.body; // Alterado para username, email, password

    // Verificar o token do reCAPTCHA
    const response = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET}&response=${token}`, {
        method: 'POST',
    });
    const data = await response.json();

    if (!data.success) {
        return res.status(400).json({ error: "Falha na verificação do reCAPTCHA" });
    }

    // Validações
    if (!username || !email || !password) { // Verifique se o username, email e password estão presentes
        return res.status(400).json({ error: "Username, email e senha são obrigatórios" });
    }
    if (!isValidEmail(email)) {
        return res.status(400).json({ error: "Email inválido" });
    }
    if (!isValidPassword(password)) {
        return res.status(400).json({ error: "A senha deve ter pelo menos 6 caracteres, incluindo maiúscula, minúscula, número e caractere especial." });
    }

    // Verifique se o username já existe
    try {
        const existingEmailUser  = await User.findOne({ email });
        if (existingEmailUser ) {
            return res.status(400).json({ error: "Utilizador já registrado com este email" });
        }

        const existingUsernameUser  = await User.findOne({ username }); // Verifique se o username já existe
        if (existingUsernameUser ) {
            return res.status(400).json({ error: "Utilizador já está em uso" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser  = new User({ username, email, password: hashedPassword }); // Salve o username
        await newUser .save(); // Salva o novo usuário no MongoDB
        res.status(201).json({ message: "Utilizador registado com sucesso" });
    } catch (error) {
        res.status(500).json({ error: "Erro ao registrar usuário" });
    }
});

// Login do utilizador
// Login do utilizador
app.post('/api/login', async (req, res) => {
    const { identifier, password } = req.body; // identifier pode ser username ou email

    if (!identifier || !isValidPassword(password)) {
        return res.status(400).json({ error: "Credenciais inválidas" });
    }

    try {
        // Verifique se o identifier é um email ou username
        const user = await User.findOne({
            $or: [
                { email: identifier },
                { username: identifier }
            ]
        });

        if (!user) return res.status(401).json({ error: "Email ou username não encontrado" });

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) return res.status(401).json({ error: "Senha incorreta" });

        const token = jwt.sign({ email: user.email, username: user.username }, process.env.SECRET_KEY, { expiresIn: "1h" });
        res.json({ message: "Login bem-sucedido!", token });
    } catch (error) {
        res.status(500).json({ error: "Erro ao fazer login" });
    }
});

// Criar listagem com imagem (Apenas autenticados)
app.post("/api/listings", authenticateToken, upload.single("image"), async (req, res) => {
    let { url, price, description } = req.body;
    if (!url || !price || !description) {
        return res.status(400).json({ error: "Todos os campos são obrigatórios" });
    }

    const newListing = {
        url,
        price: parseFloat(price), // Converte o preço para número
        description,
        image: req.file ? `/uploads/${req.file.filename}` : null,
        owner: req.user.email,
    };

    // Salvar a nova listagem no MongoDB
    try {
        const listing = new Listing(newListing);
        await listing.save();
        res.status(201).json(listing);
    } catch (error) {
        res.status(500).json({ error: "Erro ao salvar a listagem" });
    }
});

// Serve arquivos estáticos da pasta 'uploads' com CORS
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    setHeaders: (res) => {
        res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000"); // Permite acesso do frontend
        res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin"); // Evita bloqueio do navegador
    }
}));

// Rota para servir imagens específicas, se necessário
app.get('/uploads/:filename', (req, res) => {
    const filePath = path.join(__dirname, 'uploads', req.params.filename);
    
    res.setHeader("Access-Control-Allow-Origin", "*"); // Permite qualquer frontend acessar
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    res.sendFile(filePath, (err) => {
        if (err) {
            res.status(404).json({ error: "Imagem não encontrada" });
        }
    });
});

// Obter todas as listagens com filtragem e ordenação
app.get("/api/listings", async (req, res) => { 
    let { search, sort } = req.query;
    let query = {};

    if (search) {
        query = {
            $or: [
                { url: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ]
        };
    }

    try {
        let listings = await Listing.find(query);

        if (sort === "price_asc") {
            listings.sort((a, b) => a.price - b.price);
        } else if (sort === "price_desc") {
            listings.sort((a, b) => b.price - a.price);
        }

        res.json(listings);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar listagens" });
    }
});

// Nova rota para validar o token
app.get("/api/validate-token", authenticateToken, (req, res) => {
    res.json({ valid: true });
});

// Middleware para tratamento de erros
app.use((err, req, res, next) => {
    console.error(err.stack); // Log para debug
    res.status(500).json({ error: "Ocorreu um erro interno no servidor. Tente novamente mais tarde." });
});

// Iniciar o servidor
const PORT = process.env.PORT || 5000; 
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});