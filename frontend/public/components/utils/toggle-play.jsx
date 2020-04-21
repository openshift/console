import * as React from 'react';
import * as classNames from 'classnames';
import * as PropTypes from 'prop-types';
import { Button } from '@patternfly/react-core';

export class TogglePlay extends React.Component {
  shouldComponentUpdate(nextProps) {
    return !!['className', 'active', 'onClick'].find(
      (prop) => nextProps[prop] !== this.props[prop],
    );
  }

  render() {
    const klass = classNames(
      'co-toggle-play fa',
      this.props.className,
      this.props.active ? 'co-toggle-play--active' : 'co-toggle-play--inactive',
    );
    return (
      <Button
        variant="plain"
        className={klass}
        onClick={this.props.onClick}
        aria-label={this.props.active ? 'Pause event streaming' : 'Start streaming events'}
      />
    );
  }
}
TogglePlay.propTypes = {
  active: PropTypes.bool.isRequired,
  className: PropTypes.string,
  onClick: PropTypes.func.isRequired,
};
