import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import * as Renderer from 'react-test-renderer';
import { PipelineVisualizationGraph } from '../PipelineVisualizationGraph';
import { PipelineVisualizationProps } from '../PipelineVisualization';
import { mockPipelineGraph } from './pipeline-visualization-test-data';
import { getPipelineTasks } from '../../../utils/pipeline-utils';
import { mockPipeline } from './pipeline-mock';
import { mockPipelineRun } from './pipelinerun-mock';

jest.mock('react-dom', () => ({
  findDOMNode: () => ({}),
  createPortal: (node) => node,
}));

jest.mock('../PipelineVisualizationTask');
describe('PipelineVisualizationGraph', () => {
  const props = {
    namespace: 'test',
    graph: mockPipelineGraph,
  };
  let wrapper: ShallowWrapper<PipelineVisualizationProps>;
  beforeEach(() => {
    wrapper = shallow(<PipelineVisualizationGraph {...props} />);
  });

  it('renders a Pipeline visualization graph', () => {
    expect(wrapper.exists()).toBeTruthy();
  });

  it('should contain right number of stages', () => {
    const noOfStages = wrapper.find('.odc-pipeline-vis-graph__stage-column').length;

    expect(noOfStages).toEqual(mockPipelineGraph.length);
  });

  it('should match the previous pipeline snapshot', () => {
    const tree = Renderer.create(<PipelineVisualizationGraph {...props} />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should match the previous pipelineRun snapshot', () => {
    const graph = getPipelineTasks(mockPipeline, mockPipelineRun);
    const tree = Renderer.create(
      <PipelineVisualizationGraph namespace={props.namespace} graph={graph} />,
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
