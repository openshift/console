import React from 'react';
import PropTypes from 'prop-types';
import { Terminal as XTerminal } from 'xterm';
import * as fit from 'xterm/lib/addons/fit/fit';
import * as full from 'xterm/lib/addons/fullscreen/fullscreen';
import { CompressIcon } from '@patternfly/react-icons';
import { Button } from '@patternfly/react-core';

XTerminal.applyAddon(fit);
XTerminal.applyAddon(full);

export class Terminal extends React.Component {
  constructor(props) {
    super(props);
    this.state = { height: 0, width: 0 };
    this.innerRef = React.createRef();
    this.outerRef = React.createRef();
    this.isFullscreen = false;
    this.onResize = () => this.onResize_();
    this.onDataReceived = (data) => {
      this.terminal && this.terminal.write(data);
    };

    this.terminal = new XTerminal(Object.assign({}, this.props.options));
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

  focus() {
    this.terminal && this.terminal.focus();
  }

  enableiOSFix() {
    document.getElementsByClassName('pf-c-page__main')[0].classList.add('default-overflow');
    document.getElementById('content-scrollable').classList.add('default-overflow');
  }

  disableiOSFix() {
    document.getElementsByClassName('pf-c-page__main')[0].classList.remove('default-overflow');
    document.getElementById('content-scrollable').classList.remove('default-overflow');
  }

  setFullscreen(fullscreen) {
    this.terminal.toggleFullScreen(fullscreen);
    this.isFullscreen = fullscreen;
    this.focus();
    this.onResize();
    // fix iOS bug where masthead overlays fullscreen terminal
    // see https://bugs.webkit.org/show_bug.cgi?id=160953
    fullscreen ? this.enableiOSFix() : this.disableiOSFix();
  }

  onConnectionClosed(reason) {
    const terminal = this.terminal;
    if (!terminal) {
      return;
    }
    this.setFullscreen(false);
    terminal.write(`\x1b[31m${reason || 'disconnected'}\x1b[m\r\n`);
    terminal.cursorHidden = true;
    terminal.setOption('disableStdin', true);
    terminal.refresh(terminal.y, terminal.y);
  }

  componentDidMount() {
    this.terminal.open(this.innerRef.current);
    this.focus();
    this.onResize();
    window.addEventListener('resize', this.onResize);
  }

  componentWillUnmount() {
    this.terminal && this.terminal.destroy();
    window.removeEventListener('resize', this.onResize);
  }

  onResize_() {
    const node = this.outerRef.current;

    if (!node) {
      return;
    }

    const pageRect =
      document.getElementsByClassName('pf-c-page') &&
      document.getElementsByClassName('pf-c-page')[0]
        ? document.getElementsByClassName('pf-c-page')[0].getBoundingClientRect()
        : document.body.getBoundingClientRect();
    const bodyRect = document.body.getBoundingClientRect();
    const nodeRect = node.getBoundingClientRect();

    const { padding } = this.props;

    // This assumes we want to fill everything below and to the right.  In full-screen, fill entire viewport
    // Use body height when node top is too close to pageRect height
    const bottom = pageRect.bottom - nodeRect.top > 200 ? pageRect.bottom : bodyRect.bottom;
    const height = Math.floor(bottom - (this.isFullscreen ? 0 : nodeRect.top) - padding);
    const width = Math.floor(
      bodyRect.width - (this.isFullscreen ? 0 : nodeRect.left) - (this.isFullscreen ? 10 : padding),
    );

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
      // update the pty
      this.props.onResize(terminal.rows, terminal.cols);
    });
  }

  render() {
    return (
      <div ref={this.outerRef} style={this.state} className={this.props.className}>
        <div ref={this.innerRef} className="console">
          {this.isFullscreen && (
            <Button
              className="console-collapse-link"
              onClick={() => this.setFullscreen(false)}
              variant="link"
            >
              <CompressIcon className="co-icon-space-r" />
              Collapse
            </Button>
          )}
        </div>
      </div>
    );
  }
}

Terminal.propTypes = {
  onData: PropTypes.func.isRequired,
  onResize: PropTypes.func.isRequired,
  padding: PropTypes.number,
  options: PropTypes.object,
};

Terminal.defaultProps = {
  padding: 10,
  options: {
    fontFamily: 'monospace',
    fontSize: 16,
    cursorBlink: false,
    cols: 80,
    rows: 25,
  },
};
