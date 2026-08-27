import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyBdIG4dYntDLfNQ59Tp_8KtdvAH7kt6ai0",
    authDomain: "don-dario-2026.firebaseapp.com",
    projectId: "don-dario-2026",
    storageBucket: "don-dario-2026.firebasestorage.app",
    messagingSenderId: "872653981691",
    appId: "1:872653981691:web:714983cc3be4db2f45ed5e"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
