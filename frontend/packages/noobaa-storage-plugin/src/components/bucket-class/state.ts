import { K8sResourceKind } from '@console/internal/module/k8s';

export const initialState = {
  namespace: 'openshift-storage',
  bucketClassName: '',
  description: '',
  tier1Policy: 'Spread',
  tier2Policy: '',
  tier1BackingStore: [],
  tier2BackingStore: [],
  backingStores: [],
  isLoading: false,
  error: '',
};

export type BackingStoreStateType = K8sResourceKind & {
  id: string;
  selected: boolean;
  selectedBy: React.ReactText;
};

export type State = {
  namespace: string;
  bucketClassName: string;
  description: string;
  tier1Policy: string;
  tier2Policy: string;
  tier1BackingStore: string[];
  tier2BackingStore: string[];
  backingStores: BackingStoreStateType[];
  isLoading: boolean;
  error: string;
};

export type Action =
  | { type: 'setNamespace'; name: string }
  | { type: 'setBucketClassName'; name: string }
  | { type: 'setDescription'; value: string }
  | { type: 'setPlacementPolicyTier1'; value: string }
  | { type: 'setPlacementPolicyTier2'; value: string }
  | { type: 'setBackingStoreTier1'; value: string[] }
  | { type: 'setBackingStoreTier2'; value: string[] }
  | { type: 'setBackingStores'; value: BackingStoreStateType[] }
  | { type: 'setIsLoading'; value: boolean }
  | { type: 'setError'; value: string };

export const reducer = (state: State, action: Action) => {
  switch (action.type) {
    case 'setNamespace':
      return Object.assign({}, state, { namespace: action.name });
    case 'setBucketClassName':
      return Object.assign({}, state, { bucketClassName: action.name });
    case 'setDescription':
      return Object.assign({}, state, { description: action.value });
    case 'setPlacementPolicyTier1':
      return Object.assign({}, state, { tier1Policy: action.value });
    case 'setPlacementPolicyTier2':
      return Object.assign({}, state, { tier2Policy: action.value });
    case 'setBackingStoreTier1':
      return Object.assign({}, state, { tier1BackingStore: action.value });
    case 'setBackingStoreTier2':
      return Object.assign({}, state, { tier2BackingStore: action.value });
    case 'setBackingStores':
      return Object.assign({}, state, { backingStores: action.value });
    case 'setIsLoading':
      return Object.assign({}, state, { isLoading: action.value });
    case 'setError':
      return Object.assign({}, state, { error: action.value });
    default:
      return initialState;
  }
};
