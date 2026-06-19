/**
 * Prompt-specific constants
 * These values control timing recommendations and behavior in OLS prompts
 */

/**
 * Timeout constants for OLS prompt execution
 * These values control the timing recommendations in troubleshooting prompts
 */

/** Total timeout limit for OLS tool execution (seconds) */
export const PROMPT_TIMEOUT_TOTAL_LIMIT = 60;

/** Warning threshold - stop and analyze if approaching this (seconds) */
export const PROMPT_TIMEOUT_WARNING_THRESHOLD = 50;

/** Phase 2 execution threshold (seconds) */
export const PROMPT_TIMEOUT_PHASE_2_THRESHOLD = 35;

/** Phase 1 target completion time (seconds) */
export const PROMPT_TIMEOUT_PHASE_1_TARGET = 20;

/** Maximum execution time before forced completion (seconds) */
export const PROMPT_TIMEOUT_MAX_EXECUTION = 55;

/** Number of log lines to fetch per pod */
export const PROMPT_TIMEOUT_LOG_TAIL_LINES = 50;

/** Deprecated log tail size (not recommended) */
export const PROMPT_TIMEOUT_LOG_TAIL_LINES_FULL = 100;
