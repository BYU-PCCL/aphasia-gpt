

if (!import.meta.env.SSR) {
  throw new Error("This module can only be imported on the server side.");
}
import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getUserRef } from "../firebaseUtils";
import type { EditProfileData } from "@/lib/types/EditProfile";

async function EditUserData(username: string, name: string, age: string, about: string) {
  const userRef = getUserRef(username);

  const nameRef = userRef.child("name");
  nameRef.set(name);
  const ageRef = userRef.child("age");
  ageRef.set(age);
  const aboutRef = userRef.child("about");
  aboutRef.set(about);
}

/**
 * Get editable profile data for the given user
 */
export const GET: RequestHandler = async (req) => {
  const username = req.url.searchParams.get("username");
  if (!username || username === "") {
    throw error(400, "Username is required");
  }

  const userRef = getUserRef(username);
  const name = (await userRef.child("name").get()).val();
  const age = (await userRef.child("age").get()).val();
  const about = (await userRef.child("about").get()).val();

  const editProfileData: EditProfileData = {
    username,
    name,
    age,
    about,
  };

  return new Response(JSON.stringify(editProfileData), {
    status: 200,
    headers: {
      "content-type": "application/json",
    },
  });
};

export const POST: RequestHandler = async ({ request }) => {
console.log("fire base is called");
try {
const {username, name, age, about} = await request.json();
console.log('username from frontend:', username);
console.log('name from frontend:', name);
console.log('age from frontend:', age);
console.log('about from frontend:', about);
EditUserData(username, name, age, about);
return json({
status: 200,
body: { message: 'Data received successfully.' },
});
} catch (error) {
console.error('Error processing request:', error);
return json({
status: 500,
body: { error: 'hi Server Error' },
});
}
};