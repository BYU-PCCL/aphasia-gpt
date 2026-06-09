import { ASSEMBLYAI_API_KEY } from "$env/static/private";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async () => {
  // Universal-Streaming (v3) temporary token. `expires_in_seconds` is the
  // redemption window for the token (1-600s); the session itself can run up to
  // `max_session_duration_seconds` (default 3 hours) once started.
  const expiresInSeconds = 600;

  const params = new URLSearchParams({
    expires_in_seconds: String(expiresInSeconds),
  });

  const response = await fetch(
    `https://streaming.assemblyai.com/v3/token?${params.toString()}`,
    {
      method: "GET",
      headers: {
        authorization: ASSEMBLYAI_API_KEY,
      },
    }
  );

  if (response.ok) {
    // Response shape: { token: string, expires_in_seconds: number }
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
