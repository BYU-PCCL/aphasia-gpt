if (!import.meta.env.SSR) {
  throw new Error("This module can only be imported on the server side.");
}
import {
  CONVERSATION_TYPE_OPTIONS,
  DEFAULT_CONVERSATION_TYPE,
  DEFAULT_SETTING,
  DEFAULT_TONE,
  SETTING_OPTIONS,
  TONE_OPTIONS,
} from "@/lib/constants";
import type { RequestHandler } from "./../$types";
import { error } from "@sveltejs/kit";
import type { ContextDbPutRequest, ContextDbData, ContextDbPutResponse } from "@/lib/types/Context";
import { getUserRef } from "../firebaseUtils";

function getContextRef(username: string) {
  return getUserRef(username).child("context");
}

/**
 * Get the conversational context for the given user
 */
export const GET: RequestHandler = async (req) => {
  const username = req.url.searchParams.get("username");
  if (!username || username === "") {
    throw error(400, "Username is required");
  }

  const contextRef = getContextRef(username);
  const contextSnapshot = await contextRef.get();
  const context: ContextDbData = contextSnapshot.val();

  return new Response(JSON.stringify(context), {
    status: 200,
    headers: {
      "content-type": "application/json",
    },
  });
};

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

  return new Response(JSON.stringify(context), {
    status: 200,
    headers: {
      "content-type": "application/json",
    },
  });
};

/**
 * Update the conversational context for the given user
 */
export const PUT: RequestHandler = async ({ request }) => {
  const requestParams: ContextDbPutRequest = await request.json();

  const specificContextRef = getContextRef(requestParams.username).child(
    requestParams.contextTitle
  );
  specificContextRef.set({
    options: requestParams.options,
    selection: requestParams.selection,
  });

  return new Response(
    JSON.stringify({
      options: requestParams.options,
      selection: requestParams.selection,
    } as ContextDbPutResponse),
    {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    }
  );
};