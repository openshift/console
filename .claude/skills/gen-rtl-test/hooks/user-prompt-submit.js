/**
 * User-Prompt-Submit Hook for gen-rtl-test skill
 *
 * Automatically injects accurate context into the conversation:
 * 1. Detects modified React components from git diff
 * 2. Surfaces test execution status
 * 3. Provides current test file state
 *
 * This ensures Claude always has accurate, current state rather than
 * relying on it to run commands.
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

export function userPromptSubmit({ prompt, conversation }) {
  // Only inject context when gen-rtl-test skill is active
  const isSkillActive = conversation.messages.some(msg =>
    msg.content?.includes('<command-name>/gen-rtl-test</command-name>') ||
    msg.content?.includes('/gen-rtl-test') ||
    prompt.toLowerCase().includes('/gen-rtl-test')
  );

  if (!isSkillActive) {
    return { prompt };
  }

  let injectedContext = '';

  // ============================================================================
  // Auto-detect modified React components from git diff
  // ============================================================================
  try {
    const gitDiff = execSync('git diff --name-only HEAD 2>/dev/null || echo ""', {
      encoding: 'utf-8',
      cwd: process.cwd()
    }).trim();

    if (gitDiff) {
      const files = gitDiff.split('\n').filter(f => f);

      // Filter for React component files
      const componentFiles = files.filter(file => {
        // Include .tsx and .jsx files
        if (!file.match(/\.(tsx|jsx)$/)) return false;

        // Exclude test files
        if (file.match(/\.(spec|test)\.(tsx|jsx)$/)) return false;

        // Exclude __tests__, __mocks__ directories
        if (file.includes('__tests__/') || file.includes('__mocks__/')) return false;

        // Exclude type definition files
        if (file.includes('.types.ts') || file.includes('.types.tsx')) return false;

        // Exclude common non-component files
        if (file.match(/(utils|helpers|constants|types|models)\.(tsx?|jsx?)$/)) return false;

        return true;
      });

      if (componentFiles.length > 0) {
        injectedContext += '\n\n<git-diff-components>';
        injectedContext += '\nModified React components detected in git diff:\n';
        componentFiles.forEach((file, idx) => {
          injectedContext += `\n[${idx + 1}] ${file}`;
        });
        injectedContext += '\n\nUse these for automatic component detection when no arguments provided.';
        injectedContext += '\n</git-diff-components>\n';
      }
    }
  } catch (error) {
    // Git not available or not in a repo - silently skip
  }

  // ============================================================================
  // Detect recently created test files and their status
  // ============================================================================
  try {
    // Check for recently modified test files in the last 5 minutes
    const recentTests = execSync(
      'find . -name "*.spec.tsx" -o -name "*.spec.ts" -mmin -5 2>/dev/null | head -10',
      { encoding: 'utf-8', cwd: process.cwd() }
    ).trim();

    if (recentTests) {
      const testFiles = recentTests.split('\n').filter(f => f);

      if (testFiles.length > 0) {
        injectedContext += '\n<recent-test-files>';
        injectedContext += '\nRecently modified test files (last 5 minutes):\n';

        testFiles.forEach(file => {
          injectedContext += `\n- ${file}`;

          // Check if file has require() violations
          const fullPath = resolve(process.cwd(), file);
          if (existsSync(fullPath)) {
            const content = readFileSync(fullPath, 'utf-8');
            const hasRequire = /(?<!jest\.)require\s*\(/.test(content);
            const hasExpectAnything = /expect\.anything\(\)/.test(content);

            if (hasRequire) {
              injectedContext += ' ⚠️ CONTAINS require() - must fix';
            }
            if (hasExpectAnything) {
              injectedContext += ' ⚠️ CONTAINS expect.anything() - must fix';
            }
          }
        });

        injectedContext += '\n</recent-test-files>\n';
      }
    }
  } catch (error) {
    // Find not available - skip
  }

  // ============================================================================
  // Inject test utilities availability
  // ============================================================================
  const utilsPath = resolve(process.cwd(), 'frontend/packages/console-shared/src/test-utils/unit-test-utils.ts');
  if (existsSync(utilsPath)) {
    injectedContext += '\n<available-test-utilities>';
    injectedContext += '\n✅ verifyInputField utility is available at:';
    injectedContext += '\n   @console/shared/src/test-utils/unit-test-utils';
    injectedContext += '\n\nUSE THIS for all text input field testing (MANDATORY for form fields).';
    injectedContext += '\n</available-test-utilities>\n';
  }

  // If we have any context to inject, prepend it to the prompt
  if (injectedContext) {
    return {
      prompt: `${injectedContext}\n\n${prompt}`
    };
  }

  return { prompt };
}
