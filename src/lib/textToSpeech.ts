let currentAudio: HTMLAudioElement | null = null;

export function setCurrentAudio(audio: HTMLAudioElement) {
    currentAudio = audio;
}

export function getCurrentAudio() {
    return currentAudio;
}

export async function sendTextToAudio(text: string): Promise<HTMLAudioElement> {
    try {
        const response = await fetch("/api/gpt", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                userInput: text,
            }),
        });

        if (!response.ok) {
            console.error("Error generating audio:", Error);
            throw new Error('Failed to generate audio');
        }

        //Convert the response to JSON
        const responseData = await response.json();
        
        // Extract the Base64 encoded audio data from the response
        const audioBase64 = responseData.audioBase64;

        // Create a new audio element
        const audio = new Audio(`data:audio/mpeg;base64,${audioBase64}`);

        return audio; // Return the audio element

        // //WHY won't this work?????
        // const responseData = await response.blob();
        // const audio = new Audio(URL.createObjectURL(responseData));
        // return audio; 

    } catch (error) {
        console.error("Error:", error);
        throw error;
    }
}

