import { existsSync, readdirSync, readFileSync } from 'fs';
import { join, relative, resolve } from 'path';

const DIST_DIR = resolve(__dirname, '../packages/console-dynamic-plugin-sdk/dist');

const getDistFiles = (root: string, extensions: string[]): string[] => {
  const results: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
        results.push(full);
      }
    }
  };
  walk(root);
  return results;
};

// Matches ES import/export statements with a @console/* module specifier.
// Does NOT match require() calls -- those are resolved dynamically at runtime via webpack
// module federation and are expected in the dist output.
const importFromConsoleRe = /\b(?:import|export)\s+(?:[\s\S]*?\s+)?from\s+['"](@console\/[^'"]*)['"]/g;

describe('dist files must not contain monorepo-specific imports', () => {
  if (!existsSync(DIST_DIR)) {
    it.skip('dist directory not found, skipping SDK dist checks', () => {});
    return;
  }

  it('should not have ES import/export statements referencing @console packages', () => {
    const distFiles = getDistFiles(DIST_DIR, ['.js', '.jsx', '.d.ts', '.d.tsx']);
    expect(distFiles.length).toBeGreaterThan(0);

    const violations: { file: string; line: number; specifier: string }[] = [];

    for (const filePath of distFiles) {
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        importFromConsoleRe.lastIndex = 0;
        for (
          let match = importFromConsoleRe.exec(lines[i]);
          match !== null;
          match = importFromConsoleRe.exec(lines[i])
        ) {
          violations.push({
            file: relative(DIST_DIR, filePath),
            line: i + 1,
            specifier: match[1],
          });
        }
      }
    }

    expect(violations.map((v) => `${v.file}:${v.line} -- ${v.specifier}`)).toEqual([]);
  });
});
