/* eslint-env node */
/* eslint-disable no-console */

import chalk from 'chalk';

import { ActivePlugin } from '../typings';

export const printPluginStats = (plugins: ActivePlugin[]) => {
  console.info(`Active plugins: [${plugins.map((p) => `${chalk.green(p.name)}`).join(', ')}]`);
  // TODO(vojtech): print extension summary per each plugin
};
