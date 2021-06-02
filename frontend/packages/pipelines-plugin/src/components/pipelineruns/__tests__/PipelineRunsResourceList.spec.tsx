import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { shallow, ShallowWrapper } from 'enzyme';
import { ListPage } from '@console/internal/components/factory';
import { PIPELINE_GA_VERSION } from '../../pipelines/const';
import * as operatorUtils from '../../pipelines/utils/pipeline-operator';
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
    jest.spyOn(operatorUtils, 'usePipelineOperatorVersion').mockReturnValue({ version: '1.3.1' });
  });

  it('Should render the badge in the list page', () => {
    wrapper.setProps({ hideBadge: false });
    expect(wrapper.find(ListPage).props().badge).not.toBeNull();
  });

  it('Should not render the badge in the list page', () => {
    wrapper.setProps({ hideBadge: true });
    expect(wrapper.find(ListPage).props().badge).toBeNull();
  });

  it('Should not render the badge in the list page if the pipeline GA operator is installed', () => {
    jest
      .spyOn(operatorUtils, 'usePipelineOperatorVersion')
      .mockReturnValue({ version: PIPELINE_GA_VERSION });
    wrapper.setProps({ hideBadge: false });
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
