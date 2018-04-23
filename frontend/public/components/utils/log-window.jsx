import * as _ from 'lodash-es';
import * as React from 'react';
import * as PropTypes from 'prop-types';
import { pluralize } from './';

const FUDGE_FACTOR = 70;

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

  componentWillReceiveProps(nextProps) {
    if (nextProps.logState === 'paused') {
      // If paused, make sure pausedAt state is accurate. This makes the "Resume stream and show X lines"
      // footer consistent whether the log is paused via scrolling or a parent control (like the pause button in
      // pod logs).
      const pausedAt = this.state.pausedAt > 0 ? this.state.pausedAt : this.props.buffer.totalLineCount;
      this.setState({ pausedAt: pausedAt });
      return;
    }

    const lines = this.props.buffer.lines();
    this.setState({
      pausedAt: 0, // Streaming, so reset pausedAt
      lineCount: lines.length,
      content: lines.join('')
    });
  }

  componentDidMount() {
    this.scrollPane.addEventListener('scroll', this._handleScroll, {passive: true});
    window.addEventListener('resize', this._handleResize, {passive: true});
    this._handleResize();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.logState !== this.props.logState || prevProps.buffer.totalLineCount || this.props.buffer.totalLineCount) {
      this._scrollToBottom();
    }
  }

  componentWillUnmount() {
    this.scrollPane.removeEventListener('scroll', this._handleScroll, {passive: true});
    window.removeEventListener('resize', this._handleResize, {passive: true});
  }

  _handleScroll() {
    // 1px fudge for fractional heights
    const scrollTarget = this.scrollPane.scrollHeight - (this.scrollPane.clientHeight + 1);
    if (this.scrollPane.scrollTop < scrollTarget) {
      if (this.props.logState !== 'paused') {
        this.props.updateLogState('paused');
        this.setState({ pausedAt: this.props.buffer.totalLineCount });
      }
    } else {
      this.props.updateLogState('streaming');
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
    if (this.props.logState === 'streaming') {
      // Async because scrollHeight depends on the size of the rendered pane
      setTimeout(() => {
        if (this.scrollPane && this.props.logState === 'streaming') {
          this.scrollPane.scrollTop = this.scrollPane.scrollHeight;
        }
      }, 0);
    }
  }

  _unpause() {
    this.props.updateLogState('streaming');
  }

  render() {
    let linesBehind = 0;
    if (this.props.logState === 'paused') {
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
      { !['streaming', 'loading'].includes(this.props.logState) && <div onClick={this._unpause} className="log-window__footer">
        { !hasLinesBehind && <div><span className="fa fa-play-circle-o"></span> Resume stream</div> }
        { hasLinesBehind && linesBehind < this.props.buffer.maxSize && <div><span className="fa fa-play-circle-o"></span> Resume stream and show {pluralize(linesBehind, 'line')}</div> }
        { hasLinesBehind && linesBehind > this.props.buffer.maxSize && <div><span className="fa fa-play-circle-o"></span> Resume stream and show last {pluralize(this.props.buffer.maxSize, 'line')}</div> }
      </div> }
    </div>;
  }
}
LogWindow.propTypes = {
  buffer: PropTypes.object.isRequired,
  logState: PropTypes.string.isRequired,
  updateLogState: PropTypes.func.isRequired,
  loadGeneration: PropTypes.number.isRequired // loadGeneration is used as a signal that props.buffer has changed
};
