import * as React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Alert, AlertVariant } from '@patternfly/react-core';
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
import { ReviewList } from './review-list';

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
  className,
  persistentVolumeClaims,
  storageClasses,
}) => {
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

  return (
    <ReviewList
      title="Storage"
      className={className}
      items={combinedDisks.map((combinedDisk) => {
        return {
          id: combinedDisk.id,
          value: combinedDisk.toString(),
        };
      })}
    >
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
    </ReviewList>
  );
};

type StorageReviewFirehoseProps = {
  storages: VMWizardStorage[];
  storageClasses?: FirehoseResult<StorageClassResourceKind[]>;
  persistentVolumeClaims?: FirehoseResult;
  className: string;
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
