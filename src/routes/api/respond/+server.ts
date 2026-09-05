import OpenAI from "openai";
import type { ChatCompletionCreateParamsStreaming } from "openai/resources/chat/completions";
import { OPENAI_API_KEY } from "$env/static/private";
import { env } from "$env/dynamic/private";
import { json, type RequestHandler } from "@sveltejs/kit";
import type { RespondRequest, RespondStreamEvent } from "@/lib/listen/types";
import { parseOptionLine } from "@/lib/listen/parseOption";

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// gpt-4.1-mini gives sub-second time-to-first-token and is plenty capable for
// short conversational suggestions. Override with OPENAI_RESPONSE_MODEL.
const MODEL = env.OPENAI_RESPONSE_MODEL || "gpt-4.1-mini";

const DEFAULT_COUNT = 5;
const MAX_COUNT = 8;
/** Only the most recent turns are sent, to bound latency and cost. */
const MAX_HISTORY_TURNS = 16;
const MAX_TURN_CHARS = 600;
const MAX_ABOUT_CHARS = 1500;

/**
 * Static system prompt. Kept byte-identical across requests (all per-request
 * data goes in the user message) so OpenAI prompt caching can match the prefix.
 * The wording follows the research team's draft for "Listening Aphasia-GPT".
 */
const SYSTEM_PROMPT = `You are an AAC (augmentative and alternative communication) assistant for a person with aphasia. The device listens to the person's conversation partner and offers things the person might want to say next. The person taps one option and the device speaks it aloud for them.

Analyze the ongoing conversation and generate the requested number of possible responses that the AAC user might want to say next.

Rules:
- Write every response in the user's own first-person voice, exactly as it will be spoken aloud.
- Responses must be natural, conversational, and brief: 1 to 20 words.
- Include a variety of communication functions: answering, asking a question, commenting, expressing an opinion, or changing the topic.
- Do not assume the user's intended response. When the partner asked a question, cover genuinely different answers (for example both yes and no, or different choices).
- Include only contextually relevant information from the user's profile. Never force profile details in, and never invent facts about the user.
- Match the register of the conversation and the setting. If a tone preference is given, lean toward it without making every option sound the same.
- If the conversation has not started yet, offer natural openers and greetings.
- If the user spoke last, offer natural follow-ups or additions to what they just said.
- Never repeat an option that appears in the "Do not repeat" list.
- Do not ask the user for clarification. Do not explain. Present only the response options.

Output format: exactly one option per line, each line as KIND: text. KIND must be one of ANSWER, QUESTION, COMMENT, OPINION, TOPIC. No numbering, no quotes, no blank lines, nothing else.

Example
Profile: Name: Marilee. Age: 68. About: Retired. Lives alone. Does family history research and visits her nieces and nephews. Loves Indian and Mexican food.
Setting: church. Tone: casual.
Conversation:
Partner: Hey Marilee! How was your week? Did you end up going to see your sister?
Options wanted: 5
ANSWER: It was good, thanks. Yes, I saw her on Saturday.
ANSWER: Pretty quiet. I didn't make it to my sister's this time.
QUESTION: How was your week?
COMMENT: I spent most of it on family history.
TOPIC: Are you staying for the potluck after?`;

function buildUserMessage(body: RespondRequest, count: number): string {
  const profile = body.profile ?? { name: "", age: null, about: "" };
  const profileParts: string[] = [];
  if (profile.name?.trim()) profileParts.push(`Name: ${profile.name.trim()}.`);
  if (profile.age && Number.isFinite(profile.age) && profile.age > 0) {
    profileParts.push(`Age: ${Math.round(profile.age)}.`);
  }
  if (profile.about?.trim()) {
    profileParts.push(`About: ${profile.about.trim().slice(0, MAX_ABOUT_CHARS)}`);
  }
  const profileLine = profileParts.length ? profileParts.join(" ") : "(no profile provided)";

  const history = (body.history ?? [])
    .filter((turn) => turn && typeof turn.text === "string" && turn.text.trim())
    .slice(-MAX_HISTORY_TURNS)
    .map(
      (turn) =>
        `${turn.speaker === "user" ? "User" : "Partner"}: ${turn.text.trim().slice(0, MAX_TURN_CHARS)}`,
    );
  const conversation = history.length
    ? history.join("\n")
    : "(the conversation has not started yet)";

  const exclude = (body.exclude ?? []).filter((s) => typeof s === "string" && s.trim()).slice(-20);

  const lines = [
    `Profile: ${profileLine}`,
    `Setting: ${body.setting?.trim() || "unspecified"}. Tone: ${body.tone?.trim() || "unspecified"}.`,
    "Conversation:",
    conversation,
  ];
  if (exclude.length) {
    lines.push("Do not repeat:");
    lines.push(...exclude.map((s) => `- ${s.trim()}`));
  }
  lines.push(`Options wanted: ${count}`);
  return lines.join("\n");
}

/**
 * POST /api/respond
 * Streams suggested responses as NDJSON (one `RespondStreamEvent` per line) so
 * the UI can show each option the moment the model finishes writing it.
 */
export const POST: RequestHandler = async ({ request }) => {
  const body = (await request.json().catch(() => null)) as RespondRequest | null;
  if (!body || !Array.isArray(body.history)) {
    return json({ error: "Invalid request body" }, { status: 400 });
  }
  const count = Math.min(MAX_COUNT, Math.max(1, Math.round(body.count ?? DEFAULT_COUNT)));
  const userMessage = buildUserMessage(body, count);

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: RespondStreamEvent) =>
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));

      const seen = new Set<string>();
      let emitted = 0;
      let buffer = "";

      const flushLine = (line: string) => {
        if (emitted >= count) return;
        const parsed = parseOptionLine(line);
        if (!parsed) return;
        const key = parsed.text.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        emitted++;
        emit({
          type: "option",
          option: { id: `${Date.now().toString(36)}-${emitted}`, ...parsed },
        });
      };

      try {
        // `prompt_cache_key` routes requests sharing this prefix to the same
        // cache node. It postdates the installed SDK's types, hence the cast.
        const params: ChatCompletionCreateParamsStreaming & { prompt_cache_key?: string } = {
          model: MODEL,
          stream: true,
          temperature: 0.9,
          max_tokens: 60 * count,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userMessage },
          ],
          prompt_cache_key: "aphasia-listen-v1",
        };
        const completion = await openai.chat.completions.create(params, {
          signal: request.signal,
        });

        for await (const chunk of completion) {
          const delta = chunk.choices?.[0]?.delta?.content;
          if (!delta) continue;
          buffer += delta;
          let newline = buffer.indexOf("\n");
          while (newline !== -1) {
            flushLine(buffer.slice(0, newline));
            buffer = buffer.slice(newline + 1);
            newline = buffer.indexOf("\n");
          }
          if (emitted >= count) break;
        }
        if (buffer.trim()) flushLine(buffer);
        emit({ type: "done" });
      } catch (err) {
        if (!request.signal.aborted) {
          console.error("/api/respond failed:", err);
          emit({ type: "error", message: "Could not generate responses." });
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store",
      // Disable proxy buffering so options arrive as they are produced.
      "x-accel-buffering": "no",
    },
  });
};
