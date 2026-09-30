import type { VerifiedClusterVersionConditions } from '../cluster-version-helpers';
import { createPreCheckPrompt } from '../prompts/precheck';
import { createPreCheckNoUpdatesPrompt } from '../prompts/precheck-no-updates';
import { createPreCheckSpecificVersionPrompt } from '../prompts/precheck-specific';
import { createProgressPrompt } from '../prompts/progress';
import { OPENAI_PROMPT_CHARACTER_LIMIT, validatePromptLength } from '../prompts/shared/validation';
import { createTroubleshootPrompt } from '../prompts/troubleshoot';

const CURRENT_VERSION = '4.21.4';
const TARGET_VERSION = '4.22.1';
const VERIFIED_CONDITIONS: VerifiedClusterVersionConditions = {
  Failing: 'False',
  Upgradeable: 'absent',
  Available: 'True',
  Progressing: 'False',
  RetrievedUpdates: 'True',
  ReleaseAccepted: 'True',
  ImplicitlyEnabledCapabilities: 'False',
};

/**
 * Every OLS prompt is sent to OpenShift Lightspeed / OpenAI, which rejects any
 * single prompt longer than 32,000 characters. These tests generate each prompt
 * and assert it stays within the limit so oversized prompts are caught in CI
 * rather than at runtime.
 */
describe('OLS prompt character limits', () => {
  const prompts: [name: string, prompt: string][] = [
    ['pre-check (updates available)', createPreCheckPrompt(CURRENT_VERSION, VERIFIED_CONDITIONS)],
    ['pre-check (no updates)', createPreCheckNoUpdatesPrompt(CURRENT_VERSION, VERIFIED_CONDITIONS)],
    [
      'pre-check (specific version)',
      createPreCheckSpecificVersionPrompt(CURRENT_VERSION, TARGET_VERSION, VERIFIED_CONDITIONS),
    ],
    ['troubleshoot', createTroubleshootPrompt(CURRENT_VERSION, TARGET_VERSION)],
    [
      'progress',
      createProgressPrompt(CURRENT_VERSION, TARGET_VERSION, {
        total: 33,
        updated: 10,
        updating: 1,
        pending: 22,
        failed: 0,
      }),
    ],
  ];

  it.each(prompts)('generates "%s" within the OpenAI character limit', (name, prompt) => {
    const result = validatePromptLength(prompt, name);

    expect(result.length).toBeLessThanOrEqual(OPENAI_PROMPT_CHARACTER_LIMIT);
    expect(result.valid).toBe(true);
  });
});

describe('validatePromptLength', () => {
  it('reports a prompt within the limit as valid', () => {
    const result = validatePromptLength('short prompt', 'test');

    expect(result).toEqual({
      valid: true,
      length: 'short prompt'.length,
      limit: OPENAI_PROMPT_CHARACTER_LIMIT,
    });
  });

  it('throws when a prompt exceeds the limit', () => {
    const oversized = 'x'.repeat(OPENAI_PROMPT_CHARACTER_LIMIT + 1);

    expect(() => validatePromptLength(oversized, 'oversized')).toThrow(
      /exceeds the OpenAI \d+-character limit/,
    );
  });

  it('honors a custom limit', () => {
    expect(() => validatePromptLength('abcdef', 'custom', 3)).toThrow();
    expect(() => validatePromptLength('ab', 'custom', 3)).not.toThrow();
  });
});
