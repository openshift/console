/* eslint-env node */
/* eslint-disable no-console */

import * as webpack from 'webpack';
import * as path from 'path';
import * as fs from 'fs';
import * as moment from 'moment';
import * as CircularDependencyPlugin from 'circular-dependency-plugin';

type PresetOptions = {
  exclude: RegExp;
  reportFile: string;
};

type DetectedCycle = {
  // webpack module record that caused the cycle
  causedBy: string;
  // relative module paths that make up the cycle
  modulePaths: string[];
};

export class CircularDependencyPreset {
  private readonly HandleCyclesPluginName = 'HandleCyclesPlugin';

  constructor(private readonly options: PresetOptions) {}

  private getCycleReport(cycles: DetectedCycle[], compilation: webpack.compilation.Compilation) {
    const hash = compilation.getStats().hash;
    const builtAt = moment(compilation.getStats().endTime).format('MM/DD/YYYY HH:mm:ss');

    const countByDir = cycles
      .map((c) => c.modulePaths[0].replace(/\/.*$/, ''))
      .reduce((acc, dir) => {
        acc[dir] = (acc[dir] ?? 0) + 1;
        return acc;
      }, {} as { [key: string]: number });

    const header =
      `# webpack compilation ${hash} built at ${builtAt}\n` +
      '# this file is auto-generated on every webpack development build\n';

    const stats =
      `# ${cycles.length} total cycles: ${Object.keys(countByDir)
        .map((d) => `${d} (${countByDir[d]})`)
        .join(', ')}\n` +
      `# ${
        cycles.filter((c) => c.modulePaths.length === 3).length
      } minimal-length cycles (A -> B -> A)\n`;

    const entries = cycles.map((c) => `${c.causedBy}\n${c.modulePaths.join('\n-> ')}\n`).join('\n');

    return [header, stats, entries].join('\n');
  }

  apply(plugins: webpack.Plugin[]) {
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
        apply: (compiler) => {
          compiler.hooks.emit.tap(this.HandleCyclesPluginName, (compilation) => {
            if (cycles.length === 0) {
              return;
            }

            const reportPath = path.resolve(__dirname, this.options.reportFile);
            fs.writeFileSync(reportPath, this.getCycleReport(cycles, compilation));

            console.log(`detected ${cycles.length} cycles`);
            console.log(`module cycle report written to ${reportPath}`);
          });
        },
      },
    );
  }
}
