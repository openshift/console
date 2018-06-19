import * as _ from 'lodash-es';
import * as React from 'react';
import * as PropTypes from 'prop-types';
import { pluralize } from './';

// Subtracted from log window height to prevent scroll bar from appearing when footer is shown.
const FUDGE_FACTOR = 105;

export class LogWindow extends React.PureComponent {
  constructor(props) {
    super(props);
    this._unpause = this._unpause.bind(this);
    this._handleScroll = _.throttle(this._handleScroll.bind(this), 100);
    this._handleResize = _.debounce(this._handleResize.bind(this), 50);
    this._setScrollPane = (element) => this.scrollPane = element;
    this._setLogContents = (element) => this.logContents = element;
    this.state = {
      content: '',
      height: ''
    };
  }

  static getDerivedStateFromProps(nextProps) {
    if (nextProps.status !== 'paused') {
      return {
        content: nextProps.lines.join(''),
      };
    }
    return null;
  }

  componentDidMount() {
    this.scrollPane.addEventListener('scroll', this._handleScroll, {passive: true});
    window.addEventListener('resize', this._handleResize, {passive: true});
    this._handleResize();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.status !== this.props.status || prevProps.lines.length || this.props.lines.length) {
      this._scrollToBottom();
    }
  }

  componentWillUnmount() {
    this.scrollPane.removeEventListener('scroll', this._handleScroll, {passive: true});
    window.removeEventListener('resize', this._handleResize, {passive: true});
  }

  _handleScroll() {
    // Stream is finished, take no action on scroll
    if (this.props.status === 'eof') {
      return;
    }

    // 1px fudge for fractional heights
    const scrollTarget = this.scrollPane.scrollHeight - (this.scrollPane.clientHeight + 1);
    if (this.scrollPane.scrollTop < scrollTarget) {
      if (this.props.status !== 'paused') {
        this.props.updateStatus('paused');
      }
    } else {
      this.props.updateStatus('streaming');
    }
  }

  _handleResize() {
    if (!this.scrollPane) {
      return;
    }

    const targetHeight = Math.floor(window.innerHeight - this.scrollPane.getBoundingClientRect().top - FUDGE_FACTOR);
    this.setState({
      height: targetHeight
    });
  }

  _scrollToBottom() {
    if (this.props.status === 'streaming') {
      // Async because scrollHeight depends on the size of the rendered pane
      setTimeout(() => {
        if (this.scrollPane && this.props.status === 'streaming') {
          this.scrollPane.scrollTop = this.scrollPane.scrollHeight;
        }
      }, 0);
    }
  }

  _unpause() {
    this.props.updateStatus('streaming');
  }

  render() {
    const {bufferFull, lines, linesBehind, status } = this.props;
    const {content, height} = this.state;

    // TODO maybe move these variables into state so they are only updated on changes
    const totalLineCount = pluralize(lines.length, 'line');
    const linesBehindCount = pluralize(linesBehind, 'line');
    const headerText = bufferFull ? `last ${totalLineCount}` : totalLineCount;
    let footerText = ' Resume stream';
    if (linesBehind > 0) {
      footerText += bufferFull ? ` and show last ${totalLineCount}` : ` and show ${linesBehindCount}`;
    }

    return <div className="log-window">
      <div className="log-window__header">
        {headerText}
      </div>
      <div className="log-window__body">
        <div className="log-window__scroll-pane" ref={this._setScrollPane}>
          <div className="log-window__contents" ref={this._setLogContents} style={{ height: height }}>
            <div className="log-window__contents__text">
              {content}
            </div>
          </div>
        </div>
      </div>
      { status === 'paused' && <div onClick={this._unpause} className="log-window__footer">
        <span className="fa fa-play-circle-o" aria-hidden="true"></span>
        {footerText}
      </div> }
    </div>;
  }
}

LogWindow.propTypes = {
  bufferFull: PropTypes.bool.isRequired,
  lines: PropTypes.array.isRequired,
  linesBehind: PropTypes.number.isRequired,
  status: PropTypes.string.isRequired,
  updateStatus: PropTypes.func.isRequired
};
