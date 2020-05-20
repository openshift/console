import * as React from 'react';
import { Terminal as XTerminal } from 'xterm';
import * as fit from 'xterm/lib/addons/fit/fit';

XTerminal.applyAddon(fit);

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

class Terminal extends React.Component<TerminalProps> {
  private terminalRef;

  private terminal;

  private resizeObserver;

  constructor(props) {
    super(props);
    this.terminalRef = React.createRef<HTMLDivElement>();
    this.terminal = new XTerminal(terminalOptions);
    this.terminal.on('data', this.props.onData);
  }

  componentDidMount() {
    this.terminal.open(this.terminalRef.current);
    this.resizeObserver = new ResizeObserver(() => {
      window.requestAnimationFrame(() => this.terminal.fit());
    });
    this.resizeObserver.observe(this.terminalRef.current);
    this.focus();
  }

  componentWillUnmount() {
    this.terminal.destroy();
    this.resizeObserver.disconnect();
  }

  focus() {
    this.terminal && this.terminal.focus();
  }

  reset() {
    this.terminal.reset();
    this.terminal.clear();
    this.terminal.setOption('disableStdin', false);
  }

  onDataReceived(data) {
    this.terminal && this.terminal.write(data);
  }

  onConnectionClosed = (reason) => {
    this.terminal.write(`\x1b[31m${reason || 'disconnected'}\x1b[m\r\n`);
    this.terminal.cursorHidden = true;
    this.terminal.setOption('disableStdin', true);
    this.terminal.refresh(this.terminal.y, this.terminal.y);
  };

  render() {
    return <div ref={this.terminalRef} style={{ width: '100%', height: '100%' }} />;
  }
}

export default Terminal;
