const express = require('express');
const router = express.Router();
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

router.get('/', async (req, res) => {
    res.send(await get());
});

router.put('/', async (req, res) => {
    res.send(await update(req.body.data));
});

module.exports = router;
