import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { ListPage } from '@console/internal/components/factory';
import PipelineRunsResourceList from '../PipelineRunsResourceList';

type PipelineRunsResourceListProps = React.ComponentProps<typeof PipelineRunsResourceList>;

describe('PipelineRunsResourceList:', () => {
  let pipelineRunsResourceListProps: PipelineRunsResourceListProps;
  let wrapper: ShallowWrapper<PipelineRunsResourceListProps>;

  beforeEach(() => {
    pipelineRunsResourceListProps = {
      hideBadge: false,
    };
    wrapper = shallow(<PipelineRunsResourceList {...pipelineRunsResourceListProps} />);
  });

  it('Should set the create button prop in the list page', () => {
    expect(wrapper.find(ListPage).props().canCreate).toBeTruthy();
  });

  it('Should render the badge in the list page', () => {
    wrapper.setProps({ hideBadge: false });
    expect(wrapper.find(ListPage).props().badge).not.toBeNull();
  });

  it('Should not render the badge in the list page', () => {
    wrapper.setProps({ hideBadge: true });
    expect(wrapper.find(ListPage).props().badge).toBeNull();
  });
});
