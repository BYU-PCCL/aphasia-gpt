import {
  DEFAULT_CONVERSATION_TYPE,
  DEFAULT_CONVERSATION_TYPE_OPTIONS,
  DEFAULT_SETTING,
  DEFAULT_SETTING_OPTIONS,
  DEFAULT_TONE,
  DEFAULT_TONE_OPTIONS,
} from "../constants";
import type { ContextDbData } from "../types/Context";

export function getDefaultContextDbData(): ContextDbData {
  return {
    setting: {
      options: DEFAULT_SETTING_OPTIONS,
      selection: DEFAULT_SETTING,
    },
    type: {
      options: DEFAULT_CONVERSATION_TYPE_OPTIONS,
      selection: DEFAULT_CONVERSATION_TYPE,
    },
    tone: {
      options: DEFAULT_TONE_OPTIONS,
      selection: DEFAULT_TONE,
    },
  };
}
