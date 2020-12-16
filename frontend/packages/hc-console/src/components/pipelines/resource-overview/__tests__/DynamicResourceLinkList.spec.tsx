import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { ResourceLink } from '@console/internal/components/utils';
import { TaskModel, ClusterTaskModel } from '../../../../models';
import DynamicResourceLinkList from '../DynamicResourceLinkList';

type ResourceLinkListProps = React.ComponentProps<typeof DynamicResourceLinkList>;
describe('DynamicResourceLinkList component', () => {
  const props: ResourceLinkListProps = {
    namespace: 'test-ns',
    title: 'Tasks',
    links: [
      { model: TaskModel, name: 'namespaced-task' },
      { model: ClusterTaskModel, name: 'cluster-task' },
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
    expect(wrapper.find(ResourceLink)).toHaveLength(2);
  });

  it('should render proper title based on the model', () => {
    expect(wrapper.find('dt').text()).toBe(props.title);
  });

  it('should render only the name when displayName is not passed', () => {
    wrapper.setProps({
      links: [{ model: TaskModel, name: 'custom-task-name' }],
    });
    expect(wrapper.find(ResourceLink).props().displayName).toBe('custom-task-name');
  });

  it('should render the custom name and displayName when displayName is passed', () => {
    wrapper.setProps({
      links: [{ model: TaskModel, name: 'custom-task-name', displayName: 'original-task-name' }],
    });
    expect(wrapper.find(ResourceLink).props().displayName).toBe(
      'custom-task-name (original-task-name)',
    );
  });

  it('should not render the custom name and displayName when displayName is matched', () => {
    wrapper.setProps({
      links: [{ model: TaskModel, name: 'custom-task-name', displayName: 'custom-task-name' }],
    });
    const { displayName } = wrapper.find(ResourceLink).props();
    expect(displayName).not.toBe('custom-task-name (custom-task-name)');
    expect(displayName).toBe('custom-task-name');
  });
});
