import { renderHook } from '@testing-library/react';
import { asAccessReview } from '@console/internal/components/utils';
import { ClusterServiceVersionModel } from '../../../models';
import { useSubscriptionActions } from '../useSubscriptionActions';

jest.mock('@console/app/src/actions/hooks/useCommonActions', () => ({
  useCommonActions: jest.fn(() => [{ Edit: { id: 'edit-resource' } }]),
}));

jest.mock('@console/shared/src/hooks/useK8sModel', () => ({
  useK8sModel: jest.fn(() => [
    {
      apiGroup: 'operators.coreos.com',
      apiVersion: 'v1alpha1',
      kind: 'Subscription',
      plural: 'subscriptions',
    },
  ]),
}));

jest.mock('../../../components/modals/uninstall-operator-modal', () => ({
  useUninstallOperatorModal: jest.fn(() => jest.fn()),
}));

jest.mock('@console/internal/components/utils', () => ({
  asAccessReview: jest.fn((model, resource, verb) => ({
    group: model.apiGroup,
    resource: model.plural,
    verb,
    namespace: resource?.metadata?.namespace,
    name: resource?.metadata?.name,
  })),
}));

const mockSubscription = {
  apiVersion: 'operators.coreos.com/v1alpha1' as const,
  kind: 'Subscription' as const,
  metadata: {
    name: 'test-subscription',
    namespace: 'test-namespace',
  },
  spec: {
    source: 'test-catalog',
    name: 'test-operator',
  },
  status: {
    installedCSV: 'test-csv-v1.0.0',
  },
};

describe('useSubscriptionActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should include accessReview for View CSV action with get verb', () => {
    const actions = renderHook(() => useSubscriptionActions(mockSubscription)).result.current;

    const viewCSVAction = actions.find((action) => action.id === 'view-cluster-service-version');

    expect(viewCSVAction).toBeDefined();
    expect(viewCSVAction?.accessReview).toBeDefined();
    expect(asAccessReview).toHaveBeenCalledWith(
      ClusterServiceVersionModel,
      { metadata: { namespace: 'test-namespace', name: 'test-csv-v1.0.0' } },
      'get',
    );
  });

  it('should not include View CSV action when installedCSV is missing', () => {
    const subscriptionWithoutCSV = {
      ...mockSubscription,
      status: undefined,
    };

    const actions = renderHook(() => useSubscriptionActions(subscriptionWithoutCSV)).result.current;

    const viewCSVAction = actions.find((action) => action.id === 'view-cluster-service-version');

    expect(viewCSVAction).toBeUndefined();
  });

  it('should include Remove Subscription action with delete accessReview', () => {
    const actions = renderHook(() => useSubscriptionActions(mockSubscription)).result.current;

    const removeAction = actions.find((action) => action.id === 'remove-subscription');

    expect(removeAction).toBeDefined();
    expect(removeAction?.accessReview).toBeDefined();
  });
});
