
import openAI from "openai"
import path from "path";
import { OPENAI_API_KEY } from "$env/static/private";
import { json, type RequestHandler } from "@sveltejs/kit";
import { Buffer } from 'buffer';
import fs from "fs";


const openai = new openAI({
  apiKey: OPENAI_API_KEY,
});
const speechFile = path.resolve("./src/speech.mp3");

const model = 'gpt-3.5-turbo-instruct'; // Use the GPT-3 model


let value = "Broca's Aphasia";
let namevalue = "";
let agevalue = "";
let aboutvalue = "";
let voiceValue;

// Define a function to handle API retries with exponential backoff
const retryWithExponentialBackoff = async <T>(func: () => Promise<T>, maxRetries = 5): Promise<T> => {
  let retries = 0;
  while (true) {
    try {
      return await func();
    } catch (error: any) {
      if (error.response && error.response.status === 429 && retries < maxRetries) {
        const delay = Math.pow(2, retries) * 1000; // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, delay));
        retries++;
      } else {
        throw error; // Rethrow error if it's not a rate limit error or retries exceed the limit
      }
    }
  }
};


export const POST: RequestHandler = async ({ request }) => {
  const requestBody = await request.json();

  if (requestBody.userInput !== undefined) {
    return handleUserInput(requestBody.userInput);
  } else if (requestBody.utterance !== undefined) {
    return handleFormData(requestBody);
  } else {
    return json({ error: "Invalid requestBody" }, { status: 400 });
  }
};

// Function to delete the existing audio file

async function handleUserInput(userInput: any) {
  try {
    let usedVoice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer" = "alloy";
    if (voiceValue){
      usedVoice = voiceValue;
    }
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: usedVoice,
      input: userInput
    });
    //Used to write the audio data to a file. 
    // const buffer = Buffer.from(await mp3.arrayBuffer());
    // await fs.promises.writeFile(speechFile, buffer);

    // Check if the response is successful
    if (!mp3 || !mp3.blob) {
      throw new Error('Failed to generate audio in API');
    }
    console.log()

    const audioData = await mp3.blob(); 
    // return new Response(audioData, {
    //   headers: {
    //     'Content-Type': 'audio/mpeg'
    //   }
    // });

    // Check if audio data is empty
    //await blob.text()???
    if (!audioData || audioData.size === 0) {
      throw new Error('Empty audio data received');
    }

    // Convert audio blob to Base64 string
    const audioBase64 = await blobToBase64(audioData);
    return json({
      audioBase64
    });
    // Construct JSON response with Base64 encoded audio data
    
  
  } catch(error: any) {
    console.log(error);
    return json({
      error: "Response was not correctly implemented",
    });
  }
}

// Helper function to convert blob to Base64 string
async function blobToBase64(blob: Blob): Promise<string> {
  // Convert blob to ArrayBuffer
  const arrayBuffer = await blob.arrayBuffer();
  // Convert ArrayBuffer to Buffer
  const buffer = Buffer.from(arrayBuffer);
  // Convert buffer to Base64 string
  const base64String = buffer.toString('base64');
  return base64String;
}


