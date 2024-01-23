import { Configuration, OpenAIApi } from "openai";
import { OPENAI_API_KEY } from "$env/static/private";
import { json, type RequestHandler } from "@sveltejs/kit";

const configuration = new Configuration({
  apiKey: OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
const model = 'gpt-3.5-turbo-instruct'; // Use the GPT-3 model

let value = "Broca's Aphasia";

export const POST: RequestHandler = async ({ request }) => {
  const { aphasiaType, utterance, tone } = await request.json();
  console.log('received aphasia type from frontend:', aphasiaType);
  console.log("received utterance from frontend:", utterance);
  console.log("received tone from frontend:", tone);

  if (aphasiaType) {
    value = aphasiaType;
    console.log(aphasiaType);
    return json({
      aphasiaType: aphasiaType, // Return the aphasiaType data in the response body
    });
  }

  if (utterance) {
    console.log(value);
    const chatResponse = await openai.createCompletion({
      model: model, // Use the GPT-3 model
      prompt: `You are an expert in communication disorders, specifically ${value}. Your task is to transform an utterance from a person with Broca's aphasia into a grammatically correct sentence and predict the next several words they will say. Do NOT request any additional information or context or ask any questions. Only provide the transformed predicted utterances. Examples:
          1. "Walk dog" => "I will take the dog for a walk"
          2. "Book book two table" => "There are two books on the table"
          3. "i want take kids" => "I want to take the kids to the park"
          4. "sweaty i need" => "I am sweaty and I need a hot shower"
          5. "cat seems cat" => "The cat seems hungry"
          6. "i i need i need some" => "I need to get some sleep"
          
          Now, please provide three transformed and predicted sentences (separated by line break) for the following utterance in a ${tone} tone of voice: 
          ${utterance}`,
      temperature: .5,
      max_tokens: 400, // Set the desired maximum token length for the response
      n: 1,
    });
    const responseTexts = chatResponse.data.choices?.[0]?.text;

    if (responseTexts) {
      console.log("generated text:", responseTexts);
    
      // Split the text into an array of sentences
      const texts = responseTexts.split('\n').filter((s: string) => s.length > 0).map((s) => s.replace(/['"]+/g, ''));
    
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