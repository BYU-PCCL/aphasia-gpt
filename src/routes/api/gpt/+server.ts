import { Configuration, OpenAIApi } from "openai";
import { OPENAI_API_KEY } from "$env/static/private";
import { json, type RequestHandler } from "@sveltejs/kit";
import invariant from "tiny-invariant";

const configuration = new Configuration({
  apiKey: OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export const POST: RequestHandler = async ({ request }) => {
  const { utterance } = await request.json();

  console.log("calling openai with utterance:", utterance);
  invariant(typeof utterance === "string", "utterance required");

  const chatResponse = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: `You are an expert in communication disorders, specifically Broca's aphasia. Your task is to transform an utterance from a person with Broca's aphasia into a grammatically correct sentence and predict the next several words they will say. Do NOT request any additional information or context or ask any questions. Only provide the transformed predicted utterances. Examples:
        1. "Walk dog" => "I will take the dog for a walk"
        2. "Book book two table" => "There are two books on the table"
        3. "i want take kids" => "I want to take the kids to the park"
        4. "sweaty i need" => "I am sweaty and I need a hot shower"
        5. "cat seems cat" => "The cat seems hungry"
        6. "i i need i need some" => "I need to get some sleep"
        
        Do not wrap the output in quotes. Now, please transform and predict the following utterance: 
        `,
      },
      { role: "user", content: utterance.trim() },
    ],
    temperature: 1,
    n: 3,
  });

  const texts = chatResponse.data.choices.map((choice) => choice.message?.content);

  return json({
    texts,
  });
};
