import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Wizard } from '@patternfly/react-core';
import { apiVersionForModel, k8sCreate, referenceFor } from '@console/internal/module/k8s';
import { history } from '@console/internal/components/utils/router';
import { resourceObjPath } from '@console/internal/components/utils';
import { NooBaaBucketClassModel } from '../../models';
import GeneralPage from './wizard-pages/general-page';
import PlacementPolicyPage from './wizard-pages/placement-policy-page';
import BackingStorePageWithFirehose from './wizard-pages/backingstore-page';
import ReviewPage from './wizard-pages/review-page';
import { initialState, reducer } from './state';
import './create-bc.scss';

enum CreateStepsBC {
  GENERAL = 'GENERAL',
  PLACEMENT = 'PLACEMENT',
  BACKINGSTORE = 'BACKINGSTORE',
  REVIEW = 'REVIEW',
}

const CreateBucketClass: React.FC<CreateBCProps> = ({ match }) => {
  const [state, dispatch] = React.useReducer(reducer, initialState);
  const { ns } = match.params;

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
              backingStores: [...state.tier1BackingStore],
            },
          ],
        },
      },
    };
    if (state.tier2Policy) {
      payload.spec.placementPolicy.tiers.push({
        placement: state.tier2Policy,
        backingStores: [...state.tier2BackingStore],
      });
    }
    const promiseObj = k8sCreate(NooBaaBucketClassModel, payload);
    promiseObj
      .then((obj) => {
        dispatch({ type: 'setIsLoading', value: false });
        history.push(resourceObjPath(obj, referenceFor(obj)));
      })
      .catch((err) => {
        dispatch({ type: 'setIsLoading', value: false });
        dispatch({ type: 'setError', value: err });
      });
  };

  const backingStoreNextConditions = () => {
    if (state.tier1BackingStore.length === 0) return false;
    if (state.tier1Policy === 'Mirror' && state.tier1BackingStore.length < 2) return false;
    if (state.tier2Policy === 'Mirror' && state.tier2BackingStore.length < 2) return false;
    if (!!state.tier2Policy && state.tier2BackingStore.length === 0) return false;
    return true;
  };

  const creationConditionsSatisfied = () => {
    if (!backingStoreNextConditions()) return false;
    if (!state.bucketClassName) return false;
    if (!state.namespace) return false;
    return true;
  };

  const steps = [
    {
      id: CreateStepsBC.GENERAL,
      name: 'General',
      component: <GeneralPage dispatch={dispatch} state={state} />,
      enableNext: !!state.bucketClassName,
    },
    {
      id: CreateStepsBC.PLACEMENT,
      name: 'Placement Policy',
      component: <PlacementPolicyPage state={state} dispatch={dispatch} />,
      enableNext: !!state.tier1Policy,
    },
    {
      id: CreateStepsBC.BACKINGSTORE,
      name: 'BackingStore',
      component: <BackingStorePageWithFirehose state={state} dispatcher={dispatch} />,
      enableNext: backingStoreNextConditions(),
    },
    {
      id: CreateStepsBC.REVIEW,
      name: 'Review',
      component: <ReviewPage state={state} />,
      nextButtonText: 'Create BucketClass',
      enableNext: creationConditionsSatisfied(),
    },
  ];

  return (
    <>
      <Wizard
        isCompactNav
        isInPage
        isOpen
        title="Create new Bucket Class"
        description="NooBaaBucketClass is a CRD representing a class for buckets that defines policies for data placement and more"
        steps={steps}
        onSave={finalStep}
        onClose={() => history.goBack()}
      />
    </>
  );
};

type CreateBCProps = RouteComponentProps<{ ns?: string }>;

export default CreateBucketClass;
