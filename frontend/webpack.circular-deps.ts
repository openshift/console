/* eslint-env node */
/* eslint-disable no-console */

import * as webpack from 'webpack';
import * as path from 'path';
import * as fs from 'fs';
import * as CircularDependencyPlugin from 'circular-dependency-plugin';
import chalk from 'chalk';

const HandleCyclesPluginName = 'HandleCyclesPlugin';

type PresetOptions = {
  /** Exclude modules that match the given regex */
  exclude?: RegExp;
  /** Ignores cycles that involve modules matching the given regex */
  filterModules?: RegExp;
  /** Path to write the cycle report to */
  reportFile: string;
  /** Thresholds for the number of cycles detected before emitting an error */
  thresholds?: Partial<{
    /**
     * Maximum number of total cycles permitted. Defaults to 0
     */
    totalCycles: number;
    /**
     * Maximum number of min-length cycles (A -\> B -\> A) permitted. Defaults to 0
     */
    minLengthCycles: number;
  }>;
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

  const topIndexFiles = cycles.reduce((acc, c) => {
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

  lines.push('\nIndex files occurring within cycles:\n');
  lines.push(...sortedEntries(topIndexFiles).map(([file, count]) => `  ${file} (${count})\n`));

  return lines.join('');
};

const getCycleEntries = (cycles: DetectedCycle[]): string => {
  return cycles.map((c) => `${c.causedBy}\n  ${c.modulePaths.join('\n  ')}\n`).join('\n');
};

const applyThresholds = (
  cycles: DetectedCycle[],
  thresholds: PresetOptions['thresholds'],
  compilation: webpack.Compilation,
) => {
  const totalCycles = cycles.length;
  if (totalCycles > thresholds.totalCycles) {
    compilation.errors.push(
      new webpack.WebpackError(
        `${HandleCyclesPluginName}: total cycles (${totalCycles}) exceeds threshold (${thresholds.totalCycles})`,
      ),
    );
  }

  const minLengthCycles = minLengthCycleCount(cycles);
  if (minLengthCycles > thresholds.minLengthCycles) {
    compilation.errors.push(
      new webpack.WebpackError(
        `${HandleCyclesPluginName}: min-length cycles (${minLengthCycles}) exceeds threshold (${thresholds.minLengthCycles})`,
      ),
    );
  }
};

export class CircularDependencyPreset {
  constructor(private readonly options: PresetOptions) {}

  apply(plugins: webpack.Configuration['plugins']) {
    const cycles: DetectedCycle[] = [];

    plugins.push(
      new CircularDependencyPlugin({
        exclude: this.options.exclude,
        onDetected: ({ module: { resource }, paths: modulePaths }) => {
          if (
            !this.options.filterModules ||
            !modulePaths.some((p) => this.options.filterModules.test(p))
          ) {
            cycles.push({ causedBy: resource, modulePaths });
          }
        },
      }),
      {
        // Ad-hoc plugin to handle detected module cycle information
        apply: (compiler) => {
          compiler.hooks.emit.tap(HandleCyclesPluginName, (compilation) => {
            if (cycles.length === 0) {
              return;
            }

            const header = `webpack compilation ${compilation.getStats().hash}\n`;

            const reportPath = path.resolve(__dirname, this.options.reportFile);
            fs.writeFileSync(
              reportPath,
              [header, getCycleStats(cycles), getCycleEntries(cycles)].join('\n'),
            );

            console.log(chalk.bold.yellow(`Detected ${cycles.length} cycles`));
            console.log(`Module cycle report written to ${chalk.bold(reportPath)}`);

            applyThresholds(
              cycles,
              {
                totalCycles: this.options.thresholds?.totalCycles ?? 0,
                minLengthCycles: this.options.thresholds?.minLengthCycles ?? 0,
              },
              compilation,
            );
          });
        },
      },
    );
  }
}
