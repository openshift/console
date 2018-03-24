import * as React from 'react';
import { Tooltip } from 'react-lightweight-tooltip';

import {SafetyFirst} from '../safety-first';
import * as dateTime from './datetime';

const monthAbbrs = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** @augments {React.Component<{timestamp: string}>} */
export class Timestamp extends SafetyFirst {
  constructor (props) {
    super(props);

    this.interval = null;
    this.state = {
      timestamp: null,
    };
    this.initialize();
  }

  initialize (props = this.props) {
    this.mdate = props.isUnix ? new Date(props.timestamp * 1000) : new Date(props.timestamp);
    this.timeStr();
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.timestamp === this.props.timestamp) {
      return;
    }
    this.initialize(nextProps);
    if (this.isMounted_) {
      this.startInterval();
    }
  }

  shouldComponentUpdate (nextProps, nextState) {
    return nextProps.timestamp !== this.props.timestamp || nextState.timestamp !== this.state.timestamp;
  }

  componentDidMount () {
    super.componentDidMount();
    this.startInterval();
  }

  componentWillUnmount () {
    super.componentWillUnmount();
    clearInterval(this.interval);
  }

  startInterval () {
    clearInterval(this.interval);
    this.interval = setInterval(() => this.timeStr(), this.props.interval || 5000);
  }

  upsertState (timestamp) {
    if (this.isMounted_) {
      this.setState({timestamp});
    } else {
      this.state.timestamp = timestamp;
    }
  }

  timeStr () {
    const mdate = this.mdate;
    if (!dateTime.isValid(mdate)) {
      this.upsertState('-');
      clearInterval(this.interval);
      return;
    }

    const now = new Date();
    const timeAgo = now - mdate;
    if (timeAgo < 630000) { // 10.5 minutes
      this.upsertState(dateTime.fromNow(this.mdate));
      return;
    }

    let a = 'am';
    let hours = mdate.getHours();
    if (hours > 12) {
      hours -= 12;
      a = 'pm';
    }

    const minuteStr = mdate.getMinutes().toString().padStart(2, '00');
    let timeStr = `${hours}:${minuteStr} ${a}`;
    if (this.mdate.getFullYear() !== now.getFullYear()) {
      timeStr = `${mdate.getFullYear()} ${timeStr}`;
    }

    const monthStr = monthAbbrs[mdate.getMonth()];
    this.upsertState(`${monthStr} ${mdate.getDate()}, ${timeStr}`);

    clearInterval(this.interval);
  }

  render () {
    const mdate = this.mdate;

    if (!dateTime.isValid(mdate)) {
      return (
        <div className="co-timestamp">-</div>
      );
    }

    return (
      <div>
        <i className="fa fa-globe" />
        <div className="co-timestamp">
          <Tooltip content={mdate.toISOString()}>
            {this.state.timestamp}
          </Tooltip>
        </div>
      </div>
    );
  }
}
