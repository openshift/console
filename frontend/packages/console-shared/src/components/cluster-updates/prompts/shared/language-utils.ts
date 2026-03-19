import i18next from 'i18next';
import { supportedLocales } from '@console/app/src/components/user-preferences/language/const';

/**
 * Language constraint utilities for OLS prompts
 * Ensures prompts are generated in the user's selected language
 */

/**
 * Parse language display name from supportedLocales format
 * Format: "Native Name - English Name" (e.g., "Español - Spanish")
 * Special case: English is just "English"
 *
 * @param displayName - Display name from supportedLocales
 * @returns Object with nativeName and englishName, or null if parsing fails
 */
const parseLanguageDisplayName = (
  displayName: string,
): { nativeName: string; englishName: string } | null => {
  // Handle English special case (no delimiter)
  if (displayName === 'English') {
    return { nativeName: 'English', englishName: 'English' };
  }

  // Parse "Native Name - English Name" format
  const delimiterIndex = displayName.indexOf(' - ');
  if (delimiterIndex === -1) {
    return null; // Invalid format
  }

  const nativeName = displayName.slice(0, delimiterIndex).trim();
  const englishName = displayName.slice(delimiterIndex + 3).trim();

  if (!nativeName || !englishName) {
    return null; // Empty parts
  }

  return { nativeName, englishName };
};

/**
 * Get the current language constraint for prompts
 * Uses supportedLocales as the single source of truth for language configuration
 * Always uses the current UI language from i18next
 *
 * @returns Language constraint string to be included in prompts
 *
 * @example
 * ```ts
 * const constraint = getLanguageConstraint();
 * // For English: "- LANGUAGE REQUIREMENT: Respond in English..."
 * // For Spanish: "- CRITICAL LANGUAGE REQUIREMENT: You MUST respond ENTIRELY in Spanish..."
 * ```
 */
export const getLanguageConstraint = (): string => {
  const targetLang = i18next.language || 'en';

  // English constraint used for default, unsupported languages, and fallbacks
  const englishConstraint =
    '- LANGUAGE REQUIREMENT: Respond in English. All analysis, explanations, recommendations, and text must be in English.';

  // Short-circuit for English
  if (targetLang === 'en') {
    return englishConstraint;
  }

  // Use supportedLocales as the authoritative source
  const languageDisplayName = supportedLocales[targetLang];
  if (!languageDisplayName) {
    // Unsupported language - fall back to English
    return englishConstraint;
  }

  // Parse the display name to extract native and English names
  const parsed = parseLanguageDisplayName(languageDisplayName);
  if (!parsed) {
    // Invalid format - fall back to English
    return englishConstraint;
  }

  const { nativeName, englishName } = parsed;

  // Generate critical language requirement for non-English languages
  return `- CRITICAL LANGUAGE REQUIREMENT: You MUST respond ENTIRELY in ${englishName} (${nativeName}). Every explanation, recommendation, and analysis must be in ${englishName}. However, you MUST preserve the following in English:
  * Kubernetes/OpenShift resource types (Pod, Node, ClusterVersion, ClusterOperator, MachineConfigPool, etc.)
  * API field names and condition types (status, spec, metadata, Progressing, Available, Degraded, etc.)
  * Technical identifiers (file paths, URLs, command names, resource names, etc.)
  * Error messages and log output from the cluster
Only translate your explanatory text and recommendations. Do NOT translate technical terminology that has specific meaning in Kubernetes/OpenShift.`;
};
