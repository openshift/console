import * as React from 'react';
import { shallow } from 'enzyme';
import { GraphEmpty } from '@console/internal/components/graphs/graph-empty';
import { DEFAULT_PROMETHEUS_TIMESPAN } from '@console/internal/components/graphs';
import { parsePrometheusDuration } from '@console/internal/components/utils/datetime';
import { LoadingInline } from '@console/internal/components/utils';
import * as hookUtils from '../../hooks';
import { PipelineExampleNames, pipelineTestData } from '../../../../test-data/pipeline-data';
import PipelineRunCount from '../PipelineRunCount';
import { DEFAULT_REFRESH_INTERVAL } from '../../const';
import { TimeSeriesChart } from '../charts/TimeSeriesChart';

jest.mock('@console/internal/components/utils/k8s-get-hook', () => ({
  useK8sGet: jest.fn(),
}));
jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});
const pipelineRunSpy = jest.spyOn(hookUtils, 'usePipelineRunPoll');

const mockData = pipelineTestData[PipelineExampleNames.WORKSPACE_PIPELINE];
const { pipeline } = mockData;

type PipelineRunCountProps = React.ComponentProps<typeof PipelineRunCount>;

describe('Pipeline Run Count Graph', () => {
  let PipelineRunCountProps: PipelineRunCountProps;
  beforeEach(() => {
    PipelineRunCountProps = {
      pipeline,
      timespan: DEFAULT_PROMETHEUS_TIMESPAN,
      interval: parsePrometheusDuration(DEFAULT_REFRESH_INTERVAL),
    };
  });

  it('Should render an LoadingInline if query result is loading', () => {
    pipelineRunSpy.mockReturnValue([{ data: { result: [{ x: 'x' }] } }, false, true]);
    const PipelineRunCountWrapper = shallow(<PipelineRunCount {...PipelineRunCountProps} />);
    expect(PipelineRunCountWrapper.find(LoadingInline).exists()).toBe(true);
  });

  it('Should render an empty state if query result is empty', () => {
    pipelineRunSpy.mockReturnValue([{ data: { result: [] } }, false, false]);
    const PipelineRunCountWrapper = shallow(<PipelineRunCount {...PipelineRunCountProps} />);
    expect(PipelineRunCountWrapper.find(GraphEmpty).exists()).toBe(true);
  });

  it('Should render an empty state if query resulted in error', () => {
    pipelineRunSpy.mockReturnValue([{ data: { result: [] } }, true, false]);
    const PipelineRunCountWrapper = shallow(<PipelineRunCount {...PipelineRunCountProps} />);
    expect(PipelineRunCountWrapper.find(GraphEmpty).exists()).toBe(true);
  });

  it('Should render an TimeSeriesChart if data is available', () => {
    pipelineRunSpy.mockReturnValue([{ data: { result: [{ x: 'x' }] } }, false, false]);
    const PipelineRunCountWrapper = shallow(<PipelineRunCount {...PipelineRunCountProps} />);
    expect(PipelineRunCountWrapper.find(LoadingInline).exists()).toBe(false);
    expect(PipelineRunCountWrapper.find(GraphEmpty).exists()).toBe(false);
    expect(
      PipelineRunCountWrapper.dive()
        .dive()
        .find(TimeSeriesChart)
        .exists(),
    ).toBe(true);
  });
});
