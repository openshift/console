import * as React from 'react';
import * as _ from 'lodash';
import * as classNames from 'classnames';
import { connect } from 'react-redux';
import { VMWizardNetworkWithWrappers } from '../../types';
import { getNetworksWithWrappers } from '../../selectors/selectors';

import './networking-review.scss';

const NetworkingReviewConnected: React.FC<NetworkingTabComponentProps> = ({
  networks,
  className,
}) => {
  return (
    <dl className={classNames('kubevirt-create-vm-modal__review-tab-networking', className)}>
      <dt>Network Interfaces</dt>
      <dd>
        <ul className="kubevirt-create-vm-modal__review-tab-networking-simple-list">
          {networks.map(({ id, networkInterfaceWrapper, networkWrapper }) => (
            <li key={id}>
              {_.compact([
                networkInterfaceWrapper.getName(),
                networkInterfaceWrapper.getReadableModel(),
                networkWrapper.getReadableName(),
                networkInterfaceWrapper.getMACAddress(),
              ]).join(' - ')}
            </li>
          ))}
        </ul>
      </dd>
    </dl>
  );
};

type NetworkingTabComponentProps = {
  networks: VMWizardNetworkWithWrappers[];
  className: string;
};

const stateToProps = (state, { wizardReduxID }) => ({
  networks: getNetworksWithWrappers(state, wizardReduxID),
});

export const NetworkingReview = connect(stateToProps)(NetworkingReviewConnected);
