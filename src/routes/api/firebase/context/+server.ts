if (!import.meta.env.SSR) {
  throw new Error("This module can only be imported on the server side.");
}
import { FIREBASE_API_KEY, FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL } from '$env/static/private';
import { CONVERSATION_TYPE_OPTIONS, DEFAULT_CONVERSATION_TYPE, DEFAULT_SETTING, DEFAULT_TONE, SETTING_OPTIONS, TONE_OPTIONS } from "@/lib/constants";
import type { RequestHandler } from "./../$types";
import { error } from "@sveltejs/kit";
import admin from "firebase-admin";
import type { ContextDbPutRequest, ContextDbData, ContextDbPutResponse } from '@/lib/types/Context';

admin.database.enableLogging(true);
const serviceAccount = {
  project_id: FIREBASE_PROJECT_ID,
  private_key: FIREBASE_API_KEY.replace(/\\n/g, '\n'),
  client_email: FIREBASE_CLIENT_EMAIL
}

if(!admin.apps.length){
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    databaseURL: "https://brocas-userdb-default-rtdb.firebaseio.com"
  });
} // TODO: refactor this to use a single instance of admin? Idk if that matters or what the best practice is

function getContextRef(username: string) {
  const db = admin.database();
  const ref = db.ref('users');
  const usersRef = ref.child(username);
  const contextRef = usersRef.child("context");

  // Create the context property if it doesn't exist
  contextRef.once("value", (snapshot) => {
    if (!snapshot.exists()) {
      contextRef.set({});
    }
  });
  
  return contextRef;
}

/**
 * Get the conversational context for the given user
 */
export const GET: RequestHandler = async (req) => {
  const username = req.url.searchParams.get('username');
  if (!username) {
    throw error(400, "Username is required");
  }

  const contextRef = getContextRef(username);
  const contextSnapshot = await contextRef.get();
  const context: ContextDbData = contextSnapshot.val();

  return new Response(
    JSON.stringify(context),
    {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    },
  );
}

/**
 * Create or reset the default conversational context options/selection for the given user
 */
export const POST: RequestHandler = async ({ request }) => {
  const { username } = await request.json();
  if (!username || username === "") {
    throw error(400, "Username is required");
  }

  const contextRef = getContextRef(username);
  const context: ContextDbData = {
    setting: {
      options: SETTING_OPTIONS,
      selection: DEFAULT_SETTING,
    },
    type: {
      options: CONVERSATION_TYPE_OPTIONS,
      selection: DEFAULT_CONVERSATION_TYPE,
    },
    tone: {
      options: TONE_OPTIONS,
      selection: DEFAULT_TONE,
    },
  };
  contextRef.set(context);

  return new Response(
    JSON.stringify(context),
    {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    },
  );
}

/**
 * Update the conversational context for the given user
 */
export const PUT: RequestHandler = async ({ request }) => {
  const requestParams: ContextDbPutRequest = await request.json();
  
  const contextRef = getContextRef(requestParams.username).child(requestParams.contextTitle);
  contextRef.set({
    options: requestParams.options,
    selection: requestParams.selection,
  } as ContextDbPutResponse);

  return new Response(
    JSON.stringify({
      options: requestParams.options,
      selection: requestParams.selection,
    }),
    {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    },
  );
}