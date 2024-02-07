/**
 * The title of a type/category conversational context
 */
export enum ContextTitle {
  SETTING = "setting",
  TYPE = "type",
  TONE = "tone"
}

/**
 * A type of conversational context, its options, and the current selection
 */
export default interface Context {
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
}

