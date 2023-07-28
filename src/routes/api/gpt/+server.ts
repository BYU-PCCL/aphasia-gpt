import { Configuration, OpenAIApi } from "openai";
import { OPENAI_API_KEY } from "$env/static/private";
import { json, type RequestHandler } from "@sveltejs/kit";
import invariant from "tiny-invariant";
import { aphasiaType } from '../../../stores/user'
import { onDestroy } from 'svelte';

const configuration = new Configuration({
  apiKey: OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

let aphasiaStore: string;

aphasiaType.subscribe((value) => {
  aphasiaStore = value;
});

export const POST: RequestHandler = async ({ request }) => {
  const { utterance } = await request.json();
  console.log(aphasiaStore);
  const chatResponse = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: `You are an expert in communication disorders, specifically ${aphasiaStore}. Your task is to transform an utterance from a person with Broca's aphasia into a grammatically correct sentence and predict the next several words they will say. Do NOT request any additional information or context or ask any questions. Only provide the transformed predicted utterances. Examples:
        1. "Walk dog" => "I will take the dog for a walk"
        2. "Book book two table" => "There are two books on the table"
        3. "i want take kids" => "I want to take the kids to the park"
        4. "sweaty i need" => "I am sweaty and I need a hot shower"
        5. "cat seems cat" => "The cat seems hungry"
        6. "i i need i need some" => "I need to get some sleep"
        
        Now, please provide three transformed and predicted sentences (separated by line break) for the the following utterance: 
        `,
      },
      { role: "user", content: utterance.trim() },
    ],
    temperature: 1,
    n: 1,
  });

  const responseTexts = chatResponse.data.choices.map((choice) => choice.message?.content);
  const texts = responseTexts[0]?.split('\n').filter((s) => s.length > 0).map((s) => s.replace(/['"]+/g, ''));

  return json({
    texts,
  });
};
