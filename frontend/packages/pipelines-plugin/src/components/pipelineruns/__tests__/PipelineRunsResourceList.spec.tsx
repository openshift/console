import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { Button } from '@patternfly/react-core';
import { ListPage } from '@console/internal/components/factory';
import PipelineRunsResourceList from '../PipelineRunsResourceList';

type PipelineRunsResourceListProps = React.ComponentProps<typeof PipelineRunsResourceList>;

describe('PipelineRunsResourceList:', () => {
  let pipelineRunsResourceListProps: PipelineRunsResourceListProps;
  let wrapper: ShallowWrapper<PipelineRunsResourceListProps>;

  beforeEach(() => {
    pipelineRunsResourceListProps = {
      hideBadge: false,
      canCreate: false,
    };
    wrapper = shallow(<PipelineRunsResourceList {...pipelineRunsResourceListProps} />);
  });

  it('Should render the badge in the list page', () => {
    wrapper.setProps({ hideBadge: false });
    expect(wrapper.find(ListPage).props().badge).not.toBeNull();
  });

  it('Should not render the badge in the list page', () => {
    wrapper.setProps({ hideBadge: true });
    expect(wrapper.find(ListPage).props().badge).toBeNull();
  });

  it('Should not render the create button in the list page', () => {
    expect(wrapper.find(Button).exists()).toBe(false);
  });

  it('Should render the create button in the list page', () => {
    wrapper.setProps({ canCreate: true });
    expect(wrapper.find(Button).exists()).toBe(false);
  });
});
