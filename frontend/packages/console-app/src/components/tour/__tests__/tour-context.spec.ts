import * as redux from 'react-redux';
import * as plugins from '@console/plugin-sdk';
import { testHook } from '@console/shared/src/test-utils/hooks-utils';
import { TourState, tourReducer, useTourValuesForContext } from '../tour-context';
import { TourActions } from '../const';
import { TourDataType } from '../type';

describe('guided-tour-context', () => {
  describe('tour-reducer', () => {
    let mockState: TourState;
    beforeEach(() => {
      mockState = { startTour: false, completedTour: false, stepNumber: 2 };
    });

    it('should return startTour as true for StartAction', () => {
      const result = tourReducer(mockState, TourActions.start);
      expect(result).toEqual({
        startTour: true,
        completedTour: false,
        stepNumber: 0,
      });
    });

    it('should return increment in stepNumber  for next action', () => {
      const result = tourReducer(mockState, TourActions.next);
      expect(result.stepNumber).toEqual(mockState.stepNumber + 1);
    });

    it('should return decrease in stepNumber  for back action', () => {
      const result = tourReducer(mockState, TourActions.back);
      expect(result.stepNumber).toEqual(mockState.stepNumber - 1);
    });

    it('should return completedTour as true for complete action', () => {
      const result = tourReducer(mockState, TourActions.complete);
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
      spyOn(redux, 'useSelector').and.returnValues('dev', { A: true, B: false }, 'dev', {
        A: true,
        B: false,
      });
      spyOn(plugins, 'useExtensions').and.returnValue(mockTourExtension);
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
      spyOn(redux, 'useSelector').and.returnValues('dev', { A: true, B: false }, 'dev', {
        A: true,
        B: false,
      });
      spyOn(plugins, 'useExtensions').and.returnValue([]);
      testHook(() => {
        const contextValue = useTourValuesForContext();
        const { tourState, tour, totalSteps } = contextValue;
        expect(tourState).toEqual(undefined);
        expect(tour).toEqual(null);
        expect(totalSteps).toEqual(undefined);
      });
    });
  });
});
