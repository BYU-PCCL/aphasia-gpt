import { writable } from 'svelte/store';
import { CONVERSATION_TYPE_OPTIONS, DEFAULT_CONVERSATION_TYPE, DEFAULT_SETTING, DEFAULT_TONE, SETTING_OPTIONS, TONE_OPTIONS } from "@/lib/constants";
import { ContextTitle } from "@/lib/types/Context";
import type Context from "@/lib/types/Context";

/**
 * The current state of the conversational contexts
 */
type ContextStore = {
  settingContext: Context;
  typeContext: Context;
  toneContext: Context;
};

const createContextStore = () => {
  const { subscribe, set, update } = writable<ContextStore>({
    settingContext: {
      contextTitle: ContextTitle.SETTING,
      options: SETTING_OPTIONS,
      selection: getInitialSelection(SETTING_OPTIONS, DEFAULT_SETTING),
      inputValue: "",
    },
    typeContext: {
      contextTitle: ContextTitle.TYPE,
      options: CONVERSATION_TYPE_OPTIONS,
      selection: getInitialSelection(CONVERSATION_TYPE_OPTIONS, DEFAULT_CONVERSATION_TYPE),
      inputValue: "",
    },
    toneContext: {
      contextTitle: ContextTitle.TONE,
      options: TONE_OPTIONS,
      selection: getInitialSelection(TONE_OPTIONS, DEFAULT_TONE),
      inputValue: "",
    },
  });

  /**
   * Returns the default selection if it is in the options, otherwise returns the first option.
   * @param options Options to select from
   * @param defaultSelection Default selection
   * @returns The option to be used as the initial selection
   */
  function getInitialSelection(options: string[], defaultSelection: string) {
    if (options.includes(defaultSelection)) {
      return defaultSelection;
    } else if (options.length > 0) {
      return options[0];
    } else {
      return "";
    }
  }

  /**
   * Adds the current input value for the given context to the options for that context.
   * Duplicates are not added.
   * @param context Context to add the input value to
   */
  function addOption(context: Context) {
    if (!context.options.includes(context.inputValue)) {
      context.options.push(context.inputValue);
      context.inputValue = "";
    }
  }

  /**
   * Removes the given option from the given context's options.
   * Cannot remove the last remaining option.
   * If the current selection is removed, the first option becomes the new selection.
   * @param context Context to remove the option from
   * @param option Option to remove
   */
  function removeOption(context: Context, option: string) {
    if (context.options.length > 1) {
      context.options = context.options.filter((opt) => opt !== option);
      if (context.selection === option) {
        context.selection = context.options[0];
      }
    }
  }

  return {
    subscribe,
    set,

    /**
     * Adds the current setting input value to the options for the setting context
     */
    addSettingOption: () => update((contextStore) => {
      addOption(contextStore.settingContext);
      return contextStore;
    }),

    /**
     * Adds the current type input value to the options for the type context
     */
    addTypeOption: () => update((contextStore) => {
      addOption(contextStore.typeContext);
      return contextStore;
    }),

    /**
     * Adds the current tone input value to the options for the tone context
     */
    addToneOption: () => update((contextStore) => {
      addOption(contextStore.toneContext);
      return contextStore;
    }),

    /**
     * Removes the given setting option from the setting context
     * @param contextOption The option to remove
     */
    removeSettingOption: (contextOption: string) => update((contextStore) => {
      removeOption(contextStore.settingContext, contextOption);
      return contextStore;
    }),

    /**
     * Removes the given type option from the type context
     * @param contextOption The option to remove
     */
    removeTypeOption: (contextOption: string) => update((contextStore) => {
      removeOption(contextStore.typeContext, contextOption);
      return contextStore;
    }),

    /**
     * Removes the given tone option from the tone context
     * @param contextOption The option to remove
     */
    removeToneOption: (contextOption: string) => update((contextStore) => {
      removeOption(contextStore.toneContext, contextOption);
      return contextStore;
    }),

  };
}

export const contextStore = createContextStore();