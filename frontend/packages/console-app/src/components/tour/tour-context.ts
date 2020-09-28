import {
  createContext,
  useReducer,
  useState,
  Reducer,
  Dispatch,
  ReducerAction,
  useEffect,
} from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { pick, union, isEqual } from 'lodash';
import { getFlagsObject } from '@console/internal/reducers/features';
import { useExtensions } from '@console/plugin-sdk';
import { RootState } from '@console/internal/redux';
import { isGuidedTour, GuidedTour } from '@console/plugin-sdk/src/typings/guided-tour';
import { TourActions } from './const';
import {
  getTourLocalStorageForPerspective,
  filterTourBasedonPermissionAndFlag,
  setTourCompletionLocalStorageDataForPerspective,
} from './utils';
import { TourDataType, Step } from './type';

type TourStateAction = { type: TourActions; payload?: { completed?: boolean } };
export const tourReducer = (state: TourState, action: TourStateAction) => {
  const { stepNumber } = state;
  switch (action.type) {
    case TourActions.initialize:
      return {
        completedTour: action.payload.completed,
        stepNumber: 0,
        startTour: !action.payload.completed,
      };
    case TourActions.start:
      return { startTour: true, completedTour: false, stepNumber: 0 };
    case TourActions.next:
      return {
        ...state,
        startTour: false,
        stepNumber: stepNumber + 1,
      };
    case TourActions.back:
      return {
        ...state,
        stepNumber: stepNumber - 1,
      };
    case TourActions.complete:
      return { ...state, completedTour: true, stepNumber: 0 };
    default:
      return state;
  }
};

type TourReducer = Reducer<TourState, TourStateAction>;

type TourContextType = {
  tourState?: TourState;
  tourDispatch?: Dispatch<ReducerAction<TourReducer>>;
  tour?: TourDataType;
  totalSteps?: number;
  onComplete?: () => void;
};

export type TourState = {
  stepNumber: number;
  startTour: boolean;
  completedTour: boolean;
};

export const TourContext = createContext<TourContextType>({});

const getRequiredFlagsFromTour = (steps: Step[]) =>
  steps.reduce((allFlags, { flags }) => (flags ? union(allFlags, flags) : allFlags), []);

const getRequiredFlagsByTour = createSelector(
  (state: RootState) => getFlagsObject(state),
  (_, steps: Step[]) => getRequiredFlagsFromTour(steps),
  (flags, requiredFlags) => pick(flags, requiredFlags),
);

export const useTourValuesForContext = (): TourContextType => {
  // declaring a method for the perspective instead of using getActivePerspective
  // because importing getActivePerspective in this file throws error
  // Uncaught ReferenceError: Cannot access 'allModels' before initialization and this hook is used in plugin extension for ContextProvider
  const activePerspective = useSelector(({ UI }: RootState): string => UI.get('activePerspective'));
  const [perspective, setPerspective] = useState<string>(activePerspective);
  const tourExtension = useExtensions<GuidedTour>(isGuidedTour);
  const tour = tourExtension.find(({ properties }) => properties.perspective === perspective);
  const selectorSteps = tour?.properties?.tour?.steps ?? [];
  const flags = useSelector(
    (state: RootState) => getRequiredFlagsByTour(state, selectorSteps),
    isEqual,
  );
  const { completed } = getTourLocalStorageForPerspective(perspective);
  const onComplete = () => {
    if (completed === false) {
      setTourCompletionLocalStorageDataForPerspective(perspective, true);
    }
  };
  const [tourState, tourDispatch] = useReducer<TourReducer>(tourReducer, {
    completedTour: completed,
    stepNumber: 0,
    startTour: !completed,
  });

  useEffect(() => {
    const { completed: initCompleted } = getTourLocalStorageForPerspective(activePerspective);
    tourDispatch({ type: TourActions.initialize, payload: { completed: initCompleted } });
    setPerspective(activePerspective);
  }, [activePerspective]);

  if (!tour) return { tour: null };
  const {
    properties: {
      tour: { intro, steps: unfilteredSteps, end },
    },
  } = tour;
  const steps = filterTourBasedonPermissionAndFlag(unfilteredSteps, flags);
  return {
    tourState,
    tourDispatch,
    tour: { intro, steps, end },
    totalSteps: steps.length,
    onComplete,
  };
};
