import * as React from 'react';
import { Tooltip } from 'react-lightweight-tooltip';
import * as moment from 'moment';

import {SafetyFirst} from '../safety-first';

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
    this.mdate = props.isUnix ? moment(new Date(props.timestamp * 1000)) : moment(new Date(props.timestamp));
    this.timeStr(this.props.format || null);
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
    this.interval = setInterval(() => this.timeStr(this.props.format || null), this.props.interval || 5000);
  }

  upsertState (timestamp) {
    if (this.isMounted_) {
      this.setState({timestamp});
    } else {
      this.state.timestamp = timestamp;
    }
  }

  timeStr (format) {
    if (!this.mdate.isValid()) {
      this.upsertState('-');
      clearInterval(this.interval);
      return;
    }

    if (format) {
      this.upsertState(this.mdate.format(format));
      return;
    }

    const now = moment();
    const minutesAgo = now.diff(this.mdate, 'minutes', /* return floating point value */true);
    if (minutesAgo >= 10.5) {
      let formatStr = 'MMM DD, h:mm a';
      if (this.mdate.year() !== now.year()) {
        formatStr = 'MMM DD, YYYY h:mm a';
      }
      this.upsertState(this.mdate.format(formatStr));
      clearInterval(this.interval);
      return;
    }
    // 0-14:  a few seconds ago
    // 15-44: less than a minute ago
    // 45-89: a minute ago
    const secondsAgo = now.diff(this.mdate, 'seconds', /* return floating point value */true);
    if (secondsAgo < 45 && secondsAgo >= 15) {
      this.upsertState('less than a minute ago');
      return;
    }

    this.upsertState(this.mdate.fromNow());
  }

  render () {
    const mdate = this.mdate;
    // Calling mdate.utc() modifies mdate to be UTC. :(
    // eslint-disable-next-line import/namespace
    const utcdate = moment.utc(mdate);

    if (!mdate.isValid()) {
      return (
        <div className="co-timestamp">-</div>
      );
    }

    return (
      <div>
        <i className="fa fa-globe" />
        <div className="co-timestamp">
          <Tooltip content={utcdate.format('MMM DD, YYYY HH:mm z')}>
            {this.state.timestamp}
          </Tooltip>
        </div>
      </div>
    );
  }
}
