import * as React from 'react';
import { Tooltip } from './tooltip';

import {SafetyFirst} from '../safety-first';
import * as dateTime from './datetime';

const monthAbbrs = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];


/** @augments {React.Component<{timestamp: string}>} */
export class Timestamp extends SafetyFirst {
  constructor (props) {
    super(props);

    this.interval = null;
    this.reset(props.timestamp);
  }

  reset (timestamp) {
    const mdate = this.props.isUnix ? new Date(timestamp * 1000) : new Date(timestamp);

    this.setState({
      mdate, timestamp: this.getTimestamp(mdate),
    });

    this.startInterval();
  }

  startInterval () {
    clearInterval(this.interval);

    this.interval = setInterval(() => this.setState({
      timestamp: this.getTimestamp(this.state.mdate)
    }), 5000);
  }

  getTimestamp (mdate) {
    if (!dateTime.isValid(mdate)) {
      clearInterval(this.interval);
      return '-';
    }

    const now = new Date();
    const timeAgo = now - mdate;
    if (timeAgo < 630000) { // 10.5 minutes
      return dateTime.fromNow(mdate);
    }

    let a = 'am';
    let hours = mdate.getHours();
    if (hours > 12) {
      hours -= 12;
      a = 'pm';
    }

    const minuteStr = mdate.getMinutes().toString().padStart(2, '00');
    let timeStr = `${hours}:${minuteStr} ${a}`;
    if (mdate.getFullYear() !== now.getFullYear()) {
      timeStr = `${mdate.getFullYear()} ${timeStr}`;
    }

    const monthStr = monthAbbrs[mdate.getMonth()];

    clearInterval(this.interval);
    return `${monthStr} ${mdate.getDate()}, ${timeStr}`;
  }

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillReceiveProps ({timestamp}) {
    // sometimes the timestamp prop changes...
    // and we need to trigger a side effect
    if (timestamp && timestamp === this.props.timestamp) {
      return null;
    }
    this.reset(timestamp);
  }

  shouldComponentUpdate (nextProps, nextState) {
    return nextState.timestamp !== this.state.timestamp
        || nextState.mdate !== this.state.mdate;
  }

  componentWillUnmount () {
    super.componentWillUnmount();
    clearInterval(this.interval);
  }

  render () {
    const { mdate, timestamp } = this.state;

    if (!dateTime.isValid(mdate)) {
      return <div className="co-timestamp">-</div>;
    }

    return <div>
      <i className="fa fa-globe" />
      <div className="co-timestamp">
        <Tooltip content={[<span className="co-nowrap" key="nowrap">{ mdate.toISOString() }</span>]}>
          { timestamp }
        </Tooltip>
      </div>
    </div>;
  }
}
