import React from 'react';

import {angulars} from '../react-wrapper';

export class ErrorMessage extends React.Component {
  constructor(props) {
    super(props);
    this._isMounted = false;
    this._promiseGeneration = 0;
    this.state = {
      show: false,
      message: null
    };
  }

  componentDidMount() {
    this._isMounted = true;
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.promise === this.props.promise) {
      return;
    }

    this._promiseGeneration += 1;
    this.setState({
      show: false,
      message: null
    });

    if (nextProps.promise && nextProps.promise.catch) {
      nextProps.promise.catch(this._catchPromise.bind(this, this._promiseGeneration));
    }
  }

  _catchPromise(promiseGeneration, error) {
    if (!this._isMounted || promiseGeneration !== this._promiseGeneration) {
      return;
    }

    let message;
    if (this.props.formatter) {
      message = angulars.errorMessageSvc.getFormatter(this.props.formatter)(error);
    } else if (this.props.customMessage) {
      message = this.props.customMessage;
    } else {
      throw error;
    }

    this.setState({
      show: true,
      message
    });

    throw error;
  }

  render() {
    if (!this.state.show) {
      return <div></div>;
    }

    return <div className="co-m-message co-m-message--error">{this.state.message}</div>;
  }
}
ErrorMessage.propTypes = {
  promise: React.PropTypes.object,
  formatter: React.PropTypes.string,
  customMessage: React.PropTypes.node
};
