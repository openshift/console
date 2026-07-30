import { renderHook } from '@testing-library/react';
import { K8S_VERB_DELETE, K8S_VERB_UPDATE } from '@console/dynamic-plugin-sdk/src/api/constants';
import { asAccessReview } from '@console/internal/components/utils/rbac';
import { ClusterServiceVersionModel, SubscriptionModel } from '../../models';
import useOperatorActions from '../useOperatorActions';

jest.mock('@console/dynamic-plugin-sdk/src/lib-core', () => ({
  useOverlay: jest.fn(() => jest.fn()),
}));

jest.mock('../../components/modals/uninstall-operator-modal', () => ({
  useUninstallOperatorModal: jest.fn(() => jest.fn()),
}));

jest.mock('@console/internal/components/utils/rbac', () => ({
  asAccessReview: jest.fn((model, resource, verb) => ({
    group: model.apiGroup,
    resource: model.plural,
    verb,
    namespace: resource?.metadata?.namespace,
    name: resource?.metadata?.name,
  })),
}));

const mockCSV = {
  apiVersion: 'operators.coreos.com/v1alpha1',
  kind: 'ClusterServiceVersion',
  metadata: {
    name: 'test-csv',
    namespace: 'test-namespace',
  },
};

const mockSubscription = {
  apiVersion: 'operators.coreos.com/v1alpha1',
  kind: 'Subscription',
  metadata: {
    name: 'test-subscription',
    namespace: 'test-namespace',
  },
  spec: {
    name: 'test-operator',
  },
};

describe('useOperatorActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should include accessReview for Edit Subscription action with UPDATE verb', () => {
    const { result } = renderHook(() =>
      useOperatorActions({ resource: mockCSV, subscription: mockSubscription }),
    );

    const [actions] = result.current;
    const editAction = actions.find((action) => action.id === 'edit-subscription');

    expect(editAction).toBeDefined();
    expect(editAction?.accessReview).toBeDefined();
    expect(asAccessReview).toHaveBeenCalledWith(
      SubscriptionModel,
      mockSubscription,
      K8S_VERB_UPDATE,
    );
  });

  it('should include accessReview for Uninstall Operator action with DELETE verb', () => {
    const { result } = renderHook(() =>
      useOperatorActions({ resource: mockCSV, subscription: mockSubscription }),
    );

    const [actions] = result.current;
    const uninstallAction = actions.find((action) => action.id === 'uninstall-operator');

    expect(uninstallAction).toBeDefined();
    expect(uninstallAction?.accessReview).toBeDefined();
    expect(asAccessReview).toHaveBeenCalledWith(
      SubscriptionModel,
      mockSubscription,
      K8S_VERB_DELETE,
    );
  });

  it('should return Delete CSV action when subscription is empty', () => {
    const { result } = renderHook(() =>
      useOperatorActions({ resource: mockCSV, subscription: {} }),
    );

    const [actions] = result.current;
    const deleteAction = actions.find((action) => action.id === 'delete-csv');

    expect(deleteAction).toBeDefined();
    expect(deleteAction?.accessReview).toBeDefined();
    expect(asAccessReview).toHaveBeenCalledWith(
      ClusterServiceVersionModel,
      mockCSV,
      K8S_VERB_DELETE,
    );
  });
});
