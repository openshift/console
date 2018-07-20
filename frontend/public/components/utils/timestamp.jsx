import * as React from 'react';
import { Tooltip } from './tooltip';

import {SafetyFirst} from '../safety-first';
import * as dateTime from './datetime';

const monthAbbrs = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const intervalCBs = new Set();
let interval;

const updateTimestamps = () => {
  const now = new Date();
  for (let cb of intervalCBs) {
    try {
      cb(now);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Error updating timestamp:', e);
    }
  }
  if (!intervalCBs.size) {
    clearInterval(interval);
    interval = null;
  }
};

/** @augments {React.Component<{timestamp: string, isUnix?: boolean}>} */
export class Timestamp extends SafetyFirst {
  constructor (props) {
    super(props);

    this.intervalCB = null;
    this.reset(props.timestamp);
  }

  componentWillUnmount () {
    super.componentWillUnmount();

    intervalCBs.delete(this.intervalCB);
    if (!intervalCBs.size) {
      clearInterval(interval);
      interval = null;
    }
  }

  reset (timestamp) {
    const mdate = this.props.isUnix ? new Date(timestamp * 1000) : new Date(timestamp);

    if (this.intervalCB) {
      intervalCBs.delete(this.intervalCB);
    }

    intervalCBs.add(now => {
      const nextTimestamp = this.getTimestamp(this.state.mdate, now);
      if (nextTimestamp === this.state.timestamp) {
        return;
      }
      this.setState({timestamp: nextTimestamp});
    });

    this.setState({
      mdate, timestamp: this.getTimestamp(mdate, new Date()),
    });

    if (intervalCBs.size && !interval) {
      interval = setInterval(updateTimestamps, 10000);
    }
  }

  getTimestamp (mdate, now) {
    if (!dateTime.isValid(mdate)) {
      intervalCBs.delete(this.intervalCB);
      return '-';
    }

    const timeAgo = now - mdate;
    if (this.props.omitSuffix) {
      return dateTime.fromNow(mdate, undefined, {omitSuffix: true});
    }
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

    intervalCBs.delete(this.intervalCB);
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

  render () {
    const { mdate, timestamp } = this.state;

    if (!dateTime.isValid(mdate)) {
      return <div className="co-timestamp">-</div>;
    }

    if (this.props.simple) {
      return timestamp;
    }

    return <div className="co-timestamp co-icon-and-text">
      <i className="fa fa-globe co-icon-and-text__icon" aria-hidden="true" />
      <Tooltip content={[<span className="co-nowrap" key="co-timestamp">{ mdate.toISOString() }</span>]}>
        { timestamp }
      </Tooltip>
    </div>;
  }
}
