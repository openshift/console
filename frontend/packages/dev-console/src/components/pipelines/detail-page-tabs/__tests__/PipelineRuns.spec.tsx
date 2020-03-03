import * as React from 'react';
import { ListPage } from '@console/internal/components/factory';
import { shallow } from 'enzyme';
import PipelineRuns from '../PipelineRuns';

const pipelineRunProps: React.ComponentProps<typeof PipelineRuns> = {
  obj: {
    metadata: {
      name: 'pipeline-a',
    },
  },
};

const pipelineRunWrapper = shallow(<PipelineRuns {...pipelineRunProps} />);

describe('Pipeline Run List', () => {
  it('Renders a list', () => {
    expect(pipelineRunWrapper.find(ListPage).exists());
  });

  it('List renders PipelineRun resources', () => {
    expect(pipelineRunWrapper.find(ListPage).prop('kind')).toMatch('PipelineRun');
  });
});
