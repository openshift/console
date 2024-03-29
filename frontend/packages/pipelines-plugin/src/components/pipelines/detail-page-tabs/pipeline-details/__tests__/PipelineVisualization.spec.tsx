import * as React from 'react';
import { Alert } from '@patternfly/react-core';
import { shallow, ShallowWrapper } from 'enzyme';
import { mockPipelinesJSON } from '../../../../../utils/__tests__/pipeline-test-data';
import PipelineTopologyGraph from '../../../pipeline-topology/PipelineTopologyGraph';
import PipelineVisualization from '../PipelineVisualization';

describe('Pipeline Visualization', () => {
  type PipelineVisualizationProps = React.ComponentProps<typeof PipelineVisualization>;
  let wrapper: ShallowWrapper<PipelineVisualizationProps>;
  beforeEach(() => {
    wrapper = shallow(<PipelineVisualization pipeline={mockPipelinesJSON[2]} />);
  });

  it('Should render pipeline Visualization component if the pipeline has inline taskSpec ', () => {
    const PipelineTopologyGraphComponent = wrapper.find(PipelineTopologyGraph);
    expect(PipelineTopologyGraphComponent).toHaveLength(1);
  });

  it('Should render a Alert message if the pipeline is null', () => {
    wrapper.setProps({ pipeline: null });
    const alert = wrapper.find(Alert);
    expect(alert).toHaveLength(1);
    expect(alert.props().title).toBe('This Pipeline has no tasks to visualize.');
  });

  it('Should render a Alert message if the pipeline does not have tasks', () => {
    wrapper.setProps({ pipeline: { ...mockPipelinesJSON[2], spec: { tasks: [] } } });
    const alert = wrapper.find(Alert);
    expect(alert).toHaveLength(1);
    expect(alert.props().title).toBe('This Pipeline has no tasks to visualize.');
  });

  it('Should render a pipeline Visualization component', () => {
    wrapper.setProps({ pipeline: mockPipelinesJSON[1] });
    const PipelineTopologyGraphComponent = wrapper.find(PipelineTopologyGraph);
    expect(PipelineTopologyGraphComponent).toHaveLength(1);
  });
});
