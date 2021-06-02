import * as React from 'react';
import { Table, TableBody, TableHeader, TableVariant } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { NetworkInterfaceWrapper } from '../../../../k8s/wrapper/vm/network-interface-wrapper';
import { NetworkWrapper } from '../../../../k8s/wrapper/vm/network-wrapper';
import { getNetworks } from '../../selectors/selectors';
import { VMWizardNetwork } from '../../types';

const NetworkingReviewConnected: React.FC<NetworkingTabComponentProps> = ({ networks }) => {
  const { t } = useTranslation();
  const showNetworks = networks.length > 0;

  const headers = [
    { title: t('kubevirt-plugin~Name') },
    { title: t('kubevirt-plugin~Model') },
    { title: t('kubevirt-plugin~Network') },
    { title: t('kubevirt-plugin~MAC Address') },
  ];

  const rows = networks.map(({ networkInterface, network }) => {
    const networkInterfaceWrapper = new NetworkInterfaceWrapper(networkInterface);
    const networkWrapper = new NetworkWrapper(network);

    return [
      networkInterfaceWrapper.getName(),
      networkInterfaceWrapper.getReadableModel(),
      networkWrapper.getReadableName(),
      networkInterfaceWrapper.getMACAddress(),
    ];
  });

  return (
    <>
      {showNetworks && (
        <Table
          aria-label={t('kubevirt-plugin~Network Interfaces')}
          variant={TableVariant.compact}
          cells={headers}
          rows={rows}
          gridBreakPoint="grid-xl"
        >
          <TableHeader />
          <TableBody />
        </Table>
      )}
      {!showNetworks && (
        <p>
          <strong>{t('kubevirt-plugin~No network interfaces found')}</strong>
        </p>
      )}
    </>
  );
};

type NetworkingTabComponentProps = {
  networks: VMWizardNetwork[];
};

const stateToProps = (state, { wizardReduxID }) => ({
  networks: getNetworks(state, wizardReduxID),
});

export const NetworkingReview = connect(stateToProps)(NetworkingReviewConnected);
