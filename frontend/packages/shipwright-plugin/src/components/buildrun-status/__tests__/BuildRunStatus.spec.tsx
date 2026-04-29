import { render, screen } from '@testing-library/react';
import {
  incompleteBuildRun,
  pendingBuildRun,
  runningBuildRun,
  succeededBuildRun,
  failedBuildRun,
} from '../../../__tests__/mock-data-v1beta1';
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
    const { rerender } = render(<BuildRunStatus buildRun={incompleteBuildRun} />);
    expect(screen.getByText('Unknown')).toBeInTheDocument();

    rerender(<BuildRunStatus buildRun={pendingBuildRun} />);
    expect(screen.getByText('Pending')).toBeInTheDocument();

    rerender(<BuildRunStatus buildRun={runningBuildRun} />);
    expect(screen.getByText('Running')).toBeInTheDocument();

    rerender(<BuildRunStatus buildRun={succeededBuildRun} />);
    expect(screen.getByText('Succeeded')).toBeInTheDocument();

    rerender(<BuildRunStatus buildRun={failedBuildRun} />);
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });
});
