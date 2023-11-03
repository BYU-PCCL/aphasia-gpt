import type { Handle } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.username = event.cookies.get("username") ?? null;
  const response = await resolve(event);
  return response;
};