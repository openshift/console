import * as React from 'react';

export class SafetyFirst<props, state> extends React.Component<props, state> {
  /* eslint-disable no-undef */
  isMounted_: boolean;
  setState_: Function;
  /* eslint-enable no-undef */

  constructor(props) {
    super(props);
    this.isMounted_ = false;
    this.setState_ = this.setState;
    this.setState = (...args) => this.isMounted_ && this.setState_(...args);
  }

  componentWillUnmount() {
    this.isMounted_ = false;
  }

  componentDidMount() {
    this.isMounted_ = true;
  }
}
