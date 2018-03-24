import * as React from 'react';
import { Tooltip } from 'react-lightweight-tooltip';

import {SafetyFirst} from '../safety-first';
import * as dateTime from './datetime';

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

  timeStr (format) {
    if (!dateTime.isValid(this.mdate)) {
      this.upsertState('-');
      clearInterval(this.interval);
      return;
    }

    if (format) {
      this.upsertState(dateTime.format(this.mdate, format));
      return;
    }

    const now = new Date();
    const timeAgo = now - this.mdate;
    if (timeAgo >= 630000) { // 10.5 minutes
      let formatStr = 'MMM DD, h:mm a';
      if (this.mdate.getYear() !== now.getYear()) {
        formatStr = 'MMM DD, YYYY h:mm a';
      }
      this.upsertState(dateTime.format(this.mdate, formatStr));
      clearInterval(this.interval);
      return;
    }
    // 0-14:  a few seconds ago
    // 15-44: less than a minute ago
    // 45-89: a minute ago
    if (timeAgo < 45000 && timeAgo >= 15000) {
      this.upsertState('less than a minute ago');
      return;
    }

    this.upsertState(dateTime.fromNow(this.mdate));
  }

  render () {
    const mdate = this.mdate;

    if (!dateTime.isValid(mdate)) {
      return (
        <div className="co-timestamp">-</div>
      );
    }

    const utcdate = dateTime.utc(mdate);
    return (
      <div>
        <i className="fa fa-globe" />
        <div className="co-timestamp">
          <Tooltip content={dateTime.format(utcdate, 'MMM DD, YYYY HH:mm z')}>
            {this.state.timestamp}
          </Tooltip>
        </div>
      </div>
    );
  }
}
