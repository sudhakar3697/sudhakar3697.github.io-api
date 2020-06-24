const express = require('express')
const cors = require('cors');
const helmet = require('helmet');
const firebase = require('firebase');
require('firebase/firestore');
require('dotenv').config();

const firebaseConfig = {
  apiKey: process.env.API_KEY,
  authDomain: process.env.AUTH_DOMAIN,
  databaseURL: process.env.DATABASE_URL,
  projectId: process.env.PROJECT_ID,
  storageBucket: process.env.STORAGE_BUCKET,
  messagingSenderId: process.env.MESSAGING_SENDER_ID,
  appId: process.env.APP_ID
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const docRef = db.collection('clips').doc('OC');

async function get() {
  try {
    const doc = await docRef.get();
    return doc.data().content;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

async function update(value) {
  try {
    await docRef.set({
      content: value || ''
    });
    return true;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

const PORT = process.env.PORT || 5000

const app = express();

const corsOptions = {
  origin: 'https://sudhakar3697.github.io',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/oc-data', async (req, res) => {
  res.send(await get());
});

app.put('/api/oc-data', async (req, res) => {
  res.send(await update(req.body.data));
});

app.listen(PORT, () => {
  console.log(`Our Clipboard API is listening at http://localhost:${PORT}`);
});
