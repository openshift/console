/**
 * Prompt length validation utilities for OLS prompts.
 *
 * OpenAI enforces a hard limit of 32,000 characters on a single prompt/message.
 * Prompts sent to OpenShift Lightspeed must stay within this limit, otherwise the
 * request is rejected before it ever reaches the model.
 */

/** Maximum number of characters allowed in a single OpenAI prompt/message. */
export const OPENAI_PROMPT_CHARACTER_LIMIT = 32000;

export type PromptValidationResult = {
  /** Whether the prompt is within the character limit. */
  valid: boolean;
  /** Actual character length of the prompt. */
  length: number;
  /** Character limit the prompt was validated against. */
  limit: number;
};

/**
 * Validate that a generated prompt does not exceed the OpenAI character limit.
 * Throws an Error when the limit is exceeded so oversized prompts surface as hard
 * failures in tests and development rather than silent runtime rejections at OLS.
 *
 * @param prompt - The generated prompt text to validate.
 * @param promptName - Identifier used in the error message.
 * @param limit - Character limit to validate against (defaults to the OpenAI limit).
 * @returns The validation result including the actual length and the limit used.
 */
export const validatePromptLength = (
  prompt: string,
  promptName = 'prompt',
  limit: number = OPENAI_PROMPT_CHARACTER_LIMIT,
): PromptValidationResult => {
  const { length } = prompt;
  const valid = length <= limit;

  if (!valid) {
    throw new Error(
      `OLS ${promptName} exceeds the OpenAI ${limit}-character limit (actual: ${length}). ` +
        'Reduce the prompt before shipping.',
    );
  }

  return { valid, length, limit };
};
