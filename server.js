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
import nodemailer from 'nodemailer';
import Stripe from 'stripe';
import Listing from './src/models/Listing.js';
import User from './src/models/User.js';
import Transaction from './src/models/Transaction.js';
import Review from './src/models/Review.js';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB ligado'))
    .catch(err => console.error('❌ Erro ao ligar o MongoDB:', err));

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" },
});

let messages = [];

io.on("connection", (socket) => {
    console.log("Novo utilizador ligado!");
    socket.emit("loadMessages", messages);

    socket.on("newUser ", (user) => {
        io.emit("adminNotification", `Novo utilizador registado: ${user.username}`);
    });

    socket.on("newListing", (listing) => {
        io.emit("adminNotification", `Nova listagem publicada: ${listing.url}`);
    });

    socket.on("sendMessage", async (data) => {
        messages.push(data);
        io.emit("receiveMessage", data);
        io.emit("newMessageNotification", `Nova mensagem de ${data.sender}: "${data.text}"`);
        io.emit("adminNotification", `Nova mensagem de ${data.sender}: "${data.text}"`);

        const recipient = await User.findOne({ username: data.receiver });
        if (recipient) {
            sendEmail(
                recipient.email,
                "📩 Nova mensagem no AIQuira",
                `Recebeu uma nova mensagem de ${data.sender}: "${data.text}"`,
                `<p><strong>${data.sender}</strong> enviou-lhe uma mensagem:</p><blockquote>${data.text}</blockquote>`
            );
        }
    });

    socket.on("disconnect", () => {
        console.log("Utilizador desligado");
    });
});

// Configurações do Express
app.use(express.json());
app.use(morgan('dev'));

app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));

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

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Demasiados pedidos. Tente novamente mais tarde."
});
app.use(limiter);

const authenticateToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Acesso negado" });

    jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: "Token inválido" });

        req.user = { ...user, _id: user._id || user.id };
        next();
    });
};

// Endpoint para obter perfil do usuário autenticado
app.get("/api/profile", authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password"); // Remover a senha
        if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

        // Buscar transações do usuário
        const transactions = await Transaction.find({ buyer: user._id }).populate("listing", "url price");

        // Buscar avaliações do usuário
        const reviews = await Review.find({ user: user._id }).populate("listing", "url");

        res.json({ user, transactions, reviews });
    } catch (error) {
        console.error("Erro ao carregar perfil:", error);
        res.status(500).json({ error: "Erro ao carregar perfil." });
    }
});

// Endpoint para obter estatísticas do proprietário
app.get("/api/my-stats", authenticateToken, async (req, res) => {
    try {
        const myListings = await Listing.find({ owner: req.user._id });

        const stats = myListings.map(listing => ({
            url: listing.url,
            views: listing.views,
            salesCount: listing.salesCount,
            rating: listing.rating || 0
        }));

        res.json(stats);
    } catch (error) {
        console.error("Erro ao obter estatísticas do proprietário:", error);
        res.status(500).json({ error: "Erro ao carregar estatísticas." });
    }
});

// Endpoint para obter estatísticas sobre listagens
app.get("/api/stats", async (req, res) => {
    try {
        const topSold = await Listing.find().sort({ salesCount: -1 }).limit(5);
        const topViewed = await Listing.find().sort({ views: -1 }).limit(5);
        const ratingDistribution = await Listing.aggregate([
            { $group: { _id: "$rating", count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            topSold,
            topViewed,
            ratingDistribution
        });
    } catch (error) {
        console.error("Erro ao obter estatísticas:", error);
        res.status(500).json({ error: "Erro ao carregar estatísticas." });
    }
});

// Endpoint para obter os websites mais vendidos, mais visualizados e mais bem avaliados
app.get("/api/top-websites", async (req, res) => {
    try {
        const topSold = await Listing.find().sort({ salesCount: -1 }).limit(10);
        const topViewed = await Listing.find().sort({ views: -1 }).limit(10);
        const topRated = await Listing.find().sort({ rating: -1 }).limit(10);

        res.json({
            topSold,
            topViewed,
            topRated
        });
    } catch (error) {
        console.error("Erro ao obter ranking de websites:", error);
        res.status(500).json({ error: "Erro ao carregar ranking." });
    }
});

// Endpoint para adicionar uma avaliação a uma listagem
app.post("/api/listings/:id/review", authenticateToken, async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const listing = await Listing.findById(req.params.id);
        if (!listing) return res.status(404).json({ error: "Website não encontrado." });

        // Verifica se o usuário já comprou esse site
        const transaction = await Transaction.findOne({ buyer: req.user._id, listing: listing._id });
        if (!transaction) return res.status(403).json({ error: "Apenas compradores podem avaliar." });

        // Adiciona a avaliação ao website
        listing.ratings.push({ user: req.user._id, rating, comment });
        await listing.save();

        // Recalcula a média de avaliações
        const reviews = await Review.find({ listing: listing._id });
        const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
        await Listing.findByIdAndUpdate(listing._id, { rating: avgRating });

        res.json({ message: "Avaliação enviada com sucesso!" });
    } catch (error) {
        console.error("Erro ao avaliar website:", error);
        res.status(500).json({ error: "Erro ao processar avaliação." });
    }
});

