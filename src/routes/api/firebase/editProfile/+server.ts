

if (!import.meta.env.SSR) {
  throw new Error("This module can only be imported on the server side.");
}
import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getUserRef } from "../firebaseUtils";
import type { EditProfileDbData } from "@/lib/types/EditProfile";

async function EditUserData(uid: string, name: string, age: number, about: string) {
  const userRef = getUserRef(uid);

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
  const uid = req.url.searchParams.get("uid");
  if (!uid || uid === "") {
    throw error(400, "UID is required");
  }

  const userRef = getUserRef(uid);
  const name = (await userRef.child("name").get()).val();
  const age = (await userRef.child("age").get()).val();
  const about = (await userRef.child("about").get()).val();

  const editProfileData: EditProfileDbData = {
    uid,
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
  try {
    const { uid, name, age, about } = (await request.json()) as EditProfileDbData;
    EditUserData(uid, name, age, about);
    return json({
      status: 200,
      body: { message: "Data received successfully." },
    });
  } catch (error) {
    return json({
      status: 500,
      body: { message: "Error receiving data." },
    });
  }
};