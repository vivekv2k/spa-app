import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDH1kVRuTALGVmc--OFycAIhYza5lqdYp8",
    authDomain: "employee-internal-app.firebaseapp.com",
    projectId: "employee-internal-app",
    storageBucket: "employee-internal-app.firebasestorage.app",
    messagingSenderId: "75924399759",
    appId: "1:75924399759:web:0b95bd2be9c16359ff72fa"
};

// const firebaseConfig = {
//     apiKey: "AIzaSyAzcS4eKLTadKZ2ayAdu8M8UZiPYjbfzjw",
//     authDomain: "spa-ceylon-2.firebaseapp.com",
//     projectId: "spa-ceylon-2",
//     storageBucket: "spa-ceylon-2.appspot.com",
//     messagingSenderId: "802973073470",
//     appId: "1:1:802973073470:web:7cc79af5c2c3083acc116f"
// };

// Initialize Firebase
let app;
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApps()[0];  // Use existing initialized app
}

// Initialize Firestore
const firestore = getFirestore(app);

// Initialize Firebase Auth with AsyncStorage for persistence
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
});

// Initialize Firebase Storage
const storage = getStorage(app);

export { firestore, auth, app, storage };
