/**
 * Reactive state for one "Listen" conversation: what the partner said, what
 * the user said, and the suggested replies. Built with Svelte 5 runes so the
 * page can bind to it directly.
 *
 * Browser-only.
 */

import { PartnerTranscriber, type TranscriberState } from "./transcriber";
import { prefetchSpeech, speak, stopSpeaking } from "./speak";
import type { RespondRequest, RespondStreamEvent, ResponseOption, Speaker, Turn } from "./types";

export interface SessionContext {
  profile: { name: string; age: number | null; about: string };
  setting: string;
  tone: string;
  voice: string;
}

/** How long to keep the mic muted after the device finishes speaking. */
const UNMUTE_DELAY_MS = 300;
/**
 * AssemblyAI closes a turn after ~1.3 s of silence, so a partner who pauses
 * mid-thought produces several short turns. A turn that starts within this
 * many ms of the previous partner turn ending is appended to it instead.
 */
const PARTNER_MERGE_WINDOW_MS = 3000;
const OPTION_COUNT = 5;

let idCounter = 0;
const nextId = () => `${Date.now().toString(36)}-${(idCounter++).toString(36)}`;

export class ListenSession {
  turns = $state<Turn[]>([]);
  /** The partner's in-progress utterance (not yet a turn). */
  liveText = $state("");
  options = $state<ResponseOption[]>([]);
  phase = $state<TranscriberState>("idle");
  isGenerating = $state(false);
  /** Text currently being spoken aloud, if any. */
  speaking = $state<string | null>(null);
  error = $state<string | null>(null);

  lastSpeaker = $derived<Speaker | null>(this.turns.at(-1)?.speaker ?? null);
  isListening = $derived(this.phase === "listening");

  private transcriber: PartnerTranscriber | null = null;
  private suggestAbort: AbortController | null = null;
  private speakAbort: AbortController | null = null;
  private unmuteTimer: ReturnType<typeof setTimeout> | null = null;
  /** When the partner's current (interim) turn first produced text. */
  private liveStartedAt: number | null = null;
  /** Options shown since the last conversation change; excluded from "more". */
  private offered: string[] = [];

  constructor(private readonly getContext: () => SessionContext) {}

  // ---- listening -----------------------------------------------------------

  async start() {
    if (this.transcriber) return;
    this.error = null;
    const name = this.getContext().profile.name?.trim();
    this.transcriber = new PartnerTranscriber(
      {
        onTurn: ({ text, final }) => {
          if (final) {
            const startedAt = this.liveStartedAt ?? Date.now();
            this.liveStartedAt = null;
            this.liveText = "";
            this.commitPartnerSpeech(text, startedAt);
            void this.suggest();
          } else {
            this.liveStartedAt ??= Date.now();
            this.liveText = text;
          }
        },
        onStateChange: (state) => {
          this.phase = state;
          if (state === "idle") {
            this.transcriber = null;
            this.liveText = "";
            this.liveStartedAt = null;
          }
        },
        onError: (message) => {
          this.error = message;
        },
      },
      { mode: "balanced", keyterms: name ? [name] : [] },
    );
    await this.transcriber.start();
  }

  async stop() {
    const transcriber = this.transcriber;
    if (!transcriber) return;
    await transcriber.stop();
  }

  toggleListening() {
    return this.transcriber ? this.stop() : this.start();
  }

  /** The partner is done: close the current turn now instead of waiting for silence. */
  finishPartnerTurn() {
    this.transcriber?.forceEndOfTurn();
  }

  // ---- conversation --------------------------------------------------------

  /** Add something the partner said (typed, or corrected) and get suggestions. */
  addPartnerText(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    this.commitTurn("partner", trimmed);
    void this.suggest();
  }

  setSpeaker(id: string, speaker: Speaker) {
    const turn = this.turns.find((t) => t.id === id);
    if (turn && turn.speaker !== speaker) {
      turn.speaker = speaker;
      this.offered = [];
    }
  }

  removeTurn(id: string) {
    this.turns = this.turns.filter((t) => t.id !== id);
    this.offered = [];
  }

  clearConversation() {
    this.cancelSuggest();
    this.cancelSpeech();
    this.turns = [];
    this.liveText = "";
    this.options = [];
    this.offered = [];
    this.error = null;
  }

