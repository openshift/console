import { forwardRef, useRef, useEffect, useCallback, useImperativeHandle } from 'react';
import { FitAddon } from '@xterm/addon-fit';
import type { ITerminalOptions, ITerminalAddon } from '@xterm/xterm';
import { Terminal as XTerminal } from '@xterm/xterm';

import './Terminal.scss';

const terminalOptions: ITerminalOptions = {
  fontFamily: 'Red Hat Mono, monospace',
  fontSize: 16,
  cursorBlink: false,
};

type TerminalProps = {
  onData: (data: string) => void;
  onResize: (cols: number, rows: number) => void;
};

export type ImperativeTerminalType = {
  focus: () => void;
  reset: () => void;
  onDataReceived: (data) => void;
  onConnectionClosed: (msg: string) => void;
  loadAttachAddon: (addOn: ITerminalAddon) => void;
};

const Terminal = forwardRef<ImperativeTerminalType, TerminalProps>(({ onData, onResize }, ref) => {
  const terminal = useRef<XTerminal>();
  const terminalRef = useRef<HTMLDivElement>();

  useEffect(() => {
    const term: XTerminal = new XTerminal(terminalOptions);

    term.resize(80, 25);

    const fitAddon = new FitAddon();
    term.open(terminalRef.current);
    term.loadAddon(fitAddon);
    term.focus();

    const resizeObserver: ResizeObserver = new ResizeObserver(() => {
      window.requestAnimationFrame(() => fitAddon.fit());
    });

    resizeObserver.observe(terminalRef.current);

    if (terminal.current !== term) {
      terminal.current && terminal.current.dispose();
      terminal.current = term;
    }

    return () => {
      term.dispose();
      resizeObserver.disconnect();
    };
  }, []);

  const handleResize = useCallback(
    ({ cols, rows }: { cols: number; rows: number }) => {
      onResize(cols, rows);
    },
    [onResize],
  );

  useEffect(() => {
    const term = terminal.current;
    const data = term.onData(onData);
    const resize = term.onResize(handleResize);
    return () => {
      data.dispose();
      resize.dispose();
    };
  }, [onData, handleResize]);

  useImperativeHandle(ref, () => ({
    focus: () => {
      terminal.current && terminal.current.focus();
    },
    reset: () => {
      if (!terminal.current) return;
      terminal.current.reset();
      terminal.current.clear();
      terminal.current.options.disableStdin = false;
    },
    onDataReceived: (data) => {
      terminal.current && terminal.current.write(data);
    },
    onConnectionClosed: (msg) => {
      if (!terminal.current) return;
      terminal.current.write(`\x1b[31m${msg || 'disconnected'}\x1b[m\r\n`);
      terminal.current.options.disableStdin = true;
    },
    loadAttachAddon: (addOn: ITerminalAddon) => {
      if (!terminal.current) return;
      terminal.current.loadAddon(addOn);
    },
  }));

  return <div className="co-terminal" ref={terminalRef} />;
});

export default Terminal;
