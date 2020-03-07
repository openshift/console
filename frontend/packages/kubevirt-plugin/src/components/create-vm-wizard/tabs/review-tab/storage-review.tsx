import * as React from 'react';
import { connect } from 'react-redux';
import { Firehose, FirehoseResult } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { createLookup, getName } from '@console/shared/src';
import { PersistentVolumeClaimModel } from '@console/internal/models';
import { VMWizardProps, VMWizardStorageWithWrappers } from '../../types';
import { getStoragesWithWrappers } from '../../selectors/selectors';
import { iGetCommonData } from '../../selectors/immutable/selectors';
import { CombinedDisk } from '../../../../k8s/wrapper/vm/combined-disk';
import { PersistentVolumeClaimWrapper } from '../../../../k8s/wrapper/vm/persistent-volume-claim-wrapper';
import { ReviewList } from './review-list';

const StorageReviewFirehose: React.FC<StorageReviewFirehoseProps> = ({
  storages,
  className,
  persistentVolumeClaims,
}) => {
  const pvcLookup = createLookup(persistentVolumeClaims, getName);
  return (
    <ReviewList
      title="Storage"
      className={className}
      items={storages.map(
        ({ id, diskWrapper, volumeWrapper, dataVolumeWrapper, persistentVolumeClaimWrapper }) => {
          const pvc = pvcLookup[volumeWrapper.getPersistentVolumeClaimName()];
          const combinedDisk = new CombinedDisk({
            diskWrapper,
            volumeWrapper,
            dataVolumeWrapper,
            persistentVolumeClaimWrapper:
              persistentVolumeClaimWrapper || (pvc && new PersistentVolumeClaimWrapper(pvc)),
            isNewPVC: !!persistentVolumeClaimWrapper,
          });

          return {
            id,
            value: combinedDisk.toString(),
          };
        },
      )}
    />
  );
};

type StorageReviewFirehoseProps = {
  storages: VMWizardStorageWithWrappers[];
  persistentVolumeClaims?: FirehoseResult<K8sResourceKind[]>;
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
    ]}
  >
    <StorageReviewFirehose {...rest} />
  </Firehose>
);

type StorageReviewConnectedProps = StorageReviewFirehoseProps & {
  namespace: string;
};
const stateToProps = (state, { wizardReduxID }) => ({
  storages: getStoragesWithWrappers(state, wizardReduxID),
  namespace: iGetCommonData(state, wizardReduxID, VMWizardProps.activeNamespace),
});

export const StorageReview = connect(stateToProps)(StorageReviewConnected);
