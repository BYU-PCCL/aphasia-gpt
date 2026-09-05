<script lang="ts">
  /**
   * "Listen" mode: the device listens to the conversation partner and offers
   * the AAC user five things they might want to say next. Tapping one speaks
   * it aloud and records it as the user's turn.
   */
  import { onMount, tick } from "svelte";
  import { get } from "svelte/store";
  import ModeNav from "@/components/ModeNav.svelte";
  import LoginModal from "@/components/LoginModal.svelte";
  import EditProfile from "@/components/EditProfile.svelte";
  import VoiceTypeModal from "@/components/VoiceTypeModal.svelte";
  import ContextOptionsModal from "@/components/ContextOptionsModal.svelte";
  import Picker from "@/components/Picker.svelte";
  import ResponseCard from "@/components/listen/ResponseCard.svelte";
  import TurnBubble from "@/components/listen/TurnBubble.svelte";
  import { ListenSession } from "@/lib/listen/session.svelte";
  import { contextStore } from "@/stores/contextStore";
  import { ProfileStore } from "@/stores/EditProfileStore";
  import { userName, userFirebaseUid, isLoadingAuthState } from "@/stores/user";
  import { app as firebaseApp } from "@/lib/firebase";

  const OPTION_COUNT = 5;
  const FONT_SCALE_KEY = "aphasia-gpt.fontScale";

  const session = new ListenSession(() => {
    const profile = get(ProfileStore).Profile;
    const context = get(contextStore);
    return {
      profile: {
        name: profile.name ?? "",
        age: Number.isFinite(profile.age) ? profile.age : null,
        about: profile.about ?? "",
      },
      setting: context.settingContext.selection,
      tone: context.toneContext.selection,
      voice: context.voiceContext.selectedVoice.name,
    };
  });

  let fontScale = $state(1);
  let partnerDraft = $state("");
  let replyDraft = $state("");
  let isMenuOpen = $state(false);
  let showEditProfile = $state(false);
  let showVoices = $state(false);
  let showContextOptions = $state(false);
  let conversationEl: HTMLDivElement | undefined = $state();

  const displayName = $derived($userName?.trim() || "You");

  const status = $derived.by(() => {
    if (session.speaking) return { icon: "volume_up", text: "Speaking…" };
    if (session.phase === "connecting") return { icon: "sync", text: "Connecting…" };
    if (session.phase === "stopping") return { icon: "sync", text: "Stopping…" };
    if (session.liveText) return { icon: "hearing", text: "Partner is talking…" };
    if (session.isGenerating) return { icon: "auto_awesome", text: "Thinking of replies…" };
    if (session.options.length) return { icon: "touch_app", text: "Tap a reply to say it" };
    if (session.isListening) return { icon: "hearing", text: "Listening for your partner…" };
    return { icon: "mic_off", text: "Tap Listen to start" };
  });

  const placeholderCount = $derived(
    session.isGenerating ? Math.max(0, OPTION_COUNT - session.options.length) : 0,
  );

  onMount(() => {
    try {
      const saved = Number(localStorage.getItem(FONT_SCALE_KEY));
      if (saved >= 0.8 && saved <= 2) fontScale = saved;
    } catch {
      // localStorage may be unavailable (private mode); keep the default.
    }
    return () => session.destroy();
  });

  // Keep the newest line in view.
  $effect(() => {
    void session.turns.length;
    void session.liveText;
    void tick().then(() => {
      conversationEl?.scrollTo({ top: conversationEl.scrollHeight, behavior: "smooth" });
    });
  });

  function setFontScale(next: number) {
    fontScale = Math.round(Math.min(2, Math.max(0.8, next)) * 10) / 10;
    try {
      localStorage.setItem(FONT_SCALE_KEY, String(fontScale));
    } catch {
      // ignore
    }
  }

  function submitPartner(event: SubmitEvent) {
    event.preventDefault();
    session.addPartnerText(partnerDraft);
    partnerDraft = "";
  }

  function submitReply(event: SubmitEvent) {
    event.preventDefault();
    const text = replyDraft;
    replyDraft = "";
    void session.sayCustom(text);
  }

  function newConversation() {
    if (
      session.turns.length &&
      !confirm("Start a new conversation? The current one will be cleared.")
    ) {
      return;
    }
    session.clearConversation();
  }

  function downloadTranscript() {
    const text = session.transcriptText();
    if (!text) return;
    const blob = new Blob([text + "\n"], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
    a.href = url;
    a.download = `listen-transcript-${stamp}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleKeydown(event: KeyboardEvent) {
    const target = event.target as HTMLElement | null;
    if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key === "Escape") {
      session.cancelSpeech();
      return;
    }
    const index = Number(event.key);
    if (index >= 1 && index <= session.options.length) {
      event.preventDefault();
      void session.choose(session.options[index - 1]);
    }
  }

  function closeMenus() {
    isMenuOpen = false;
  }

  async function logout() {
    closeMenus();
    session.clearConversation();
    await session.stop();
    contextStore.clear();
    try {
      await firebaseApp.auth().signOut();
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  }
</script>

<svelte:head>
  <title>Listen · Aphasia GPT</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
</svelte:head>

<svelte:window onkeydown={handleKeydown} onclick={closeMenus} />

{#if !$isLoadingAuthState}
  {#if !$userFirebaseUid}
    <LoginModal />
  {/if}
  {#if showEditProfile}
    <EditProfile toggleEditProfile={() => (showEditProfile = false)} />
  {/if}
  {#if showVoices}
    <VoiceTypeModal toggleVoiceTypesModal={() => (showVoices = false)} />
  {/if}
  {#if showContextOptions}
    <ContextOptionsModal
      toggleModal={() => {
        showContextOptions = false;
        contextStore.clearForm();
      }}
    />
  {/if}

  <div class="flex min-h-screen flex-col bg-slate-50 text-slate-900">
    <header class="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div class="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-2 sm:px-6">
        <ModeNav />
        <div class="flex items-center gap-2">
          {#if $userName}
            <span class="hidden text-sm text-slate-600 sm:inline">Hi {$userName} 👋</span>
          {/if}
          <div class="relative">
            <button
              type="button"
              class="rounded-full p-2 hover:bg-slate-100"
              aria-label="Menu"
              aria-expanded={isMenuOpen}
              onclick={(event) => {
                event.stopPropagation();
                isMenuOpen = !isMenuOpen;
              }}
            >
              <span class="material-icons align-middle">{isMenuOpen ? "close" : "menu"}</span>
            </button>
            {#if isMenuOpen}
              <div
                role="menu"
                class="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
              >
                <button
                  role="menuitem"
                  class="block w-full px-4 py-2 text-left hover:bg-slate-100"
                  onclick={() => (showEditProfile = true)}>Edit profile</button
                >
                <button
                  role="menuitem"
                  class="block w-full px-4 py-2 text-left hover:bg-slate-100"
                  onclick={() => (showVoices = true)}>Voice</button
                >
                <button
                  role="menuitem"
                  class="block w-full px-4 py-2 text-left hover:bg-slate-100"
                  onclick={() => (showContextOptions = true)}>Context options</button
                >
                {#if $userFirebaseUid}
                  <button
                    role="menuitem"
                    class="block w-full px-4 py-2 text-left hover:bg-slate-100"
                    onclick={logout}>Log out</button
                  >
                {/if}
              </div>
            {/if}
          </div>
        </div>
      </div>
    </header>

    <main class="mx-auto w-full max-w-6xl flex-1 px-3 py-4 sm:px-6 sm:py-6">
      <!-- Listen control + status + context -->
      <section
        class="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:gap-4 sm:p-4"
      >
        <button
          type="button"
          class="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-white shadow transition
            focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-300 sm:h-20 sm:w-20
            {session.isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-sky-600 hover:bg-sky-700'}"
          aria-pressed={session.isListening}
          aria-label={session.isListening ? "Stop listening" : "Start listening"}
          disabled={session.phase === "connecting" || session.phase === "stopping"}
          onclick={() => session.toggleListening()}
        >
          {#if session.isListening}
            <span
              class="absolute inset-0 animate-ping rounded-full bg-red-400/60"
              aria-hidden="true"
            ></span>
            <span class="material-icons relative text-3xl sm:text-4xl">stop</span>
          {:else}
            <span class="material-icons text-3xl sm:text-4xl">mic</span>
          {/if}
        </button>

        <div class="min-w-0 flex-1">
          <div class="text-lg font-semibold sm:text-xl">
            {session.isListening ? "Listening" : "Listen"}
          </div>
          <div class="flex items-center gap-1.5 text-sm text-slate-600">
            <span
              class="material-icons text-base {session.phase === 'connecting'
                ? 'animate-spin'
                : ''}"
              aria-hidden="true">{status.icon}</span
            >
            <span aria-live="polite">{status.text}</span>
          </div>
        </div>

        <div class="flex flex-wrap items-end gap-2 sm:gap-3">
          <div class="w-32">
            <Picker
              title={$contextStore.settingContext.contextTitle}
              bind:selectedItem={$contextStore.settingContext.selection}
              options={$contextStore.settingContext.options}
            />
          </div>
          <div class="w-32">
            <Picker
              title={$contextStore.toneContext.contextTitle}
              bind:selectedItem={$contextStore.toneContext.selection}
              options={$contextStore.toneContext.options}
            />
          </div>
          <div
            class="flex items-center gap-1 rounded-lg border border-slate-200 p-1"
            role="group"
            aria-label="Text size"
          >
            <button
              type="button"
              class="rounded px-2 py-1 text-sm hover:bg-slate-100"
              aria-label="Smaller text"
              onclick={() => setFontScale(fontScale - 0.1)}>A−</button
            >
            <button
              type="button"
              class="rounded px-2 py-1 text-lg hover:bg-slate-100"
              aria-label="Larger text"
              onclick={() => setFontScale(fontScale + 0.1)}>A+</button
            >
          </div>
          <button
            type="button"
            class="rounded-lg border border-slate-200 p-2 hover:bg-slate-100 disabled:opacity-40"
            title="Download transcript"
            aria-label="Download transcript"
            disabled={session.turns.length === 0}
            onclick={downloadTranscript}
          >
            <span class="material-icons align-middle">download</span>
          </button>
          <button
            type="button"
            class="rounded-lg border border-slate-200 p-2 hover:bg-slate-100"
            title="New conversation"
            aria-label="New conversation"
            onclick={newConversation}
          >
            <span class="material-icons align-middle">add_comment</span>
          </button>
        </div>
      </section>

      {#if session.error}
        <div
          class="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          <span class="material-icons text-base" aria-hidden="true">error_outline</span>
          <span class="flex-1">{session.error}</span>
          <button
            type="button"
            class="text-red-700 underline"
            onclick={() => (session.error = null)}
          >
            Dismiss
          </button>
        </div>
      {/if}

      <div class="mt-4 grid gap-4 lg:grid-cols-5 lg:gap-6">
        <!-- Suggested replies (first on small screens) -->
        <section
          class="order-1 flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm lg:order-2 lg:col-span-3"
          aria-labelledby="replies-heading"
        >
          <div class="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h2 id="replies-heading" class="font-semibold">You could say…</h2>
            <button
              type="button"
              class="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-sky-700 hover:bg-sky-50 disabled:opacity-40"
              disabled={session.isGenerating}
              onclick={() => session.more()}
            >
              <span class="material-icons text-base" aria-hidden="true">refresh</span>
              {session.options.length ? "Different ideas" : "Suggest something"}
            </button>
          </div>

          <div class="flex flex-1 flex-col gap-2.5 p-3 sm:p-4">
            {#each session.options as option, i (option.id)}
              <ResponseCard
                {option}
                index={i + 1}
                {fontScale}
                speaking={session.speaking === option.text}
                onchoose={(chosen) => void session.choose(chosen)}
              />
            {/each}

            {#each Array(placeholderCount) as _, i (i)}
              <div
                class="flex animate-pulse items-center gap-3 rounded-2xl border border-slate-100 p-4"
                aria-hidden="true"
              >
                <div class="h-9 w-9 rounded-full bg-slate-100"></div>
                <div class="flex-1 space-y-2">
                  <div
                    class="h-4 rounded bg-slate-100"
                    style="width: {55 + ((i * 17) % 35)}%"
                  ></div>
                  <div class="h-3 w-14 rounded-full bg-slate-100"></div>
                </div>
              </div>
            {/each}

            {#if !session.options.length && !session.isGenerating}
              <div
                class="flex flex-1 flex-col items-center justify-center gap-2 py-10 text-center text-slate-500"
              >
                <span class="material-icons text-4xl text-slate-300" aria-hidden="true">forum</span>
                {#if session.lastSpeaker === "user"}
                  <p>Waiting for your partner to reply.</p>
                {:else if session.isListening}
                  <p>Replies will appear here when your partner finishes talking.</p>
                {:else}
                  <p>Press <strong>Listen</strong>, or type what your partner said.</p>
                {/if}
              </div>
            {/if}
          </div>

          <form class="flex gap-2 border-t border-slate-100 p-3" onsubmit={submitReply}>
            <label class="sr-only" for="reply-draft">Type your own reply</label>
            <input
              id="reply-draft"
              class="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 focus:border-sky-500 focus:outline-none"
              placeholder="Or type your own reply…"
              autocomplete="off"
              bind:value={replyDraft}
            />
            <button
              type="submit"
              class="flex items-center gap-1 rounded-xl bg-sky-600 px-4 py-2 font-medium text-white hover:bg-sky-700 disabled:opacity-40"
              disabled={!replyDraft.trim()}
            >
              <span class="material-icons text-base" aria-hidden="true">volume_up</span>
              Say
            </button>
          </form>
        </section>

        <!-- Conversation -->
        <section
          class="order-2 flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm lg:order-1 lg:col-span-2"
          aria-labelledby="conversation-heading"
        >
          <div class="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h2 id="conversation-heading" class="font-semibold">Conversation</h2>
            {#if session.liveText}
              <button
                type="button"
                class="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-sky-700 hover:bg-sky-50"
                title="Close the partner's turn now instead of waiting for silence"
                onclick={() => session.finishPartnerTurn()}
              >
                <span class="material-icons text-base" aria-hidden="true">check</span>
                They're done
              </button>
            {/if}
          </div>

          <div
            bind:this={conversationEl}
            class="flex max-h-[40vh] flex-1 flex-col gap-3 overflow-y-auto p-3 sm:p-4 lg:max-h-[60vh]"
            aria-live="polite"
          >
            {#if !session.turns.length && !session.liveText}
              <p class="py-8 text-center text-sm text-slate-400">Nothing yet.</p>
            {/if}
            {#each session.turns as turn (turn.id)}
              <TurnBubble
                {turn}
                userName={displayName}
                {fontScale}
                speaking={session.speaking === turn.text}
                onspeak={(text) => void session.say(text)}
                onsetspeaker={(id, speaker) => session.setSpeaker(id, speaker)}
                onremove={(id) => session.removeTurn(id)}
              />
            {/each}
            {#if session.liveText}
              <div class="flex flex-col items-start">
                <span class="mb-1 px-1 text-xs font-medium text-slate-500">Partner</span>
                <div
                  class="max-w-[92%] rounded-2xl rounded-bl-md border border-dashed border-slate-300 bg-slate-50 px-4 py-2.5 leading-snug text-slate-600"
                  style="font-size: {1.0625 * fontScale}rem;"
                >
                  {session.liveText}<span class="ml-1 inline-block animate-pulse">…</span>
                </div>
              </div>
            {/if}
          </div>

          <form class="flex gap-2 border-t border-slate-100 p-3" onsubmit={submitPartner}>
            <label class="sr-only" for="partner-draft">Type what your partner said</label>
            <input
              id="partner-draft"
              class="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 focus:border-sky-500 focus:outline-none"
              placeholder="Type what your partner said…"
              autocomplete="off"
              bind:value={partnerDraft}
            />
            <button
              type="submit"
              class="rounded-xl border border-slate-300 px-4 py-2 font-medium hover:bg-slate-100 disabled:opacity-40"
              disabled={!partnerDraft.trim()}
            >
              Add
            </button>
          </form>
        </section>
      </div>

      <p class="mt-4 text-center text-xs text-slate-400">
        Keyboard: press 1–5 to say a reply, Esc to stop speaking.
      </p>
    </main>
  </div>
{/if}
