import * as React from 'react';
import { connect } from 'react-redux';
import { Firehose, FirehoseResult } from '@console/internal/components/utils';
import { createLookup, getName } from '@console/shared/src';
import { PersistentVolumeClaimModel } from '@console/internal/models';
import { VMWizardProps, VMWizardStorage } from '../../types';
import { getStorages } from '../../selectors/selectors';
import { iGetCommonData } from '../../selectors/immutable/selectors';
import { CombinedDisk } from '../../../../k8s/wrapper/vm/combined-disk';
import { ReviewList } from './review-list';
import { VolumeWrapper } from '../../../../k8s/wrapper/vm/volume-wrapper';

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
      items={storages.map(({ id, disk, volume, dataVolume, persistentVolumeClaim }) => {
        const pvc = pvcLookup[new VolumeWrapper(volume).getPersistentVolumeClaimName()];
        const combinedDisk = new CombinedDisk({
          disk,
          volume,
          dataVolume,
          persistentVolumeClaim: persistentVolumeClaim || pvc,
          isNewPVC: !!persistentVolumeClaim,
        });

        return {
          id,
          value: combinedDisk.toString(),
        };
      })}
    />
  );
};

type StorageReviewFirehoseProps = {
  storages: VMWizardStorage[];
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
