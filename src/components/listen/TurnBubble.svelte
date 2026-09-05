<script lang="ts">
  import type { Speaker, Turn } from "@/lib/listen/types";

  interface Props {
    turn: Turn;
    userName?: string;
    fontScale?: number;
    speaking?: boolean;
    onspeak: (text: string) => void;
    onsetspeaker: (id: string, speaker: Speaker) => void;
    onremove: (id: string) => void;
  }

  let {
    turn,
    userName = "You",
    fontScale = 1,
    speaking = false,
    onspeak,
    onsetspeaker,
    onremove,
  }: Props = $props();

  const isUser = $derived(turn.speaker === "user");
  const otherSpeaker = $derived<Speaker>(isUser ? "partner" : "user");
</script>

<!-- @component One utterance in the conversation, with tools to correct who said it. -->

<div class="group flex flex-col {isUser ? 'items-end' : 'items-start'}">
  <span class="mb-1 px-1 text-xs font-medium text-slate-500">
    {isUser ? userName : "Partner"}
  </span>
  <div class="flex max-w-[92%] items-end gap-1 {isUser ? 'flex-row-reverse' : ''}">
    <div
      class="rounded-2xl px-4 py-2.5 leading-snug shadow-sm
        {isUser
        ? 'rounded-br-md bg-sky-600 text-white'
        : 'rounded-bl-md border border-slate-200 bg-white text-slate-900'}
        {speaking ? 'ring-2 ring-sky-300' : ''}"
      style="font-size: {1.0625 * fontScale}rem;"
    >
      {turn.text}
    </div>
    <div
      class="flex shrink-0 gap-0.5 opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100"
    >
      <button
        type="button"
        class="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        title="Say this aloud"
        aria-label="Say this aloud"
        onclick={() => onspeak(turn.text)}
      >
        <span class="material-icons text-base leading-none" aria-hidden="true">volume_up</span>
      </button>
      <button
        type="button"
        class="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        title={isUser ? "Actually, my partner said this" : "Actually, I said this"}
        aria-label={isUser ? "Mark as said by partner" : "Mark as said by me"}
        onclick={() => onsetspeaker(turn.id, otherSpeaker)}
      >
        <span class="material-icons text-base leading-none" aria-hidden="true">swap_horiz</span>
      </button>
      <button
        type="button"
        class="rounded-full p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
        title="Remove"
        aria-label="Remove this line"
        onclick={() => onremove(turn.id)}
      >
        <span class="material-icons text-base leading-none" aria-hidden="true">close</span>
      </button>
    </div>
  </div>
</div>
