import React from 'react';
import classNames from 'classnames';

import {LoadingInline} from './';

const injectDisabled = (children, disabled) => {
  return React.Children.map(children, c => {
    if (!_.isObject(c) || c.type !== 'button') {
      return c;
    }

    return React.cloneElement(c, { disabled: c.props.disabled || disabled });
  });
};

// NOTE: DO NOT use <a> elements within a ButtonBar.
// They don't support the disabled attribute, and therefore
// can't be disabled during a pending promise/request.
export class ButtonBar extends React.Component {
  constructor(props) {
    super(props);
    this._isMounted = false;
    this._promiseGeneration = 0;
    this.state = {
      inProgress: false
    };
  }

  componentDidMount() {
    this._isMounted = true;
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.completePromise === this.props.completePromise) {
      return;
    }

    this._promiseGeneration += 1;

    if (!nextProps.completePromise) {
      this.setState({
        inProgress: false
      });
      return;
    }

    this.setState({
      inProgress: true
    });
    nextProps.completePromise
      .then(this._promiseCompleted.bind(this, this._promiseGeneration, false))
      .catch(this._promiseCompleted.bind(this, this._promiseGeneration, true));
  }

  _promiseCompleted(promiseGeneration, isError, response) {
    if (!this._isMounted || promiseGeneration !== this._promiseGeneration) {
      return;
    }

    this.setState({
      inProgress: false
    });

    if (isError) {
      throw response;
    }
  }

  render() {
    const props = _.omit(this.props, ['children', 'completePromise', 'className']);
    return <div className={classNames(this.props.className, 'co-m-btn-bar')} {...props}>
      {injectDisabled(this.props.children, this.state.inProgress)}
      {this.state.inProgress && <LoadingInline />}
    </div>;
  }
}
ButtonBar.propTypes = {
  completePromise: React.PropTypes.object,
  children: React.PropTypes.node
};
