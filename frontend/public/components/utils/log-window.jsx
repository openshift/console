import * as _ from 'lodash-es';
import * as React from 'react';
import * as PropTypes from 'prop-types';
import { pluralize } from './';
import { STREAM_EOF, STREAM_PAUSED, STREAM_ACTIVE } from './resource-log';
import { OutlinedPlayCircleIcon } from '@patternfly/react-icons';
import { Button } from '@patternfly/react-core';

// Subtracted from log window height to prevent scroll bar from appearing when resume button is shown.
// Added fullscreen fudge factor to account for fullscreen taking log contents outside of .co-m-pane__body div
const FUDGE_FACTOR = 105;
const FULLSCREEN_FUDGE_FACTOR = 57;

export class LogWindow extends React.PureComponent {
  constructor(props) {
    super(props);
    this._unpause = this._unpause.bind(this);
    this._handleScroll = _.throttle(this._handleScroll.bind(this), 100);
    this._handleResize = _.debounce(this._handleResize.bind(this), 50);
    this._setScrollPane = (element) => (this.scrollPane = element);
    this._setLogContents = (element) => (this.logContents = element);
    this.state = {
      content: '',
      height: '',
    };
    this.prevScrollLeft = null;
  }

  static getDerivedStateFromProps(nextProps) {
    if (nextProps.status !== STREAM_PAUSED) {
      return {
        content: nextProps.lines.join('\n'),
      };
    }
    return null;
  }

  componentDidMount() {
    this.scrollPane.addEventListener('scroll', this._handleScroll, { passive: true });
    window.addEventListener('resize', this._handleResize, { passive: true });
    this._handleResize();
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.status !== this.props.status ||
      prevProps.lines.length ||
      this.props.lines.length
    ) {
      this._scrollToBottom();
    }
  }

  componentWillUnmount() {
    this.scrollPane.removeEventListener('scroll', this._handleScroll, { passive: true });
    window.removeEventListener('resize', this._handleResize, { passive: true });
  }

  _handleScroll() {
    const scrollLeftChanged = this.prevScrollLeft !== this.scrollPane.scrollLeft;

    // Stream is finished, take no action on scroll
    if (this.props.status === STREAM_EOF) {
      return;
    }

    // If horizontal scrolling, take no action
    if (scrollLeftChanged) {
      this.prevScrollLeft = this.scrollPane.scrollLeft;
      return;
    }

    // 1px fudge for fractional heights
    const scrollTarget = this.scrollPane.scrollHeight - (this.scrollPane.clientHeight + 1);
    if (this.scrollPane.scrollTop < scrollTarget) {
      if (this.props.status !== STREAM_PAUSED) {
        this.props.updateStatus(STREAM_PAUSED);
      }
    } else {
      this.props.updateStatus(STREAM_ACTIVE);
    }
  }

  _handleResize() {
    if (!this.scrollPane) {
      return;
    }

    const targetHeight = Math.floor(
      window.innerHeight -
        this.scrollPane.getBoundingClientRect().top -
        (this.props.isFullscreen ? FULLSCREEN_FUDGE_FACTOR : FUDGE_FACTOR),
    );
    this.prevScrollLeft = this.scrollPane.scrollLeft;
    this.setState({
      height: targetHeight,
    });
  }

  _scrollToBottom() {
    if (this.props.status === STREAM_ACTIVE) {
      // Async because scrollHeight depends on the size of the rendered pane
      setTimeout(() => {
        if (this.scrollPane && this.props.status === STREAM_ACTIVE) {
          this.scrollPane.scrollTop = this.scrollPane.scrollHeight;
        }
      }, 0);
    }
  }

  _unpause() {
    this.props.updateStatus(STREAM_ACTIVE);
  }

  render() {
    const { bufferFull, lines, linesBehind, status } = this.props;
    const { content, height } = this.state;

    // TODO maybe move these variables into state so they are only updated on changes
    const totalLineCount = pluralize(lines.length, 'line');
    const linesBehindCount = pluralize(linesBehind, 'new line');
    const headerText = bufferFull ? `last ${totalLineCount}` : totalLineCount;
    const resumeText =
      linesBehind > 0 ? ` Resume stream and show ${linesBehindCount}` : ' Resume stream';

    return (
      <div className="log-window">
        <div className="log-window__header">{headerText}</div>
        <div className="log-window__body">
          <div className="log-window__scroll-pane" ref={this._setScrollPane}>
            <div className="log-window__contents" ref={this._setLogContents} style={{ height }}>
              <div className="log-window__lines">{content}</div>
            </div>
          </div>
        </div>
        {status === STREAM_PAUSED && (
          <Button onClick={this._unpause} isBlock>
            <OutlinedPlayCircleIcon />
            {resumeText}
          </Button>
        )}
      </div>
    );
  }
}

LogWindow.propTypes = {
  bufferFull: PropTypes.bool.isRequired,
  lines: PropTypes.array.isRequired,
  linesBehind: PropTypes.number.isRequired,
  status: PropTypes.string.isRequired,
  updateStatus: PropTypes.func.isRequired,
};
