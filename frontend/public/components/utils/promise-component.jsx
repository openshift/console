import React from 'react';

import { angulars } from '../react-wrapper';
import { SafetyFirst } from '../safety-first';

export class PromiseComponent extends SafetyFirst {
  constructor(props) {
    super(props);
    this.state = {
      inProgress: false,
      errorMessage: '',
    };
  }

  handlePromise(promise) {
    this.setState({
      inProgress: true
    });
    return promise.then(
      res => this._then(res),
      error => this._catch(error)
    );
  }

  _then(res) {
    this.setState({
      inProgress: false,
      errorMessage: '',
    });
    return res;
  }

  _catch(error) {
    const formatter = this.props.formatter || 'k8sApi';
    const errorMessage = angulars.errorMessageSvc.getFormatter(formatter)(error);
    this.setState({
      inProgress: false,
      errorMessage,
    });
    return Promise.reject(errorMessage);
  }
}
