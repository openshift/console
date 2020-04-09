import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { PipelineModel } from '../../../../models';
import ResourceLinkList from '../ResourceLinkList';
import { ResourceLink } from '@console/internal/components/utils';

type ResourceLinkListProps = React.ComponentProps<typeof ResourceLinkList>;
describe('PipelineResourceSection component', () => {
  const props = {
    namespace: 'test-ns',
    model: PipelineModel,
    links: ['one', 'two', 'three'],
  };

  let wrapper: ShallowWrapper<ResourceLinkListProps>;
  beforeEach(() => {
    wrapper = shallow(<ResourceLinkList {...props} />);
  });

  it('should not render the children if links are empty', () => {
    wrapper.setProps({ links: [] });
    expect(wrapper.find(ResourceLink)).toHaveLength(0);
  });

  it('should render resourceLinks if the links are passed', () => {
    expect(wrapper.find(ResourceLink)).toHaveLength(3);
  });

  it('should render proper title based on the model', () => {
    expect(wrapper.find('dt').text()).toBe(PipelineModel.labelPlural);
  });
});
