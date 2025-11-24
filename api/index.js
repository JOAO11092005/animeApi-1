// 1. Importar as bibliotecas
const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors'); // Importe o cors

// 2. Inicializar o Express
const app = express();

// 3. Inicializar o Firebase Admin (MODO VERCEL)
try {
  if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
} catch (e) {
  console.error('Falha ao inicializar Firebase Admin:', e);
}

const db = admin.firestore();

// 4. Configurar os Middlewares
// --- CORREÇÃO APLICADA AQUI ---
app.use(cors({ origin: '*' })); // Habilita o CORS para permitir acesso de qualquer site
app.use(express.json());

// --- 5. ROTAS (ENDPOINTS) DA API ---

app.get('/', (req, res) => {
  res.send('API de Séries está funcionando!');
});

app.get('/series', async (req, res) => {
  try {
    const seriesRef = db.collection('series');
    const snapshot = await seriesRef.get();

    if (snapshot.empty) {
      return res.status(404).json({ message: 'Nenhuma série encontrada.' });
    }

    const seriesList = [];
    snapshot.forEach(doc => {
      seriesList.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.status(200).json(seriesList);
  } catch (error) {
    console.error("Erro ao buscar séries:", error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

app.get('/series/:id', async (req, res) => {
  try {
    const seriesId = req.params.id;
    const docRef = db.collection('series').doc(seriesId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'Série não encontrada.' });
    }

    res.status(200).json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error("Erro ao buscar série por ID:", error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

// 6. EXPORTAR O APP PARA A VERCEL
module.exports = app;
