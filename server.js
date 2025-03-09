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

const users = [];
let listings = [];
const SECRET_KEY = "supersecretkey";

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
    
    jwt.verify(token.split(' ')[1], SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ error: "Token inválido" });
        }
        req.user = user;
        next();
    });
};

// Middleware para registrar requisições
app.use((req, res, next) => {
    next();
});

// Middleware para registrar respostas
app.use((req, res, next) => {
    res.on('finish', () => {
        // Aqui você pode manter o log se quiser registrar as respostas
    });
    next();
});

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
app.post('/api/register', async (req, res) => {
    const { email, password, token } = req.body;

    // Verificar o token do reCAPTCHA
    const secretKey = '6Ld64esqAAAAALASav5rmBm_8HR-wEs3IQkLkm5X'; // Chave secreta do reCAPTCHA
    const response = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`, {
        method: 'POST',
    });
    const data = await response.json();

    if (!data.success) {
        return res.status(400).json({ error: "Falha na verificação do reCAPTCHA" });
    }

    if (!email || !password) {
        return res.status(400).json({ error: "Email e senha são obrigatórios" });
    }
    if (!isValidEmail(email)) {
        return res.status(400).json({ error: "Email inválido" });
    }
    if (!isValidPassword(password)) {
        return res.status(400).json({ error: "A senha deve ter pelo menos 6 caracteres, incluindo maiúscula, minúscula, número e caractere especial" });
    }
    
    const existingUser  = users.find((u) => u.email === email);
    if (existingUser ) {
        return res.status(400).json({ error: "Utilizador já registrado com este email" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    users.push({ email, password: hashedPassword });
    res.status(201).json({ message: "Utilizador registado com sucesso" });
});

// Login do utilizador
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if (!isValidEmail(email) || !isValidPassword(password)) {
        return res.status(400).json({ error: "Credenciais inválidas" });
    }
    
    const user = users.find((u) => u.email === email);
    if (!user) {
        return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
        return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const token = jwt.sign({ email: user.email }, SECRET_KEY, { expiresIn: "1h" });
    res.json({ token });
});

// Criar listagem com imagem (Apenas autenticados)
app.post("/api/listings", authenticateToken, upload.single("image"), (req, res) => {
    let { url, price, description } = req.body;
    if (!url || !price || !description) {
        return res.status(400).json({ error: "Todos os campos são obrigatórios" });
    }

    const newListing = {
        id: listings.length + 1,
        url,
        price: parseFloat(price), // Converte o preço para número
        description,
        image: req.file ? `/uploads/${req.file.filename}` : null,
        owner: req.user.email,
    };

    listings.push(newListing);
    res.status(201).json(newListing);
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
app.get("/api/listings", (req, res) => { 

    let { search, sort } = req.query;
    let filteredListings = [...listings];

    if (search) {
        search = search.toLowerCase();
        filteredListings = filteredListings.filter(
            (listing) =>
                listing.url.toLowerCase().includes(search) ||
                listing.description.toLowerCase().includes(search)
        );
    }

    if (sort === "price_asc") {
        filteredListings.sort((a, b) => a.price - b.price);
    } else if (sort === "price_desc") {
        filteredListings.sort((a, b) => b.price - a.price);
    }
    res.json(filteredListings);
});


// Nova rota para validar o token
app.get("/api/validate-token", authenticateToken, (req, res) => {
    res.json({ valid: true });
});

// Middleware para tratamento de erros
app.use((err, req, res, next) => {
    res.status(500).json({ error: 'Algo deu errado!' }); // Retorna um JSON
});

// Iniciar o servidor
const PORT = process.env.PORT || 5000; 
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});