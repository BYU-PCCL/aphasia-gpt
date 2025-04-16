import { json } from '@sveltejs/kit';
import dotenv from 'dotenv';

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY_B;

export async function POST({ request }) {
    console.debug("Creating a new session...");
    try {
        const { instructions, voice } = await request.json();

        const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENAI_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "gpt-4o-realtime-preview-2024-12-17",
                instructions: instructions,
                voice: voice
            }),
        });

        const data = await response.json();
        console.debug("Session created.");
        return json(data);
    } catch (error) {
        console.error("Error creating session:", error);
        return json({ error: "Failed to create session" }, { status: 500 });
    }
}
