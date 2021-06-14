import * as React from 'react';
import { Alert, AlertVariant, Stack, StackItem } from '@patternfly/react-core';
import { Table, TableBody, TableHeader, TableVariant } from '@patternfly/react-table';
import { Trans, useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Firehose, FirehoseResult, resourcePath } from '@console/internal/components/utils';
import { PersistentVolumeClaimModel, StorageClassModel } from '@console/internal/models';
import { StorageClassResourceKind } from '@console/internal/module/k8s';
import { createLookup, getName } from '@console/shared/src';
import { CombinedDisk } from '../../../../k8s/wrapper/vm/combined-disk';
import { VolumeWrapper } from '../../../../k8s/wrapper/vm/volume-wrapper';
import { getDefaultStorageClass } from '../../../../selectors/config-map/sc-defaults';
import { getLoadedData } from '../../../../utils';
import { iGetCommonData } from '../../selectors/immutable/selectors';
import { getStorages } from '../../selectors/selectors';
import { VMWizardProps, VMWizardStorage } from '../../types';

import './storage-review.scss';

type DefaultSCUsedProps = {
  defaultSCName: string;
};

const DefaultSCUsed: React.FC<DefaultSCUsedProps> = ({ defaultSCName }) => {
  const { t } = useTranslation();
  return (
    <p>
      <Trans t={t} ns="kubevirt-plugin">
        Default storage class{' '}
        <Link
          to={resourcePath(StorageClassModel.kind, defaultSCName)}
          className="co-resource-item__resource-name"
        >
          {{ defaultSCName }}
        </Link>{' '}
        will be used
      </Trans>
    </p>
  );
};

const NoDefaultSC: React.FC = () => {
  const { t } = useTranslation();
  return (
    <p className="kubevirt-create-vm-modal__review-tab-storage-class-alert-p">
      <Stack>
        <StackItem>{t('kubevirt-plugin~This virtual machine could experience issues')}</StackItem>
        <StackItem>
          <Trans t={t} ns="kubevirt-plugin">
            Please select a storage class or{' '}
            <Link
              to={resourcePath(StorageClassModel.kind)}
              className="co-resource-item__resource-name"
            >
              create a default one
            </Link>
            .
          </Trans>
        </StackItem>
      </Stack>
    </p>
  );
};

const StorageReviewFirehose: React.FC<StorageReviewFirehoseProps> = ({
  storages,
  persistentVolumeClaims,
  storageClasses,
}) => {
  const { t } = useTranslation();
  const showStorages = storages.length > 0;

  const headers = [
    { title: t('kubevirt-plugin~Name') },
    { title: t('kubevirt-plugin~Source') },
    { title: t('kubevirt-plugin~Size') },
    { title: t('kubevirt-plugin~Interface') },
    { title: t('kubevirt-plugin~Storage Class') },
    { title: t('kubevirt-plugin~Access Mode') },
    { title: t('kubevirt-plugin~Volume Mode') },
  ];

  const pvcLookup = createLookup(persistentVolumeClaims, getName);

  const combinedDisks = storages.map(({ id, disk, volume, dataVolume, persistentVolumeClaim }) => {
    const pvc = pvcLookup[new VolumeWrapper(volume).getPersistentVolumeClaimName()];

    return new CombinedDisk({
      id,
      disk,
      volume,
      dataVolume,
      persistentVolumeClaim: persistentVolumeClaim || pvc,
      isNewPVC: !!persistentVolumeClaim,
    });
  });

  const hasStorageWithoutStorageClass = combinedDisks.some(
    (combinedDisk) =>
      combinedDisk.getSource()?.requiresStorageClass() && !combinedDisk.getStorageClassName(),
  );

  const defaultStorageClass = getDefaultStorageClass(getLoadedData(storageClasses, []));

  const rows = combinedDisks.map((combinedDisk) => {
    return [
      combinedDisk.getName(),
      combinedDisk.getSourceValue(),
      combinedDisk.getReadableSize(),
      combinedDisk.getDiskInterface(),
      combinedDisk.getStorageClassName(),
      combinedDisk.getAccessModes()?.join(', '),
      combinedDisk.getVolumeMode()?.toString(),
    ];
  });

  return (
    <>
      {showStorages && (
        <>
          {hasStorageWithoutStorageClass && (
            <Alert
              title={t('kubevirt-plugin~Some disks do not have a storage class defined')}
              isInline
              variant={AlertVariant.warning}
              className="kubevirt-create-vm-modal__review-tab-storage-class-alert"
            >
              {defaultStorageClass ? (
                <DefaultSCUsed defaultSCName={getName(defaultStorageClass)} />
              ) : (
                <NoDefaultSC />
              )}
            </Alert>
          )}
          <Table
            aria-label={t('kubevirt-plugin~Storage Devices')}
            variant={TableVariant.compact}
            cells={headers}
            rows={rows}
            gridBreakPoint="grid-xl"
          >
            <TableHeader />
            <TableBody />
          </Table>
        </>
      )}
      {!showStorages && (
        <p>
          <strong>{t('kubevirt-plugin~No disks found')}</strong>
        </p>
      )}
    </>
  );
};

type StorageReviewFirehoseProps = {
  storages: VMWizardStorage[];
  storageClasses?: FirehoseResult<StorageClassResourceKind[]>;
  persistentVolumeClaims?: FirehoseResult;
};

const StorageReviewConnected: React.FC<StorageReviewConnectedProps> = ({ namespace, ...rest }) => (
  <Firehose
    resources={[
      {
        kind: PersistentVolumeClaimModel.kind,
        isList: true,
        namespace,
        prop: 'persistentVolumeClaims',
      },
      {
        kind: StorageClassModel.kind,
        isList: true,
        namespaced: false,
        prop: 'storageClasses',
      },
    ]}
  >
    <StorageReviewFirehose {...rest} />
  </Firehose>
);

type StorageReviewConnectedProps = StorageReviewFirehoseProps & {
  namespace: string;
};
const stateToProps = (state, { wizardReduxID }) => ({
  storages: getStorages(state, wizardReduxID),
  namespace: iGetCommonData(state, wizardReduxID, VMWizardProps.activeNamespace),
});

export const StorageReview = connect(stateToProps)(StorageReviewConnected);
