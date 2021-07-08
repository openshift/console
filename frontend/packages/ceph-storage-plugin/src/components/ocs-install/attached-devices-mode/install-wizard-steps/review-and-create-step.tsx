import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TextContent, Text, TextVariants } from '@patternfly/react-core';
import { humanizeBinaryBytes } from '@console/internal/components/utils';
import { getName, useFlag } from '@console/shared';
import {
  ValidationMessage,
  getEncryptionLevel,
  ValidationType,
} from '../../../../utils/common-ocs-install-el';
import { getNodeInfo } from '../../../../utils/install';
import { MINIMUM_NODES, NetworkTypeLabels } from '../../../../constants';
import { State } from '../reducer';
import {
  ReviewListTitle,
  ReviewListBody,
  NodesCard,
  RequestErrors,
} from '../../install-wizard/review-and-create';
import { NetworkType } from '../../../../types';
import { GUARDED_FEATURES } from '../../../../features';

export const ReviewAndCreate: React.FC<ReviewAndCreateProps> = ({
  state,
  errorMessage,
  inProgress,
}) => {
  const { t } = useTranslation();

  const {
    nodes,
    encryption,
    enableMinimal,
    enableFlexibleScaling,
    storageClass,
    kms,
    networkType,
    publicNetwork,
    clusterNetwork,
    stretchClusterChecked,
    selectedArbiterZone,
  } = state;
  const { cpu, memory, zones } = getNodeInfo(state.nodes);
  const scName = getName(storageClass);
  const emptyRequiredField = nodes.length < MINIMUM_NODES && !scName && !memory && !cpu;
  const isMultusSupported = useFlag(GUARDED_FEATURES.OCS_MULTUS);

  return (
    <>
      <TextContent className="ocs-install-wizard__text-content">
        <Text component={TextVariants.h2}>{t('ceph-storage-plugin~Review StorageCluster')}</Text>
      </TextContent>
      <dl>
        <ReviewListTitle text={t('ceph-storage-plugin~Storage and nodes')} />
        {stretchClusterChecked && (
          <ReviewListBody noValue={!selectedArbiterZone}>
            <p>
              {t('ceph-storage-plugin~Arbiter zone:')}&nbsp;
              <span className="text-muted">
                {selectedArbiterZone ?? t('ceph-storage-plugin~None')}
              </span>
            </p>
          </ReviewListBody>
        )}
        <ReviewListBody noValue={nodes.length < MINIMUM_NODES || !scName}>
          <div>
            <p>
              {t('ceph-storage-plugin~{{nodeCount, number}} node', {
                nodeCount: nodes.length,
                count: nodes.length,
              })}{' '}
              {t('ceph-storage-plugin~selected based on the created StorageClass:')}
              <span className="text-muted">{scName ?? t('ceph-storage-plugin~None')}</span>
            </p>
            <NodesCard nodes={nodes} />
          </div>
        </ReviewListBody>
        <ReviewListBody
          validation={enableMinimal && !emptyRequiredField && ValidationType.MINIMAL}
          noValue={!cpu || !memory}
        >
          <p>
            {t('ceph-storage-plugin~Total CPU and memory of {{cpu, number}} CPU and {{memory}}', {
              cpu,
              memory: humanizeBinaryBytes(memory).string,
            })}{' '}
          </p>
        </ReviewListBody>
        <ReviewListBody
          hideIcon={!enableFlexibleScaling || !stretchClusterChecked}
          validation={enableFlexibleScaling && ValidationType.ATTACHED_DEVICES_FLEXIBLE_SCALING}
        >
          <p>
            {t('ceph-storage-plugin~{{zoneCount, number}} zone', {
              zoneCount: zones.size,
              count: zones.size,
            })}
          </p>
        </ReviewListBody>
        {(encryption.clusterWide || encryption.storageClass) && (
          <>
            <ReviewListTitle text={t('ceph-storage-plugin~Configure')} />
            <ReviewListBody>
              <p className="ocs-install-wizard__review-encryption">
                {t('ceph-storage-plugin~Enable Encryption')}
              </p>
              {encryption.advanced && (
                <p className="ocs-install-wizard__review-encryption">
                  {t('ceph-storage-plugin~Connect to external key management service: {{name}}', {
                    name: kms.name.value,
                  })}
                </p>
              )}
              <p>
                {t('ceph-storage-plugin~Encryption Level: {{level}}', {
                  level: getEncryptionLevel(encryption, t),
                })}
              </p>
            </ReviewListBody>
          </>
        )}
        {isMultusSupported && (
          <ReviewListBody
            validation={
              networkType === NetworkType.MULTUS &&
              !publicNetwork &&
              !clusterNetwork &&
              ValidationType.NETWORK
            }
          >
            <p>
              {t('ceph-storage-plugin~Using {{networkLabel}}', {
                networkLabel: NetworkTypeLabels[networkType],
              })}
            </p>
          </ReviewListBody>
        )}
      </dl>
      {emptyRequiredField && (
        <ValidationMessage
          className="ocs-install-wizard__review-alert"
          validation={ValidationType.ALLREQUIREDFIELDS}
        />
      )}
      <RequestErrors errorMessage={errorMessage} inProgress={inProgress} />
    </>
  );
};

type ReviewAndCreateProps = {
  errorMessage: string;
  inProgress: boolean;
  state: State;
};
