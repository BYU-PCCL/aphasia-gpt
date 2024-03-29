
import openAI from "openai"

import { OPENAI_API_KEY } from "$env/static/private";
import { json, type RequestHandler } from "@sveltejs/kit";

const openai = new openAI({
  apiKey: OPENAI_API_KEY,
});


const model = 'gpt-3.5-turbo-instruct'; // Use the GPT-3 model

let value = "Broca's Aphasia";
let namevalue = "";
let agevalue = "";
let aboutvalue = "";



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
  const {
    name,
    age,
    about,
    aphasiaType,
    utterance,
    setting,
    conversationType,
    tone,
  } = await request.json();
  console.log("received userName from frontend:", name);
  console.log("received userAge from frontend:", age);
  console.log("received userContent from frontend:", about);

  console.log('received aphasia type from frontend:', aphasiaType);
  console.log("received utterance from frontend:", utterance);
  console.log("received setting from frontend:", setting);
  console.log("received conversation type from frontend:", conversationType);
  console.log("received tone from frontend:", tone);

  if(name || age || about){
    namevalue = name;
    agevalue = age;
    aboutvalue = about;
  }
  // if (aphasiaType) {
  //   value = aphasiaType;
  //   return json({
  //     aphasiaType: aphasiaType, // Return the aphasiaType data in the response body
  //   });
  // }

  if (utterance) {
    let responseTexts = null;
    do {
      responseTexts = null;
      console.log("utterance:", utterance);

      try {
        const chatResponse = await retryWithExponentialBackoff(async () => {
          return await openai.completions.create({
            model: model, // Use the GPT-3 model
            prompt:
              `You are an expert in communication disorders, specifically ${value}. Your task is to transform an utterance from a person with Broca's aphasia into a grammatically correct sentence and predict the next several words they will say. Do NOT request any additional information or context or ask any questions. Only provide the  3 transformed predicted sentences based on the utterance provided. Do not attempt to change the utterance itself in any way.
              This patient name is ${name}, and he is ${age} years old. This is a Profile about him:
              ${about}. 
            
              Please consider the following about the speaker:
              - Current setting: ${setting}
              - Type of conversation they are having: ${conversationType}
              - Tone of voice they are trying to convey: ${tone}

              Formatting examples:
              
              Utterance: "walk dog"
                Prediction 1: "I will take the dog for a walk."
                Prediction 2: "Have you walked the dog today?"
                Prediction 3: "Can you go walk the dog?"
              Utterance: "Book book two table"
                Prediction 1: "Give me both books on the table."
                Prediction 2: "There are two books on the table."
                Prediction 3: "Can you place the books on the table for me?"
              Utterance: "I want take kids"
                Prediction 1: "Can you please take the kids for me?"
                Prediction 2: "Do you want to take the kids?"
                Prediction 3: "I have to take the kids somewhere."
              Utterance: "Sweaty I need"
                Prediction 1: "I am sweaty and I need a hot shower."
                Prediction 2: "I am sweaty and hot, I neeed water."
                Prediciton 3: "I am sweaty; can I get a towel?"
              Utterance: "Cat seems cat"
                Prediction 1: "Do you have a cat? You seem like a cat person."
                Prediction 2: "The cat seems hungry"
                Prediction 3: "Is the cat angry?"
              Utterance: "I I need I need some"
                Prediction 1: "I need some water."
                Prediction 2: "I need to go to sleep."
                Prediction 3: "You've got something I need!"
              Utterance: "${utterance}"
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
        .map((s) => s.replace(/['"]+/g, ''))
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
