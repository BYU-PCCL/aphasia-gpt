import OpenAI from "openai";
import { OPENAI_API_KEY } from "$env/static/private";
import { env } from "$env/dynamic/private";
import { error, type RequestHandler } from "@sveltejs/kit";

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// `tts-1` has the lowest time-to-first-byte, which matters more than fidelity
// when a person is waiting to speak. `gpt-4o-mini-tts` is higher quality.
const TTS_MODEL = env.OPENAI_TTS_MODEL || "tts-1";

const VOICES = new Set([
  "alloy",
  "ash",
  "coral",
  "echo",
  "fable",
  "nova",
  "onyx",
  "sage",
  "shimmer",
]);
const MAX_CHARS = 500;

/**
 * POST /api/tts  { text: string, voice?: string }
 * Returns the spoken text as an MP3 body.
 */
export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text) throw error(400, "text is required");
  if (text.length > MAX_CHARS) throw error(400, `text must be at most ${MAX_CHARS} characters`);

  const requested = typeof body?.voice === "string" ? body.voice.toLowerCase() : "alloy";
  const voice = (VOICES.has(requested) ? requested : "alloy") as "alloy";

  const speech = await openai.audio.speech.create({
    model: TTS_MODEL,
    voice,
    input: text,
    response_format: "mp3",
  });

  return new Response(speech.body, {
    status: 200,
    headers: {
      "content-type": "audio/mpeg",
      "cache-control": "no-store",
    },
  });
};
