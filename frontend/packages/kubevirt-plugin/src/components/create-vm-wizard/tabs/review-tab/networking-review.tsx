import * as React from 'react';
import * as _ from 'lodash';
import { connect } from 'react-redux';
import { VMWizardNetworkWithWrappers } from '../../types';
import { getNetworksWithWrappers } from '../../selectors/selectors';
import { ReviewList } from './review-list';

const NetworkingReviewConnected: React.FC<NetworkingTabComponentProps> = ({
  networks,
  className,
}) => (
  <ReviewList
    title="Network Interfaces"
    className={className}
    items={networks.map(({ id, networkInterfaceWrapper, networkWrapper }) => ({
      id,
      value: _.compact([
        networkInterfaceWrapper.getName(),
        networkInterfaceWrapper.getReadableModel(),
        networkWrapper.getReadableName(),
        networkInterfaceWrapper.getMACAddress(),
      ]).join(' - '),
    }))}
  />
);

type NetworkingTabComponentProps = {
  networks: VMWizardNetworkWithWrappers[];
  className: string;
};

const stateToProps = (state, { wizardReduxID }) => ({
  networks: getNetworksWithWrappers(state, wizardReduxID),
});

export const NetworkingReview = connect(stateToProps)(NetworkingReviewConnected);
