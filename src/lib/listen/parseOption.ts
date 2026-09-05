import type { ResponseKind, ResponseOption } from "./types";

const KIND_ALIASES: Record<string, ResponseKind> = {
  answer: "answer",
  reply: "answer",
  question: "question",
  ask: "question",
  comment: "comment",
  opinion: "opinion",
  topic: "topic",
  "change topic": "topic",
  "new topic": "topic",
  "topic change": "topic",
};

const LINE_PATTERN = /^\s*(?:\d+[.)]\s*)?[-*•]?\s*([A-Za-z ]{3,14})\s*[:\-–—]\s*(.+?)\s*$/;

/**
 * Parse one line of model output (`KIND: text`) into a response option.
 * Tolerates numbering, bullets, quotes and unknown labels; returns null for
 * lines that carry no usable text.
 */
export function parseOptionLine(line: string): Omit<ResponseOption, "id"> | null {
  const match = LINE_PATTERN.exec(line);
  let kind: ResponseKind = "comment";
  let text = line;
  if (match) {
    const mapped = KIND_ALIASES[match[1].trim().toLowerCase()];
    if (mapped) {
      kind = mapped;
      text = match[2];
    }
  }
  text = text
    .trim()
    .replace(/^\d+[.)]\s*/, "")
    .replace(/^["'“”‘’]+|["'“”‘’]+$/g, "")
    .trim();
  if (text.length < 1 || text.length > 160) return null;
  if (!/[A-Za-z]/.test(text)) return null;
  return { kind, text };
}
