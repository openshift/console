import React from 'react';

import {SafetyFirst} from '../safety-first';

export class PromiseComponent extends SafetyFirst {
  constructor(props) {
    super(props);
    this.state = {};
    this.requestPromise = null;
  }

  _setRequestPromise(promise) {
    this.requestPromise = promise;

    // requestPromiseGeneration is only used to indicate a re-render is needed
    this.setState({
      requestPromiseGeneration: this.state.requestPromiseGeneration + 1 || 0
    });

    return this.requestPromise;
  }
}
