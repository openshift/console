import * as React from 'react';
import { Terminal as XTerminal } from 'xterm';
import { fit } from 'xterm/lib/addons/fit/fit';

const terminalOptions = {
  fontFamily: 'monospace',
  fontSize: 16,
  cursorBlink: false,
  cols: 80,
  rows: 25,
  padding: 4,
};

type TerminalProps = {
  onData: (data: string) => void;
};

export type ImperativeTerminalType = {
  focus: () => void;
  reset: () => void;
  onDataReceived: (data) => void;
  onConnectionClosed: (msg: string) => void;
};

const Terminal = React.forwardRef<ImperativeTerminalType, TerminalProps>(({ onData }, ref) => {
  const terminal = React.useRef<XTerminal>();
  const terminalRef = React.useRef<HTMLDivElement>();

  const focus = () => {
    terminal.current && terminal.current.focus();
  };

  const reset = () => {
    if (!terminal.current) return;
    terminal.current.reset();
    terminal.current.clear();
    terminal.current.setOption('disableStdin', false);
  };

  const onDataReceived = (data) => {
    terminal.current && terminal.current.write(data);
  };

  const onConnectionClosed = (msg) => {
    if (!terminal.current) return;
    terminal.current.write(`\x1b[31m${msg || 'disconnected'}\x1b[m\r\n`);
    terminal.current.setOption('disableStdin', true);
  };

  React.useEffect(() => {
    const term: XTerminal = new XTerminal(terminalOptions);
    term.on('data', onData);
    term.open(terminalRef.current);
    term.focus();

    const resizeObserver: ResizeObserver = new ResizeObserver(() => {
      window.requestAnimationFrame(() => fit(term));
    });

    resizeObserver.observe(terminalRef.current);

    if (terminal.current !== term) {
      terminal.current && terminal.current.destroy();
      terminal.current = term;
    }

    return () => {
      term.destroy();
      resizeObserver.disconnect();
    };
  }, [onData]);

  React.useImperativeHandle(ref, () => ({
    focus,
    reset,
    onDataReceived,
    onConnectionClosed,
  }));

  return <div ref={terminalRef} style={{ width: '100%', height: '100%' }} />;
});

export default Terminal;
