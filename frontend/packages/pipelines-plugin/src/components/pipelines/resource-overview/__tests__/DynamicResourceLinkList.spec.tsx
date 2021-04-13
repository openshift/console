import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { TaskModel, ClusterTaskModel } from '../../../../models';
import PipelineResourceRef from '../../../shared/common/PipelineResourceRef';
import DynamicResourceLinkList from '../DynamicResourceLinkList';

type ResourceLinkListProps = React.ComponentProps<typeof DynamicResourceLinkList>;
describe('DynamicResourceLinkList component', () => {
  const props: ResourceLinkListProps = {
    namespace: 'test-ns',
    title: 'Tasks',
    links: [
      { resourceKind: TaskModel.kind, name: 'namespaced-task' },
      { resourceKind: ClusterTaskModel.kind, name: 'cluster-task' },
    ],
  };

  let wrapper: ShallowWrapper<ResourceLinkListProps>;
  beforeEach(() => {
    wrapper = shallow(<DynamicResourceLinkList {...props} />);
  });

  it('should not render the children if links are empty', () => {
    wrapper.setProps({ links: [] });
    expect(wrapper.isEmptyRender()).toBe(true);
  });

  it('should render resourceLinks if the links are passed', () => {
    expect(wrapper.find(PipelineResourceRef)).toHaveLength(2);
  });

  it('should render proper title based on the model', () => {
    expect(wrapper.find('dt').text()).toBe(props.title);
  });
});