// Endpoint para obter avaliações de uma listagem
app.get("/api/listings/:id/reviews", async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id).populate("ratings.user", "username");
        if (!listing) return res.status(404).json({ error: "Website não encontrado." });

        res.json({ reviews: listing.ratings });
    } catch (error) {
        console.error("Erro ao buscar avaliações:", error);
        res.status(500).json({ error: "Erro ao carregar avaliações." });
    }
});

// Endpoint para responder avaliações
app.post("/api/listings/:listingId/reviews/:reviewIndex/respond", authenticateToken, async (req, res) => {
    try {
        const { responseText } = req.body;
        const { listingId, reviewIndex } = req.params;

        const listing = await Listing.findById(listingId).populate("owner");
        if (!listing) return res.status(404).json({ error: "Website não encontrado." });

        // Verifica se o usuário é o dono do website
        if (listing.owner._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: "Somente o vendedor pode responder avaliações." });
        }

        // Verifica se a avaliação existe
        if (!listing.ratings[reviewIndex]) {
            return res.status(404).json({ error: "Avaliação não encontrada." });
        }

        // Adiciona a resposta
        listing.ratings[reviewIndex].response = { text: responseText, date: new Date() };
        await listing.save();

        // Enviar notificação ao comprador
        await sendNotification(listing.ratings[reviewIndex].user, `📩 O vendedor respondeu sua avaliação em ${listing.url}`);

        res.json({ message: "Resposta enviada com sucesso!" });
    } catch (error) {
        console.error("Erro ao responder avaliação:", error);
        res.status(500).json({ error: "Erro ao processar resposta." });
    }
});

// Endpoint para registrar visualizações
app.post("/api/listings/:id/view", async (req, res) => {
    try {
        await Listing.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
        res.json({ message: "Visualização registrada!" });
    } catch (error) {
        res.status(500).json({ error: "Erro ao registrar visualização." });
    }
});

// Endpoint para checkout
app.post("/api/checkout", authenticateToken, async (req, res) => {
    const { listingId } = req.body;

    try {
        const listing = await Listing.findById(listingId);
        if (!listing) return res.status(404).json({ error: "Listagem não encontrada" });

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            success_url: `${process.env.FRONTEND_URL}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/checkout-cancel`,
            customer_email: req.user.email,
            line_items: [
                {
                    price_data: {
                        currency: "eur",
                        product_data: { name: listing.url },
                        unit_amount: listing.price * 100,
                    },
                    quantity: 1,
                },
            ],
            metadata: { listingId, buyerId: req.user._id, sellerId: listing.owner.toString() },
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error("Erro ao criar sessão de checkout:", error);
        res.status(500).json({ error: "Erro ao processar pagamento." });
    }
});

// Endpoint para confirmar pagamento
app.post("/api/confirm-payment", async (req, res) => {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: "ID da sessão não fornecido" });

    try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (!session) return res.status(404).json({ error: "Sessão não encontrada" });

        // Atualiza o status da transação para "concluído"
        await Transaction.findOneAndUpdate(
            { listing: session.metadata.listingId, buyer: session.metadata.buyerId },
            { status: "concluído" }
        );

        // Incrementa o contador de vendas da listagem
        await Listing.findByIdAndUpdate(session.metadata.listingId, { $inc: { salesCount: 1 } });

        res.json({ success: true, message: "Pagamento confirmado!" });
    } catch (error) {
        console.error("Erro ao confirmar pagamento:", error);
        res.status(500).json({ error: "Erro ao confirmar pagamento." });
    }
});

