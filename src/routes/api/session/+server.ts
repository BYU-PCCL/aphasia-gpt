import { json } from '@sveltejs/kit';
import dotenv from 'dotenv';

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY_B;

// Realtime GA models. `gpt-realtime-2.1` is the current flagship (best quality,
// ~25% lower p95 latency than the old preview). `gpt-realtime-2.1-mini` is the
// same API at roughly 6x lower cost and lower latency, but is a smaller model —
// swap it in via env if a quality A/B shows it holds up for this task.
const REALTIME_MODEL = process.env.OPENAI_REALTIME_MODEL || 'gpt-realtime-2.1';

// Input-speech transcription. Left on `whisper-1` deliberately: the newer
// `gpt-4o-mini-transcribe` is faster, but the gpt-4o transcribe family tends to
// tidy up disfluent speech, which is exactly the signal this project studies.
// Override only after checking transcript fidelity on real aphasic speech.
const TRANSCRIBE_MODEL = process.env.OPENAI_TRANSCRIBE_MODEL || 'whisper-1';

export async function POST({ request }) {
    console.debug('Creating a new realtime session...');
    try {
        const { instructions, voice } = await request.json();

        // GA endpoint. The old POST /v1/realtime/sessions was removed and now
        // 404s with "Invalid URL" regardless of the API key.
        const response = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                expires_after: { anchor: 'created_at', seconds: 600 },
                session: {
                    // GA requires an explicit session type, and moves voice/
                    // transcription under audio.input / audio.output.
                    type: 'realtime',
                    model: REALTIME_MODEL,
                    instructions,
                    audio: {
                        input: {
                            transcription: { model: TRANSCRIBE_MODEL, language: 'en' },
                        },
                        output: { voice },
                    },
                },
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error(
                'OpenAI client secret creation failed:',
                response.status,
                JSON.stringify(data)
            );
            return json(
                {
                    error: 'OpenAI client secret creation failed',
                    status: response.status,
                    details: data,
                },
                { status: response.status }
            );
        }

        // GA returns the ephemeral key at the top level as `value`
        // (the old shape was `client_secret.value`).
        console.debug(
            'Realtime session created:',
            data?.session?.id,
            'model:',
            data?.session?.model
        );
        return json(data);
    } catch (error) {
        console.error('Error creating session:', error);
        return json({ error: 'Failed to create session' }, { status: 500 });
    }
}
