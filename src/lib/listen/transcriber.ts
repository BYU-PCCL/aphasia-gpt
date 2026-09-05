/**
 * Streams the conversation partner's speech to AssemblyAI's Universal-Streaming
 * (v3) WebSocket API and reports turns as they evolve.
 *
 * Each "Turn" message carries the full running transcript for the current
 * turn. With `format_turns=true` the end of a turn produces two messages that
 * share a `turn_order`: an unformatted final, then a punctuated/cased final.
 * We surface interim text as it grows and emit `final` once for the formatted
 * version (falling back to the unformatted one if formatting never arrives).
 *
 * Browser-only: do not import from server code.
 */

import { PcmCapture } from "@/lib/audio/pcmCapture";

export type TranscriberState = "idle" | "connecting" | "listening" | "stopping";

export interface TurnEvent {
  turnOrder: number;
  text: string;
  final: boolean;
}

export interface TranscriberCallbacks {
  onTurn: (event: TurnEvent) => void;
  onStateChange: (state: TranscriberState) => void;
  onError: (message: string) => void;
}

export interface TranscriberOptions {
  /**
   * AssemblyAI turn-detection preset. `balanced` waits ~1.3 s of silence
   * before closing a turn, which suits conversational speech; `max_accuracy`
   * tolerates longer pauses (~2.6 s) at the cost of slower suggestions.
   */
  mode?: "min_latency" | "balanced" | "max_accuracy";
  /** Free-text hint that improves recognition of names and domain terms. */
  keyterms?: string[];
}

const STREAMING_URL = "wss://streaming.assemblyai.com/v3/ws";
/** How long to wait for the formatted final before using the unformatted one. */
const FORMAT_GRACE_MS = 600;

export class PartnerTranscriber {
  private socket: WebSocket | null = null;
  private capture: PcmCapture | null = null;
  private state: TranscriberState = "idle";
  private pendingFinal: { turnOrder: number; timer: ReturnType<typeof setTimeout> } | null = null;
  private emittedFinalTurns = new Set<number>();
  private generation = 0;

  constructor(
    private readonly callbacks: TranscriberCallbacks,
    private readonly options: TranscriberOptions = {},
  ) {}

  get currentState() {
    return this.state;
  }

  async start(): Promise<void> {
    if (this.state !== "idle") return;
    const generation = ++this.generation;
    this.setState("connecting");
    this.emittedFinalTurns.clear();

    try {
      const capture = new PcmCapture();
      await capture.start({
        sampleRate: 16000,
        frameMs: 100,
        onFrame: (pcm) => {
          if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(pcm);
        },
      });
      if (generation !== this.generation) {
        // stop() was called while we were waiting for the microphone.
        await capture.stop();
        return;
      }
      this.capture = capture;

      const token = await fetchToken();
      if (generation !== this.generation) return;

      const params = new URLSearchParams({
        token,
        sample_rate: String(capture.sampleRate),
        encoding: "pcm_s16le",
        format_turns: "true",
        mode: this.options.mode ?? "balanced",
      });
      if (this.options.keyterms?.length) {
        params.set("keyterms_prompt", JSON.stringify(this.options.keyterms));
      }

      const socket = new WebSocket(`${STREAMING_URL}?${params.toString()}`);
      this.socket = socket;
      socket.onopen = () => {
        if (this.socket === socket) this.setState("listening");
      };
      socket.onmessage = (event) => this.handleMessage(event);
      socket.onerror = () => {
        if (this.socket !== socket) return;
        this.callbacks.onError("Lost the connection to the transcription service.");
        void this.stop();
      };
      socket.onclose = (event) => {
        if (this.socket !== socket) return;
        if (event.code !== 1000 && event.code !== 1005) {
          this.callbacks.onError(
            `Transcription connection closed (${event.code}${event.reason ? `: ${event.reason}` : ""}).`,
          );
        }
        void this.stop();
      };
    } catch (error) {
      this.callbacks.onError(describeError(error));
      await this.stop();
    }
  }

  /** Ask AssemblyAI to close the current turn immediately instead of waiting for silence. */
  forceEndOfTurn() {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: "ForceEndpoint" }));
    }
  }

  /** Stop forwarding audio without tearing the session down (e.g. while the device speaks). */
  setMuted(muted: boolean) {
    this.capture?.setMuted(muted);
  }

  async stop(): Promise<void> {
    if (this.state === "idle" || this.state === "stopping") return;
    this.generation++;
    this.setState("stopping");

    if (this.pendingFinal) {
      clearTimeout(this.pendingFinal.timer);
      this.pendingFinal = null;
    }

    const socket = this.socket;
    this.socket = null;
    if (socket) {
      socket.onopen = socket.onmessage = socket.onerror = socket.onclose = null;
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "Terminate" }));
      }
      if (socket.readyState !== WebSocket.CLOSED) socket.close();
    }

    const capture = this.capture;
    this.capture = null;
    await capture?.stop();

    this.setState("idle");
  }

  private handleMessage(event: MessageEvent<string>) {
    let data: {
      type?: string;
      turn_order?: number;
      transcript?: string;
      end_of_turn?: boolean;
      turn_is_formatted?: boolean;
      error?: string;
    };
    try {
      data = JSON.parse(event.data);
    } catch {
      return;
    }

    if (data.type === "Error" || data.error) {
      this.callbacks.onError(data.error ?? "Transcription error.");
      return;
    }
    if (data.type !== "Turn") return;

    const turnOrder = data.turn_order ?? 0;
    const text = (data.transcript ?? "").trim();

    if (!data.end_of_turn) {
      if (text) this.callbacks.onTurn({ turnOrder, text, final: false });
      return;
    }

    if (this.emittedFinalTurns.has(turnOrder)) return;

    if (data.turn_is_formatted) {
      this.emitFinal(turnOrder, text);
      return;
    }

    // Unformatted final: show it right away as interim, then give the formatted
    // version a short window to arrive before committing.
    if (text) this.callbacks.onTurn({ turnOrder, text, final: false });
    if (this.pendingFinal) clearTimeout(this.pendingFinal.timer);
    this.pendingFinal = {
      turnOrder,
      timer: setTimeout(() => this.emitFinal(turnOrder, text), FORMAT_GRACE_MS),
    };
  }

  private emitFinal(turnOrder: number, text: string) {
    if (this.pendingFinal?.turnOrder === turnOrder) {
      clearTimeout(this.pendingFinal.timer);
      this.pendingFinal = null;
    }
    if (this.emittedFinalTurns.has(turnOrder)) return;
    this.emittedFinalTurns.add(turnOrder);
    // Empty finals happen when a turn was force-ended with no speech.
    if (text) this.callbacks.onTurn({ turnOrder, text, final: true });
  }

  private setState(state: TranscriberState) {
    if (this.state === state) return;
    this.state = state;
    this.callbacks.onStateChange(state);
  }
}

async function fetchToken(): Promise<string> {
  const response = await fetch("/api/assemblyai-token");
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.token) {
    throw new Error(body.error ?? "Could not get a transcription token.");
  }
  return body.token as string;
}

function describeError(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError") return "Microphone access was denied.";
    if (error.name === "NotFoundError") return "No microphone was found.";
  }
  return error instanceof Error ? error.message : "Could not start listening.";
}
