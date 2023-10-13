import type { Handle } from "@sveltejs/kit";
import { start_mongo } from "./db/mongo";


export const handle: Handle = async ({ event, resolve }) => {
  event.locals.username = event.cookies.get("username") ?? null;
  const response = await resolve(event);
  return response;
};

start_mongo().then(():void=>{
  console.log("Mongo started ");
}). catch(e => {console.error(e)})