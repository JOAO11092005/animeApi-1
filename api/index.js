// 1. Importar as bibliotecas
const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors'); 

// 2. Inicializar o Express
const app = express();

// 3. Inicializar o Firebase Admin (CRÍTICO: Tratamento de erro explícito)
let db;

try {
  if (!admin.apps.length) {
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    
    if (!serviceAccountString) {
        throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON está ausente. Verifique os Secrets do Vercel.");
    }

    const serviceAccount = JSON.parse(serviceAccountString); 
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
  // Se a inicialização for bem-sucedida, obtenha o Firestore
  db = admin.firestore();
  console.log("Firebase Admin SDK inicializado com sucesso.");

} catch (e) {
  console.error('ERRO CRÍTICO: Falha ao inicializar Firebase Admin:', e.message);
  db = null; 
}


// 4. Configurar os Middlewares
app.use(cors({ origin: '*' })); 
app.use(express.json());


// Middleware de verificação de DB (CRÍTICO)
app.use((req, res, next) => {
    if (!db) {
        console.error("Tentativa de acessar rota com DB não inicializado.");
        return res.status(500).json({ 
            message: "Erro interno: Serviço de banco de dados indisponível.",
            details: "Verifique os logs do Vercel para SyntaxError no JSON do Firebase Secret."
        });
    }
    next();
});


// --- 5. ROTAS (ENDPOINTS) DA API ---

// Rota Raiz (Vercel padrão)
app.get('/', (req, res) => {
  res.send('API de Animes Maxplay está funcionando! Use /api/animes para a lista.');
});


// Endpoint para listar todos os ANIMES
app.get('/animes', async (req, res) => {
  try {
    // A coleção que buscamos (confirme o nome no seu Firestore)
    const animesRef = db.collection('animes'); 
    const snapshot = await animesRef.get();

    if (snapshot.empty) {
      return res.status(200).json([]);
    }

    const animesList = [];
    snapshot.forEach(doc => {
      animesList.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.status(200).json(animesList);
  } catch (error) {
    console.error("Erro ao buscar animes:", error); 
    // CORREÇÃO: RETORNA O ERRO DETALHADO PARA O USUÁRIO VER
    res.status(500).json({ 
        message: 'Erro interno do servidor ao buscar animes.',
        details: error.message // <--- AGORA VEREMOS O ERRO REAL (e.g., "Permission denied")
    }); 
  }
});

// Endpoint para buscar um ANIME por ID
app.get('/animes/:id', async (req, res) => {
  try {
    const animeId = req.params.id;
    const docRef = db.collection('animes').doc(animeId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'Anime não encontrado.' });
    }

    res.status(200).json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error("Erro ao buscar anime por ID:", error);
    res.status(500).json({ 
        message: 'Erro interno do servidor ao buscar detalhes.',
        details: error.message 
    }); 
  }
});

// 6. EXPORTAR O APP PARA A VERCEL
module.exports = app;