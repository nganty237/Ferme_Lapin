import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';
import { environment } from '../../environments/environment';

// Initialisation de l'application Firebase globale avec notre configuration.
export const firebaseApp: FirebaseApp = initializeApp(environment.firebase);

let _db: Firestore | null = null;
let _auth: Auth | null = null;

// Base de données Firestore NoSQL temps réel — instanciée à la demande.
export function getDb(): Firestore {
  if (_db === null) {
    _db = getFirestore(firebaseApp);
  }
  return _db;
}

// Service d'Authentification — instancié à la demande.
export function getAuthLazy(): Auth {
  if (_auth === null) {
    _auth = getAuth(firebaseApp);
  }
  return _auth;
}

// Ré-exports nommés `db`/`auth` pour compatibilité avec les services
// existants qui les importent directement.
export const db: Firestore = new Proxy({} as Firestore, {
  get(_t, prop) {
    return Reflect.get(getDb() as object, prop);
  }
});

export const auth: Auth = new Proxy({} as Auth, {
  get(_t, prop) {
    return Reflect.get(getAuthLazy() as object, prop);
  }
});

// Analytics désactivé temporairement
export const analyticsPromise = Promise.resolve(null);
