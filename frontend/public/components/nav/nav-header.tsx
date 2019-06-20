import * as React from 'react';
import { connect } from 'react-redux';
import { Title, Text, TextVariants } from '@patternfly/react-core';
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

  let clusterName: string;
  const server = window.SERVER_FLAGS.kubeAPIServerURL;
  if (server) {
    // add zero-width space after each `.` to improve readability when breaking up the string for wrapping
    clusterName = new URL(server).host.replace(/\./g, `.${String.fromCharCode(8203)}`);
  }

  return (
    <div className="oc-nav-header">
      <Title className="oc-nav-header__title" size="md">
        {icon} {name}
      </Title>
      {clusterName && (
        <Text className="oc-nav-header__description co-break-word" component={TextVariants.small}>
          Cluster: {clusterName}
        </Text>
      )}
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
