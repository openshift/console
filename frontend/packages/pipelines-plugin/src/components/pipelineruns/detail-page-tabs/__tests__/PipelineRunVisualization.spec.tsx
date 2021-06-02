import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { LoadingInline } from '@console/internal/components/utils';
import {
  DataState,
  PipelineExampleNames,
  pipelineTestData,
} from '../../../../test-data/pipeline-data';
import PipelineVisualization from '../../../pipelines/detail-page-tabs/pipeline-details/PipelineVisualization';
import * as plrDetailsHooks from '../../hooks/usePipelineFromPipelineRun';
import PipelineRunVisualization from '../PipelineRunVisualization';

const pipelineData = pipelineTestData[PipelineExampleNames.COMPLEX_PIPELINE];
const pipelineRun = pipelineData.pipelineRuns[DataState.SUCCESS];

describe('PipelineRunVisualization', () => {
  type PipelineRunVisualizationProps = React.ComponentProps<typeof PipelineRunVisualization>;
  let wrapper: ShallowWrapper<PipelineRunVisualizationProps>;
  const usePipelineFromPipelineRunSpy = jest.spyOn(plrDetailsHooks, 'usePipelineFromPipelineRun');

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('Should render the loading component if pipeline from pipeline run is not defined or null', () => {
    usePipelineFromPipelineRunSpy.mockReturnValueOnce(null);
    wrapper = shallow(<PipelineRunVisualization pipelineRun={pipelineRun} />);
    const LoadingInlineComponent = wrapper.find(LoadingInline);
    expect(LoadingInlineComponent.exists()).toBe(true);
  });

  it('Should render the visualization component if the pipelinerun has the graphable data', () => {
    usePipelineFromPipelineRunSpy.mockReturnValueOnce(pipelineData.pipeline);
    wrapper = shallow(<PipelineRunVisualization pipelineRun={pipelineRun} />);
    const PipelineVisualizationComponent = wrapper.find(PipelineVisualization);
    expect(PipelineVisualizationComponent.exists()).toBe(true);
  });
});
