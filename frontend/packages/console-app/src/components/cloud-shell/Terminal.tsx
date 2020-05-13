import * as React from 'react';
import Measure from 'react-measure';
import { Terminal as XTerminal } from 'xterm';
import * as fit from 'xterm/lib/addons/fit/fit';

XTerminal.applyAddon(fit);

type TerminalProps = {
  onData: (data: string) => void;
};

class Terminal extends React.Component<TerminalProps> {
  private terminalRef;

  private terminal;

  constructor(props) {
    super(props);
    const options = {
      fontFamily: 'monospace',
      fontSize: 16,
      cursorBlink: false,
      cols: 80,
      rows: 25,
      padding: 4,
    };
    this.terminalRef = React.createRef<HTMLDivElement>();
    this.terminal = new XTerminal(options);
    this.terminal.on('data', this.props.onData);
  }

  focus() {
    this.terminal && this.terminal.focus();
  }

  onDataReceived(data) {
    this.terminal && this.terminal.write(data);
  }

  reset() {
    const { terminal } = this;

    terminal.reset();
    terminal.clear();
    terminal.setOption('disableStdin', false);
  }

  onConnectionClosed = (reason) => {
    const { terminal } = this;
    terminal.write(`\x1b[31m${reason || 'disconnected'}\x1b[m\r\n`);
    terminal.cursorHidden = true;
    terminal.setOption('disableStdin', true);
    terminal.refresh(terminal.y, terminal.y);
  };

  componentDidMount() {
    this.terminal.open(this.terminalRef.current);
    this.focus();
  }

  componentWillUnmount() {
    this.terminal && this.terminal.destroy();
  }

  resize() {
    try {
      this.terminal.fit();
    } finally {
      // do nothing
    }
  }

  render() {
    return <div ref={this.terminalRef} style={{ width: '100%', height: '100%' }} />;
  }
}

export default Terminal;
