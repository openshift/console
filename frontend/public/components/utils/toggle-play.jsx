import * as React from 'react';
import classnames from 'classnames';
import * as PropTypes from 'prop-types';
import { Button } from '@patternfly/react-core';
import { withTranslation } from 'react-i18next';

class TogglePlayWithTranslation extends React.Component {
  shouldComponentUpdate(nextProps) {
    return !!['className', 'active', 'onClick'].find(
      (prop) => nextProps[prop] !== this.props[prop],
    );
  }

  render() {
    const klass = classnames(
      'co-toggle-play fa',
      this.props.className,
      this.props.active ? 'co-toggle-play--active' : 'co-toggle-play--inactive',
    );
    const { t } = this.props;
    return (
      <Button
        variant="plain"
        className={klass}
        onClick={this.props.onClick}
        aria-label={
          this.props.active ? t('public~Pause event streaming') : t('public~Start streaming events')
        }
      />
    );
  }
}

export const TogglePlay = withTranslation()(TogglePlayWithTranslation);

TogglePlay.propTypes = {
  active: PropTypes.bool.isRequired,
  className: PropTypes.string,
  onClick: PropTypes.func.isRequired,
};
