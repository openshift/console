/* eslint-disable no-underscore-dangle */
/* eslint-disable no-console */
import * as React from 'react';
import { Terminal as XTerminal } from 'xterm';
import * as fit from 'xterm/lib/addons/fit/fit';
import * as full from 'xterm/lib/addons/fullscreen/fullscreen';

XTerminal.applyAddon(fit);
XTerminal.applyAddon(full);

type TerminalProps = {
  onData: Function;
  onResize: Function;
  options?: any;
};
type TerminalState = {
  height: number;
  width: number;
};

declare const ResizeObserver: any;

export class Terminal extends React.PureComponent<TerminalProps, TerminalState> {
  // todo
  // private options = {
  //   fontFamily: 'monospace',
  //   fontSize: 16,
  //   cursorBlink: false,
  //   cols: 80,
  //   rows: 25,
  // };

  private innerRef: React.RefObject<any>;

  private outerRef: React.RefObject<any>;

  private onResize: Function;

  private terminal: any;

  private drawer: any;

  private drawerResizeObserver: any;

  constructor(props) {
    super(props);
    this.state = { height: 0, width: 0 };
    this.innerRef = React.createRef();
    this.outerRef = React.createRef();
    this.onResize = () => this.onResize_();

    this.terminal = new XTerminal(Object.assign({}, this.props.options));
    this.terminal.on('data', this.props.onData);

    this.drawer = document.querySelector('.ocs-drawer');

    let drawerResizeTimeoutId;
    this.drawerResizeObserver = new ResizeObserver(() => {
      if (drawerResizeTimeoutId) {
        clearTimeout(drawerResizeTimeoutId);
      }
      drawerResizeTimeoutId = setTimeout(() => {
        this.onResize_();
      }, 200);
    });
  }

  reset() {
    if (!this.terminal) {
      return;
    }
    this.terminal.reset();
    this.terminal.clear();
    this.terminal.setOption('disableStdin', false);
  }

  focus() {
    this.terminal && this.terminal.focus();
  }

  // todo
  enableiOSFix() {
    document.getElementsByClassName('pf-c-page__main')[0].classList.add('default-overflow');
    document.getElementById('content-scrollable').classList.add('default-overflow');
  }

  // todo
  disableiOSFix() {
    document.getElementsByClassName('pf-c-page__main')[0].classList.remove('default-overflow');
    document.getElementById('content-scrollable').classList.remove('default-overflow');
  }

  onConnectionClosed(reason) {
    if (!this.terminal) {
      return;
    }
    this.terminal.write(`\x1b[31m${reason || 'disconnected'}\x1b[m\r\n`);
    this.terminal.cursorHidden = true;
    this.terminal.setOption('disableStdin', true);
    this.terminal.refresh(this.terminal.y, this.terminal.y);
  }

  onDataReceived(data) {
    this.terminal && this.terminal.write(data);
  }

  componentDidMount() {
    this.terminal.open(this.innerRef.current);
    this.focus();
    this.onResize();
    this.drawerResizeObserver.observe(this.drawer);
  }

  componentWillUnmount() {
    this.terminal && this.terminal.destroy();
    this.drawerResizeObserver.unobserve(this.drawer);
  }

  onResize_() {
    const node = this.outerRef.current;

    if (!node) {
      return;
    }

    const drawerRect = this.drawer.getBoundingClientRect();
    const nodeRect = node.getBoundingClientRect();

    const height = Math.floor(drawerRect.bottom - nodeRect.top);
    const width = Math.floor(drawerRect.width - nodeRect.left);

    if (height === this.state.height && width === this.state.width) {
      return;
    }

    // rerender with correct dimensions
    this.setState({ height, width }, () => {
      const { terminal } = this;
      if (!terminal) {
        return;
      }
      // tell the terminal to resize itself
      terminal.fit();
      // update the pty
      this.props.onResize(terminal.rows, terminal.cols);
    });
  }

  render() {
    return (
      <div ref={this.outerRef} style={this.state}>
        <div ref={this.innerRef} className="console">
          {' '}
        </div>
      </div>
    );
  }
}
