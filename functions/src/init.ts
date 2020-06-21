import * as admin from "firebase-admin";
import { serviceAccount } from './service-account';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as any),
  databaseURL: "https://fir-course-496de.firebaseio.com",
});
export const db = admin.firestore();
