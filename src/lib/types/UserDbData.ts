import type { ContextDbData } from "./Context";

export interface UserDbData {
  name: string;
  age: number;
  about: string;
  context: ContextDbData;
}
