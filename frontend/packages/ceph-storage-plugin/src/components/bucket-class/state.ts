import { BucketClassType, NamespacePolicyType, TimeUnits } from '../../constants/bucket-class';
import { BackingStoreKind, NamespaceStoreKind, PlacementPolicy } from '../../types';

export const initialState = {
  namespace: 'openshift-storage',
  bucketClassName: '',
  bucketClassType: BucketClassType.STANDARD,
  namespacePolicyType: NamespacePolicyType.SINGLE,
  readNamespaceStore: [],
  writeNamespaceStore: [],
  hubNamespaceStore: null,
  cacheBackingStore: null,
  timeToLive: 3600000,
  timeUnit: TimeUnits.HOUR,
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
  bucketClassType: BucketClassType;
  namespacePolicyType: NamespacePolicyType;
  readNamespaceStore: NamespaceStoreKind[];
  writeNamespaceStore: NamespaceStoreKind[];
  hubNamespaceStore: NamespaceStoreKind;
  cacheBackingStore: BackingStoreKind;
  timeToLive: number;
  timeUnit: TimeUnits;
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
  | { type: 'setBucketClassType'; value: BucketClassType }
  | { type: 'setNamespacePolicyType'; value: NamespacePolicyType }
  | { type: 'setReadNamespaceStore'; value: NamespaceStoreKind[] }
  | { type: 'setWriteNamespaceStore'; value: NamespaceStoreKind[] }
  | { type: 'setHubNamespaceStore'; value: NamespaceStoreKind }
  | { type: 'setCacheBackingStore'; value: BackingStoreKind }
  | { type: 'setTimeToLive'; value: number }
  | { type: 'setTimeUnit'; value: TimeUnits }
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
    case 'setBucketClassType':
      return Object.assign({}, state, { bucketClassType: action.value });
    case 'setNamespacePolicyType':
      return Object.assign({}, state, { namespacePolicyType: action.value });
    case 'setReadNamespaceStore':
      return Object.assign({}, state, { readNamespaceStore: action.value });
    case 'setWriteNamespaceStore':
      return Object.assign({}, state, { writeNamespaceStore: action.value });
    case 'setHubNamespaceStore':
      return Object.assign({}, state, { hubNamespaceStore: action.value });
    case 'setCacheBackingStore':
      return Object.assign({}, state, { cacheBackingStore: action.value });
    case 'setTimeToLive':
      return Object.assign({}, state, { timeToLive: action.value });
    case 'setTimeUnit':
      return Object.assign({}, state, { timeUnit: action.value });
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
