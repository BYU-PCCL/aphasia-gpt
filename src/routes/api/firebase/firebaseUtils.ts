import admin from "firebase-admin";
import type { Database } from "firebase-admin/lib/database/database";
import { FIREBASE_API_KEY, FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL } from "$env/static/private";

admin.database.enableLogging(true);
const serviceAccount = {
  project_id: FIREBASE_PROJECT_ID,
  private_key: FIREBASE_API_KEY.replace(/\\n/g, "\n"),
  client_email: FIREBASE_CLIENT_EMAIL,
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    databaseURL: "https://brocas-userdb-default-rtdb.firebaseio.com",
  });
}

export const database: Database = admin.database();

export function getUserRef(username: string) {
  const ref = database.ref("users");
  return ref.child(username);
}
