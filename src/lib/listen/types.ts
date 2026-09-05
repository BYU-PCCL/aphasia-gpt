/**
 * Shared types for the "Listen" mode: the device listens to the conversation
 * partner and suggests things the AAC user might want to say next.
 */

export type Speaker = "partner" | "user";

/** One utterance in the conversation. */
export interface Turn {
  id: string;
  speaker: Speaker;
  text: string;
  /** Epoch ms when the turn was finalized. */
  at: number;
}

/**
 * The communication function a suggested response serves. Mirrors the variety
 * requested in the research prompt (answer / question / comment / opinion /
 * change of topic).
 */
export type ResponseKind = "answer" | "question" | "comment" | "opinion" | "topic";

export const RESPONSE_KINDS: readonly ResponseKind[] = [
  "answer",
  "question",
  "comment",
  "opinion",
  "topic",
] as const;

/** One suggested response option shown to the user. */
export interface ResponseOption {
  id: string;
  kind: ResponseKind;
  text: string;
}

/** Request body for POST /api/respond. */
export interface RespondRequest {
  history: Pick<Turn, "speaker" | "text">[];
  profile: { name: string; age: number | null; about: string };
  setting: string;
  tone: string;
  /** Previously offered options that should not be repeated. */
  exclude?: string[];
  count?: number;
}

/** One line of the NDJSON stream returned by POST /api/respond. */
export type RespondStreamEvent =
  | { type: "option"; option: ResponseOption }
  | { type: "done" }
  | { type: "error"; message: string };
