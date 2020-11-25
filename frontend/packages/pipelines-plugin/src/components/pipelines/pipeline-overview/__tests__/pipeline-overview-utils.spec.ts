import * as overviewUtils from '../pipeline-overview-utils';

describe('pipeline-overview-utils', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('should properly set the failed pipeline names in the session storage', () => {
    overviewUtils.setPipelineNotStarted('pipeline-one', 'ns-1');
    overviewUtils.setPipelineNotStarted('pipeline-two', 'ns-1');
    overviewUtils.setPipelineNotStarted('pipeline-three', 'ns-1');

    expect(overviewUtils.getNotStartedPipelines('ns-1')).toHaveLength(3);
  });

  it('should not set the session storage if empty string or null is passed', () => {
    overviewUtils.setPipelineNotStarted('', '');
    overviewUtils.setPipelineNotStarted(null, '');
    overviewUtils.setPipelineNotStarted(undefined, '');

    expect(overviewUtils.getNotStartedPipelines('ns-1')).toHaveLength(0);
  });

  it('should remove the pipeline names from the session storage', () => {
    overviewUtils.setPipelineNotStarted('pipeline-one', 'ns-1');
    overviewUtils.setPipelineNotStarted('pipeline-two', 'ns-1');
    overviewUtils.setPipelineNotStarted('pipeline-three', 'ns-1');

    overviewUtils.removePipelineNotStarted('pipeline-three', 'ns-1');
    overviewUtils.removePipelineNotStarted('pipeline-two', 'ns-1');
    const failedPipelines = overviewUtils.getNotStartedPipelines('ns-1');

    expect(failedPipelines).toHaveLength(1);
    expect(failedPipelines[0]).toBe('pipeline-one');
  });

  it('should not affect existing values if we pass null or undefined values to remove operation', () => {
    overviewUtils.setPipelineNotStarted('pipeline-one', 'ns-1');

    overviewUtils.removePipelineNotStarted(null, 'ns-1');
    overviewUtils.removePipelineNotStarted(undefined, 'ns-1');

    expect(overviewUtils.getNotStartedPipelines('ns-1')).toHaveLength(1);
  });

  it('should return true or false based on pipeline name availability in the session storage', () => {
    overviewUtils.setPipelineNotStarted('pipeline-one', 'ns-1');
    overviewUtils.setPipelineNotStarted('pipeline-two', 'ns-1');

    expect(overviewUtils.isPipelineNotStarted('pipeline-one', 'ns-1')).toBeTruthy();
    expect(overviewUtils.isPipelineNotStarted('pipeline-two', 'ns-1')).toBeTruthy();
    expect(overviewUtils.isPipelineNotStarted('pipeline-three', 'ns-1')).toBeFalsy();
  });
});
