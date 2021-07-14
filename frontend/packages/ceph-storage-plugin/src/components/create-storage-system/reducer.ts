import * as _ from 'lodash';
import { BackingStorageType, RHCS } from '../../constants/create-storage-system';

export type WizardState = React.ReducerState<WizardReducer>;
export type WizardDispatch = React.Dispatch<React.ReducerAction<WizardReducer>>;

export type WizardCommonProps = {
  state: WizardState;
  dispatch: WizardDispatch;
};

/* State of CreateStorageSystem */
export const initialState: CreateStorageSystemState = {
  currentStep: 1,
  backingStorage: {
    type: BackingStorageType.EXISTING,
    externalProvider: RHCS,
  },
  storageClass: { name: '', provisioner: '' },
};

type CreateStorageSystemState = {
  currentStep: number;
  backingStorage: {
    type: BackingStorageType;
    externalProvider: string;
  };
  storageClass: { name: string; provisioner?: string };
};

/* Reducer of CreateStorageSystem */
export const reducer: WizardReducer = (prevState, action) => {
  const newState = _.cloneDeep(prevState);
  switch (action.type) {
    case 'currentStep/incrementCount':
      newState.currentStep += 1;
      break;
    case 'currentStep/resetCount':
      newState.currentStep = 1;
      break;
    case 'backingStorage/setType':
      newState.backingStorage = {
        ...prevState.backingStorage,
        type: action.payload,
      };
      break;
    case 'backingStorage/setExternalProvider':
      newState.backingStorage = {
        ...prevState.backingStorage,
        externalProvider: action.payload,
      };
      break;
    case 'wizard/setStorageClass':
      newState.storageClass = {
        name: action.payload.name,
        provisioner: action.payload?.provisioner,
      };
      break;
    default:
      throw new TypeError(`${action} is not a valid reducer action`);
  }
  return newState;
};

export type WizardReducer = (
  prevState: CreateStorageSystemState,
  action: CreateStorageSystemAction,
) => CreateStorageSystemState;

/* Actions of CreateStorageSystem */
type CreateStorageSystemAction =
  | { type: 'currentStep/incrementCount' }
  | { type: 'currentStep/resetCount' }
  | { type: 'backingStorage/setType'; payload: CreateStorageSystemState['backingStorage']['type'] }
  | {
      type: 'backingStorage/setExternalProvider';
      payload: CreateStorageSystemState['backingStorage']['externalProvider'];
    }
  | {
      type: 'wizard/setStorageClass';
      payload: CreateStorageSystemState['storageClass'];
    };
