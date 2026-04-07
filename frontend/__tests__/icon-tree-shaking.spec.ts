import { existsSync, readFileSync, readdirSync } from 'fs';
import { basename, join, resolve } from 'path';
import { WizardsOfTheCoastIcon } from '@patternfly/react-icons';

const DIST_DIR = resolve(__dirname, '../public/dist');

// PatternFly icons are tree-shakeable, but we've seen that sometimes a
// CJS PatternFly icon import gets pulled in, which causes the entire icon set
// to be bundled, including large ones like WizardsOfTheCoastIcon.

// While analyze.sh should catch this, this test makes it easier to diagnose
// when this happens, and ensures that the issue doesn't regress.

describe('@patternfly/react-icons tree shaking', () => {
  if (!existsSync(DIST_DIR)) {
    it.skip('dist directory not found, skipping bundle checks', () => {});
    return;
  }

  const bundleFiles = readdirSync(DIST_DIR)
    .filter((f) => f.endsWith('.js'))
    .map((f) => join(DIST_DIR, f));

  it('should resolve unused PatternFly icons (WizardsOfTheCoastIcon)', () => {
    expect(WizardsOfTheCoastIcon).toBeDefined();
  });

  it('should not bundle unused PatternFly icons (WizardsOfTheCoastIcon)', () => {
    const found: string[] = [];

    for (const file of bundleFiles) {
      const content = readFileSync(file, 'utf-8');
      if (content.includes('WizardsOfTheCoastIcon')) {
        found.push(basename(file));
      }
    }

    expect(found).toEqual([]);
  }, 10000); // possibly could take longer due to slow IO
});
