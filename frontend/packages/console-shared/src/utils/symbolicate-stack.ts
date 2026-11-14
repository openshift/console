/**
 * Maps the minified locations in a JavaScript stack trace (or a React component stack)
 * back to source files, using the source maps served next to each bundle.
 */

export type StackFrame = {
  /** Text before the location, for example `    at TopologyPage (`. */
  head: string;
  /** Function name as printed by the browser, if any. */
  name?: string;
  url: string;
  line: number;
  column: number;
  /** Text after the location, for example `)`. */
  tail: string;
};

export type OriginalPosition = {
  source: string;
  /** 1-based */
  line: number;
  /** 0-based, as source maps count columns */
  column: number;
  /** Original name of the identifier at this position, if the source map records one. */
  name?: string;
};

export type PositionResolver = (
  url: string,
  line: number,
  column: number,
) => Promise<OriginalPosition | null>;

// Chrome: "    at name (url:1:2)", "    at url:1:2"
const V8_FRAME = /^(\s*at (?:(.*?) \()?)(\S+?):(\d+):(\d+)(\)?\s*)$/;
// Firefox and Safari: "name@url:1:2", "@url:1:2"
const GECKO_FRAME = /^(\s*(?:([^@\s]*)@))(\S+?):(\d+):(\d+)(\s*)$/;

export const parseStackLine = (text: string): StackFrame | null => {
  const match = V8_FRAME.exec(text) ?? GECKO_FRAME.exec(text);
  if (!match || !/^(https?:|\/)/.test(match[3])) {
    return null;
  }
  return {
    head: match[1],
    name: match[2] || undefined,
    url: match[3],
    line: Number(match[4]),
    column: Number(match[5]),
    tail: match[6],
  };
};

/** `webpack://openshift-console/./public/x.ts` -> `public/x.ts` */
export const formatSource = (source: string): string =>
  source.replace(/^webpack:\/\/[^/]*\//, '').replace(/^(\.\/)+/, '');

// The minifier renames most functions to one or two letters. A name this short is
// replaced with the original name recorded at the caller's call site.
const isMangled = (name: string) => /^[A-Za-z_$][\w$]?$/.test(name);

const renameFrame = (name: string, original: string): string =>
  name.replace(/(^|\.)([\w$]+)(?=$| \[as )/, (whole, dot, last) =>
    isMangled(last) ? `${dot}${original}` : whole,
  );

/**
 * Returns `stack` with every frame that `resolve` can map rewritten to its source location.
 * Frames that cannot be mapped, and lines that are not frames, are kept as they are.
 *
 * With `nameFromCaller`, a mangled function name is replaced with the name its caller's
 * call site has in the source. Use it for call stacks only: in a React component stack the
 * next line is the parent component, not a call site.
 */
export const symbolicateStack = async (
  stack: string,
  resolve: PositionResolver,
  { nameFromCaller = false } = {},
): Promise<string> => {
  const lines = stack.split('\n');
  const frames = lines.map(parseStackLine);
  const positions = await Promise.all(
    frames.map((frame) =>
      frame ? resolve(frame.url, frame.line, frame.column).catch(() => null) : null,
    ),
  );
  return lines
    .map((text, i) => {
      const frame = frames[i];
      const position = positions[i];
      if (!frame || !position) {
        return text;
      }
      // The caller's call site names the function it calls, which is this frame.
      // A native caller (`at Array.forEach (<anonymous>)`) has no position, so no name.
      const calledAs = nameFromCaller ? positions[i + 1]?.name : undefined;
      const name = frame.name && calledAs ? renameFrame(frame.name, calledAs) : frame.name;
      const head = name === frame.name ? frame.head : frame.head.replace(frame.name, name);
      return `${head}${formatSource(position.source)}:${position.line}:${position.column + 1}${
        frame.tail
      }`;
    })
    .join('\n');
};

const sourceMaps = new Map<string, Promise<any>>();

/**
 * Resolves positions with the `<bundle>.map` file the console serves next to each bundle.
 * Only same-origin bundles are looked up; each map is fetched once per page load.
 */
export const sourceMapResolver: PositionResolver = async (url, line, column) => {
  const bundle = new URL(url, window.location.href);
  if (bundle.origin !== window.location.origin || !bundle.pathname.endsWith('.js')) {
    return null;
  }
  const mapURL = `${bundle.origin}${bundle.pathname}.map`;
  if (!sourceMaps.has(mapURL)) {
    sourceMaps.set(
      mapURL,
      Promise.all([
        import('@jridgewell/trace-mapping'),
        fetch(mapURL).then((response) => {
          if (!response.ok) {
            throw new Error(`${mapURL}: ${response.status}`);
          }
          return response.text();
        }),
      ]).then(([{ TraceMap, originalPositionFor }, map]) => {
        const traceMap = new TraceMap(map);
        return (l: number, c: number) => originalPositionFor(traceMap, { line: l, column: c });
      }),
    );
  }
  const lookup = await sourceMaps.get(mapURL);
  const position = lookup(line, column - 1);
  return position.source
    ? {
        source: position.source,
        line: position.line,
        column: position.column,
        name: position.name ?? undefined,
      }
    : null;
};
