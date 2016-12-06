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

  shouldComponentUpdate (nextProps, nextState) {
    return nextProps.timestamp !== this.props.timestamp || nextState.timestamp !== this.state.timestamp;
  }

  componentDidMount () {
    this._isMounted = true;
    this.startInterval();
  }

  componentWillUnmount () {
    clearInterval(this.interval);
  }

  startInterval () {
    clearInterval(this.interval);
    this.interval = setInterval(() => this.timeStr(), this.props.interval || 5000);
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

    const now = moment();
    const minutesAgo = now.diff(this.mdate, 'minutes', /* return floating point value */true);
    if (minutesAgo >= 10.5) {
      let format = 'MMM DD, h:mm a';
      if (this.mdate.year() !== now.year()) {
        format = 'MMM DD, YYYY h:mm a';
      }
      this.upsertState(this.mdate.format(format));
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
    const utcdate = moment.utc(mdate);

    if (!mdate.isValid()) {
      return (
        <div className="co-timestamp">-</div>
      );
    }

    return (
      <div>
        <i className="fa fa-globe" />
        <div className="co-timestamp" title={utcdate.format('MMM DD, YYYY HH:mm z')}>
          {this.state.timestamp}
        </div>
      </div>
    );
  }
}
