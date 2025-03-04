import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import sanitizeHtml from 'sanitize-html';

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());

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
    
    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: "Token inválido" });
        req.user = user;
        next();
    });
};

// Registar utilizador com validação
app.post('/api/register', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password || password.length < 6) {
        return res.status(400).json({ error: "Email válido e senha com pelo menos 6 caracteres são obrigatórios" });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    users.push({ email, password: hashedPassword });
    res.status(201).json({ message: "Utilizador registado com sucesso" });
});

// Login do utilizador
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const user = users.find((u) => u.email === email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: "Credenciais inválidas" });
    }
    
    const token = jwt.sign({ email: user.email }, SECRET_KEY, { expiresIn: "1h" });
    res.json({ token });
});

// Criar listagem (Apenas autenticados) com sanitização
app.post('/api/listings', authenticateToken, (req, res) => {
    let { url, price, description } = req.body;
    if (!url || !price || !description) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }
    
    // Sanitização de inputs
    url = sanitizeHtml(url);
    price = sanitizeHtml(price);
    description = sanitizeHtml(description);
    
    const newListing = { id: listings.length + 1, url, price, description, owner: req.user.email };
    listings.push(newListing);
    res.status(201).json(newListing);
});

// Obter todas as listagens
app.get('/api/listings', (req, res) => {
    res.json(listings);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});