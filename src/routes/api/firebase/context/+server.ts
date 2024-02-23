if (!import.meta.env.SSR) {
  throw new Error("This module can only be imported on the server side.");
}
import type { RequestHandler } from "./../$types";
import { error } from "@sveltejs/kit";
import { getDefaultContextDbData } from "@/lib/utils/getDefaultContextDbData";
import type { ContextDbData, ContextDbPutRequest, ContextDbPutResponse } from "@/lib/types/Context";
import { getUserRef } from "../firebaseUtils";

function getContextRef(uid: string) {
  return getUserRef(uid).child("context");
}

/**
 * Get the conversational context for the given user
 */
export const GET: RequestHandler = async (req) => {
  const uid = req.url.searchParams.get("uid");
  if (!uid || uid === "") {
    throw error(400, "UID is required");
  }

  const contextRef = getContextRef(uid);
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
  const { uid } = await request.json();
  if (!uid || uid === "") {
    throw error(400, "UID is required");
  }

  const contextRef = getContextRef(uid);
  const context: ContextDbData = getDefaultContextDbData();
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

  const specificContextRef = getContextRef(requestParams.uid).child(requestParams.contextTitle);
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