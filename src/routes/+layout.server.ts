import type { LayoutServerLoad } from "./$types";

/**
 * Makes available a top-level prop with global data
 */
export const load = (async ({ locals }) => {
  return {
    userFirebaseUid: locals.userCookies.userFirebaseUid,
    userEmail: locals.userCookies.userEmail,
    userName: locals.userCookies.userName,
  };
}) satisfies LayoutServerLoad;
