import chalk from 'chalk';

import { ActivePlugin } from '../../typings';
import { printPluginStats } from '../plugin-stats';

describe('plugin-stats', () => {
  describe('printPluginStats', () => {
    let consoleInfoMock;

    beforeEach(() => {
      consoleInfoMock = jest.spyOn(console, 'info');
      chalk.enabled = false;
    });

    afterEach(() => {
      consoleInfoMock.mockRestore();
      chalk.enabled = true;
    });

    it('should print the list of plugins', () => {
      const activePlugins: ActivePlugin[] = [
        {
          name: 'foo',
          extensions: [],
        },
        {
          name: 'bar-plugin',
          extensions: [],
        },
      ];

      printPluginStats(activePlugins);

      expect(consoleInfoMock).toHaveBeenCalledWith(
        `Active plugins: [${activePlugins[0].name}, ${activePlugins[1].name}]`,
      );
    });
  });
});
