import * as React from 'react';
import * as _ from 'lodash-es';
import { Terminal as XTerminal } from 'xterm';
import Measure from 'react-measure';
import * as fit from 'xterm/lib/addons/fit/fit';
import * as full from 'xterm/lib/addons/fullscreen/fullscreen';

XTerminal.applyAddon(fit);
XTerminal.applyAddon(full);

export class Terminal extends React.Component<any, any> {
  private innerRef;
  private outerRef;
  private onDataReceived;
  private terminal;
  private padding;

  constructor(props) {
    super(props);
    this.innerRef = React.createRef();
    this.outerRef = React.createRef();
    this.state = {
      dimensions: {
        width: -1,
        height: -1,
      },
    };
    this.onDataReceived = (data) => {
      this.terminal && this.terminal.write(data);
    };
    this.padding = 20;
    const {
      options = {
        fontFamily: 'monospace',
        fontSize: 16,
        cursorBlink: false,
        cols: 80,
        rows: 25,
      },
    } = this.props;
    this.terminal = new XTerminal(Object.assign({}, options));
    this.terminal.on('data', this.props.onData);
  }

  reset() {
    const terminal = this.terminal;
    if (!terminal) {
      return;
    }
    terminal.reset();
    terminal.clear();
    terminal.setOption('disableStdin', false);
  }

  focus = () => {
    this.terminal && this.terminal.focus();
  };

  enableiOSFix = () => {
    document.getElementsByClassName('pf-c-page__main')[0].classList.add('default-overflow');
    document.getElementById('content-scrollable').classList.add('default-overflow');
  };

  disableiOSFix = () => {
    document.getElementsByClassName('pf-c-page__main')[0].classList.remove('default-overflow');
    document.getElementById('content-scrollable').classList.remove('default-overflow');
  };

  setFullscreen = (fullscreen) => {
    this.terminal.toggleFullScreen(fullscreen);
    this.focus();
    // fix iOS bug where masthead overlays fullscreen terminal
    // see https://bugs.webkit.org/show_bug.cgi?id=160953
    fullscreen ? this.enableiOSFix() : this.disableiOSFix();
  };

  onResize = () => {
    const node = this.outerRef.current;

    if (!node) {
      return;
    }

    const bodyRect = document.body.getBoundingClientRect();
    const nodeRect = node.getBoundingClientRect();

    // This assumes we want to fill everything below and to the right.  In full-screen, fill entire viewport
    // Use body height when node top is too close to pageRect height
    const bottom = bodyRect.bottom;
    const height = Math.floor(bottom - nodeRect.top);
    const width = Math.floor(bodyRect.width - nodeRect.left);

    if (height === this.state.height && width === this.state.width) {
      return;
    }
    // rerender with correct dimensions
    this.setState({ height, width }, () => {
      const terminal = this.terminal;
      if (!terminal) {
        return;
      }
      // tell the terminal to resize itself
      terminal.fit();
    });
  };

  onConnectionClosed = (reason) => {
    const terminal = this.terminal;
    if (!terminal) {
      return;
    }
    this.setFullscreen(false);
    terminal.write(`\x1b[31m${reason || 'disconnected'}\x1b[m\r\n`);
    terminal.cursorHidden = true;
    terminal.setOption('disableStdin', true);
    terminal.refresh(terminal.y, terminal.y);
  };

  componentDidMount() {
    this.terminal.open(this.innerRef.current);
    this.focus();
    this.onResize();
  }

  componentWillUnmount() {
    this.terminal && this.terminal.destroy();
  }

  render() {
    return (
      <Measure
        bounds
        onResize={(contenRect) => {
          this.onResize();
        }}
      >
        {({ measureRef }) => (
          <div
            style={{
              width: '100%',
              height: '100%',
              padding: this.padding / 2,
            }}
            ref={measureRef}
          >
            <div ref={this.outerRef} className={this.props.className}>
              <div
                ref={this.innerRef}
                style={{ width: this.state.width, height: this.state.height }}
                className="console"
              ></div>
            </div>
          </div>
        )}
      </Measure>
    );
  }
}