// Endpoint do webhook do Stripe
app.post("/api/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error("Erro no webhook:", err);
        return res.status(400).json({ error: "Webhook inválido" });
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object;

        await Transaction.findOneAndUpdate(
            { listing: session.metadata.listingId, buyer: session.metadata.buyerId },
            { status: "concluído" }
        );

        console.log("✅ Pagamento concluído e transação registada!");
    }

    if (event.type === "checkout.session.expired") {
        const session = event.data.object;

        await Transaction.findOneAndUpdate(
            { listing: session.metadata.listingId, buyer: session.metadata.buyerId },
            { status: "cancelado" }
        );

        console.log("❌ Pagamento cancelado.");
    }

    res.json({ received: true });
});

// Endpoint para verificar se o email já existe
app.get("/api/check-email", async (req, res) => {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: "Email não fornecido." });

    const user = await User.findOne({ email });
    if (user) {
        return res.json({ exists: true });
    } else {
        return res.json({ exists: false });
    }
});

// Endpoint para verificar se o nome de utilizador já existe
app.get("/api/check-username", async (req, res) => {
    const { username } = req.query;
    if (!username) return res.status(400).json({ error: "Username não fornecido." });

    const user = await User.findOne({ username });
    if (user) {
        return res.json({ exists: true });
    } else {
        return res.json({ exists: false });
    }
});

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

// ✅ Eliminar utilizador (apenas para admin)
app.delete("/api/admin/users/:id", authenticateToken, isAdmin, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ error: "Utilizador não encontrado." });
        res.json({ message: "Utilizador eliminado com sucesso." });
    } catch (error) {
        res.status(500).json({ error: "Erro ao apagar o utilizador." });
    }
});

// ✅ Adicionar ou remover favorito
app.post("/api/favorites/:listingId", authenticateToken, async (req, res) => {
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ error: "Utilizador não encontrado" });

    const listingId = req.params.listingId;

    const isFavorited = user.favorites.includes(listingId);

    if (isFavorited) {
        user.favorites = user.favorites.filter((id) => id.toString() !== listingId);
    } else {
        user.favorites.push(listingId);
    }

    await user.save();
    res.json({ success: true, favorites: user.favorites });
});

// ✅ Obter favoritos do utilizador
app.get("/api/favorites", authenticateToken, async (req, res) => {
    const user = await User.findOne({ email: req.user.email }).populate("favorites");
    if (!user) return res.status(404).json({ error: "Utilizador não encontrado" });

    res.json(user.favorites);
});

// Middleware de validação de input
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

// Configuração do Nodemailer
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Função para enviar email
const sendEmail = async (to, subject, text, html) => {
    try {
        await transporter.sendMail({
            from: `AIQuira <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html,
        });
        console.log(`📩 Email enviado para ${to}`);
    } catch (error) {
        console.error("❌ Erro ao enviar email:", error);
    }
};

// ✅ Registo do utilizador com reCAPTCHA e validação
app.post('/api/register', validateInput, async (req, res) => {
    const { username, email, password, token } = req.body;

    const response = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET}&response=${token}`, {
        method: 'POST',
    });
    const data = await response.json();
    if (!data.success) return res.status(400).json({ error: "A verificação do reCAPTCHA falhou" });

    const existingUser  = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser ) return res.status(400).json({ error: "Utilizador já registrado" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser  = new User({ username, email, password: hashedPassword, role: "user" });
    await newUser .save();

    const subject = "Bem-vindo ao AIQuira!";
    const text = `Olá ${username},\n\nObrigado por se registrar no AIQuira!`;
    const html = `<h1>Bem-vindo ao AIQuira!</h1><p>Olá ${username},</p><p>Obrigado por se registrar no AIQuira!</p>`;
    await sendEmail(email, subject, text, html);

    io.emit("newUser ", { username });

    res.status(201).json({ message: "Utilizador registado com sucesso" });
});

// ✅ Login do utilizador
app.post('/api/login', validateInput, async (req, res) => {
    const { identifier, password } = req.body;
    const user = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] });

    if (!user) return res.status(401).json({ error: "Utilizador não encontrado" });

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return res.status(401).json({ error: "Password incorreta" });

    const token = jwt.sign(
        { email: user.email, username: user.username, role: user.role, id: user._id },
        process.env.SECRET_KEY,
        { expiresIn: "1h" }
    );

    res.json({ message: "Login bem-sucedido!", token });
});

