import * as React from 'react';
import * as PropTypes from 'prop-types';
import { Terminal as XTerminal } from 'xterm';
import * as fit from 'xterm/lib/addons/fit/fit';
import * as full from 'xterm/lib/addons/fullscreen/fullscreen';
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

  onConnectionClosed(reason) {
    const terminal = this.terminal;
    if (!terminal) {
      return;
    }
    terminal.write(`\x1b[31m${reason || 'disconnected'}\x1b[m\r\n`);
    terminal.cursorHidden = true;
    terminal.setOption('disableStdin', true);
    terminal.refresh(terminal.y, terminal.y);
  }

  componentDidMount() {
    this.terminal.open(this.innerRef.current);
    this.focus();
  }

  componentWillUnmount() {
    this.terminal && this.terminal.destroy();
  }

  render() {
    return (
      <div style={this.state} className={this.props.className} ref={this.outerRef}>
        <div ref={this.innerRef} className="console"></div>
      </div>
    );
  }
}

Terminal.propTypes = {
  onData: PropTypes.func.isRequired,
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
