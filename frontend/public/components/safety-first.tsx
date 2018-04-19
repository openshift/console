import * as _ from 'lodash-es';
import * as React from 'react';

// React doesn't like it when you call setState unless your component is mounted
export class SafetyFirst<props, state> extends React.Component<props, state> {
  /* eslint-disable no-undef */
  unMounted_: boolean;
  isMounted_: boolean;
  setState_: Function;
  /* eslint-enable no-undef */

  constructor(props) {
    super(props);
    this.unMounted_ = false;
    this.isMounted_ = false;
    this.setState_ = this.setState;
    this.setState = (arg0, arg1) => {
      // NOP in the case that we are unmounting
      if (this.unMounted_) {
        return;
      }

      // business as usual...
      if (this.isMounted_) {
        return this.setState_(arg0, arg1);
      }

      // We are in the constructor...
      // https://reactjs.org/docs/react-component.html#setstate
      const nextState = _.isFunction(arg0)
        ? arg0(this.state as any || {}, this.props)
        : arg0;

      this.state = Object.assign({}, this.state as any || {}, nextState);

      if (_.isFunction(arg1)) {
        return arg1();
      }
    };
  }

  componentWillUnmount() {
    this.unMounted_ = true;
    this.isMounted_ = false;
  }

  componentDidMount() {
    this.isMounted_ = true;
  }
}
