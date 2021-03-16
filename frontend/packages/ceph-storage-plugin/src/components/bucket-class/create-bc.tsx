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
import { initialState, reducer } from './state';
import { NooBaaBucketClassModel } from '../../models';
import { PlacementPolicy } from '../../types';
import './create-bc.scss';

enum CreateStepsBC {
  GENERAL = 'GENERAL',
  PLACEMENT = 'PLACEMENT',
  BACKINGSTORE = 'BACKINGSTORE',
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

  const finalStep = () => {
    dispatch({ type: 'setIsLoading', value: true });
    const payload = {
      apiVersion: apiVersionForModel(NooBaaBucketClassModel),
      kind: NooBaaBucketClassModel.kind,
      metadata: {
        name: state.bucketClassName,
        namespace: ns,
      },
      spec: {
        placementPolicy: {
          tiers: [
            {
              placement: state.tier1Policy,
              backingStores: state.tier1BackingStore.map(getName),
            },
          ],
        },
      },
    };
    if (state.tier2Policy) {
      payload.spec.placementPolicy.tiers.push({
        placement: state.tier2Policy,
        backingStores: state.tier2BackingStore.map(getName),
      });
    }
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

  const creationConditionsSatisfied = () => {
    if (!backingStoreNextConditions()) return false;
    if (!state.bucketClassName) return false;
    return true;
  };

  const steps = [
    {
      id: CreateStepsBC.GENERAL,
      name: t('ceph-storage-plugin~General'),
      component: <GeneralPage dispatch={dispatch} state={state} />,
      enableNext: !!state.bucketClassName.trim().length,
    },
    {
      id: CreateStepsBC.PLACEMENT,
      name: t('ceph-storage-plugin~Placement Policy'),
      component: <PlacementPolicyPage state={state} dispatch={dispatch} />,
      enableNext: !!state.tier1Policy,
    },
    {
      id: CreateStepsBC.BACKINGSTORE,
      name: t('ceph-storage-plugin~Backing Store'),
      component: <BackingStorePage state={state} dispatcher={dispatch} namespace={ns} />,
      enableNext: backingStoreNextConditions(),
    },
    {
      id: CreateStepsBC.REVIEW,
      name: t('ceph-storage-plugin~Review'),
      component: <ReviewPage state={state} />,
      nextButtonText: t('ceph-storage-plugin~Create Bucket Class'),
      enableNext: creationConditionsSatisfied(),
    },
  ];

  return (
    <>
      <div className="co-create-operand__header">
        <div className="co-create-operand__header-buttons">
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
                name: t('ceph-storage-plugin~Create Bucket Class'),
                path: match.url,
              },
            ]}
          />
        </div>
        <div className="nb-create-bc-header-title">
          <Title size="2xl" headingLevel="h1" className="nb-create-bc-header-title__main">
            {t('ceph-storage-plugin~Create new Bucket Class')}
          </Title>
          <p className="nb-create-bc-header-title__info">
            {t(
              'ceph-storage-plugin~Bucket Class is a CRD representing a class for buckets that defines tiering policies and data placements for an OBC.',
            )}
          </p>
        </div>
      </div>
      <div className="nb-create-bc-wizard">
        <Wizard steps={steps} onSave={finalStep} onClose={() => history.goBack()} />
      </div>
    </>
  );
};

type CreateBCProps = RouteComponentProps<{ ns?: string; appName?: string }>;

export default CreateBucketClass;
