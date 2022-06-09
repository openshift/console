import * as React from 'react';
import { render } from '@testing-library/react';
import {
  incompleteBuildRun,
  pendingBuildRun,
  runningBuildRun,
  succeededBuildRun,
  failedBuildRun,
} from '../../../__tests__/mock-data';
import { ComputedBuildRunStatus } from '../../../types';
import BuildRunStatus, { getBuildRunStatus } from '../BuildRunStatus';

describe('getBuildRunStatus', () => {
  it('should return the right status', () => {
    expect(getBuildRunStatus(incompleteBuildRun)).toBe(ComputedBuildRunStatus.UNKNOWN);
    expect(getBuildRunStatus(pendingBuildRun)).toBe(ComputedBuildRunStatus.PENDING);
    expect(getBuildRunStatus(runningBuildRun)).toBe(ComputedBuildRunStatus.RUNNING);
    expect(getBuildRunStatus(succeededBuildRun)).toBe(ComputedBuildRunStatus.SUCCEEDED);
    expect(getBuildRunStatus(failedBuildRun)).toBe(ComputedBuildRunStatus.FAILED);
  });
});

describe('BuildRunStatus', () => {
  it('should render the right status', () => {
    const renderResult = render(<BuildRunStatus buildRun={incompleteBuildRun} />);
    expect(renderResult.container.textContent).toEqual('Unknown');

    renderResult.rerender(<BuildRunStatus buildRun={pendingBuildRun} />);
    expect(renderResult.container.textContent).toEqual('Pending');

    renderResult.rerender(<BuildRunStatus buildRun={runningBuildRun} />);
    expect(renderResult.container.textContent).toEqual('Running');

    renderResult.rerender(<BuildRunStatus buildRun={succeededBuildRun} />);
    expect(renderResult.container.textContent).toEqual('Succeeded');

    renderResult.rerender(<BuildRunStatus buildRun={failedBuildRun} />);
    expect(renderResult.container.textContent).toEqual('Failed');
  });
});
