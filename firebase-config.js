import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  projectId: "tienda-amanda-2026",
  appId: "1:422574930162:web:593de3a41eaf9eb8d3b86b",
  storageBucket: "tienda-amanda-2026.firebasestorage.app",
  apiKey: "AIzaSyAfTqKXUTJpSCFqpz100QmvM9XfpE6l__c",
  authDomain: "tienda-amanda-2026.firebaseapp.com",
  messagingSenderId: "422574930162",
  projectNumber: "422574930162"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
