import * as React from 'react';
import { shallow } from 'enzyme';
import { ListPage } from '@console/internal/components/factory';
import { PipelinesPage } from '../PipelinesPage';
import PipelineRuns from '../PipelineRuns';

const pipelinePageProps = {
  namespace: 'my-project',
  perspective: 'dev',
};

const pipelineRunProps = {
  obj: {
    metadata: {
      name: 'pipeline-a',
    },
  },
};

const pipelineWrapper = shallow(<PipelinesPage {...pipelinePageProps} />);
const pipelineRunWrapper = shallow(<PipelineRuns {...pipelineRunProps} />);

describe('Pipeline List', () => {
  it('Renders a list', () => {
    expect(pipelineWrapper.exists()).toBe(true);
    expect(pipelineWrapper.find(ListPage).exists());
  });
});

describe('Pipeline Run List', () => {
  it('Renders a list', () => {
    expect(pipelineRunWrapper.exists()).toBe(true);
    expect(pipelineRunWrapper.find(ListPage).exists());
  });

  it('List renders PipelineRun resources', () => {
    expect(pipelineRunWrapper.exists()).toBe(true);
    expect(pipelineRunWrapper.find(ListPage).prop('kind')).toMatch('PipelineRun');
  });
});
