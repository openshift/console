/* eslint-env node */
/* eslint-disable no-console */

import type { Configuration, Compiler } from 'webpack';
import * as path from 'path';
import * as fs from 'fs';
import * as CircularDependencyPlugin from 'circular-dependency-plugin';
import chalk from 'chalk';

const HandleCyclesPluginName = 'HandleCyclesPlugin';

type PresetOptions = {
  /** Exclude modules that match the given regex */
  exclude?: RegExp;
  /** Path to write the cycle report to */
  reportFile: string;
};

type DetectedCycle = {
  // webpack module record that caused the cycle
  causedBy: string;
  // relative module paths that make up the cycle
  modulePaths: string[];
};

const minLengthCycleCount = (cycles: DetectedCycle[]) =>
  cycles.filter((c) => c.modulePaths.length === 3).length;

const getCycleStats = (cycles: DetectedCycle[]): string => {
  type ItemCount = { [key: string]: number };
  const lines: string[] = [];

  const sortedEntries = (obj: ItemCount): [string, number][] =>
    Object.entries(obj).sort((a, b) => b[1] - a[1]); // descending order

  const minLengthCycles = minLengthCycleCount(cycles);

  const cycleCountByDir = cycles
    .map((c) => {
      const startPath = c.modulePaths[0];
      const elements = startPath.split('/');
      return startPath.startsWith('packages') ? elements.slice(0, 2).join('/') : elements[0];
    })
    .reduce((acc, dir) => {
      acc[dir] = (acc[dir] ?? 0) + 1;
      return acc;
    }, {} as ItemCount);

  const topBarrelFiles = cycles.reduce((acc, c) => {
    c.modulePaths
      .slice(1, -1) // exclude outer edges
      .filter((p) => /\/index\.tsx?$/.test(p))
      .forEach((p) => {
        acc[p] = (acc[p] ?? 0) + 1;
      });
    return acc;
  }, {} as ItemCount);

  lines.push(`${cycles.length} total cycles, ${minLengthCycles} min-length cycles (A -> B -> A)\n`);

  lines.push('\nCycle count per directory:\n');
  lines.push(...sortedEntries(cycleCountByDir).map(([dir, count]) => `  ${dir} (${count})\n`));

  if (Object.keys(topBarrelFiles).length > 0) {
    lines.push('\nBarrel files occurring within cycles:\n');
    lines.push(...sortedEntries(topBarrelFiles).map(([file, count]) => `  ${file} (${count})\n`));
  }

  return lines.join('');
};

const getCycleEntries = (cycles: DetectedCycle[]): string => {
  return cycles.map((c) => `${c.causedBy}\n  ${c.modulePaths.join('\n  ')}\n`).join('\n');
};

export class CircularDependencyPreset {
  constructor(private readonly options: PresetOptions) {}

  apply(plugins: Configuration['plugins']) {
    const cycles: DetectedCycle[] = [];

    plugins.push(
      new CircularDependencyPlugin({
        exclude: this.options.exclude,
        onDetected: ({ module: { resource }, paths: modulePaths }) => {
          cycles.push({ causedBy: resource, modulePaths });
        },
      }),
      {
        // Ad-hoc plugin to handle detected module cycle information
        apply: (compiler: Compiler) => {
          compiler.hooks.emit.tap(HandleCyclesPluginName, (compilation) => {
            if (cycles.length === 0) {
              return;
            }

            // write report
            const header = `webpack compilation ${compilation.getStats().hash}\n`;

            const reportPath = path.resolve(__dirname, this.options.reportFile);
            fs.writeFileSync(
              reportPath,
              [header, getCycleStats(cycles), getCycleEntries(cycles)].join('\n'),
            );

            console.log(chalk.bold.red(`Detected ${cycles.length} cycles`));
            console.log(`Module cycle report written to ${chalk.bold(reportPath)}`);

            // throw build error
            const minLengthCycles = minLengthCycleCount(cycles);

            compilation.errors.push(
              new compiler.webpack.WebpackError(
                `${HandleCyclesPluginName}: ${cycles.length} total cycles detected, ${minLengthCycles} of which are min-length :-(`,
              ),
            );
          });
        },
      },
    );
  }
}
