import * as React from 'react';
import { connect } from 'react-redux';
import { VMWizardNetwork } from '../../types';
import { getNetworks } from '../../selectors/selectors';
import { NetworkInterfaceWrapper } from '../../../../k8s/wrapper/vm/network-interface-wrapper';
import { NetworkWrapper } from '../../../../k8s/wrapper/vm/network-wrapper';
import { cellWidth, Table, TableBody, TableHeader, TableVariant } from '@patternfly/react-table';

const NetworkingReviewConnected: React.FC<NetworkingTabComponentProps> = ({
  networks,
  className,
}) => {
  const headers = [
    { title: 'Name', transforms: [cellWidth(10)] },
    { title: 'Model', transforms: [cellWidth(10)] },
    { title: 'MAC Address', transforms: [cellWidth(10)] },
    { title: 'Network', transforms: [cellWidth(10)] },
  ];

  const rows = networks.map(({ networkInterface, network }) => {
    const networkInterfaceWrapper = new NetworkInterfaceWrapper(networkInterface);
    const networkWrapper = new NetworkWrapper(network);

    return [
      networkInterfaceWrapper.getName(),
      networkInterfaceWrapper.getReadableModel(),
      networkInterfaceWrapper.getMACAddress(),
      networkWrapper.getReadableName(),
    ];
  });

  return (
    <Table
      aria-label="Network Interfaces"
      variant={TableVariant.compact}
      cells={headers}
      rows={rows}
    >
      <TableHeader />
      <TableBody />
    </Table>
  );
};

type NetworkingTabComponentProps = {
  networks: VMWizardNetwork[];
  className: string;
};

const stateToProps = (state, { wizardReduxID }) => ({
  networks: getNetworks(state, wizardReduxID),
});

export const NetworkingReview = connect(stateToProps)(NetworkingReviewConnected);
