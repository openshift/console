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
import { getName, useFlag } from '@console/dynamic-plugin-sdk';
import {
  NooBaaBucketClassModel,
  NooBaaBackingStoreModel,
  NooBaaNamespaceStoreModel,
} from '../../../models';
import { getBackingStoreNames, getBackingStorePolicy } from '../../../utils/noobaa-utils';
import BackingStoreSelection from '../backingstore-table';
import {
  BackingStoreKind,
  K8sListResponse,
  BucketClassKind,
  PlacementPolicy,
  NamespaceStoreKind,
} from '../../../types';
import './_bs-modal.scss';
import { initialState, reducer } from '../state';
import { NamespacePolicyType } from '../../../constants/bucket-class';
import { SingleNamespaceStorePage } from '../wizard-pages/namespace-store-pages/single-namespace-store';
import { CacheNamespaceStorePage } from '../wizard-pages/namespace-store-pages/cache-namespace-store';
import { MultiNamespaceStorePage } from '../wizard-pages/namespace-store-pages/multi-namespace-store';
import { validateDuration } from '../../../utils/bucket-class';
import { GUARDED_FEATURES } from '../../../features';

const BucketClassEditModal = withHandlePromise<
  HandlePromiseProps & BucketClassEditModalProps & ModalComponentProps & CreateModalLauncherProps
