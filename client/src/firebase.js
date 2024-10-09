import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyB4wuTIK0TZ30DY0qLkNv8T0h_E1gulukY",
    authDomain: "codecollaborati.firebaseapp.com",
    projectId: "codecollaborati",
    storageBucket: "codecollaborati.appspot.com",
    messagingSenderId: "765809972964",
    appId: "1:765809972964:web:c7c22ada3291839eb4bef1",
    measurementId: "G-HJVM1BSY5M"
  };
  
  const firebaseApp = initializeApp(firebaseConfig);

  const db = getFirestore(firebaseApp);
  const analytics = getAnalytics(firebaseApp);
  
  export { db };