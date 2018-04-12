import { browser } from 'protractor';
import { writeFileSync } from 'fs';
import * as path from 'path';

describe('Performance test', () => {

  it('checks bundle size using ResourceTiming API', async() => {
    const resources = await browser.executeScript<{name: string, size: number}[]>(() => performance.getEntriesByType('resource')
      .filter(({name}) => name.endsWith('.js') && name.indexOf('main') > -1 && name.indexOf('runtime') === -1)
      .map(({name, decodedBodySize}) => ({name: name.split('/').slice(-1)[0], size: Math.floor(decodedBodySize / 1024)}))
      .reduce((acc, val) => acc.concat(`${val.name.split('-')[0]}: ${val.size} KB, `), '')
    );

    writeFileSync(path.resolve(__dirname, '../../gui_test_screenshots/bundle-analysis.txt'), resources);

    expect(resources.length).not.toEqual(0);
  });
});
