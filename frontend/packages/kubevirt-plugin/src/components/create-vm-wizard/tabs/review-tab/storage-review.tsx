import * as React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Alert, AlertVariant } from '@patternfly/react-core';
import { Table, TableBody, TableHeader, TableVariant } from '@patternfly/react-table';
import { Firehose, FirehoseResult, resourcePath } from '@console/internal/components/utils';
import { StorageClassResourceKind } from '@console/internal/module/k8s';
import { createLookup, getAnnotations, getName } from '@console/shared/src';
import { PersistentVolumeClaimModel, StorageClassModel } from '@console/internal/models';
import { VMWizardProps, VMWizardStorage } from '../../types';
import { getStorages } from '../../selectors/selectors';
import { iGetCommonData } from '../../selectors/immutable/selectors';
import { CombinedDisk } from '../../../../k8s/wrapper/vm/combined-disk';
import { VolumeWrapper } from '../../../../k8s/wrapper/vm/volume-wrapper';
import { getLoadedData } from '../../../../utils';
import { DEFAULT_SC_ANNOTATION } from '../../../../constants/sc';

import './storage-review.scss';

type DefaultSCUsedProps = {
  defaultSCName: string;
};

const DefaultSCUsed: React.FC<DefaultSCUsedProps> = ({ defaultSCName }) => (
  <p>
    {`Default storage class `}
    <Link
      to={resourcePath(StorageClassModel.kind, defaultSCName)}
      className="co-resource-item__resource-name"
    >
      {defaultSCName}
    </Link>
    {' will be used'}
  </p>
);

const NoDefaultSC: React.FC = () => (
  <p className="kubevirt-create-vm-modal__review-tab-storage-class-alert-p">
    {`This virtual machine could experience issues. \n Please select a storage class or `}
    <Link to={resourcePath(StorageClassModel.kind)} className="co-resource-item__resource-name">
      create a default one
    </Link>
    .
  </p>
);

const StorageReviewFirehose: React.FC<StorageReviewFirehoseProps> = ({
  storages,
  persistentVolumeClaims,
  storageClasses,
}) => {
  const showStorages = storages.length > 0;

  const headers = [
    { title: 'Name' },
    { title: 'Source' },
    { title: 'Size' },
    { title: 'Interface' },
    { title: 'Storage Class' },
    { title: 'Access' },
    { title: 'Volume Mode' },
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

  const defaultStorageClass = getLoadedData(storageClasses, []).find(
    (sc) => getAnnotations(sc, {})[DEFAULT_SC_ANNOTATION] === 'true',
  );

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
              title={'Some disks do not have a storage class defined'}
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
            aria-label="Storage Devices"
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
          <strong>No disks found</strong>
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
