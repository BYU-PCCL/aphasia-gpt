import { error } from "@sveltejs/kit"; // Import the error function

export async function parseFormData(request: Request): Promise<FormData> {
  const contentType = request.headers.get("content-type");
  if (!contentType?.includes("multipart/form-data")) {
    throw error(400, "Invalid content type. Expected multipart/form-data.");
  }
  return await request.formData();
}
