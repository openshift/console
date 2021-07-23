import * as React from 'react';
import { useTranslation } from 'react-i18next';
import * as _ from 'lodash';
import { RouteComponentProps } from 'react-router';
import { Title, Wizard } from '@patternfly/react-core';
import {
  apiVersionForModel,
  k8sCreate,
  k8sGet,
  referenceForModel,
} from '@console/internal/module/k8s';
import { history } from '@console/internal/components/utils/router';
import { BreadCrumbs, resourcePathFromModel } from '@console/internal/components/utils';
import { ClusterServiceVersionModel } from '@console/operator-lifecycle-manager';
import { getName } from '@console/shared';
import GeneralPage from './wizard-pages/general-page';
import PlacementPolicyPage from './wizard-pages/placement-policy-page';
import BackingStorePage from './wizard-pages/backingstore-page';
import ReviewPage from './wizard-pages/review-page';
import { initialState, reducer, State } from './state';
import './create-bc.scss';
import { NamespacePolicyPage } from './wizard-pages/namespace-policy-page';
import { SingleNamespaceStorePage } from './wizard-pages/namespace-store-pages/single-namespace-store';
import { CacheNamespaceStorePage } from './wizard-pages/namespace-store-pages/cache-namespace-store';
import { MultiNamespaceStorePage } from './wizard-pages/namespace-store-pages/multi-namespace-store';
import { BucketClassType, NamespacePolicyType } from '../../constants/bucket-class';
import { validateBucketClassName, validateDuration } from '../../utils/bucket-class';
import { NooBaaBucketClassModel } from '../../models';
import { PlacementPolicy } from '../../types';

enum CreateStepsBC {
  GENERAL = 'GENERAL',
  PLACEMENT = 'PLACEMENT',
  RESOURCES = 'RESOURCES',
  REVIEW = 'REVIEW',
}

