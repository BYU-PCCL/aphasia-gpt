# Aphasia GPT

This is a real-time, AI-driven assistive platform for persons with aphasia (PWA). It blends real-time automatic speech recognition with modern language models in order to support PWA to communicate fluently.

The site has three modes, switchable from the header:

| Mode            | Route          | What it does                                                                                                                                           |
| --------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Speak**       | `/`            | Listens to the user and predicts complete sentences for what they are trying to say.                                                                    |
| **Listen**      | `/listen`      | Listens to the _conversation partner_ and offers the user five things they might want to say next. Tapping one speaks it aloud ("Listening Aphasia-GPT"). |
| **Aphasiafier** | `/aphasiafier` | Transforms ordinary speech into aphasic speech for training and simulation (OpenAI Realtime).                                                           |

## Listen mode

1. Press **Listen**. The partner's speech streams to AssemblyAI (Universal-Streaming v3) and appears live in the conversation panel.
2. When the partner pauses, the turn is finalized and `POST /api/respond` streams five reply options (answer / ask / comment / opinion / new topic) from `gpt-4.1-mini`, personalized with the user's profile, setting and tone.
3. Tapping an option (or pressing keys 1–5) records it as the user's turn and speaks it through `POST /api/tts`. Speech for each option is pre-fetched, so playback is immediate. The microphone is muted while the device speaks so its own voice is not transcribed.
4. **Different ideas** asks for five more options that avoid the ones already shown. Partner lines can also be typed, corrected, re-attributed, or removed, and the transcript can be downloaded.

Key code: `src/routes/listen/+page.svelte` (UI), `src/lib/listen/session.svelte.ts` (state), `src/lib/listen/transcriber.ts` (AssemblyAI), `src/lib/audio/pcmCapture.ts` (mic → PCM), `src/routes/api/respond/+server.ts` (prompt + streaming).

## Development

```sh
cp .env.example .env   # fill in keys
./run.sh               # Node 22 via nvm, then `pnpm dev`
```

Optional model overrides are documented in `.env.example`.
