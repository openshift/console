import * as React from 'react';
import * as _ from 'lodash';
import { shallow, ShallowWrapper } from 'enzyme';
import { ResourceLink } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { PipelineModel, PipelineResourceModel } from '../../../../models';
import { PipelineRunDetails } from '../PipelineRunDetails';
import { mockPipelineRun } from '../../../../test/pipeline-data';
import PipelineRunVisualization from '../PipelineRunVisualization';

type PipelineRunDetailsProps = React.ComponentProps<typeof PipelineRunDetails>;
describe('PipelineRun details page', () => {
  let wrapper: ShallowWrapper<PipelineRunDetailsProps>;

  beforeEach(() => {
    wrapper = shallow(<PipelineRunDetails obj={mockPipelineRun} />);
  });

  it('should contain pipeline visualization', () => {
    expect(wrapper.find(PipelineRunVisualization).exists()).toBe(true);
    expect(wrapper.find(PipelineRunVisualization).props().pipelineRun).toBe(mockPipelineRun);
  });

  it('should render page with pipeline links', () => {
    const resources = wrapper.find(ResourceLink).filter({ kind: referenceForModel(PipelineModel) });
    expect(resources).toHaveLength(1);
    expect(resources.get(0).props.name).toBe('new-pipeline');
  });

  it('should render page with pipeline run links', () => {
    const resources = wrapper
      .find(ResourceLink)
      .filter({ kind: referenceForModel(PipelineResourceModel) });
    expect(resources).toHaveLength(2);
    expect(resources.get(0).props.name).toBe('git-hhckr7');
    expect(resources.get(1).props.name).toBe('image-2yx98v');
  });

  it('should not render page with pipeline run links if resources are empty', () => {
    const pipelineRun = _.cloneDeep(mockPipelineRun);
    pipelineRun.spec.resources = [];
    wrapper.setProps({ obj: pipelineRun });
    const resources = wrapper
      .find(ResourceLink)
      .filter({ kind: referenceForModel(PipelineResourceModel) });
    expect(resources).toHaveLength(0);
  });

  it('should not render page with pipeline run links if resources is undefined', () => {
    const pipelineRun = _.omit(_.cloneDeep(mockPipelineRun), 'spec.resources');
    wrapper.setProps({ obj: pipelineRun });
    const resources = wrapper
      .find(ResourceLink)
      .filter({ kind: referenceForModel(PipelineResourceModel) });
    expect(resources).toHaveLength(0);
  });
});
