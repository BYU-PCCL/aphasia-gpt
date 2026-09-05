<script lang="ts">
  import type { ResponseOption } from "@/lib/listen/types";

  interface Props {
    option: ResponseOption;
    /** 1-based position, also the keyboard shortcut. */
    index: number;
    disabled?: boolean;
    speaking?: boolean;
    fontScale?: number;
    onchoose: (option: ResponseOption) => void;
  }

  let {
    option,
    index,
    disabled = false,
    speaking = false,
    fontScale = 1,
    onchoose,
  }: Props = $props();

  const KIND_STYLES: Record<ResponseOption["kind"], { label: string; classes: string }> = {
    answer: { label: "Answer", classes: "bg-emerald-100 text-emerald-800" },
    question: { label: "Ask", classes: "bg-sky-100 text-sky-800" },
    comment: { label: "Comment", classes: "bg-slate-200 text-slate-700" },
    opinion: { label: "Opinion", classes: "bg-amber-100 text-amber-800" },
    topic: { label: "New topic", classes: "bg-violet-100 text-violet-800" },
  };

  const style = $derived(KIND_STYLES[option.kind]);
</script>

<!-- @component A large tappable card for one suggested reply. -->

<button
  type="button"
  class="group flex w-full items-center gap-3 rounded-2xl border bg-white p-3 text-left shadow-sm transition
    hover:border-sky-400 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500
    active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 sm:gap-4 sm:p-4
    {speaking ? 'border-sky-500 ring-2 ring-sky-200' : 'border-slate-200'}"
  {disabled}
  onclick={() => onchoose(option)}
  aria-label={`Say: ${option.text}`}
  aria-keyshortcuts={String(index)}
>
  <span
    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600
      group-hover:bg-sky-500 group-hover:text-white sm:h-10 sm:w-10"
    aria-hidden="true"
  >
    {index}
  </span>
  <span class="min-w-0 flex-1">
    <span class="block leading-snug text-slate-900" style="font-size: {1.125 * fontScale}rem;">
      {option.text}
    </span>
    <span class="mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium {style.classes}">
      {style.label}
    </span>
  </span>
  <span class="material-icons shrink-0 text-slate-300 group-hover:text-sky-500" aria-hidden="true">
    {speaking ? "volume_up" : "play_arrow"}
  </span>
</button>
