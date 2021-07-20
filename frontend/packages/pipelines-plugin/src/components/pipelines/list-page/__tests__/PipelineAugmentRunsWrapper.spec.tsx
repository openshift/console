import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { ListPageWrapper } from '@console/internal/components/factory';
import { EmptyBox, LoadingBox } from '@console/internal/components/utils';
import { PipelineExampleNames, pipelineTestData } from '../../../../test-data/pipeline-data';
import PipelineAugmentRunsWrapper from '../PipelineAugmentRunsWrapper';

const mockData = pipelineTestData[PipelineExampleNames.WORKSPACE_PIPELINE];
const { pipeline } = mockData;

type PipelineAugmentRunsWrapperProps = React.ComponentProps<typeof PipelineAugmentRunsWrapper>;

describe('Pipeline Augment Run Wrapper', () => {
  let pipelineAugmentRunsWrapperProps: PipelineAugmentRunsWrapperProps;
  let wrapper: ShallowWrapper;
  beforeEach(() => {
    pipelineAugmentRunsWrapperProps = {
      pipeline: {
        data: [pipeline],
        loaded: false,
      },
    };
    wrapper = shallow(<PipelineAugmentRunsWrapper {...pipelineAugmentRunsWrapperProps} />);
  });

  it('Should render loader if data not yet loaded', () => {
    expect(wrapper.find(LoadingBox).exists()).toBeTruthy();
  });

  it('Should render the EmptyBox if the data is empty', () => {
    wrapper.setProps({ pipeline: { data: [], loaded: true } });
    expect(wrapper.find(EmptyBox).exists()).toBeTruthy();
  });

  it('Should render ListpageWrapper if the pipeline data is loaded and available', () => {
    wrapper.setProps({ pipeline: { data: [pipeline], loaded: true } });
    expect(wrapper.find(ListPageWrapper).exists()).toBeTruthy();
  });
});
