import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { environment } from '../../environments/environment';

// Initialisation de l'application Firebase globale avec notre configuration
export const firebaseApp = initializeApp(environment.firebase);

// Base de données Firestore NoSQL temps réel
export const db = getFirestore(firebaseApp);

// Service d'Authentification
export const auth = getAuth(firebaseApp);

// Analytics désactivé temporairement — la clé API n'est pas autorisée pour
// les services Analytics/Installations. À réactiver après configuration dans
// la console Firebase (Analytics activé + restrictions de clé API assouplies).
export const analyticsPromise = Promise.resolve(null);
