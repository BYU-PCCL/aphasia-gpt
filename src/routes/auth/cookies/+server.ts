import type { UserCookies } from "@/lib/types/UserCookies";
import type { RequestHandler } from "@sveltejs/kit";

/**
 * Set the user cookies
 */
export const POST: RequestHandler = async ({ request }) => {
  const userCookies: UserCookies = await request.json();

  // Create an array of Set-Cookie headers from the userCookies object
  // Each element in the array is a string that includes a key from the userCookies
  // object and its corresponding value
  const setCookieHeaders = Object.keys(userCookies).map((key) => {
    if (userCookies[key as keyof UserCookies] === null) {
      // If the value is null, set the cookie to expire immediately
      return `${key}=; Path=/; HttpOnly; Max-Age=0`;
    } else {
      // Otherwise, set the cookie normally
      return `${key}=${userCookies[key as keyof UserCookies]}; Path=/; HttpOnly`;
    }
  });

  // For each Set-Cookie header in the setCookieHeaders array, create a new Response
  // object and append the Set-Cookie header to it
  let response = new Response(null, { status: 200 });
  setCookieHeaders.forEach((cookie) => {
    response = new Response(response.body, response);
    response.headers.append("Set-Cookie", cookie);
  });

  // Return the final Response object, which includes all the Set-Cookie headers
  return response;
};
