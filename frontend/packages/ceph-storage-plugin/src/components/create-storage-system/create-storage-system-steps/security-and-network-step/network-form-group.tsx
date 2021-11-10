import * as React from 'react';
import { useTranslation } from 'react-i18next';
import * as fuzzy from 'fuzzysearch';
import { FormGroup, Radio } from '@patternfly/react-core';
import { FieldLevelHelp, Firehose } from '@console/internal/components/utils';
import { TechPreviewBadge, ResourceDropdown, getName } from '@console/shared';
import { referenceForModel, K8sResourceCommon } from '@console/internal/module/k8s';
import { NetworkAttachmentDefinitionKind } from '@console/network-attachment-definition-plugin/src/types';
import { NetworkAttachmentDefinitionModel } from '@console/network-attachment-definition-plugin';
import { CEPH_STORAGE_NAMESPACE } from '../../../../constants';
import { NetworkType, NADSelectorType } from '../../../../types';
import './network-form-group.scss';

const resources = [
  {
    isList: true,
    kind: referenceForModel(NetworkAttachmentDefinitionModel),
    namespace: CEPH_STORAGE_NAMESPACE,
    prop: 'openshift-storage-nad',
  },
  {
    isList: true,
    kind: referenceForModel(NetworkAttachmentDefinitionModel),
    namespace: 'default',
    prop: 'default-nad',
  },
];

export const NetworkFormGroup: React.FC<NetworkFormGroupProps> = ({
  setNetworkType,
  networkType,
  publicNetwork,
  clusterNetwork,
  setNetwork,
}) => {
  const { t } = useTranslation();

  const clusterNetworkName = React.useMemo(() => clusterNetwork?.split('/')?.[1], [clusterNetwork]);
  const publicNetworkName = React.useMemo(() => publicNetwork?.split('/')?.[1], [publicNetwork]);

  const filterForPublicDevices = React.useCallback(
    (device: NetworkAttachmentDefinitionKind) => clusterNetworkName !== getName(device),
    [clusterNetworkName],
  );

  const filterForClusterDevices = React.useCallback(
    (device: NetworkAttachmentDefinitionKind) => publicNetworkName !== getName(device),
    [publicNetworkName],
  );

  const autoCompleteFilter = (strText: string, item: React.ReactElement): boolean =>
    fuzzy(strText, item?.props?.name);

  return (
    <>
      <FormGroup
        fieldId="configure-networking"
        label={
          <>
            {t('ceph-storage-plugin~Network')}
            <FieldLevelHelp>
              {t(
                'ceph-storage-plugin~The default SDN networking uses a single network for all data operations such read/write and also for control plane, such as data replication. Multus allows a network separation between the data operations and the control plane operations.',
              )}
            </FieldLevelHelp>
          </>
        }
        className="ceph__install-radio--inline"
      >
        <Radio
          isChecked={networkType === NetworkType.DEFAULT}
          name="default-network"
          label={t('ceph-storage-plugin~Default (SDN)')}
          onChange={() => setNetworkType(NetworkType.DEFAULT)}
          value={NetworkType.DEFAULT}
          id={NetworkType.DEFAULT}
        />
        <Radio
          isChecked={networkType === NetworkType.MULTUS}
          name="custom-network"
          label={t('ceph-storage-plugin~Custom (Multus)')}
          onChange={() => setNetworkType(NetworkType.MULTUS)}
          value={NetworkType.MULTUS}
          id={NetworkType.MULTUS}
        />
        <div className="ceph__multus-tech-preview-badge--margin">
          <TechPreviewBadge />
        </div>
      </FormGroup>
      {networkType === NetworkType.MULTUS && (
        <>
          <FormGroup
            fieldId="configure-multus"
            label={t('ceph-storage-plugin~Public Network Interface')}
          >
            <Firehose resources={resources}>
              <ResourceDropdown
                dropDownClassName="ceph__multus-dropdown"
                buttonClassName="ceph__multus-dropdown-button"
                selectedKey={publicNetworkName}
                placeholder={t('ceph-storage-plugin~Select a network')}
                dataSelector={['metadata', 'name']}
                onChange={(_key, _name, selectedResource) =>
                  setNetwork(NADSelectorType.PUBLIC, selectedResource)
                }
                resourceFilter={filterForPublicDevices}
                autocompleteFilter={autoCompleteFilter}
                showBadge
              />
            </Firehose>
          </FormGroup>
          <FormGroup
            fieldId="configure-multus"
            label={t('ceph-storage-plugin~Cluster Network Interface')}
          >
            <Firehose resources={resources}>
              <ResourceDropdown
                dropDownClassName="ceph__multus-dropdown"
                buttonClassName="ceph__multus-dropdown-button"
                selectedKey={clusterNetworkName}
                placeholder={t('ceph-storage-plugin~Select a network')}
                dataSelector={['metadata', 'name']}
                onChange={(_key, _name, selectedResource) =>
                  setNetwork(NADSelectorType.CLUSTER, selectedResource)
                }
                resourceFilter={filterForClusterDevices}
                autocompleteFilter={autoCompleteFilter}
                showBadge
              />
            </Firehose>
          </FormGroup>
        </>
      )}
    </>
  );
};

type NetworkFormGroupProps = {
  setNetworkType: any;
  networkType: NetworkType;
  publicNetwork: string;
  clusterNetwork: string;
  setNetwork: (type: NADSelectorType, resource: K8sResourceCommon) => void;
};
