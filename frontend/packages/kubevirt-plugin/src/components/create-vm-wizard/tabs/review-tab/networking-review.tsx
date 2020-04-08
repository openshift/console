import * as React from 'react';
import * as _ from 'lodash';
import { connect } from 'react-redux';
import { VMWizardNetwork } from '../../types';
import { getNetworks } from '../../selectors/selectors';
import { ReviewList } from './review-list';
import { NetworkInterfaceWrapper } from '../../../../k8s/wrapper/vm/network-interface-wrapper';
import { NetworkWrapper } from '../../../../k8s/wrapper/vm/network-wrapper';

const NetworkingReviewConnected: React.FC<NetworkingTabComponentProps> = ({
  networks,
  className,
}) => (
  <ReviewList
    title="Network Interfaces"
    className={className}
    items={networks.map(({ id, networkInterface, network }) => {
      const networkInterfaceWrapper = new NetworkInterfaceWrapper(networkInterface);
      const networkWrapper = new NetworkWrapper(network);
      return {
        id,
        value: _.compact([
          networkInterfaceWrapper.getName(),
          networkInterfaceWrapper.getReadableModel(),
          networkWrapper.getReadableName(),
          networkInterfaceWrapper.getMACAddress(),
        ]).join(' - '),
      };
    })}
  />
);

type NetworkingTabComponentProps = {
  networks: VMWizardNetwork[];
  className: string;
};

const stateToProps = (state, { wizardReduxID }) => ({
  networks: getNetworks(state, wizardReduxID),
});

export const NetworkingReview = connect(stateToProps)(NetworkingReviewConnected);
