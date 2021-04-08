import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@patternfly/react-core';
import { k8sUpdate } from '@console/internal/module/k8s';
import {
  ModalTitle,
  ModalBody,
  ModalFooter,
  ModalComponentProps,
  createModalLauncher,
  CreateModalLauncherProps,
} from '@console/internal/components/factory';
import {
  withHandlePromise,
  HandlePromiseProps,
  ButtonBar,
} from '@console/internal/components/utils';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { getName } from '@console/shared';
import { NooBaaBucketClassModel, NooBaaBackingStoreModel } from '../../../models';
import { getBackingStoreNames, getBackingStorePolicy } from '../../../utils/noobaa-utils';
import BackingStoreSelection from '../backingstore-table';
import {
  BackingStoreKind,
  K8sListResponse,
  BucketClassKind,
  PlacementPolicy,
} from '../../../types';
import './_bs-modal.scss';

const BucketClassEditModal = withHandlePromise<
  HandlePromiseProps & BucketClassEditModalProps & ModalComponentProps & CreateModalLauncherProps
>((props) => {
  const { t } = useTranslation();
  const { bucketClass, inProgress, errorMessage, handlePromise, close, cancel } = props;
  const [data, loaded, loadError] = useK8sGet(
    NooBaaBackingStoreModel,
    null,
    bucketClass.metadata.namespace,
  );
  const [selectedA, setSelectedA] = React.useState<BackingStoreKind[]>([]);
  const [selectedB, setSelectedB] = React.useState<BackingStoreKind[]>([]);
  const policyA = getBackingStorePolicy(bucketClass, 0);
  const policyB = getBackingStorePolicy(bucketClass, 1);

  // Resolve to BackingStore Objects from Name
  React.useEffect(() => {
    if (loaded && !loadError) {
      const bsNamesTier1 = getBackingStoreNames(bucketClass, 0);
      const bsNamesTier2 = getBackingStoreNames(bucketClass, 1);
      const bsTier1 = (data as K8sListResponse<BackingStoreKind>).items?.filter((item) =>
        bsNamesTier1.includes(getName(item)),
      );
      const bsTier2 = (data as K8sListResponse<BackingStoreKind>).items?.filter((item) =>
        bsNamesTier2.includes(getName(item)),
      );
      setSelectedA([...bsTier1]);
      setSelectedB([...bsTier2]);
    }
  }, [data, loaded, loadError, bucketClass]);

  const isEnabled = (() => {
    const satifiesPolicyA = (() => {
      if (policyA === PlacementPolicy.Spread) {
        return selectedA?.length >= 1;
      }
      if (policyA === PlacementPolicy.Mirror) {
        return selectedA?.length >= 2;
      }
      return false;
    })();
    const satifiesPolicyB = policyB
      ? policyB === PlacementPolicy.Spread
        ? selectedB?.length >= 1
        : selectedB?.length >= 2
      : true;
    return satifiesPolicyA && satifiesPolicyB;
  })();

  const onSubmit = () => {
    bucketClass.spec.placementPolicy.tiers[0].backingStores = selectedA.map(getName);
    if (policyB?.length) {
      bucketClass.spec.placementPolicy.tiers[1].backingStores = selectedB.map(getName);
    }
    handlePromise(
      k8sUpdate(
        NooBaaBucketClassModel,
        bucketClass,
        bucketClass.metadata.namespace,
        bucketClass.metadata.name,
      ),
      close,
    );
  };
  return (
    <>
      <ModalTitle>{t('ceph-storage-plugin~Edit BucketClass Resource')}</ModalTitle>
      <div className="nb-bc-modal">
        <ModalBody>
          <p className="nb-bc-modal__text">
            {t(
              'ceph-storage-plugin~BackingStore represents a storage target to be used as the underlying storage for the data in Multicloud Object Gateway buckets.',
            )}
          </p>
          <BackingStoreSelection
            namespace={bucketClass.metadata.namespace}
            tier1Policy={policyA}
            tier2Policy={policyB}
            selectedTierA={selectedA}
            selectedTierB={selectedB}
            setSelectedTierA={setSelectedA}
            setSelectedTierB={setSelectedB}
            hideCreateBackingStore
          />
        </ModalBody>
      </div>
      <ModalFooter errorMessage={errorMessage} inProgress={inProgress}>
        <ButtonBar>
          <Button
            onClick={cancel}
            aria-label={t('ceph-storage-plugin~Cancel ')}
            variant="secondary"
          >
            {t('ceph-storage-plugin~Cancel')}
          </Button>
          <Button
            onClick={onSubmit}
            aria-label={t('ceph-storage-plugin~Save')}
            type="submit"
            className="nb-edit-modal__save-btn"
            isDisabled={!isEnabled}
          >
            {t('ceph-storage-plugin~Save')}
          </Button>
        </ButtonBar>
      </ModalFooter>
    </>
  );
});

export default createModalLauncher(BucketClassEditModal);

type BucketClassEditModalProps = {
  bucketClass: BucketClassKind;
};
