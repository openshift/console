import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TextContent, Text, TextVariants, List, ListItem } from '@patternfly/react-core';
import { useFlag } from '@console/shared/src';
import { humanizeBinaryBytes } from '@console/internal/components/utils';
import { BackingStorageType } from '../../../../constants/create-storage-system';
import { NetworkTypeLabels, NO_PROVISIONER } from '../../../../constants';
import {
  getAllZone,
  getExternalStorage,
  getTotalCpu,
  getTotalMemory,
} from '../../../../utils/create-storage-system';
import { OSD_CAPACITY_SIZES } from '../../../../utils/osd-size-dropdown';
import { WizardState } from '../../reducer';
import { GUARDED_FEATURES } from '../../../../features';
import './review-and-create-step.scss';

export const ReviewItem = ({ children, title }) => (
  <div className="odf-review-and-create__review-item">
    <TextContent>
      <Text component={TextVariants.h4}>{title}</Text>
    </TextContent>
    <List isPlain>{children}</List>
  </div>
);

export const ReviewAndCreate: React.FC<ReviewAndCreateProps> = ({ state }) => {
  const { t } = useTranslation();
  const isMultusSupported = useFlag(GUARDED_FEATURES.OCS_MULTUS);

  const {
    storageClass,
    capacityAndNodes,
    securityAndNetwork,
    createLocalVolumeSet,
    backingStorage,
    nodes,
  } = state;
  const { capacity } = capacityAndNodes;
  const { encryption, kms, networkType } = securityAndNetwork;
  const { deployment, externalStorage, type } = backingStorage;

  const isNoProvisioner = storageClass.provisioner === NO_PROVISIONER;
  const formattedCapacity = !isNoProvisioner
    ? `${OSD_CAPACITY_SIZES[capacity]} TiB`
    : humanizeBinaryBytes(capacity).string;

  const hasEncryption = encryption.clusterWide || encryption.storageClass;

  const storagePlatform = externalStorage && getExternalStorage(externalStorage).displayName;

  const encryptionStatus = hasEncryption
    ? t('ceph-storage-plugin~Enabled')
    : t('ceph-storage-plugin~Disabled');

  const totalCpu = getTotalCpu(nodes);
  const totalMemory = getTotalMemory(nodes);
  const zones = getAllZone(nodes);

  return (
    <>
      <ReviewItem title={t('ceph-storage-plugin~Backing storage')}>
        <ListItem>
          {t('ceph-storage-plugin~StorageClass: {{name}}', {
            name: storageClass.name || createLocalVolumeSet.volumeSetName,
          })}
        </ListItem>
        <ListItem>
          {t('ceph-storage-plugin~Deployment type: {{deployment}}', {
            deployment,
          })}
        </ListItem>
        {type === BackingStorageType.EXTERNAL && (
          <ListItem>
            {t('ceph-storage-plugin~External storage platform: {{storagePlatform}}', {
              storagePlatform,
            })}
          </ListItem>
        )}
      </ReviewItem>
      <ReviewItem title={t('ceph-storage-plugin~Capacity and nodes')}>
        <ListItem>
          {t('ceph-storage-plugin~Cluster capacity: {{capacity}}', {
            capacity: formattedCapacity,
          })}
        </ListItem>
        <ListItem>
          {t('ceph-storage-plugin~Selected nodes: {{nodeCount, number}} node', {
            nodeCount: nodes.length,
            count: nodes.length,
          })}
        </ListItem>
        <ListItem>
          {t('ceph-storage-plugin~CPU and memory: {{cpu, number}} CPU and {{memory}} memory', {
            cpu: totalCpu,
            memory: humanizeBinaryBytes(totalMemory).string,
          })}
        </ListItem>
        <ListItem>
          {t('ceph-storage-plugin~Zone: {{zoneCount, number}} zone', {
            zoneCount: zones.size,
            count: zones.size,
          })}
        </ListItem>
      </ReviewItem>
      <ReviewItem title={t('ceph-storage-plugin~Security and network')}>
        <ListItem>
          {t('ceph-storage-plugin~Encryption: {{encryptionStatus}}', { encryptionStatus })}
        </ListItem>
        {hasEncryption && (
          <ListItem>
            {t('ceph-storage-plugin~External key management service: {{name}}', {
              name: encryption.advanced ? kms.name.value : t('ceph-storage-plugin~Disabled'),
            })}
          </ListItem>
        )}
        {isMultusSupported && (
          <ListItem>
            {t('ceph-storage-plugin~Network: {{networkType}}', {
              networkType: NetworkTypeLabels[networkType],
            })}
          </ListItem>
        )}
      </ReviewItem>
    </>
  );
};
type ReviewAndCreateProps = {
  state: WizardState;
};