const CreateBucketClass: React.FC<CreateBCProps> = ({ match }) => {
  const { t } = useTranslation();
  const [state, dispatch] = React.useReducer(reducer, initialState);
  const { ns, appName } = match.params;
  const [clusterServiceVersion, setClusterServiceVersion] = React.useState(null);

  React.useEffect(() => {
    k8sGet(ClusterServiceVersionModel, appName, ns)
      .then((clusterServiceVersionObj) => {
        setClusterServiceVersion(clusterServiceVersionObj);
      })
      .catch(() => setClusterServiceVersion(null));
  }, [appName, ns]);

  const getNamespaceStorePage = () => {
    switch (state.namespacePolicyType) {
      case NamespacePolicyType.SINGLE:
        return <SingleNamespaceStorePage state={state} dispatch={dispatch} namespace={ns} />;
      case NamespacePolicyType.CACHE:
        return <CacheNamespaceStorePage state={state} dispatch={dispatch} namespace={ns} />;
      case NamespacePolicyType.MULTI:
        return <MultiNamespaceStorePage state={state} dispatch={dispatch} namespace={ns} />;
      default:
        return null;
    }
  };

  const getPayload = (currentState: State) => {
    const metadata = {
      apiVersion: apiVersionForModel(NooBaaBucketClassModel),
      kind: NooBaaBucketClassModel.kind,
      metadata: {
        name: currentState.bucketClassName,
        namespace: ns,
      },
    };
    let payload = null;
    if (currentState.bucketClassType === BucketClassType.STANDARD) {
      payload = {
        ...metadata,
        spec: {
          placementPolicy: {
            tiers: [
              {
                placement: currentState.tier1Policy,
                backingStores: currentState.tier1BackingStore.map(getName),
              },
            ],
          },
        },
      };
      if (currentState.tier2Policy) {
        payload.spec.placementPolicy.tiers.push({
          placement: currentState.tier2Policy,
          backingStores: currentState.tier2BackingStore.map(getName),
        });
      }
    } else {
      switch (currentState.namespacePolicyType) {
        case NamespacePolicyType.SINGLE:
          payload = {
            ...metadata,
            spec: {
              namespacePolicy: {
                type: currentState.namespacePolicyType,
                single: {
                  resource: getName(currentState.readNamespaceStore[0]),
                },
              },
            },
          };
          break;
        case NamespacePolicyType.MULTI:
          payload = {
            ...metadata,
            spec: {
              namespacePolicy: {
                type: state.namespacePolicyType,
                multi: {
                  writeResource: getName(state.writeNamespaceStore[0]),
                  readResources: state.readNamespaceStore.map(getName),
                },
              },
            },
          };
          break;
        case NamespacePolicyType.CACHE:
          payload = {
            ...metadata,
            spec: {
              namespacePolicy: {
                type: currentState.namespacePolicyType,
                cache: {
                  caching: {
                    ttl: currentState.timeToLive,
                  },
                  hubResource: getName(currentState.hubNamespaceStore),
                },
              },
              placementPolicy: {
                tiers: [
                  {
                    backingStores: [getName(currentState.cacheBackingStore)],
                  },
                ],
              },
            },
          };
          break;
        default:
          return null;
      }
    }
    return payload;
  };
  const finalStep = () => {
    dispatch({ type: 'setIsLoading', value: true });
    const payload = getPayload(state);
    const promiseObj = k8sCreate(NooBaaBucketClassModel, payload);
    promiseObj
      .then((obj) => {
        dispatch({ type: 'setIsLoading', value: false });
        history.push(
          `/k8s/ns/${ns}/clusterserviceversions/${getName(
            clusterServiceVersion,
          )}/${referenceForModel(NooBaaBucketClassModel)}/${getName(obj)}`,
        );
      })
      .catch((err) => {
        dispatch({ type: 'setIsLoading', value: false });
        dispatch({ type: 'setError', value: err.message });
      });
  };

  const backingStoreNextConditions = () => {
    if (state.tier1BackingStore.length === 0) return false;
    if (state.tier1Policy === PlacementPolicy.Mirror && state.tier1BackingStore.length < 2)
      return false;
    if (state.tier2Policy === PlacementPolicy.Mirror && state.tier2BackingStore.length < 2)
      return false;
    if (!!state.tier2Policy && state.tier2BackingStore.length === 0) return false;
    return true;
  };

  const namespaceStoreNextConditions = () => {
    if (state.namespacePolicyType === NamespacePolicyType.SINGLE) {
      return state.readNamespaceStore.length === 1 && state.writeNamespaceStore.length === 1;
    }
    if (state.namespacePolicyType === NamespacePolicyType.CACHE) {
      return (
        !!state.hubNamespaceStore && !!state.cacheBackingStore && validateDuration(state.timeToLive)
      );
    }
    if (state.namespacePolicyType === NamespacePolicyType.MULTI) {
      return state.readNamespaceStore.length >= 1 && state.writeNamespaceStore.length === 1;
    }
    return false;
  };

  const creationConditionsSatisfied = () => {
    return (
      (state.bucketClassType === BucketClassType.STANDARD
        ? backingStoreNextConditions()
        : namespaceStoreNextConditions()) && !!state.bucketClassName
    );
  };

  const steps = [
    {
      id: CreateStepsBC.GENERAL,
      name: t('ceph-storage-plugin~General'),
      component: <GeneralPage dispatch={dispatch} state={state} />,
      enableNext: validateBucketClassName(state.bucketClassName.trim()),
    },
    {
      id: CreateStepsBC.PLACEMENT,
      name: t('ceph-storage-plugin~Placement Policy'),
      component:
        state.bucketClassType === BucketClassType.STANDARD ? (
          <PlacementPolicyPage state={state} dispatch={dispatch} />
        ) : (
          <NamespacePolicyPage state={state} dispatch={dispatch} />
        ),
      enableNext:
        state.bucketClassType === BucketClassType.STANDARD
          ? !!state.tier1Policy
          : !!state.namespacePolicyType,
    },
    {
      id: CreateStepsBC.RESOURCES,
      name: t('ceph-storage-plugin~Resources'),
      component:
        state.bucketClassType === BucketClassType.STANDARD ? (
          <BackingStorePage state={state} dispatcher={dispatch} namespace={ns} />
        ) : (
          getNamespaceStorePage()
        ),
      enableNext:
        state.bucketClassType === BucketClassType.STANDARD
          ? backingStoreNextConditions()
          : namespaceStoreNextConditions(),
    },
    {
      id: CreateStepsBC.REVIEW,
      name: t('ceph-storage-plugin~Review'),
      component: <ReviewPage state={state} />,
      nextButtonText: t('ceph-storage-plugin~Create BucketClass'),
      enableNext: creationConditionsSatisfied(),
    },
  ];

  return (
    <>
      <div className="co-create-operand__breadcrumbs">
        <BreadCrumbs
          breadcrumbs={[
            {
              name: _.get(
                clusterServiceVersion,
                'spec.displayName',
                'Openshift Container Storage Operator',
              ),
              path: resourcePathFromModel(ClusterServiceVersionModel, appName, ns),
            },
            {
              name: t('ceph-storage-plugin~Create BucketClass'),
              path: match.url,
            },
          ]}
        />
      </div>
      <div className="co-create-operand__header">
        <div className="nb-create-bc-header-title">
          <Title size="2xl" headingLevel="h1" className="nb-create-bc-header-title__main">
            {t('ceph-storage-plugin~Create new BucketClass')}
          </Title>
          <p className="nb-create-bc-header-title__info">
            {t(
              'ceph-storage-plugin~BucketClass is a CRD representing a class for buckets that defines tiering policies and data placements for an OBC.',
            )}
          </p>
        </div>
      </div>
      <div className="nb-create-bc-wizard">
        <Wizard
          steps={steps}
          cancelButtonText={t('ceph-storage-plugin~Cancel')}
          nextButtonText={t('ceph-storage-plugin~Next')}
          backButtonText={t('ceph-storage-plugin~Back')}
          onSave={finalStep}
          onClose={() => history.goBack()}
        />
      </div>
    </>
  );
};

type CreateBCProps = RouteComponentProps<{ ns?: string; appName?: string }>;

export default CreateBucketClass;
