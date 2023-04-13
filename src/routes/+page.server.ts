import type { Actions, PageServerLoad } from "./$types";

export const load = (async ({ locals }) => {
  return {
    username: locals.username,
  };
}) satisfies PageServerLoad;

export const actions = {
  login: async ({ request, cookies }) => {
    const formData = await request.formData();
    const username = formData.get("username") as string;
    cookies.set("username", username, {
      path: "/",
    });
  },
  logout: async ({ cookies }) => {
    cookies.delete("username", {
      path: "/",
    });
  },
} satisfies Actions;
