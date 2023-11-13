// Import the functions you need from the SDKs you need
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import {getDatabase, ref, set, onValue} from "firebase/database";
// const dotenv = require('dotenv')
import {API_KEY, AUTH_DOMAIN, DATABASE_URL, PROJECT_ID, STORAGE_BUCKET,
    MESSAGING_SENDER_ID, APP_ID, MEASUREMENT_ID} from "$env/static/private";




const firebaseConfig = {
  apiKey: API_KEY,
  authDomain: AUTH_DOMAIN,
  databaseURL: DATABASE_URL,
  projectId: PROJECT_ID,
  storageBucket: STORAGE_BUCKET,
  messagingSenderId: MESSAGING_SENDER_ID,
  appId:APP_ID,
  measurementId:MEASUREMENT_ID
};

// // Initialize Firebase
const app = initializeApp(firebaseConfig);
// // const analytics = getAnalytics(app);
function writeUserData(userId, password){
  const db = getDatabase();
  const reference = ref(db, 'users/'+ userId);
  
  set(reference,{
  password:password

});
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
        const  {dataform } = await request.json();
        console.log('dataform from frontend:', dataform);
    //   console.log('Received password from frontend:', password);
  
      // Other processing logic...
  
      // Send a success response
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
  