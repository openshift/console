import { existsSync, readFileSync, readdirSync } from 'fs';
import { basename, join, resolve } from 'path';
import { WizardsOfTheCoastIcon } from '@patternfly/react-icons';

const DIST_DIR = resolve(__dirname, '../public/dist');

const findFilesContaining = (files: string[], needle: string): string[] =>
  files.filter((f) => readFileSync(f, 'utf-8').includes(needle)).map((f) => basename(f));

// While analyze.sh should catch tree-shaking issues, this test makes it easier to
// diagnose when this happens, and also serves as a regression test
describe('tree shaking', () => {
  if (!existsSync(DIST_DIR)) {
    it.skip('dist directory not found, skipping bundle checks', () => {});
    return;
  }

  const bundleFiles = readdirSync(DIST_DIR)
    .filter((f) => f.endsWith('.js'))
    .map((f) => join(DIST_DIR, f));

  const indexHtml = new DOMParser().parseFromString(
    readFileSync(join(DIST_DIR, 'index.html'), 'utf-8'),
    'text/html',
  );

  const initialJsFiles = Array.from(indexHtml.querySelectorAll('script[src]')).map((s) =>
    resolve(DIST_DIR, basename(s.getAttribute('src')!)),
  );

  // Only check vendor chunks: when this test is run in CI, the dev build embeds
  // package names in chunk filenames (e.g., vendors-[...]-monaco-editor-[...].js),
  // which causes false positives when the runtime chunk references them by name.
  const initialVendorChunks = initialJsFiles.filter((f) => basename(f).startsWith('vendor'));

  // Preconditions
  expect(WizardsOfTheCoastIcon).toBeDefined();
  expect(initialJsFiles.length).toBeGreaterThan(0);
  expect(initialVendorChunks.length).toBeGreaterThan(0);

  // PatternFly icons are tree-shakeable, but we've seen that sometimes a
  // CJS PatternFly icon import gets pulled in, which causes the entire icon set
  // to be bundled, including large ones like WizardsOfTheCoastIcon.
  it('should not bundle unused PatternFly icons (WizardsOfTheCoastIcon)', () => {
    expect(findFilesContaining(bundleFiles, 'WizardsOfTheCoastIcon')).toEqual([]);
  }, 10000); // possibly could take longer due to slow IO

  // These large libraries should only be loaded as-needed using AsyncComponent
  it.each(['@xterm/xterm', 'monaco-editor', '@octokit/rest'])(
    'should not bundle %s in initial vendor chunk',
    (library) => {
      expect(findFilesContaining(initialVendorChunks, library)).toEqual([]);
    },
    10000,
  ); // possibly could take longer due to slow IO
});
