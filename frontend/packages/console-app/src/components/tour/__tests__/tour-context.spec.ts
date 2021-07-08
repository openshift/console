import * as redux from 'react-redux';
import * as plugins from '@console/plugin-sdk';
import * as userHooks from '@console/shared/src/hooks/useUserSettingsCompatibility';
import { testHook } from '../../../../../../__tests__/utils/hooks-utils';
import { TourActions } from '../const';
import * as TourModule from '../tour-context';
import { TourDataType } from '../type';

jest.mock('@console/shared/src/hooks/useActivePerspective', () => ({
  useActivePerspective: () => ['dev', jest.fn()],
}));

const { tourReducer, useTourValuesForContext, useTourStateForPerspective } = TourModule;

describe('guided-tour-context', () => {
  describe('tour-reducer', () => {
    let mockState;
    beforeEach(() => {
      mockState = { startTour: false, completedTour: false, stepNumber: 2 };
    });

    it('should return startTour as true for StartAction', () => {
      const result = tourReducer(mockState, { type: TourActions.start });
      expect(result).toEqual({
        startTour: true,
        completedTour: false,
        stepNumber: 0,
      });
    });

    it('should return increment in stepNumber  for next action', () => {
      const result = tourReducer(mockState, { type: TourActions.next });
      expect(result.stepNumber).toEqual(mockState.stepNumber + 1);
    });

    it('should return decrease in stepNumber  for back action', () => {
      const result = tourReducer(mockState, { type: TourActions.back });
      expect(result.stepNumber).toEqual(mockState.stepNumber - 1);
    });

    it('should return completedTour as true for complete action', () => {
      const result = tourReducer(mockState, { type: TourActions.complete });
      expect(result).toEqual({
        startTour: false,
        completedTour: true,
        stepNumber: 0,
      });
    });
  });

  describe('guided-tour-context-hook', () => {
    let mockTour: TourDataType;
    let mockTourExtension;
    beforeEach(() => {
      mockTour = {
        intro: { heading: 'a', content: 'c' },
        steps: [
          { flags: ['A', 'B'], heading: 'step1', content: 'step1 content' },
          { flags: ['A'], heading: 'g', content: 'h' },
        ],
        end: { heading: 'b', content: 'd' },
      };

      mockTourExtension = [
        {
          type: 'GuidedTour',
          properties: {
            perspective: 'dev',
            tour: mockTour,
          },
        },
      ];
    });

    it('should return context values from the hook', () => {
      spyOn(redux, 'useSelector').and.returnValues(
        { A: true, B: false },
        {
          A: true,
          B: false,
        },
      );
      spyOn(plugins, 'useExtensions').and.returnValue(mockTourExtension);
      spyOn(TourModule, 'useTourStateForPerspective').and.returnValue([
        { completed: false },
        () => null,
        true,
      ]);
      testHook(() => {
        const contextValue = useTourValuesForContext();
        const { tourState, tour, totalSteps } = contextValue;
        expect(tourState).toEqual({
          startTour: true,
          completedTour: false,
          stepNumber: 0,
        });
        expect(tour).toEqual({
          ...mockTour,
          steps: [{ flags: ['A'], heading: 'g', content: 'h' }],
        });
        expect(totalSteps).toEqual(1);
      });
    });

    it('should return tour null from the hook', () => {
      spyOn(redux, 'useSelector').and.returnValues(
        { A: true, B: false },
        {
          A: true,
          B: false,
        },
      );
      spyOn(plugins, 'useExtensions').and.returnValue([]);
      spyOn(TourModule, 'useTourStateForPerspective').and.returnValue([
        { completed: false },
        () => null,
        true,
      ]);
      testHook(() => {
        const contextValue = useTourValuesForContext();
        const { tourState, tour, totalSteps } = contextValue;
        expect(tourState).toEqual(undefined);
        expect(tour).toEqual(null);
        expect(totalSteps).toEqual(undefined);
      });
    });

    it('should return null from the hook if tour is available but data isnot loaded', () => {
      spyOn(redux, 'useSelector').and.returnValues(
        { A: true, B: false },
        {
          A: true,
          B: false,
        },
      );
      spyOn(plugins, 'useExtensions').and.returnValue(mockTourExtension);
      spyOn(TourModule, 'useTourStateForPerspective').and.returnValue([
        { completed: false },
        () => null,
        false,
      ]);
      testHook(() => {
        const contextValue = useTourValuesForContext();
        const { tourState, tour, totalSteps } = contextValue;
        expect(tourState).toEqual(undefined);
        expect(tour).toEqual(null);
        expect(totalSteps).toEqual(undefined);
      });
    });
  });

  describe('useTourStatePerspective', () => {
    it('should return data based on the perspective passed as prop', () => {
      spyOn(userHooks, 'useUserSettingsCompatibility').and.returnValue([
        { dev: { a: true }, admin: { a: false } },
        () => null,
        true,
      ]);
      testHook(() => {
        const [state, , loaded] = useTourStateForPerspective('dev');
        expect(state).toEqual({ a: true });
        expect(loaded).toEqual(true);
      });
    });
  });
});