  /** Plain-text transcript, one line per turn. */
  transcriptText(): string {
    const name = this.getContext().profile.name?.trim() || "User";
    return this.turns
      .map((turn) => {
        const time = new Date(turn.at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        const who = turn.speaker === "user" ? name : "Partner";
        return `[${time}] ${who}: ${turn.text}`;
      })
      .join("\n");
  }

  // ---- speaking ------------------------------------------------------------

  /** Say a suggested option: speak it and record it as the user's turn. */
  async choose(option: ResponseOption) {
    this.cancelSuggest();
    this.options = [];
    this.offered = [];
    this.commitTurn("user", option.text);
    await this.say(option.text);
  }

  /** Say free text typed by the user. */
  async sayCustom(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    this.cancelSuggest();
    this.options = [];
    this.offered = [];
    this.commitTurn("user", trimmed);
    await this.say(trimmed);
  }

  /** Speak text aloud without adding a turn (e.g. repeating an earlier reply). */
  async say(text: string) {
    this.cancelSpeech();
    const controller = new AbortController();
    this.speakAbort = controller;
    this.speaking = text;
    // Mute the mic so the device's own voice is not transcribed as the partner.
    this.transcriber?.setMuted(true);
    try {
      await speak(text, this.getContext().voice, controller.signal);
    } catch (err) {
      if (!controller.signal.aborted) {
        this.error = err instanceof Error ? err.message : "Could not speak.";
      }
    } finally {
      if (this.speakAbort === controller) {
        this.speakAbort = null;
        this.speaking = null;
        this.unmuteTimer = setTimeout(() => {
          this.transcriber?.setMuted(false);
          this.unmuteTimer = null;
        }, UNMUTE_DELAY_MS);
      }
    }
  }

  cancelSpeech() {
    if (this.unmuteTimer) {
      clearTimeout(this.unmuteTimer);
      this.unmuteTimer = null;
    }
    this.speakAbort?.abort();
    this.speakAbort = null;
    stopSpeaking();
    this.speaking = null;
    this.transcriber?.setMuted(false);
  }

  // ---- suggestions ---------------------------------------------------------

  /** Ask for a fresh set of options that avoids the ones already shown. */
  more() {
    return this.suggest({ keepCurrent: true });
  }

  cancelSuggest() {
    this.suggestAbort?.abort();
    this.suggestAbort = null;
    this.isGenerating = false;
  }

  private async suggest({ keepCurrent = false } = {}) {
    this.cancelSuggest();
    const controller = new AbortController();
    this.suggestAbort = controller;
    this.isGenerating = true;
    this.error = null;
    if (!keepCurrent) this.options = [];

    const context = this.getContext();
    const body: RespondRequest = {
      history: this.turns.map(({ speaker, text }) => ({ speaker, text })),
      profile: context.profile,
      setting: context.setting,
      tone: context.tone,
      exclude: keepCurrent ? [...this.offered, ...this.options.map((o) => o.text)] : this.offered,
      count: OPTION_COUNT,
    };

    // When asking for more, replace the current list only once the first new
    // option arrives so the screen never goes blank.
    let replaced = !keepCurrent;

    try {
      const response = await fetch("/api/respond", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!response.ok || !response.body) throw new Error("Could not generate responses.");

      for await (const event of readNdjson(response.body, controller.signal)) {
        if (event.type === "option") {
          if (!replaced) {
            this.offered.push(...this.options.map((o) => o.text));
            this.options = [];
            replaced = true;
          }
          this.options = [...this.options, event.option];
          // Warm the speech cache so tapping the option plays immediately.
          prefetchSpeech(event.option.text, context.voice);
        } else if (event.type === "error") {
          throw new Error(event.message);
        }
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        this.error = err instanceof Error ? err.message : "Could not generate responses.";
      }
    } finally {
      if (this.suggestAbort === controller) {
        this.suggestAbort = null;
        this.isGenerating = false;
      }
    }
  }

  private commitTurn(speaker: Speaker, text: string) {
    this.turns = [...this.turns, { id: nextId(), speaker, text, at: Date.now() }];
    this.offered = [];
  }

  /**
   * Record transcribed partner speech, appending to the previous partner turn
   * when it is a continuation after a short pause.
   */
  private commitPartnerSpeech(text: string, startedAt: number) {
    const last = this.turns.at(-1);
    if (
      last &&
      last.speaker === "partner" &&
      !this.speaking &&
      startedAt - last.at < PARTNER_MERGE_WINDOW_MS
    ) {
      last.text = `${last.text} ${text}`;
      last.at = Date.now();
      this.offered = [];
      return;
    }
    this.commitTurn("partner", text);
  }

  destroy() {
    this.cancelSuggest();
    this.cancelSpeech();
    void this.stop();
  }
}

async function* readNdjson(
  body: ReadableStream<Uint8Array>,
  signal: AbortSignal,
): AsyncGenerator<RespondStreamEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (!signal.aborted) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let newline = buffer.indexOf("\n");
      while (newline !== -1) {
        const line = buffer.slice(0, newline).trim();
        buffer = buffer.slice(newline + 1);
        if (line) yield JSON.parse(line) as RespondStreamEvent;
        newline = buffer.indexOf("\n");
      }
    }
    if (buffer.trim()) yield JSON.parse(buffer.trim()) as RespondStreamEvent;
  } finally {
    reader.releaseLock();
  }
}
