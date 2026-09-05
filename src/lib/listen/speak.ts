/**
 * Speaks text aloud through the /api/tts endpoint. Only one utterance plays at
 * a time; starting a new one stops the previous. Recently spoken phrases are
 * cached so repeating a reply is instant.
 *
 * Browser-only.
 */

const CACHE_LIMIT = 24;
const cache = new Map<string, Blob>();
const inflight = new Map<string, Promise<Blob>>();
let current: { audio: HTMLAudioElement; url: string } | null = null;

const cacheKey = (text: string, voice: string) => `${voice}\u0000${text}`;

function fetchSpeech(text: string, voice: string): Promise<Blob> {
  const key = cacheKey(text, voice);
  const cached = cache.get(key);
  if (cached) {
    // Refresh insertion order so the entry stays "recent".
    cache.delete(key);
    cache.set(key, cached);
    return Promise.resolve(cached);
  }
  const pending = inflight.get(key);
  if (pending) return pending;

  const request = (async () => {
    const response = await fetch("/api/tts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text, voice }),
    });
    if (!response.ok) throw new Error("Could not generate speech.");
    const blob = await response.blob();
    cache.set(key, blob);
    if (cache.size > CACHE_LIMIT) {
      const oldest = cache.keys().next().value;
      if (oldest !== undefined) cache.delete(oldest);
    }
    return blob;
  })();
  inflight.set(key, request);
  request.catch(() => undefined).finally(() => inflight.delete(key));
  return request;
}

/**
 * Warm the cache so a later `speak()` of the same text starts instantly.
 * Failures are ignored; `speak()` will simply fetch again.
 */
export function prefetchSpeech(text: string, voice: string) {
  fetchSpeech(text, voice).catch(() => undefined);
}

/** Stop whatever is currently playing. */
export function stopSpeaking() {
  if (!current) return;
  const { audio, url } = current;
  current = null;
  audio.onended = audio.onerror = null;
  audio.pause();
  URL.revokeObjectURL(url);
}

/**
 * Speak `text` and resolve when playback finishes (or is interrupted).
 * Rejects only if speech could not be generated or started.
 */
export async function speak(text: string, voice: string, signal?: AbortSignal): Promise<void> {
  const blob = await fetchSpeech(text, voice);
  if (signal?.aborted) return;
  stopSpeaking();

  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  const entry = { audio, url };
  current = entry;

  await new Promise<void>((resolve, reject) => {
    const finish = () => {
      if (current === entry) {
        current = null;
        URL.revokeObjectURL(url);
      }
      resolve();
    };
    audio.onended = finish;
    audio.onerror = () => {
      finish();
      reject(new Error("Could not play speech."));
    };
    signal?.addEventListener("abort", () => {
      if (current === entry) stopSpeaking();
      resolve();
    });
    audio.play().catch((err) => {
      finish();
      reject(err);
    });
  });
}
