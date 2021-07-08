import * as React from 'react';
import { shallow } from 'enzyme';
import Measure from 'react-measure';
import { DEFAULT_PROMETHEUS_TIMESPAN } from '@console/internal/components/graphs';
import { GraphEmpty } from '@console/internal/components/graphs/graph-empty';
import { LoadingInline } from '@console/internal/components/utils';
import { parsePrometheusDuration } from '@console/internal/components/utils/datetime';
import { PipelineExampleNames, pipelineTestData } from '../../../../test-data/pipeline-data';
import { DEFAULT_REFRESH_INTERVAL } from '../../const';
import * as hookUtils from '../../hooks';
import { LineChart } from '../charts/lineChart';
import { MetricsQueryPrefix } from '../pipeline-metrics-utils';
import PipelineRunTaskRunGraph from '../PipelineRunTaskRunGraph';

jest.mock('@console/internal/components/utils/k8s-get-hook', () => ({
  useK8sGet: jest.fn(),
}));

const usePipelineRunTaskRunPollSpy = jest.spyOn(hookUtils, 'usePipelineRunTaskRunPoll');

const mockData = pipelineTestData[PipelineExampleNames.WORKSPACE_PIPELINE];
const { pipeline } = mockData;

type PipelineRunTaskRunGraphProps = React.ComponentProps<typeof PipelineRunTaskRunGraph>;

describe('TaskRun Duration Graph', () => {
  let PipelineRunTaskRunGraphProps: PipelineRunTaskRunGraphProps;
  beforeEach(() => {
    PipelineRunTaskRunGraphProps = {
      pipeline,
      timespan: DEFAULT_PROMETHEUS_TIMESPAN,
      interval: parsePrometheusDuration(DEFAULT_REFRESH_INTERVAL),
      queryPrefix: MetricsQueryPrefix.TEKTON_PIPELINES_CONTROLLER,
    };
  });

  it('Should render a LoadingInline if query result is loading', () => {
    usePipelineRunTaskRunPollSpy.mockReturnValue([{ data: { result: [{ x: 'x' }] } }, false, true]);
    const PipelineRunTaskRunGraphWrapper = shallow(
      <PipelineRunTaskRunGraph {...PipelineRunTaskRunGraphProps} />,
    );
    expect(PipelineRunTaskRunGraphWrapper.find(LoadingInline).exists()).toBe(true);
  });

  it('Should render an empty state if query result is empty', () => {
    usePipelineRunTaskRunPollSpy.mockReturnValue([{ data: { result: [] } }, false, false]);
    const PipelineRunTaskRunGraphWrapper = shallow(
      <PipelineRunTaskRunGraph {...PipelineRunTaskRunGraphProps} />,
    );
    expect(PipelineRunTaskRunGraphWrapper.find(GraphEmpty).exists()).toBe(true);
  });

  it('Should render an empty state if query resulted in error', () => {
    usePipelineRunTaskRunPollSpy.mockReturnValue([{ data: { result: [] } }, true, false]);
    const PipelineRunTaskRunGraphWrapper = shallow(
      <PipelineRunTaskRunGraph {...PipelineRunTaskRunGraphProps} />,
    );
    expect(PipelineRunTaskRunGraphWrapper.find(GraphEmpty).exists()).toBe(true);
  });

  it('Should render a LineChart if data is available', () => {
    usePipelineRunTaskRunPollSpy.mockReturnValue([
      { data: { result: [{ x: Date.now(), y: 1 }] } },
      false,
      false,
    ]);
    const PipelineRunTaskRunGraphWrapper = shallow(
      <PipelineRunTaskRunGraph {...PipelineRunTaskRunGraphProps} />,
    );
    expect(PipelineRunTaskRunGraphWrapper.find(LoadingInline).exists()).toBe(false);
    expect(PipelineRunTaskRunGraphWrapper.find(GraphEmpty).exists()).toBe(false);
    expect(
      PipelineRunTaskRunGraphWrapper.find(Measure)
        .dive()
        .dive()
        .find(LineChart)
        .exists(),
    ).toBe(true);
  });
});
