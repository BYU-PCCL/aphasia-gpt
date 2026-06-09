import { ASSEMBLYAI_API_KEY } from "$env/static/private";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async () => {
  const expiresInSeconds = 3600;

  console.log("Wingate adding debug info");
  
  const response = await fetch("https://api.assemblyai.com/v2/realtime/token", {
    method: "POST",
    headers: {
      authorization: ASSEMBLYAI_API_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      expires_in: expiresInSeconds,
    }),
  });

  console.log("AA Response was ok");

  if (response.ok) {
    return json(await response.json());
  }

  console.log("Response was NOT ok");
  console.log(response);

  return json(
    { error: "Failed to get token" },
    {
      status: response.status,
    }
  );
};
