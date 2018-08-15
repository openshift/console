import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { Terminal as XTerminal } from 'xterm';
import * as fit from 'xterm/lib/addons/fit/fit';
import * as full from 'xterm/lib/addons/fullscreen/fullscreen';

XTerminal.applyAddon(fit);
XTerminal.applyAddon(full);

export class Terminal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {height: 0, width: 0};
    this.innerRef = React.createRef();
    this.outerRef = React.createRef();
    this.isFullscreen = false;
    this.onResize = () => this.onResize_();
    this.onDataReceived = data => this.terminal && this.terminal.write(data);

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

  focus () {
    this.terminal && this.terminal.focus();
  }

  setFullscreen( fullscreen ) {
    this.terminal.toggleFullScreen(fullscreen);
    this.isFullscreen = fullscreen;
    this.focus();
    this.onResize();
  }

  onConnectionClosed (reason) {
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

    const bodyRect = document.body.getBoundingClientRect();
    const nodeRect = node.getBoundingClientRect();

    const { padding } = this.props;

    // This assumes we want to fill everything below and to the right.  In full-screen, fill entire viewport
    const height = Math.floor(bodyRect.bottom - (this.isFullscreen ? 0 : nodeRect.top) - padding);
    const width = Math.floor(bodyRect.width - (this.isFullscreen ? 0 : nodeRect.left) - (this.isFullscreen ? 10 : padding));

    if (height === this.state.height && width === this.state.width) {
      return;
    }

    // rerender with correct dimensions
    this.setState({height, width}, () => {
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

  render () {
    return <div ref={this.outerRef} style={this.state} className={this.props.className}>
      <div ref={this.innerRef} className="console">
        { this.isFullscreen && <button className="btn btn-link console-collapse-link" onClick={() => this.setFullscreen(false)}>
          <i className="fa fa-compress" aria-hidden="true" /> Collapse
        </button> }
      </div>
    </div>;
  }
}

Terminal.propTypes = {
  onData: PropTypes.func.isRequired,
  onResize: PropTypes.func.isRequired,
  padding: PropTypes.number,
  options: PropTypes.object,
};

Terminal.defaultProps = {
  padding: 30,
  options: {
    fontFamily: 'monospace',
    fontSize: 16,
    cursorBlink: false,
    cols: 80,
    rows: 25,
  }
};
