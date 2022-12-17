import app from './firebase-init'
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const auth = getAuth(app)

const login = async () => {
  try {
    const email     = import.meta.env.VITE_FIREBASE_EMAIL
    const password  = import.meta.env.VITE_FIREBASE_PASSWORD
    return await signInWithEmailAndPassword(auth, email, password)
  } catch(e) {
    console.error(e)
  }
};

const logout = async () => {
  try {
    return await signOut(auth)
  } catch(e) {
    console.error(e)
  }
};

export { login, logout }