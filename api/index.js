// Importações necessárias
const admin = require('firebase-admin');
const express = require('express');
const app = express();

// --- FIREBASE ADMIN INITIALIZATION (Executado uma única vez) ---
const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

if (!admin.apps.length) {
    try {
        if (!serviceAccountString) {
            // Se a variável estiver ausente, lançamos um erro claro para os logs do Vercel
            throw new Error("Variável FIREBASE_SERVICE_ACCOUNT_JSON está ausente. Verifique os Secrets do Vercel.");
        }
        
        // Converte a string JSON (do Secret do Vercel) em um objeto JavaScript
        const serviceAccount = JSON.parse(serviceAccountString);

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });

        console.log("Firebase Admin inicializado com credenciais seguras.");
    } catch (error) {
        console.error("ERRO CRÍTICO: Falha ao inicializar o Firebase Admin.", error);
        // Lançar um erro aqui garante que o Vercel capture a falha no log de invocação.
        throw new Error("Credenciais do Firebase Admin inválidas ou erro de Parse JSON. Detalhe: " + error.message);
    }
}

// Obtém a instância do Firestore
const db = admin.firestore();

// --- API MIDDLEWARE (CORS) ---

// Permite que seu frontend (em qualquer domínio) acesse esta API
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});

// --- API ROUTES ---

// 1. Endpoint para listar todos os animes
// Rota esperada: /api/animes
app.get('/api/animes', async (req, res) => {
    try {
        const animesRef = db.collection('animes');
        const snapshot = await animesRef.get();

        if (snapshot.empty) {
            return res.status(200).json([]);
        }

        const animes = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.status(200).json(animes);
    } catch (error) {
        console.error("Erro ao buscar a lista de animes:", error);
        res.status(500).json({ 
            error: "Erro interno do servidor ao buscar dados.",
            details: error.message 
        });
    }
});

// 2. Endpoint para buscar um anime por ID
// Rota esperada: /api/animes/:id
app.get('/api/animes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const animeDoc = await db.collection('animes').doc(id).get();

        if (!animeDoc.exists) {
            return res.status(404).json({ error: "Anime não encontrado." });
        }

        res.status(200).json({ id: animeDoc.id, ...animeDoc.data() });
    } catch (error) {
        console.error(`Erro ao buscar anime ID ${req.params.id}:`, error);
        res.status(500).json({ 
            error: "Erro interno do servidor ao buscar detalhes.",
            details: error.message 
        });
    }
});


// Rota raiz (padrão do Vercel)
app.get('/', (req, res) => {
    res.status(200).send("API de Animes Maxplay está operacional. Use /api/animes para acessar os dados.");
});


// Exporta a aplicação Express para o Vercel
module.exports = app;