import * as React from 'react';
import { render } from '@testing-library/react';
import { incompleteBuildRun } from '../../../__tests__/mock-data';
import { BuildRun } from '../../../types';
import BuildRunDuration, { getDuration } from '../BuildRunDuration';

let now: string;
const OriginDate = global.Date;
jest
  .spyOn(global, 'Date')
  .mockImplementation((newDate) =>
    newDate ? new OriginDate(newDate) : now ? new OriginDate(now) : new OriginDate(),
  );

describe('getDuration', () => {
  it('should return the right duration strings', () => {
    expect(getDuration(0, false)).toBe('less than a sec');
    expect(getDuration(0, true)).toBe('less than a sec');

    expect(getDuration(10, false)).toBe('10s');
    expect(getDuration(10, true)).toBe('10 second');

    expect(getDuration(60, false)).toBe('1m');
    expect(getDuration(60, true)).toBe('1 minute');

    expect(getDuration(3600 + 2 * 60 + 3, false)).toBe('1h 2m 3s');
    expect(getDuration(3600 + 2 * 60 + 3, true)).toBe('1 hour 2 minute 3 second');

    expect(getDuration(48 * 3600 + 1, false)).toBe('48h 1s');
    expect(getDuration(48 * 3600 + 1, true)).toBe('48 hour 1 second');
  });
});

describe('BuildRunDuration', () => {
  it('should render a placeholder for incomplete BuildRuns', () => {
    const buildRun: BuildRun = incompleteBuildRun;
    const renderResult = render(<BuildRunDuration buildRun={buildRun} />);
    expect(renderResult.container.textContent).toEqual('-');
  });

  it('should render a the time between startTime and completionTime', () => {
    const buildRun: BuildRun = {
      apiVersion: 'shipwright.io/v1alpha1',
      kind: 'BuildRun',
      metadata: {
        namespace: 'a-namespace',
        name: 'incomplete-buildrun',
      },
      status: {
        startTime: '2022-06-06T13:52:34Z',
        completionTime: '2022-06-06T13:53:26Z',
      },
    };
    const renderResult = render(<BuildRunDuration buildRun={buildRun} />);
    expect(renderResult.container.textContent).toEqual('52 second');
  });

  it('should render a the time between startTime and NOW if completionTime is missing', () => {
    const buildRun: BuildRun = {
      apiVersion: 'shipwright.io/v1alpha1',
      kind: 'BuildRun',
      metadata: {
        namespace: 'a-namespace',
        name: 'incomplete-buildrun',
      },
      status: {
        startTime: '2022-06-06T13:52:34Z',
      },
    };
    now = '2022-06-06T13:54:34Z';
    const renderResult = render(<BuildRunDuration buildRun={buildRun} />);
    expect(renderResult.container.textContent).toEqual('2 minute');
  });
});
