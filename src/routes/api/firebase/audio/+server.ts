if (!import.meta.env.SSR) {
    throw new Error("This module can only be imported on the server side.");
  }
  
  import type { RequestHandler } from "./../$types";
  import { error } from "@sveltejs/kit";
  import { getUserRef } from "../firebaseUtils";
  import { parseFormData } from "@/lib/utils/parseFormData"; // Custom utility to parse FormData
  
  function getAudioRef(uid: string) {
    return getUserRef(uid).child("audio");
  }
  
  /**
   * Upload an audio file for a specific user to the database
   */
  export const POST: RequestHandler = async ({ request }) => {
    // Parse FormData from the request
    const formData = await parseFormData(request);
  
    const uid = formData.get("uid") as string;
    const audioFile = formData.get("audio") as File | null;
  
    if (!uid || uid === "") {
      throw error(400, "UID is required");
    }
  
    if (!audioFile) {
      throw error(400, "Audio file is required");
    }
  
    const audioRef = getAudioRef(uid);
  
    // Save the audio file to Firebase Storage
    try {
      const buffer = await audioFile.arrayBuffer();
      const base64Audio = Buffer.from(buffer).toString("base64");
  
      await audioRef.set({
        filename: audioFile.name,
        contentType: audioFile.type,
        audioData: base64Audio, // Storing as base64 for simplicity
      });
  
      return new Response(
        JSON.stringify({ message: "Audio file uploaded successfully" }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }
      );
    } catch (err) {
      console.error("Error saving audio file:", err);
      throw error(500, "Failed to save audio file");
    }
  };
  