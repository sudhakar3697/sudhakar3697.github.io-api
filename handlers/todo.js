const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const firebase = require('./firebase');
require('firebase/firestore');
require('dotenv').config();

const db = firebase.firestore();
const docRefToDo = db.collection('todos').doc('TD');

async function getToDoItems() {
    try {
        const doc = await docRefToDo.get();
        return doc.data().content;
    } catch (err) {
        console.log(err);
        throw err;
    }
}

async function updateToDoItems(value) {
    try {
        await docRefToDo.set({
            content: value || ''
        });
        return true;
    } catch (err) {
        console.log(err);
        throw err;
    }
}

const gClientId = '244780050095-9ccg4opqdf7eimdi36h1toi232la4ecv.apps.googleusercontent.com';

const authRequired = async (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        if (req.query.type === 'google') {
            const client = new OAuth2Client(gClientId);
            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: gClientId
            });
            const payload = ticket.getPayload();
            const userid = payload['sub'];
            if (userid === process.env.SECRET_GA) {
                req.user = payload;
                return next();
            }
            else {
                return res.sendStatus(403);
            }
        }
        else {
            const decoded = jwt.verify(token, process.env.SECRET_KEY);
            if (decoded.id === process.env.SECRET_KEY_U) {
                req.user = decoded;
                return next();
            } else {
                return res.sendStatus(403);
            }
        }
    } catch (err) {
        return res.sendStatus(401);
    }
};

router.post('/sign-in', async (req, res) => {
    try {
        const { id, password } = req.body;
        if (id === process.env.SECRET_KEY_U && password === process.env.SECRET_KEY_P) {
            const token = jwt.sign({ id }, process.env.SECRET_KEY);
            res.send(token);
        } else {
            res.status(403).send('Incorrect Username/Password');
        }
    } catch (err) {
        res.status(400).send(err.message);
    }
});

router.get('/', authRequired, async (req, res) => {
    res.send(await getToDoItems());
});

router.put('/', authRequired, async (req, res) => {
    res.send(await updateToDoItems(req.body.data));
});

module.exports = router;
