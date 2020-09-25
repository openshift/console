import { Step } from '../type';
import { filterTourBasedonPermissionAndFlag } from '../utils';
import { FeatureState } from '@console/internal/reducers/features';

describe('guided-tour-utils', () => {
  it('should return steps that has access true', () => {
    const steps: Step[] = [
      {
        access: () => false,
        heading: 'heading1',
        content: 'content1',
      },
      {
        access: () => true,
        heading: 'heading2',
        content: 'content2',
      },
      {
        access: () => false,
        heading: 'heading2',
        content: 'content2',
      },
    ];
    const result = filterTourBasedonPermissionAndFlag(steps, {} as FeatureState);
    expect(result.length).toBe(1);
    expect(result[0].heading).toBe('heading2');
  });

  it('should filter out even if one of the flags for a step is false', () => {
    const steps: Step[] = [
      {
        flags: ['A', 'B'],
        heading: 'heading1',
        content: 'content1',
      },
      {
        flags: ['A', 'C'],
        heading: 'heading2',
        content: 'content2',
      },
      {
        flags: ['B'],
        heading: 'heading2',
        content: 'content2',
      },
    ];
    const result = filterTourBasedonPermissionAndFlag(steps, {
      A: true,
      B: false,
      C: true,
    } as any);
    expect(result.length).toBe(1);
    expect(result[0].heading).toBe('heading2');
  });
});
