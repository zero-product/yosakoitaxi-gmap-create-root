import app from './firebase-init';
import { getFirestore } from "firebase/firestore";

const firestore = getFirestore(app)
export default firestore;