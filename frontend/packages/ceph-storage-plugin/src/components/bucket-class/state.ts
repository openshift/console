import { BackingStoreKind, PlacementPolicy } from '../../types';

export const initialState = {
  namespace: 'openshift-storage',
  bucketClassName: '',
  description: '',
  tier1Policy: PlacementPolicy.Spread,
  tier2Policy: null,
  tier1BackingStore: [],
  tier2BackingStore: [],
  isLoading: false,
  error: '',
};

export type State = {
  namespace: string;
  bucketClassName: string;
  description: string;
  tier1Policy: PlacementPolicy;
  tier2Policy: PlacementPolicy;
  tier1BackingStore: BackingStoreKind[];
  tier2BackingStore: BackingStoreKind[];
  isLoading: boolean;
  error: string;
};

export type Action =
  | { type: 'setNamespace'; name: string }
  | { type: 'setBucketClassName'; name: string }
  | { type: 'setDescription'; value: string }
  | { type: 'setPlacementPolicyTier1'; value: PlacementPolicy }
  | { type: 'setPlacementPolicyTier2'; value: PlacementPolicy }
  | { type: 'setBackingStoreTier1'; value: BackingStoreKind[] }
  | { type: 'setBackingStoreTier2'; value: BackingStoreKind[] }
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
    case 'setIsLoading':
      return Object.assign({}, state, { isLoading: action.value });
    case 'setError':
      return Object.assign({}, state, { error: action.value });
    default:
      return initialState;
  }
};
