import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyDbKqMHP_MBhtVpQgj2oJqf1uWOm2WCUhA",
    authDomain: "zenith-time-ca820.firebaseapp.com",
    projectId: "zenith-time-ca820",
    storageBucket: "zenith-time-ca820.appspot.com",
    messagingSenderId: "630876970980",
    appId: "1:630876970980:web:14e4854fae913bef37f1f1",
    measurementId: "G-Z9H7GRH4BX"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

// IMPORTANT: analytics only works in production with https
getAnalytics(app);


// 🔥 TEST FIRESTORE
import { collection, getDocs } from "firebase/firestore";

(async () => {
    try {
        console.log("🔥 Testing Firestore connection...");
        const snap = await getDocs(collection(db, "users"));
        console.log("🔥 Firestore connected. Users:", snap.size);
    } catch (err) {
        console.error("❌ Firestore test failed:", err);
    }
})();