// Serve ficheiros estáticos da pasta 'uploads'
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Obter listagens com paginação
app.post("/api/listings", authenticateToken, upload.single("image"), async (req, res) => {
    const { url, price, description } = req.body;
    if (!url || !price || !description) {
        return res.status(400).json({ error: "Todos os campos são obrigatórios" });
    }

    try {
        const listing = new Listing({
            url,
            price: parseFloat(price),
            description,
            image: req.file ? `/uploads/${req.file.filename}` : null,
            owner: req.user._id,
        });
        await listing.save();

        await sendEmail(req.user.email, "Website listado com sucesso!", `Seu website ${url} foi publicado.`);

        io.emit("newListing", { url });

        res.status(201).json(listing);
    } catch (error) {
        console.error("❌ Erro ao criar listagem:", error);
        res.status(500).json({ error: "Erro ao guardar a listagem." });
    }
});

// ✅ Obter listagens com pesquisa e ordenação
app.get("/api/listings", async (req, res) => {
    let { search, sort, minRating, page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    minRating = parseFloat(minRating);

    let query = {};
    if (search) {
        query.$or = [
            { url: new RegExp(search, "i") },
            { description: new RegExp(search, "i") }
        ];
    }

    if (!isNaN(minRating)) {
        query.rating = { $gte: minRating };
    }

    let sortOption = {};
    if (sort === "price_asc") {
        sortOption = { price: 1 };
    } else if (sort === "price_desc") {
        sortOption = { price: -1 };
    } else if (sort === "rating_desc") {
        sortOption = { rating: -1 };
    }

    try {
        let listings = await Listing.find(query)
            .sort(sortOption)
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('owner', 'username email');

        res.json(listings);
    } catch (error) {
        console.error("❌ Erro ao obter listagens:", error);
        res.status(500).json({ error: "Erro ao obter listagens." });
    }
});

// Eliminar listagem (apenas para admin)
app.delete("/api/admin/listings/:id", authenticateToken, isAdmin, async (req, res) => {
    try {
        const listing = await Listing.findByIdAndDelete(req.params.id);
        if (!listing) return res.status(404).json({ error: "Listagem não encontrada." });

        res.json({ message: "Listagem eliminada com sucesso." });
    } catch (error) {
        console.error("❌ Erro ao eliminar listagem:", error);
        res.status(500).json({ error: "Erro ao eliminar a listagem." });
    }
});

// ✅ Criar uma nova transação após compra
app.post("/api/transactions", authenticateToken, async (req, res) => {
    const { listingId, sellerId, amount } = req.body;
    if (!listingId || !sellerId || !amount) {
        return res.status(400).json({ error: "Dados incompletos." });
    }

    try {
        const transaction = new Transaction({
            buyer: req.user._id,
            seller: sellerId,
            listing: listingId,
            amount,
            status: 'pendente',
        });

        await transaction.save();
        res.status(201).json({ message: "Transação registada!", transaction });

        io.emit("adminNotification", `📢 Nova transação registada!`);
    } catch (error) {
        res.status(500).json({ error: "Erro ao criar transação." });
    }
});

// ✅ Histórico de compras do utilizador autenticado
app.get("/api/transactions/buyer", authenticateToken, async (req, res) => {
    try {
        const transactions = await Transaction.find({ buyer: req.user._id })
            .populate('listing', 'url price')
            .populate('seller', 'username email');
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: "Erro ao obter compras." });
    }
});

// ✅ Histórico de vendas do utilizador autenticado
app.get("/api/transactions/seller", authenticateToken, async (req, res) => {
    try {
        const transactions = await Transaction.find({ seller: req.user._id })
            .populate('listing', 'url price')
            .populate('buyer', 'username email');
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: "Erro ao obter vendas." });
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