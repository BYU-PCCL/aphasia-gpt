

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

function EditUserData(username: string, name: string, age: string, about: string){
const db = admin.database();
const ref = db.ref('users');
const usersRef = ref.child(username);

const userData = {
name: name,
age: age,
about: about
}
usersRef.set(userData);
}


export const GET: RequestHandler = async () => {
console.log("this is a test");
return json(
{
status: 200,
}
);
};

export const POST: RequestHandler = async ({ request }) => {
console.log("fire base is called");
try {
const {username, name, age, about} = await request.json();
console.log('username from frontend:', username);
console.log('name from frontend:', name);
console.log('age from frontend:', age);
console.log('about from frontend:', about);
EditUserData(username, name, age, about);
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