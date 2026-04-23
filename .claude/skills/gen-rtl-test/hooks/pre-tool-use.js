/**
 * Pre-Tool-Use Hook for gen-rtl-test skill
 *
 * Enforces critical constraints that cannot be violated:
 * 1. Block Write operations that create test files with require()
 * 2. Ensure test files follow naming conventions
 * 3. Prevent completion without test execution
 *
 * This hook provides STRUCTURAL enforcement - Claude cannot bypass these rules.
 */

export function preToolUse({ tool, parameters, conversation }) {
  // Only enforce when gen-rtl-test skill is active
  const isSkillActive = conversation.messages.some(msg =>
    msg.content?.includes('<command-name>/gen-rtl-test</command-name>') ||
    msg.content?.includes('gen-rtl-test skill') ||
    msg.content?.includes('generating React Testing Library tests')
  );

  if (!isSkillActive) {
    return { allowed: true };
  }

  // ============================================================================
  // RULE 1: Block test files containing require()
  // ============================================================================
  if (tool === 'Write') {
    const filePath = parameters.file_path;
    const content = parameters.content;

    // Check if this is a test file
    const isTestFile = filePath.match(/\.(spec|test)\.(tsx?|jsx?)$/);

    if (isTestFile && content) {
      // Check for require() calls (except jest.requireActual)
      const requirePattern = /(?<!jest\.)require\s*\(/g;
      const hasInvalidRequire = requirePattern.test(content);

      if (hasInvalidRequire) {
        return {
          allowed: false,
          reason: `🚫 BLOCKED: Test file contains require() calls.

CRITICAL VIOLATION: ${filePath}

The test file you're trying to write contains require() calls, which violates
the ZERO TOLERANCE rule for ES6 imports.

✅ REQUIRED: Use ES6 imports ONLY
❌ FORBIDDEN: require() calls (except jest.requireActual for partial mocks)

Fix the code by:
1. Move all require() calls to ES6 import statements at the top of the file
2. For mocks, return simple values (null, strings, children) - NO React.createElement
3. Import modules once at the top and use them throughout the file

Example fix:
  ❌ const { k8sCreate } = require('@console/internal/module/k8s');
  ✅ import { k8sCreate } from '@console/internal/module/k8s';

  ❌ jest.mock('../Component', () => {
       const React = require('react');
       return () => React.createElement('div');
     });
  ✅ jest.mock('../Component', () => () => null);

This is structurally enforced - the file will not be written until fixed.`
        };
      }
    }
  }

  // ============================================================================
  // RULE 2: Enforce test file naming conventions
  // ============================================================================
  if (tool === 'Write') {
    const filePath = parameters.file_path;

    // Check if creating a test file
    const isTestFile = filePath.match(/\.(spec|test)\.(tsx?|jsx?)$/);

    if (isTestFile) {
      // Test files must be in __tests__ directory
      const isInTestsDir = filePath.includes('/__tests__/');

      if (!isInTestsDir) {
        return {
          allowed: false,
          reason: `🚫 BLOCKED: Test file not in __tests__/ directory.

NAMING VIOLATION: ${filePath}

Test files must follow the convention:
  ComponentDirectory/__tests__/ComponentName.spec.tsx

Current path does not include /__tests__/

✅ CORRECT: packages/console-app/src/components/MyForm/__tests__/MyForm.spec.tsx
❌ INCORRECT: packages/console-app/src/components/MyForm/MyForm.spec.tsx

Move the test file to the __tests__/ directory.`
        };
      }

      // Ensure .spec extension (not .test)
      if (!filePath.includes('.spec.')) {
        return {
          allowed: false,
          reason: `🚫 BLOCKED: Test file must use .spec extension.

NAMING VIOLATION: ${filePath}

OpenShift Console uses .spec.tsx extension for test files, not .test.tsx

✅ CORRECT: MyComponent.spec.tsx
❌ INCORRECT: MyComponent.test.tsx

Rename to use .spec extension.`
        };
      }
    }
  }

  // ============================================================================
  // RULE 3: Block expect.anything() usage
  // ============================================================================
  if (tool === 'Write') {
    const filePath = parameters.file_path;
    const content = parameters.content;
    const isTestFile = filePath.match(/\.(spec|test)\.(tsx?|jsx?)$/);

    if (isTestFile && content) {
      const hasExpectAnything = /expect\.anything\(\)/.test(content);

      if (hasExpectAnything) {
        return {
          allowed: false,
          reason: `🚫 BLOCKED: Test file contains expect.anything().

CRITICAL VIOLATION: ${filePath}

Using expect.anything() defeats the purpose of testing and is strictly forbidden.

❌ FORBIDDEN:
  expect(mockFn).toHaveBeenCalledWith(expect.anything());

✅ REQUIRED: Use specific assertions:
  expect(mockFn).toHaveBeenCalledWith(expect.any(String));
  expect(mockFn).toHaveBeenCalledWith(expect.objectContaining({ key: 'value' }));
  expect(mockFn).toHaveBeenCalledWith(expect.stringContaining('partial'));

This is structurally enforced - fix all expect.anything() calls.`
        };
      }
    }
  }

  // All other tool uses are allowed
  return { allowed: true };
}
