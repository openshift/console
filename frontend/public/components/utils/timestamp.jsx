import React from 'react';

export class Timestamp extends React.Component {
  constructor (props) {
    super(props);

    this.interval = null;
    this.mdate = moment(new Date(props.timestamp));
    this.state = {
      timestamp: null,
    };
    this.timeStr();
  }

  startInterval () {
    clearInterval(this.interval);
    this.interval = setInterval(() => this.timeStr(), this.props.interval || 5000);
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.timestamp === this.props.timestamp) {
      return;
    }
    this.mdate = moment(new Date(nextProps.timestamp));
    if (this._isMounted) {
      this.startInterval();
    }
    this.timeStr();
  }

  upsertState (timestamp) {
    if (this._isMounted) {
      this.setState({timestamp});
    } else {
      this.state.timestamp = timestamp;
    }
  }

  timeStr () {
    if (!this.mdate.isValid()) {
      clearInterval(this.interval);
      return;
    }

    const minutesAgo = moment().diff(this.mdate, 'minutes', /* return floating point value */true);
    if (minutesAgo >= 10.5) {
      this.upsertState(this.mdate.format('MMM DD, h:mm a'));
      clearInterval(this.interval);
      return;
    }
    // 0-14:  a few seconds ago
    // 15-44: less than a minute ago
    // 45-89: a minute ago
    const secondsAgo = moment().diff(this.mdate, 'seconds', /* return floating point value */true);
    if (secondsAgo < 45 && secondsAgo >= 15) {
      this.upsertState('less than a minute ago');
      return;
    }
    this.upsertState(this.mdate.fromNow());
  }

  componentDidMount () {
    this._isMounted = true;
    this.startInterval();
  }

  componentWillUnmount () {
    clearInterval(this.interval);
  }

  render () {
    const mdate = this.mdate;
    // Calling mdate.utc() modifies mdate to be UTC. :(
    const utcdate = moment.utc(mdate);

    if (!mdate.isValid()) {
      return (
        <div className="co-timestamp">-</div>
      );
    }

    return (
      <div>
        <i className="fa fa-globe" />
        <div className="co-timestamp" title={utcdate.format('MMM DD, H:mm A z')}>
          {this.state.timestamp}
        </div>
      </div>
    );
  }
}
