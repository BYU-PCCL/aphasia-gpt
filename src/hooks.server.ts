import type { Handle } from "@sveltejs/kit";
import type { UserCookies } from "./lib/types/UserCookies";

/**
 * Sets event.locals with user cookies for use in page/layout `load()` functions
 */
export const handle: Handle = async ({ event, resolve }) => {
  const userCookies: Partial<UserCookies> = {};
  const keys: (keyof UserCookies)[] = ["userFirebaseUid", "userEmail", "userName"];
  for (const key of keys) {
    const cookieValue = event.cookies.get(key);
    userCookies[key] = cookieValue ?? null;
  }
  event.locals.userCookies = userCookies;
  const response = await resolve(event);
  return response;
};
