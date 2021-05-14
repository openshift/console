import * as React from 'react';
import { shallow } from 'enzyme';
import * as hookUtils from '../../hooks';
import PipelineMetrics from '../PipelineMetrics';
import {
  DataState,
  PipelineExampleNames,
  pipelineTestData,
} from '../../../../test-data/pipeline-data';
import PipelineMetricsEmptyState from '../PipelineMetricsEmptyState';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import PipelineSuccessRatioDonut from '../PipelineSuccessRatioDonut';
import PipelineRunCount from '../PipelineRunCount';
import PipelineRunDurationGraph from '../PipelineRunDurationGraph';
import PipelineRunTaskRunGraph from '../PipelineRunTaskRunGraph';
import PipelineMetricsTimeRangeDropdown from '../PipelineMetricsTimeRangeDropdown';
import PipelineMetricsRefreshDropdown from '../PipelineMetricsRefreshDropdown';
import { MetricsQueryPrefix } from '../pipeline-metrics-utils';

jest.mock('@console/internal/components/utils/k8s-get-hook', () => ({
  useK8sGet: jest.fn(),
}));

const latestPipelineRunSpy = jest.spyOn(hookUtils, 'useLatestPipelineRun');

const mockData = pipelineTestData[PipelineExampleNames.WORKSPACE_PIPELINE];
const { pipeline } = mockData;
const pipelineRun = mockData.pipelineRuns[DataState.SUCCESS];

type PipelineMetricsProps = React.ComponentProps<typeof PipelineMetrics>;

describe('Pipeline Metrics', () => {
  let PipelineMetricsProps: PipelineMetricsProps;
  beforeEach(() => {
    PipelineMetricsProps = {
      obj: pipeline,
      customData: {
        templateNames: [],
        queryPrefix: MetricsQueryPrefix.TEKTON_PIPELINES_CONTROLLER,
      },
    };
  });

  it('Should render an empty state if pipeline is not started', () => {
    latestPipelineRunSpy.mockReturnValue(null);
    const pipelineMetricsWrapper = shallow(<PipelineMetrics {...PipelineMetricsProps} />);
    expect(pipelineMetricsWrapper.find(PipelineMetricsEmptyState).exists()).toBe(true);
  });

  it('Should render pipeline Metrics graph if the pipeline is started', () => {
    latestPipelineRunSpy.mockReturnValue(pipelineRun);
    const pipelineMetricsWrapper = shallow(<PipelineMetrics {...PipelineMetricsProps} />);
    expect(pipelineMetricsWrapper.find(PipelineMetricsEmptyState).exists()).toBe(false);
    expect(pipelineMetricsWrapper.find(DashboardCard)).toHaveLength(4);

    expect(pipelineMetricsWrapper.find(PipelineMetricsTimeRangeDropdown).exists()).toBe(true);
    expect(pipelineMetricsWrapper.find(PipelineMetricsRefreshDropdown).exists()).toBe(true);

    expect(pipelineMetricsWrapper.find(PipelineSuccessRatioDonut).exists()).toBe(true);
    expect(pipelineMetricsWrapper.find(PipelineRunCount).exists()).toBe(true);
    expect(pipelineMetricsWrapper.find(PipelineRunDurationGraph).exists()).toBe(true);
    expect(pipelineMetricsWrapper.find(PipelineRunTaskRunGraph).exists()).toBe(true);
  });
});
