import { basename, resolve, sep } from 'path';
import { readFileSync } from 'fs';
import { sync as glob } from 'glob';
import { NAMESPACE_EXCEPTIONS } from '../i18n-scripts/namespace-map';

const FRONTEND_DIR = resolve(__dirname, '..');

/** Returns the expected i18n namespace for a file path relative to the frontend directory. */
const expectedNamespace = (file: string): string => {
  const segments = file.split(sep);
  if (segments[0] === 'packages') {
    const dir = segments[1];
    return NAMESPACE_EXCEPTIONS[dir] ?? dir;
  }
  return 'public';
};

// Sometimes the wrong i18n namespace is used in a locale file, which causes the
// locale file to be placed in the wrong directory (e.g., `console-app` namespace
// used in `public` causes it to be placed in `public/locales` instead). This
// causes issues when sending our i18n files to translation services.

describe('i18n structure', () => {
  describe('locale files', () => {
    /** Location of all source locale files in Console */
    const LOCALE_FILES = glob('{packages/*/locales,public/locales}/*/**.json', {
      cwd: FRONTEND_DIR,
      ignore: ['**/dist/**', '**/node_modules/**'],
    });

    it('must only have locale filenames that match its namespace directory', () => {
      const mismatches = LOCALE_FILES.filter((file) => {
        // packages/{namespace}/locales/{lang}/{file}.json => namespace is segments[1]
        // public/locales/{lang}/{file}.json => namespace is segments[0] ("public")
        const segments = file.split('/');
        const dir = segments[0] === 'packages' ? segments[1] : segments[0];

        const expectedName = NAMESPACE_EXCEPTIONS[dir] ?? dir;
        const receivedName = basename(file, '.json');

        return expectedName !== receivedName;
      });

      expect(mismatches).toEqual([]);
    });

    it('must contain only one file per locale directory', () => {
      const dirCounts: Record<string, string[]> = {};
      for (const file of LOCALE_FILES) {
        const dir = file.substring(0, file.lastIndexOf('/'));
        if (!dirCounts[dir]) {
          dirCounts[dir] = [];
        }
        dirCounts[dir].push(basename(file));
      }

      const violations = Object.entries(dirCounts)
        .filter(([, files]) => files.length > 1)
        .map(([dir, files]) => `${dir}: ${files.join(', ')}`);

      expect(violations).toEqual([]);
    });
  });

  describe('useTranslation namespace', () => {
    const SOURCE_FILES = glob('{packages/*/src,public}/**/*.{ts,tsx,jsx}', {
      cwd: FRONTEND_DIR,
      ignore: [
        '**/__tests__/**',
        '**/*.spec.*',
        '**/*.test.*',
        '**/node_modules/**',
        '**/dist/**',
        '**/console-dynamic-plugin-sdk/src/api/**',
      ],
    });

    it('must pass the correct namespace for its package', () => {
      const mismatches: string[] = [];

      for (const file of SOURCE_FILES) {
        const content = readFileSync(resolve(FRONTEND_DIR, file), 'utf-8');

        if (/useTranslation\(\s*\)/.test(content)) {
          const expected = expectedNamespace(file);
          mismatches.push(
            `${file}: useTranslation() is missing a namespace, should be useTranslation('${expected}')`,
          );
        }

        const matches = content.matchAll(/useTranslation\(\s*(['"])([^'"]+)\1/g);
        const expected = expectedNamespace(file);
        for (const match of matches) {
          const actual = match[2];
          if (actual !== expected) {
            mismatches.push(
              `${file}: useTranslation('${actual}') should be useTranslation('${expected}')`,
            );
          }
        }
      }

      expect(mismatches).toEqual([]);
    });
  });
});
