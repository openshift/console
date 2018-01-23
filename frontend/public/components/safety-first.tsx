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
    this.setState = (...args) => {
      if (this.isMounted_) {
        return this.setState_(...args);
      }
      // eslint-disable-next-line no-console
      console.debug('SafetyFirst: Not setting state because component is not mounted.');
    };
  }

  componentWillUnmount() {
    this.isMounted_ = false;
  }

  componentDidMount() {
    this.isMounted_ = true;
  }
}
