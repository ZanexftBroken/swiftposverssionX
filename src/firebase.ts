import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyC53tnpw-3Uupzc1Me8ZGEDzy903yG-S0Y", 
  authDomain: "ascedia-60dd4.firebaseapp.com", 
  databaseURL: "https://ascedia-60dd4-default-rtdb.asia-southeast1.firebasedatabase.app", 
  projectId: "ascedia-60dd4"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Enable offline persistence so the app works without internet
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === "failed-precondition") {
    // Multiple tabs open — persistence only works in one tab at a time
    console.warn("[SwiftPOS] Offline persistence unavailable: multiple tabs open");
  } else if (err.code === "unimplemented") {
    // Browser doesn't support persistence
    console.warn("[SwiftPOS] Offline persistence not supported in this browser");
  }
});

