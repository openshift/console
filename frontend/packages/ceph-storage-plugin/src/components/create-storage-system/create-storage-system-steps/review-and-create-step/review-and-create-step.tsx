import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { TextContent, Text, TextVariants, List, ListItem } from '@patternfly/react-core';
import { useFlag } from '@console/shared/src';
import { humanizeBinaryBytes } from '@console/internal/components/utils';
import { BackingStorageType, DeploymentType } from '../../../../constants/create-storage-system';
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

export const ReviewAndCreate: React.FC<ReviewAndCreateProps> = ({ state, hasOCS }) => {
  const { t } = useTranslation();
  const isMultusSupported = useFlag(GUARDED_FEATURES.OCS_MULTUS);
  const isTaintSupported = useFlag(GUARDED_FEATURES.OCS_TAINT_NODES);

  const {
    storageClass,
    capacityAndNodes,
    securityAndNetwork,
    createLocalVolumeSet,
    backingStorage,
    connectionDetails,
    createStorageClass,
    nodes,
  } = state;
  const { capacity, arbiterLocation, enableTaint, enableArbiter } = capacityAndNodes;
  const { encryption, kms, networkType } = securityAndNetwork;
  const { deployment, externalStorage, type } = backingStorage;

  const isMCG = deployment === DeploymentType.MCG;
  const isRhcs = !_.isEmpty(connectionDetails);
  const isStandaloneExternal = hasOCS && !_.isEmpty(createStorageClass);

  const isNoProvisioner = storageClass.provisioner === NO_PROVISIONER;
  const formattedCapacity = !isNoProvisioner
    ? `${OSD_CAPACITY_SIZES[capacity]} TiB`
    : humanizeBinaryBytes(capacity).string;

  const hasEncryption = encryption.clusterWide || encryption.storageClass;

  const storagePlatform = externalStorage && getExternalStorage(externalStorage).displayName;

  const encryptionStatus = hasEncryption
    ? t('ceph-storage-plugin~Enabled')
    : t('ceph-storage-plugin~Disabled');

  const ocsTaintsStatus = enableTaint
    ? t('ceph-storage-plugin~Enabled')
    : t('ceph-storage-plugin~Disabled');

  const kmsStatus = encryption.advanced
    ? kms.vault.name.value
    : t('ceph-storage-plugin~Not connected');

  const totalCpu = getTotalCpu(nodes);
  const totalMemory = getTotalMemory(nodes);
  const zones = getAllZone(nodes);

  return (
    <>
      <ReviewItem title={t('ceph-storage-plugin~Backing storage')}>
        {!isMCG && !isRhcs && (
          <ListItem>
            {t('ceph-storage-plugin~StorageClass: {{name}}', {
              name: storageClass.name || createLocalVolumeSet.volumeSetName,
            })}
          </ListItem>
        )}
        <ListItem>
          {t('ceph-storage-plugin~Deployment type: {{deployment}}', {
            deployment,
          })}
        </ListItem>
        {!isMCG && type === BackingStorageType.EXTERNAL && (
          <ListItem>
            {t('ceph-storage-plugin~External storage platform: {{storagePlatform}}', {
              storagePlatform,
            })}
          </ListItem>
        )}
      </ReviewItem>
      {!isMCG && !isRhcs && !isStandaloneExternal && (
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
          {enableArbiter && (
            <ListItem>
              {t('ceph-storage-plugin~Arbiter zone: {{zone}}', {
                zone: arbiterLocation,
              })}
            </ListItem>
          )}
          {isTaintSupported && (
            <ListItem>
              {t('ceph-storage-plugin~Taint nodes: {{ocsTaintsStatus}}', {
                ocsTaintsStatus,
              })}
            </ListItem>
          )}
        </ReviewItem>
      )}
      {!isRhcs &&
        !isStandaloneExternal &&
        (isMCG ? (
          <ReviewItem title={t('ceph-storage-plugin~Security')}>
            <ListItem>{t('ceph-storage-plugin~Encryption: Enabled')}</ListItem>
            <ListItem>
              {t('ceph-storage-plugin~External key management service: {{kmsStatus}}', {
                kmsStatus,
              })}
            </ListItem>
          </ReviewItem>
        ) : (
          <ReviewItem title={t('ceph-storage-plugin~Security and network')}>
            <ListItem>
              {t('ceph-storage-plugin~Encryption: {{encryptionStatus}}', { encryptionStatus })}
            </ListItem>
            {hasEncryption && (
              <ListItem>
                {t('ceph-storage-plugin~External key management service: {{kmsStatus}}', {
                  kmsStatus,
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
        ))}
    </>
  );
};
type ReviewAndCreateProps = {
  state: WizardState;
  hasOCS: boolean;
};
