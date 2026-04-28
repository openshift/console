import { basename, resolve } from 'path';
import { sync as glob } from 'glob';

const FRONTEND_DIR = resolve(__dirname, '..');

/** Packages where the i18n namespace differs from the package directory name */
const NAMESPACE_EXCEPTIONS: Record<string, string> = {
  'dev-console': 'devconsole',
  'operator-lifecycle-manager': 'olm',
  'operator-lifecycle-manager-v1': 'olm-v1',
};

/** Location of all source locale files in Console */
const LOCALE_FILES = glob('{packages/*/locales,public/locales}/*/**.json', {
  cwd: FRONTEND_DIR,
  ignore: ['**/dist/**', '**/node_modules/**'],
});

// Sometimes the wrong i18n namespace is used in a locale file, which causes the
// locale file to be placed in the wrong directory (e.g., `console-app` namespace
// used in `public` causes it to be placed in `public/locales` instead). This
// causes issues when sending our i18n files to translation services.

describe('locales folder structure', () => {
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
