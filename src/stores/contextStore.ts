import { get, writable } from "svelte/store";
import { userFirebaseUid } from "./user";
import type {
  ContextState,
  ContextDbData,
  ContextDbPutRequest,
  ContextDbPutResponse,
} from "@/lib/types/Context";
import { ContextTitle } from "@/lib/types/Context";
/**
 * The current state of the conversational contexts
 */
type ContextStore = {

  settingContext: ContextState;
  typeContext: ContextState;
  toneContext: ContextState;
};

function createContextStore() {
  const { subscribe, set, update } = writable<ContextStore>(getBaseStore());

  // If the selection of a context value has changed, update the database accordingly
  let lastSettingSelection = "";
  let lastTypeSelection = "";
  let lastToneSelection = "";
  subscribe((store: ContextStore) => {
    const userUid: string | null = get(userFirebaseUid);
    if (!userUid) return; // Don't update the database if the user is not logged in

    if (
      store.settingContext.selection !== lastSettingSelection &&
      store.settingContext.selection !== "" &&
      store.settingContext.options.length > 0
    ) {
      updateDatabase(
        store.settingContext,
        store.settingContext.options,
        store.settingContext.selection,
        userUid
      );
      lastSettingSelection = store.settingContext.selection;
    }
    if (
      store.typeContext.selection !== lastTypeSelection &&
      store.typeContext.selection !== "" &&
      store.typeContext.options.length > 0
    ) {
      updateDatabase(
        store.typeContext,
        store.typeContext.options,
        store.typeContext.selection,
        userUid
      );
      lastTypeSelection = store.typeContext.selection;
    }
    if (
      store.toneContext.selection !== lastToneSelection &&
      store.toneContext.selection !== "" &&
      store.toneContext.options.length > 0
    ) {
      updateDatabase(
        store.toneContext,
        store.toneContext.options,
        store.toneContext.selection,
        userUid
      );
      lastToneSelection = store.toneContext.selection;
    }
  });

  /**
   * Updates the store with the given database values
   */
  function setStoreFromDatabaseValues(dbData: ContextDbData) {
    update((store) => {
      store.settingContext.options = dbData.setting.options;
      store.settingContext.selection = dbData.setting.selection;
      store.typeContext.options = dbData.type.options;
      store.typeContext.selection = dbData.type.selection;
      store.toneContext.options = dbData.tone.options;
      store.toneContext.selection = dbData.tone.selection;
      return store;
    });
  }

  /**
   * Updates the database with the given context's options and selection
   * @param context Context to update
   * @param options Updated options for the context
   * @param selection Updated selection for the context
   * @param userUid UID of the user to update the context for
   */
  async function updateDatabase(
    context: ContextState,
    options: string[],
    selection: string,
    userUid: string
  ) {
    const response = await fetch("/api/firebase/context", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        uid: userUid,
        contextTitle: context.contextTitle,
        options: options,
        selection: selection,
      } as ContextDbPutRequest),
    });

    let responseData = await response.json();
    if (response.ok) {
      // Update the state with the successful results
      responseData = responseData as ContextDbPutResponse;
      context.options = responseData.options;
      context.inputValue = "";
      context.errorMessage = "";
      context.selection = responseData.selection;
    } else {
      context.errorMessage = responseData.error || "Unknown error";
    }

    // Trigger UI update
    update((value: ContextStore) => {
      return value;
    });
  }

  /**
   * Adds the current input value for the given context to the options for that context.
   * Empty/whitespace and duplicates are not added.
   * @param context Context to add the input value to
   */
  async function addOption(context: ContextState) {
    const userUid: string | null = get(userFirebaseUid);
    if (!userUid) {
      console.error("User is not logged in");
      return;
    }

    context.errorMessage = "";
    const trimmedInput = context.inputValue.trim();
    if (trimmedInput == "") {
      return;
    }
    if (context.options.includes(trimmedInput)) {
      context.errorMessage = "Option already exists";
      return;
    }

    // Add the option to a copy of the options
    const updatedOptions = context.options.slice();
    updatedOptions.push(trimmedInput);

    await updateDatabase(context, updatedOptions, context.selection, userUid);
  }

  /**
   * Removes the given option from the given context's options.
   * Cannot remove the last remaining option.
   * If the current selection is removed, the first option becomes the new selection.
   * @param context Context to remove the option from
   * @param option Option to remove
   */
  async function removeOption(context: ContextState, option: string) {
    const userUid: string | null = get(userFirebaseUid);
    if (!userUid) {
      console.error("User is not logged in");
      return;
    }

    context.errorMessage = "";
    if (context.options.length <= 1) {
      context.errorMessage = "Cannot remove the last option";
      return;
    }

    // Remove the option from a copy of the options
    const updatedOptions = context.options.filter((opt) => opt !== option);
    let selection = context.selection;
    if (context.selection === option) {
      selection = updatedOptions[0];
    }

    await updateDatabase(context, updatedOptions, selection, userUid);
  }

  return {
    subscribe,
    set,

    /**
     * Initializes the context store with the current database values
     */
    initialize: async () => {
      const userUid: string | null = get(userFirebaseUid);
      if (!userUid) {
        // Don't fetch from the DB if the user is not logged in
        return;
      }

      const initialDatabaseValues: ContextDbData = await getDatabaseValues(userUid);

      // Track initial values for later comparison
      lastSettingSelection = initialDatabaseValues.setting.selection;
      lastTypeSelection = initialDatabaseValues.type.selection;
      lastToneSelection = initialDatabaseValues.tone.selection;

      setStoreFromDatabaseValues(initialDatabaseValues);
    },

    /**
     * Resets the context store to its initial, blank state
     */
    clear: () => {
      set(getBaseStore());
    },

    /**
     * Clears error messages and input values for all contexts
     */
    clearForm: () => {
      update((contextStore) => {
        contextStore.settingContext.inputValue = "";
        contextStore.settingContext.errorMessage = "";
        contextStore.typeContext.inputValue = "";
        contextStore.typeContext.errorMessage = "";
        contextStore.toneContext.inputValue = "";
        contextStore.toneContext.errorMessage = "";
        return contextStore;
      });
    },

    /**
     * Resets in the database the user's conversational contexts to their original default values, erasing any changes made
     */
    resetUserContextsToDefaults: async () => {
      const userUid: string | null = get(userFirebaseUid);
      if (!userUid) {
        console.error("User is not logged in");
        return;
      }

      const response = await fetch("/api/firebase/context", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uid: userUid,
        }),
      });

      const responseData = await response.json();
      if (response.ok) {
        setStoreFromDatabaseValues(responseData as ContextDbData);
      } else {
        throw new Error(responseData.error || "Unknown error");
      }
    },

    /**
     * Adds the current setting input value to the options for the setting context
     */
    addSettingOption: () =>
      update((contextStore) => {
        addOption(contextStore.settingContext);
        return contextStore;
      }),

    /**
     * Adds the current type input value to the options for the type context
     */
    addTypeOption: () =>
      update((contextStore) => {
        addOption(contextStore.typeContext);
        return contextStore;
      }),

    /**
     * Adds the current tone input value to the options for the tone context
     */
    addToneOption: () =>
      update((contextStore) => {
        addOption(contextStore.toneContext);
        return contextStore;
      }),

    /**
     * Removes the given setting option from the setting context
     * @param contextOption The option to remove
     */
    removeSettingOption: (contextOption: string) =>
      update((contextStore) => {
        removeOption(contextStore.settingContext, contextOption);
        return contextStore;
      }),

    /**
     * Removes the given type option from the type context
     * @param contextOption The option to remove
     */
    removeTypeOption: (contextOption: string) =>
      update((contextStore) => {
        removeOption(contextStore.typeContext, contextOption);
        return contextStore;
      }),

    /**
     * Removes the given tone option from the tone context
     * @param contextOption The option to remove
     */
    removeToneOption: (contextOption: string) =>
      update((contextStore) => {
        removeOption(contextStore.toneContext, contextOption);
        return contextStore;
      }),
  };
}

async function getDatabaseValues(uid: string) {
  const response = await fetch(`/api/firebase/context?uid=${encodeURIComponent(uid)}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const responseData = await response.json();
  if (response.ok) {
    return responseData as ContextDbData;
  } else {
    throw new Error(responseData.error || "Unknown error");
  }
}

function getBaseStore(): ContextStore {
  return {
    settingContext: {
      contextTitle: ContextTitle.SETTING,
      options: [],
      selection: "",
      inputValue: "",
      errorMessage: "",
    } as ContextState,
    typeContext: {
      contextTitle: ContextTitle.TYPE,
      options: [],
      selection: "",
      inputValue: "",
      errorMessage: "",
    } as ContextState,
    toneContext: {
      contextTitle: ContextTitle.TONE,
      options: [],
      selection: "",
      inputValue: "",
      errorMessage: "",
    } as ContextState,
  } as ContextStore;
}

export const contextStore = createContextStore();
