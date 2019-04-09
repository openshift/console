import React from 'react';
import * as _ from 'lodash-es';
import { inject } from '../../../components/utils';

const DEFAULT_THROTTLE_DELAY = 250; // in ms

/**
 * Avoids eager re-rendering for frequent redux store changes.
 *
 * Assumption: re-render requests are frequent, so skipping a few of them
 * has no impact on rendered information from user's perspective.
 *
 * If that assumption is not met, the use of this component is not recommended.
 */
export class LazyRenderer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isRenderingEnabled: false,
    };
    this.enableRendering = _.throttle(() => {
      this.setState({
        isRenderingEnabled: true,
      });
    }, DEFAULT_THROTTLE_DELAY);
  }

  shouldComponentUpdate(nextProps, nextState) {
    this.enableRendering();

    if (nextState.isRenderingEnabled) {
      // will cause additional shouldComponentUpdate() call
      this.setState({ isRenderingEnabled: false });
    }
    return nextState.isRenderingEnabled;
  }

  componentWillUnmount() {
    this.enableRendering.cancel();
  }

  render() {
    return inject(this.props.children, this.props);
  }
}
