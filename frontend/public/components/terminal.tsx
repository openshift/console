import { forwardRef, useRef, useEffect, useImperativeHandle, useCallback, useState } from 'react';
import { Terminal as XTerminal, ITerminalOptions, ITerminalAddon } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { XtermAddonFullscreen } from '@console/shared';
import { useIsFullscreen } from '@console/shared/src/hooks/useFullscreen';

const defaultOptions: ITerminalOptions = {
  fontFamily: 'Red Hat Mono, monospace',
  fontSize: 16,
  cursorBlink: false,
  cols: 80,
  rows: 25,
};

export type ImperativeTerminalType = {
  focus: () => void;
  reset: () => void;
  onDataReceived: (data: string) => void;
  onConnectionClosed: (msg: string) => void;
  loadAttachAddon: (addOn: ITerminalAddon) => void;
};

export interface TerminalProps {
  onData: (data: string) => void;
  onResize: (rows: number, cols: number) => void;
  padding?: number;
  options?: ITerminalOptions;
  className?: string;
}

export const Terminal = forwardRef<ImperativeTerminalType, TerminalProps>(
  ({ onData, onResize, padding = 52, options = defaultOptions, className }, ref) => {
    const terminal = useRef<XTerminal>();
    const fitAddon = useRef<FitAddon>();
    const terminalRef = useRef<HTMLDivElement>(null);
    const isFullscreen = useIsFullscreen();

    const [dimensions, setDimensions] = useState<Pick<CSSStyleDeclaration, 'width' | 'height'>>({
      width: '0',
      height: '0',
    });

    const handleResize = useCallback(() => {
      const node = terminalRef.current;
      if (!node) {
        return;
      }

      const pageRect = document.getElementsByClassName('pf-v6-c-page')[0]?.getBoundingClientRect();
      const bodyRect = document.body.getBoundingClientRect();
      const nodeRect = node.getBoundingClientRect();

      if (!pageRect) {
        return;
      }

      // This assumes we want to fill everything below and to the right.  In full-screen, fill entire viewport
      const height = Math.floor(pageRect.bottom - (isFullscreen ? 0 : nodeRect.top) - padding);
      const width = Math.floor(
        bodyRect.width - (isFullscreen ? 0 : nodeRect.left) - (isFullscreen ? 10 : padding),
      );

      setDimensions({ width: `${width}px`, height: `${height}px` });

      // rerender with correct dimensions
      setTimeout(() => {
        if (!terminal.current) {
          return;
        }
        // tell the terminal to resize itself
        fitAddon.current?.fit();
        // update the pty
        onResize(terminal.current.rows, terminal.current.cols);
        // @ts-expect-error The internal xterm textarea was not repositioned when the window was resized.
        // This workaround triggers a textarea position update to fix this.
        // See https://bugzilla.redhat.com/show_bug.cgi?id=1983220
        // and https://github.com/xtermjs/xterm.js/issues/3390
        terminal.current._core?._syncTextArea?.();
      }, 0);
    }, [isFullscreen, onResize, padding]);

    useEffect(() => {
      const term = new XTerminal({ ...options });
      const fit = new FitAddon();
      const fullscreen = new XtermAddonFullscreen();

      terminal.current = term;
      fitAddon.current = fit;

      term.loadAddon(fit);
      term.loadAddon(fullscreen);

      if (terminalRef.current) {
        term.open(terminalRef.current);
        term.focus();
        handleResize();
      }

      // Window resize fallback
      window.addEventListener('resize', handleResize);
      window.addEventListener('sidebar_toggle', handleResize);

      return () => {
        term.dispose();
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('sidebar_toggle', handleResize);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      const term = terminal.current;
      if (!term) {
        return;
      }
      const dataListener = term.onData(onData);
      const resizeListener = term.onResize(({ rows, cols }) => onResize(rows, cols));
      return () => {
        dataListener.dispose();
        resizeListener.dispose();
      };
    }, [onData, onResize]);

    useEffect(() => {
      handleResize();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isFullscreen]);

    useImperativeHandle(ref, () => ({
      focus: () => {
        terminal.current?.focus();
      },
      reset: () => {
        if (!terminal.current) {
          return;
        }
        terminal.current.reset();
        terminal.current.clear();
        terminal.current.setOption('disableStdin', false);
      },
      onDataReceived: (data: string) => {
        terminal.current?.write(data);
      },
      onConnectionClosed: (msg: string) => {
        if (!terminal.current) {
          return;
        }
        if (isFullscreen) {
          document.exitFullscreen();
        }
        terminal.current.write(`\x1b[31m${msg || 'disconnected'}\x1b[m\r\n`);
        (terminal.current as any).cursorHidden = true;
        terminal.current.setOption('disableStdin', true);
        terminal.current.refresh(0, terminal.current.rows - 1);
      },
      loadAttachAddon: (addOn: ITerminalAddon) => {
        terminal.current?.loadAddon(addOn);
      },
    }));

    return <div ref={terminalRef} className={className || 'co-terminal'} style={dimensions} />;
  },
);