>((props) => {
  const { t } = useTranslation();
  const { bucketClass, inProgress, errorMessage, handlePromise, close, cancel } = props;
  const isNamespaceStoreSupported = useFlag(GUARDED_FEATURES.OCS_NAMESPACE_STORE);
  const isNamespaceType = isNamespaceStoreSupported && !!bucketClass.spec?.namespacePolicy;
  const [state, dispatch] = React.useReducer(reducer, initialState);
  const [data, loaded, loadError] = useK8sGet(
    NooBaaBackingStoreModel,
    null,
    bucketClass.metadata.namespace,
  );

  const [nsData, nsLoaded, nsLoadErr] = useK8sGet(
    NooBaaNamespaceStoreModel,
    null,
    bucketClass.metadata.namespace,
  );

  const policyA = getBackingStorePolicy(bucketClass, 0);
  const policyB = getBackingStorePolicy(bucketClass, 1);

  const getNamespaceStorePage = () => {
    switch (state.namespacePolicyType) {
      case NamespacePolicyType.SINGLE:
        return (
          <SingleNamespaceStorePage
            hideCreateNamespaceStore
            state={state}
            dispatch={dispatch}
            namespace={bucketClass.metadata.namespace}
          />
        );
      case NamespacePolicyType.CACHE:
        return (
          <CacheNamespaceStorePage
            hideCreateNamespaceStore
            state={state}
            dispatch={dispatch}
            namespace={bucketClass.metadata.namespace}
          />
        );
      case NamespacePolicyType.MULTI:
        return (
          <MultiNamespaceStorePage
            hideCreateNamespaceStore
            state={state}
            dispatch={dispatch}
            namespace={bucketClass.metadata.namespace}
          />
        );
      default:
        return null;
    }
  };

  // Resolve to BackingStore Objects from Name
  React.useEffect(() => {
    if (!isNamespaceType && loaded && !loadError) {
      const bsNamesTier1 = getBackingStoreNames(bucketClass, 0);
      const bsNamesTier2 = getBackingStoreNames(bucketClass, 1);
      const bsTier1 = (data as K8sListResponse<BackingStoreKind>).items?.filter((item) =>
        bsNamesTier1.includes(getName(item)),
      );
      const bsTier2 = (data as K8sListResponse<BackingStoreKind>).items?.filter((item) =>
        bsNamesTier2.includes(getName(item)),
      );
      dispatch({ type: 'setBackingStoreTier1', value: bsTier1 });
      dispatch({ type: 'setBackingStoreTier2', value: bsTier2 });
    }
  }, [data, loaded, loadError, bucketClass, isNamespaceType]);

  React.useEffect(() => {
    if (isNamespaceType && nsLoaded && !nsLoadErr) {
      dispatch({ type: 'setNamespacePolicyType', value: bucketClass.spec?.namespacePolicy.type });
      if (bucketClass.spec?.namespacePolicy.type === NamespacePolicyType.SINGLE) {
        const singleNS = (nsData as K8sListResponse<NamespaceStoreKind>).items.find(
          (item) => getName(item) === bucketClass.spec.namespacePolicy.single.resource,
        );
        dispatch({ type: 'setWriteNamespaceStore', value: [singleNS] });
        dispatch({ type: 'setReadNamespaceStore', value: [singleNS] });
      }
      if (bucketClass.spec?.namespacePolicy.type === NamespacePolicyType.MULTI) {
        const writeNS = (nsData as K8sListResponse<NamespaceStoreKind>).items.find(
          (item) => getName(item) === bucketClass.spec.namespacePolicy.multi.writeResource,
        );
        const readNS = (nsData as K8sListResponse<NamespaceStoreKind>).items.filter((item) =>
          bucketClass.spec.namespacePolicy.multi.readResources.includes(getName(item)),
        );
        dispatch({ type: 'setWriteNamespaceStore', value: [writeNS] });
        dispatch({ type: 'setReadNamespaceStore', value: readNS });
      }
      if (bucketClass.spec?.namespacePolicy.type === NamespacePolicyType.CACHE) {
        const hubNS = (nsData as K8sListResponse<NamespaceStoreKind>).items.find(
          (item) => getName(item) === bucketClass.spec.namespacePolicy.cache.hubResource,
        );
        const cacheBS = (data as K8sListResponse<BackingStoreKind>).items.find((item) =>
          bucketClass.spec.placementPolicy.tiers[0].backingStores.includes(getName(item)),
        );
        dispatch({ type: 'setHubNamespaceStore', value: hubNS });
        dispatch({ type: 'setCacheBackingStore', value: cacheBS });
      }
    }
  }, [bucketClass, nsData, nsLoaded, nsLoadErr, isNamespaceType, data]);

  const isEnabled = (() => {
    const satifiesPolicyA = (() => {
      if (policyA === PlacementPolicy.Spread) {
        return state.tier1BackingStore?.length >= 1;
      }
      if (policyA === PlacementPolicy.Mirror) {
        return state.tier1BackingStore?.length >= 2;
      }
      return false;
    })();
    const satifiesPolicyB = policyB
      ? policyB === PlacementPolicy.Spread
        ? state.tier2BackingStore?.length >= 1
        : state.tier2BackingStore?.length >= 2
      : true;
    return satifiesPolicyA && satifiesPolicyB;
  })();

  const isEnabledNS = () => {
    if (state.namespacePolicyType === NamespacePolicyType.SINGLE) {
      return state.readNamespaceStore.length === 1 && state.writeNamespaceStore.length === 1;
    }
    if (state.namespacePolicyType === NamespacePolicyType.MULTI) {
      return state.readNamespaceStore.length >= 1 && state.writeNamespaceStore.length === 1;
    }
    if (state.namespacePolicyType === NamespacePolicyType.CACHE) {
      return (
        !!state.hubNamespaceStore && !!state.cacheBackingStore && validateDuration(state.timeToLive)
      );
    }
    return false;
  };

  const onSubmit = () => {
    if (!isNamespaceType) {
      bucketClass.spec.placementPolicy.tiers[0].backingStores = state.tier1BackingStore.map(
        getName,
      );
      if (policyB?.length) {
        bucketClass.spec.placementPolicy.tiers[1].backingStores = state.tier2BackingStore.map(
          getName,
        );
      }
    } else {
      switch (state.namespacePolicyType) {
        case NamespacePolicyType.SINGLE:
          bucketClass.spec.namespacePolicy.single.resource = getName(state.readNamespaceStore[0]);
          break;
        case NamespacePolicyType.MULTI:
          bucketClass.spec.namespacePolicy.multi.writeResource = getName(
            state.writeNamespaceStore[0],
          );
          bucketClass.spec.namespacePolicy.multi.readResources = state.readNamespaceStore.map(
            getName,
          );
          break;
        case NamespacePolicyType.CACHE:
          bucketClass.spec.namespacePolicy.cache.hubResource = getName(state.hubNamespaceStore);
          bucketClass.spec.namespacePolicy.cache.caching.ttl = state.timeToLive;
          bucketClass.spec.placementPolicy.tiers[0].backingStores = [
            getName(state.cacheBackingStore),
          ];
          break;
        default:
      }
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
              'ceph-storage-plugin~{{storeType}} represents a storage target to be used as the underlying storage for the data in Multicloud Object Gateway buckets.',
              {
                storeType: isNamespaceType
                  ? t('ceph-storage-plugin~NamespaceStore')
                  : t('ceph-storage-plugin~BackingStore'),
              },
            )}
          </p>
          {!isNamespaceType ? (
            <BackingStoreSelection
              namespace={bucketClass.metadata.namespace}
              tier1Policy={policyA}
              tier2Policy={policyB}
              selectedTierA={state.tier1BackingStore}
              selectedTierB={state.tier2BackingStore}
              setSelectedTierA={(selectedA) =>
                dispatch({ type: 'setBackingStoreTier1', value: selectedA })
              }
              setSelectedTierB={(selectedB) =>
                dispatch({ type: 'setBackingStoreTier2', value: selectedB })
              }
              hideCreateBackingStore
            />
          ) : (
            getNamespaceStorePage()
          )}
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
            isDisabled={isNamespaceType ? !isEnabledNS() : !isEnabled}
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
