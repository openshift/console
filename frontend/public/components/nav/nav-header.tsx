import * as React from 'react';
import { connect } from 'react-redux';
import { Title } from '@patternfly/react-core';
import { getActivePerspective } from '../../reducers/ui';
import * as plugins from '../../plugins';
import { RootState } from '../../redux';

type StateProps = {
  activePerspective: string;
};

export const NavHeader: React.FC<StateProps> = ({ activePerspective }) => {
  const { icon, name } = plugins.registry
    .getPerspectives()
    .find((p) => p.properties.id === activePerspective).properties;

  return (
    <div className="oc-nav-header">
      <Title className="oc-nav-header__title" size="md">
        {icon} {name}
      </Title>
    </div>
  );
};

const mapStateToProps = (state: RootState): StateProps => {
  return {
    activePerspective: getActivePerspective(state),
  };
};

export default connect(
  mapStateToProps,
  null,
  null,
  { pure: true },
)(NavHeader);
