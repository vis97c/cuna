import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

export const functionsFirebaseApp = initializeApp();
export const functionsFirestore = getFirestore(functionsFirebaseApp);
export const functionsStorage = getStorage();
