/**
 * The title of a type/category conversational context
 */
export enum ContextTitle {
  SETTING = "setting",
  TYPE = "type",
  TONE = "tone",
}

/**
 * The current state of the conversational contexts as stored in the database
 */
export interface ContextDbData {
  setting: {
    options: string[];
    selection: string;
  };
  type: {
    options: string[];
    selection: string;
  };
  tone: {
    options: string[];
    selection: string;
  };
}

/**
 * API Request object to update the conversational context for the given user
 */
export interface ContextDbPutRequest {
  uid: string;
  contextTitle: ContextTitle;
  options: string[];
  selection: string;
}

/**
 * API Response object for updating the conversational context for the given user
 */
export interface ContextDbPutResponse {
  options: string[];
  selection: string;
}

/**
 * A type of conversational context and related state data
 */
export interface ContextState {
  /**
   * The title of this type/category of context
   */
  contextTitle: ContextTitle;

  /**
   * The options available for this context
   */
  options: string[];

  /**
   * The current selection for this context
   */
  selection: string;

  /**
   * The current input value for adding to the options
   */
  inputValue: string;

  /**
   * The current error message for the input value
   */
  errorMessage: string;
}
