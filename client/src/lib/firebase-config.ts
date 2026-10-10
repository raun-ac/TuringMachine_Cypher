import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAMiVk60pTMQnyZrhd2eFib8YfF_P3njFc",
  authDomain: "antigravity-5edd9.firebaseapp.com",
  projectId: "antigravity-5edd9",
  storageBucket: "antigravity-5edd9.firebasestorage.app",
  messagingSenderId: "431235291699",
  appId: "1:431235291699:web:5bc6150ade256bea382146",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
