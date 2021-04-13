import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { LoadingInline } from '@console/internal/components/utils';
import {
  DataState,
  PipelineExampleNames,
  pipelineTestData,
} from '../../../../test-data/pipeline-data';
import PipelineRunVisualization from '../PipelineRunVisualization';
import PipelineVisualization from '../../../pipelines/detail-page-tabs/pipeline-details/PipelineVisualization';

const pipelineData = pipelineTestData[PipelineExampleNames.COMPLEX_PIPELINE];
const pipelineRun = pipelineData.pipelineRuns[DataState.SUCCESS];

describe('PipelineRunVisualization', () => {
  type PipelineRunVisualizationProps = React.ComponentProps<typeof PipelineRunVisualization>;
  let wrapper: ShallowWrapper<PipelineRunVisualizationProps>;

  beforeEach(() => {
    wrapper = shallow(<PipelineRunVisualization pipelineRun={pipelineRun} />);
  });

  it('Should render the loading component if pipelinerun status is not yet resolved', () => {
    wrapper = shallow(<PipelineRunVisualization pipelineRun={{ ...pipelineRun, status: null }} />);
    const LoadingInlineComponent = wrapper.find(LoadingInline);
    expect(LoadingInlineComponent).toHaveLength(1);
  });

  it('Should render the visualization component if the pipelinerun has the graphable data', () => {
    const PipelineVisualizationComponent = wrapper.find(PipelineVisualization);
    expect(PipelineVisualizationComponent).toHaveLength(1);
  });
});
