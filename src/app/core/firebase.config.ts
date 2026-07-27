import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';
import { environment } from '../../environments/environment';

// Initialisation de l'application Firebase globale avec notre configuration.
export const firebaseApp: FirebaseApp = initializeApp(environment.firebase);

// Base de données Firestore NoSQL temps réel
export const db: Firestore = getFirestore(firebaseApp);

// Service d'Authentification
export const auth: Auth = getAuth(firebaseApp);

// Analytics désactivé temporairement
export const analyticsPromise = Promise.resolve(null);
