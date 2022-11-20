const express = require('express');
const router = express.Router();
const firebase = require('./firebase');
require('firebase/firestore');

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
