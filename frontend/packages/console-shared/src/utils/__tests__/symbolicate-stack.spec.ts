import type { OriginalPosition } from '../symbolicate-stack';
import { formatSource, parseStackLine, symbolicateStack } from '../symbolicate-stack';

const base = 'https://console.example.com/static';

describe('parseStackLine', () => {
  it('parses a named V8 frame', () => {
    expect(parseStackLine(`    at yk (${base}/main-bundle-1.min.js:49:330468)`)).toEqual({
      head: '    at yk (',
      name: 'yk',
      url: `${base}/main-bundle-1.min.js`,
      line: 49,
      column: 330468,
      tail: ')',
    });
  });

  it('parses an anonymous V8 frame', () => {
    expect(parseStackLine(`    at ${base}/89948-chunk-1.min.js:1:16353`)).toEqual({
      head: '    at ',
      name: undefined,
      url: `${base}/89948-chunk-1.min.js`,
      line: 1,
      column: 16353,
      tail: '',
    });
  });

  it('parses a method alias and a chunk name with a tilde', () => {
    expect(
      parseStackLine(
        `    at Object.oC [as useMemo] (${base}/vendors~55761-chunk-1.min.js:1:974700)`,
      ),
    ).toMatchObject({
      name: 'Object.oC [as useMemo]',
      url: `${base}/vendors~55761-chunk-1.min.js`,
    });
  });

  it('parses a Firefox frame', () => {
    expect(parseStackLine(`yk@${base}/main-bundle-1.min.js:49:330468`)).toMatchObject({
      head: 'yk@',
      name: 'yk',
      line: 49,
      column: 330468,
    });
  });

  it('ignores lines without a bundle location', () => {
    expect(parseStackLine('TypeError: Cannot read properties of undefined')).toBeNull();
    expect(parseStackLine('    at Array.forEach (<anonymous>)')).toBeNull();
    expect(parseStackLine('    at withFallback(TopologyPage)')).toBeNull();
    expect(parseStackLine('    at div')).toBeNull();
  });
});

describe('formatSource', () => {
  it('strips the webpack scheme and project name', () => {
    expect(
      formatSource('webpack://openshift-console/./public/components/monitoring/utils.ts'),
    ).toBe('public/components/monitoring/utils.ts');
    expect(formatSource('webpack://openshift-console/node_modules/react-dom/index.js')).toBe(
      'node_modules/react-dom/index.js',
    );
  });
});

describe('symbolicateStack', () => {
  const positions: Record<string, OriginalPosition> = {
    'main-bundle-1.min.js:49:330489': {
      source: 'webpack://openshift-console/./public/components/monitoring/utils.ts',
      line: 56,
      column: 17,
    },
    'main-bundle-1.min.js:49:330468': {
      source: 'webpack://openshift-console/./public/components/monitoring/utils.ts',
      line: 55,
      column: 9,
    },
    '89948-chunk-1.min.js:1:16353': {
      source: 'webpack://openshift-console/./packages/topology/src/useMonitoringAlerts.tsx',
      line: 18,
      column: 17,
      name: 'getAlertsAndRules',
    },
  };
  const resolve = jest.fn(async (url: string, line: number, column: number) => {
    const position = positions[`${url.replace(`${base}/`, '')}:${line}:${column}`];
    if (!position) {
      throw new Error('no source map');
    }
    return position;
  });

  const stack = [
    "TypeError: Cannot read properties of undefined (reading 'forEach')",
    `    at ${base}/main-bundle-1.min.js:49:330489`,
    '    at Array.forEach (<anonymous>)',
    `    at yk (${base}/main-bundle-1.min.js:49:330468)`,
    `    at ${base}/89948-chunk-1.min.js:1:16353`,
    `    at Object.oC [as useMemo] (${base}/vendors~55761-chunk-1.min.js:1:974700)`,
  ].join('\n');

  it('maps frames to source locations and keeps frames it cannot map', async () => {
    expect(await symbolicateStack(stack, resolve)).toBe(
      [
        "TypeError: Cannot read properties of undefined (reading 'forEach')",
        '    at public/components/monitoring/utils.ts:56:18',
        '    at Array.forEach (<anonymous>)',
        '    at yk (public/components/monitoring/utils.ts:55:10)',
        '    at packages/topology/src/useMonitoringAlerts.tsx:18:18',
        `    at Object.oC [as useMemo] (${base}/vendors~55761-chunk-1.min.js:1:974700)`,
      ].join('\n'),
    );
  });

  it('names a mangled frame after the call site in the next frame', async () => {
    const result = await symbolicateStack(stack, resolve, { nameFromCaller: true });
    expect(result.split('\n')[3]).toBe(
      '    at getAlertsAndRules (public/components/monitoring/utils.ts:55:10)',
    );
    // Its caller is native, so the anonymous callback stays unnamed.
    expect(result.split('\n')[1]).toBe('    at public/components/monitoring/utils.ts:56:18');
  });

  it('keeps a readable name even when the call site has another one', async () => {
    const named = stack.replace('at yk (', 'at TopologyPage (');
    const result = await symbolicateStack(named, resolve, { nameFromCaller: true });
    expect(result.split('\n')[3]).toBe(
      '    at TopologyPage (public/components/monitoring/utils.ts:55:10)',
    );
  });

  it('returns the stack unchanged when nothing resolves', async () => {
    const failing = jest.fn(async () => null);
    expect(await symbolicateStack(stack, failing)).toBe(stack);
  });
});
