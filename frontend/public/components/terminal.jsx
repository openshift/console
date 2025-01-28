import React from 'react';
import PropTypes from 'prop-types';
import { Terminal as XTerminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { withTranslation } from 'react-i18next';
import { CompressIcon } from '@patternfly/react-icons/dist/esm/icons/compress-icon';
import { Button } from '@patternfly/react-core';
import { XtermAddonFullscreen } from '@console/shared';

class Terminal_ extends React.Component {
  constructor(props) {
    super(props);
    this.state = { height: 0, width: 0 };
    this.innerRef = React.createRef();
    this.outerRef = React.createRef();
    this.isFullscreen = false;
    this.onResize = () => this.onResize_();
    this.onDataReceived = (data) => this.terminal && this.terminal.write(data);

    this.terminal = new XTerminal(Object.assign({}, this.props.options));
    this.fitAddon = new FitAddon();
    this.fullscreenAddon = new XtermAddonFullscreen();
    this.terminal.loadAddon(this.fitAddon);
    this.terminal.loadAddon(this.fullscreenAddon);
    this.terminal.onData(this.props.onData);
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

  enableLayoutFix() {
    document.getElementsByClassName('pf-v6-c-page__main')[0].classList.add('default-overflow');
    document.getElementById('content-scrollable').classList.add('default-overflow');
    document
      .getElementsByClassName('pf-v6-c-page__main-container')[0]
      .classList.add('fullscreen-fix');
  }

  disableLayoutFix() {
    document.getElementsByClassName('pf-v6-c-page__main')[0].classList.remove('default-overflow');
    document.getElementById('content-scrollable').classList.remove('default-overflow');
    document
      .getElementsByClassName('pf-v6-c-page__main-container')[0]
      .classList.remove('fullscreen-fix');
  }

  setFullscreen(fullscreen) {
    this.fullscreenAddon.toggleFullScreen(fullscreen);
    this.isFullscreen = fullscreen;
    this.focus();
    this.onResize();
    document.getElementsByClassName('pf-v6-c-page__main-container');
    // fix iOS bug where masthead overlays fullscreen terminal
    // see https://bugs.webkit.org/show_bug.cgi?id=160953
    fullscreen ? this.enableLayoutFix() : this.disableLayoutFix();
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
    terminal.refresh(0, terminal.rows - 1);
  }

  componentDidMount() {
    this.terminal.open(this.innerRef.current);
    this.focus();
    this.onResize();
    window.addEventListener('resize', this.onResize);
  }

  componentWillUnmount() {
    this.terminal && this.terminal.dispose();
    window.removeEventListener('resize', this.onResize);
  }

  onResize_() {
    const node = this.outerRef.current;

    if (!node) {
      return;
    }

    const pageRect = document.getElementsByClassName('pf-v6-c-page')[0].getBoundingClientRect();
    const bodyRect = document.body.getBoundingClientRect();
    const nodeRect = node.getBoundingClientRect();

    const { padding } = this.props;

    // This assumes we want to fill everything below and to the right.  In full-screen, fill entire viewport
    const height = Math.floor(pageRect.bottom - (this.isFullscreen ? 0 : nodeRect.top) - padding);
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
      this.fitAddon.fit();
      // update the pty
      this.props.onResize(terminal.rows, terminal.cols);
      // The internal xterm textarea was not repositioned when the window was resized.
      // This workaround triggers a textarea position update to fix this.
      // See https://bugzilla.redhat.com/show_bug.cgi?id=1983220
      // and https://github.com/xtermjs/xterm.js/issues/3390
      terminal._core?._syncTextArea?.();
    });
  }

  render() {
    const { t } = this.props;
    return (
      <div ref={this.outerRef} style={this.state} className={this.props.className}>
        <div ref={this.innerRef} className="co-terminal">
          {this.isFullscreen && (
            <Button
              icon={<CompressIcon className="co-icon-space-r" />}
              className="co-terminal-collapse-link"
              onClick={() => this.setFullscreen(false)}
              variant="link"
            >
              {t('public~Collapse')}
            </Button>
          )}
        </div>
      </div>
    );
  }
}

export const Terminal = withTranslation('translation', { withRef: true })(Terminal_);

Terminal.propTypes = {
  onData: PropTypes.func.isRequired,
  onResize: PropTypes.func.isRequired,
  padding: PropTypes.number,
  options: PropTypes.object,
};

Terminal.defaultProps = {
  padding: 52,
  options: {
    fontFamily: 'monospace',
    fontSize: 16,
    cursorBlink: false,
    cols: 80,
    rows: 25,
  },
};
