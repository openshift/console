import * as _ from 'lodash-es';
import * as React from 'react';
import * as PropTypes from 'prop-types';
import { pluralize } from './';

// Subtracted from log window height to prevent scroll bar from appearing when footer is shown.
const FUDGE_FACTOR = 105;

export class LogWindow extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      pausedAt: 0,
      lineCount: 0,
      content: '',
      height: ''
    };

    this._unpause = this._unpause.bind(this);
    this._handleScroll = _.throttle(this._handleScroll.bind(this), 100);
    this._handleResize = _.debounce(this._handleResize.bind(this), 50);
    this._setScrollPane = (element) => this.scrollPane = element;
    this._setLogContents = (element) => this.logContents = element;
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    if (nextProps.status === 'paused') {
      // If paused, make sure pausedAt state is accurate. This makes the "Resume stream and show X lines"
      // footer consistent whether the log is paused via scrolling or a parent control (like the pause button in
      // pod logs).
      const pausedAt = prevState.pausedAt > 0 ? prevState.pausedAt : nextProps.buffer.totalLineCount;
      return {pausedAt};
    }

    const lines = nextProps.buffer.lines();
    return {
      pausedAt: 0, // Streaming, so reset pausedAt
      lineCount: lines.length,
      content: lines.join('')
    };
  }

  componentDidMount() {
    this.scrollPane.addEventListener('scroll', this._handleScroll, {passive: true});
    window.addEventListener('resize', this._handleResize, {passive: true});
    this._handleResize();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.status !== this.props.status || prevProps.buffer.totalLineCount || this.props.buffer.totalLineCount) {
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
        this.setState({ pausedAt: this.props.buffer.totalLineCount });
      }
    } else {
      this.props.updateStatus('streaming');
      this.setState({ pausedAt: 0 });
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
    if (['streaming', 'eof'].includes(this.props.status)) {
      // Async because scrollHeight depends on the size of the rendered pane
      setTimeout(() => {
        if (this.scrollPane && ['streaming', 'eof'].includes(this.props.status)) {
          this.scrollPane.scrollTop = this.scrollPane.scrollHeight;
        }
      }, 0);
    }
  }

  _unpause() {
    this.props.updateStatus('streaming');
  }

  render() {
    let linesBehind = 0;
    if (this.props.status === 'paused') {
      linesBehind = this.props.buffer.totalLineCount - this.state.pausedAt;
    }
    const hasLinesBehind = linesBehind > 0;

    return <div className="log-window">
      <div className="log-window__header">
        { this.state.lineCount < this.props.buffer.maxSize ? pluralize(this.state.lineCount, 'line') : `last ${pluralize(this.props.buffer.maxSize, 'line')}` }
      </div>
      <div className="log-window__body">
        <div className="log-window__scroll-pane" ref={this._setScrollPane}>
          <div className="log-window__contents" ref={this._setLogContents} style={{ height: this.state.height }}>
            <div className="log-window__contents__text">
              {this.state.content}
            </div>
          </div>
        </div>
      </div>
      { !['streaming', 'loading', 'eof'].includes(this.props.status) && <div onClick={this._unpause} className="log-window__footer">
        { !hasLinesBehind && <div><span className="fa fa-play-circle-o"></span> Resume stream</div> }
        { hasLinesBehind && linesBehind < this.props.buffer.maxSize && <div><span className="fa fa-play-circle-o"></span> Resume stream and show {pluralize(linesBehind, 'line')}</div> }
        { hasLinesBehind && linesBehind > this.props.buffer.maxSize && <div><span className="fa fa-play-circle-o"></span> Resume stream and show last {pluralize(this.props.buffer.maxSize, 'line')}</div> }
      </div> }
    </div>;
  }
}
LogWindow.propTypes = {
  buffer: PropTypes.object.isRequired,
  status: PropTypes.string.isRequired,
  updateStatus: PropTypes.func.isRequired,
  touched: PropTypes.number.isRequired // touched is used as a signal that props.buffer has changed
};
