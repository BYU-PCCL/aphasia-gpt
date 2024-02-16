import type { PageServerLoad } from "./$types";

export const load = (async ({ locals }) => {
  return {
    username: locals.username,
  };
}) satisfies PageServerLoad;
