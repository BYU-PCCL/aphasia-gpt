

import {ASSEMBLYAI_API_KEY } from '$env/static/private';
// Import the functions you need from the SDKs you need
if (!import.meta.env.SSR) {
throw new Error("This module can only be imported on the server side.");
}
import { FIREBASE_API_KEY, FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL } from '$env/static/private';

import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
// import 'server-only'
import admin from "firebase-admin";
import {GlobalVars} from "@/stores/user";

// this creates a dictionary from a string that's read from a run-time environment variable
//import FIREBASE_JSON_STRING from '$env/static/private';
admin.database.enableLogging(true);

let serviceAccount = {
  
  project_id: FIREBASE_PROJECT_ID,
  private_key: FIREBASE_API_KEY.replace(/\\n/g, '\n'),
  client_email: FIREBASE_CLIENT_EMAIL
  
  
}

if(!admin.apps.length){
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    databaseURL: "https://brocas-userdb-default-rtdb.firebaseio.com"
    });
}

async function getUserData(username: string, password:string) {
    const db = admin.database();
    const ref = db.ref('users');
    const usersRef = ref.child(username);

    try {
        const snapshot = await usersRef.once('value');
        const userData = snapshot.val();

        if (userData && userData.password) {
            // Password found, return it
            return userData.password;
        } else {
            // User or password not found
            return null;
        }
    } catch (error) {
        // Handle any errors
        console.error("Error fetching user data:", error);
        throw error;
    }
}

export const POST: RequestHandler = async ({ request }) => {
try {
const {username, password} = await request.json();
console.log('username from frontend:', username);
console.log('password from frontend:', password);
getUserData(username, password);
return json({
status: 200,
body: { message: 'Data received successfully.' },
});
} catch (error) {
console.error('Error processing request:', error);
return json({
status: 500,
body: { error: 'hi Server Error' },
});
}
};



