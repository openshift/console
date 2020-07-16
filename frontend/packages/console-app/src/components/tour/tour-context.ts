import { createContext, useReducer, Reducer, Dispatch, ReducerAction } from 'react';
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

export const tourReducer = (state: TourState, action: TourActions) => {
  const { stepNumber } = state;
  switch (action) {
    case TourActions.start:
      return { closeTour: false, startTour: true, completedTour: false, stepNumber: 0 };
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
    case TourActions.pause:
      return {
        ...state,
        closeTour: true,
      };
    case TourActions.resume:
      return { ...state, closeTour: false };
    case TourActions.complete:
      return { ...state, closeTour: false, completedTour: true, stepNumber: 0 };
    default:
      return state;
  }
};

type TourReducer = Reducer<TourState, TourActions>;

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
  closeTour: boolean;
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
  const tourExtension = useExtensions<GuidedTour>(isGuidedTour);
  const tour = tourExtension.find(({ properties }) => properties.perspective === activePerspective);
  const selectorSteps = tour?.properties?.tour?.steps ?? [];
  const flags = useSelector(
    (state: RootState) => getRequiredFlagsByTour(state, selectorSteps),
    isEqual,
  );
  const { completed } = getTourLocalStorageForPerspective(activePerspective);
  const onComplete = () => {
    if (completed === false) {
      setTourCompletionLocalStorageDataForPerspective(activePerspective, true);
    }
  };
  const [tourState, tourDispatch] = useReducer<TourReducer>(tourReducer, {
    completedTour: completed,
    stepNumber: 0,
    closeTour: false,
    startTour: !completed,
  });
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
