const firebase = require('firebase/app');
require('dotenv').config();

class Firebase {
    constructor() {
        const firebaseConfig = {
            apiKey: process.env.API_KEY,
            authDomain: process.env.AUTH_DOMAIN,
            databaseURL: process.env.DATABASE_URL,
            projectId: process.env.PROJECT_ID,
            storageBucket: process.env.STORAGE_BUCKET,
            messagingSenderId: process.env.MESSAGING_SENDER_ID,
            appId: process.env.APP_ID
        };
        
        this.app = firebase.initializeApp(firebaseConfig);
    }
}

module.exports = new Firebase().app;