async function handleFormData(requestBody) {
  const { 
    name, 
    age, 
    about,
    aphasiaType,
    utterance,
    setting,
    conversationType,
    tone,
    voice
  } = requestBody;

  console.log("received userName from frontend:", name);
  console.log("received userAge from frontend:", age);
  console.log("received userContent from frontend:", about);
  console.log('received aphasia type from frontend:', aphasiaType);
  console.log("received utterance from frontend:", utterance);
  console.log("received setting from frontend:", setting);
  console.log("received conversation type from frontend:", conversationType);
  console.log("received tone from frontend:", tone);
  console.log("received voice from frontend", voice);

  if(name || age || about || voice){
    namevalue = name;
    agevalue = age;
    aboutvalue = about;
    voiceValue = voice;
  }
  // if (aphasiaType) {
  //   value = aphasiaType;
  //   return json({
  //     aphasiaType: aphasiaType, // Return the aphasiaType data in the response body
  //   });
  // }

  if (utterance || tone || setting || conversationType) {
    let responseTexts = null;
    do {
      responseTexts = null;
      console.log("utterance:", utterance);
//content tone and setting in each utterance. 
//voice synthesis
//scrollback feature maybe. 
      try {
        const chatResponse = await retryWithExponentialBackoff(async () => {
          return await openai.completions.create({
            model: model, // Use the GPT-3 model
            prompt:
              `You are an expert in communication disorders, specifically ${value}. Your task is to transform an utterance from a person with Broca's aphasia into a grammatically correct sentence and predict the next several words they will say. Do NOT request any additional information or context or ask any questions. Only provide the 3 transformed predicted sentences based on the utterance provided. Do not attempt to change the utterance itself in any way.
              
              This patient name is ${name}, and he is ${age} years old. This is a Profile about him:
              
              ${about}. 
              
              You are welcome to use this data in the predictions.
              
              Make each prediction different from one another, so that the patient can choose the response that best fits their intended message. Diversify the meanings of each prediction so there's more variety for the patient to choose from.
              
              Formatting examples:
              
              Utterance: "walk dog"
                Setting: home
                Type: apology
                Tone: kind
                Prediction 1: "I'm sorry I didn't take the dog for a walk."
                Prediction 2: "I apologize for not walking the dog."
                Prediction 3: "I'm sorry but can you go walk the dog?"
              Utterance: "Book book two table"
                Setting: work
                Type: chat
                Tone: neutral
                Prediction 1: "Give me both books on the table."
                Prediction 2: "There are two books on the table."
                Prediction 3: "Can you place the books on the table for me?"
              Utterance: "I want take kids"
                Setting: school
                Type: chat
                Tone: happy
                Prediction 1: "I'd be happy to take the kids to school."
                Prediction 2: "It's time to take the kids home"
                Prediction 3: "I want you to take the kids outside."
              Utterance: "Sweaty I need"
                Setting: gym
                Type: argument
                Tone: angry
                Prediction 1: "Listen, I am sweaty and I need a hot shower."
                Prediction 2: "I am sweaty and hot, I neeed water."
                Prediciton 3: "I am sweaty; can I get a towel?"
              Utterance: "Cat seems cat"
                Setting: school
                Type: joke
                Tone: sarcastic
                Prediction 1: "You seem like a cat person. Cat people are so cool."
                Prediction 2: "The cat seems hungry... for love."
                Prediction 3: "That seems like a cool cat. Not!"
              Utterance: "I I need I need some"
                Setting: school
                Type: chat
                Tone: happy
                Prediction 1: "I need some paper."
                Prediction 2: "I need some help with my homework."
                Prediction 3: "You've got something I need!"
              Utterance: "${utterance}"
                Setting: "${setting}"
                Type: "${conversationType}"
                Tone: "${tone}"
                Prediction 1:`,
            temperature: 1,
            max_tokens: 100, // Set the desired maximum token length for the response
            n: 1,
          });
        });

        responseTexts = chatResponse.choices?.[0]?.text;
        console.log(responseTexts);
      } catch (error: any) {
        if (error.response && error.response.status === 429) {
          console.log("Rate limit exceeded. Retrying...");
          continue; // Retry the loop if rate limit exceeded
        } else {
          throw error; // Rethrow error if it's not a rate limit error
        }
      }

    } while (!responseTexts || responseTexts.split('\n').filter((s: string) => s.length > 0).length !== 3);

    if (responseTexts) {
      console.log("generated text:", responseTexts);

      // Remove Prediction 1, Prediction 2, and Prediction 3 from each sentence
      const texts = responseTexts.split('\n')
        .filter((s: string) => s.length > 0)
        .map((s) => s.replace(/["]+/g, ''))
        .map((s) => s.replace(/Prediction \d+: /g, ''));

      return json({
        texts,
      });
    } else {
      // Handle the case where responseTexts is undefined
      return json({
        error: "Response text is undefined",
      });
    }
  }
};

/*          
`You are an expert in communication disorders, specifically ${value}. Your task is to transform an utterance from a person with Broca's aphasia into a grammatically correct sentence and predict the next several words they will say. Do NOT request any additional information or context or ask any questions. Only provide the 3 transformed predicted sentences based on the utterance provided. Do not attempt to change the utterance itself in any way.
This patient name is ${name}, and he is ${age} years old. This is a Profile about him:
${about}. You are welcome to use these values in the predictions. 

Make each prediction different from one another, so that the patient can choose the response that best fits their intended message. Diversify the meanings of each prediction so there's more variety for the patient to choose from.

Formatting examples:

Utterance: "walk dog"
  Setting: home
  Type: apology
  Tone: kind
  Prediction 1: "I'm sorry I didn't take the dog for a walk."
  Prediction 2: "I apologize for not walking the dog."
  Prediction 3: "I'm sorry but can you go walk the dog?"
Utterance: "Book book two table"
  Setting: work
  Type: chat
  Tone: neutral
  Prediction 1: "Give me both books on the table."
  Prediction 2: "There are two books on the table."
  Prediction 3: "Can you place the books on the table for me?"
Utterance: "I want take kids"
  Setting: school
  Type: chat
  Tone: happy
  Prediction 1: "I'd be happy to take the kids to school."
  Prediction 2: "It's time to take the kids home"
  Prediction 3: "I want you to take the kids outside."
Utterance: "Sweaty I need"
  Setting: gym
  Type: argument
  Tone: angry
  Prediction 1: "Listen, I am sweaty and I need a hot shower"
  Prediction 2: "I am sweaty and hot, I neeed water."
  Prediciton 3: "I am sweaty; can I get a towel?"
Utterance: "Cat seems cat"
  Setting: school
  Type: joke
  Tone: sarcastic
  Prediction 1: "You seem like a cat person. Cat people are so cool."
  Prediction 2: "The cat seems hungry. . . for love."
  Prediction 3: "That seems like a cooll cat. Not!"
Utterance: "I I need I need some"
  Setting: school
  Type: chat
  Tone: happy
  Prediction 1: "I need some water."
  Prediction 2: "I need to go to sleep."
  Prediction 3: "You've got something I need!"
Utterance: "${utterance}"
  Setting: "${setting}"
  Type: "${conversationType}"
  Tone: "${tone}"
  Prediction 1:`,
temperature: 1,
max_tokens: 100, // Set the desired maximum token length for the response
n: 1,
});
})
*/
