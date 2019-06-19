import * as React from 'react';
import { shallow } from 'enzyme';
import { ListPage } from '@console/internal/components/factory';
import PipelinePage from '../PipelinesPage';
import PipelineRuns from '../PipelineRuns';

const pipelinePageProps = {
  namespace: 'all-namespaces',
};

const pipelineRunProps = {
  obj: {
    metadata: {
      name: 'pipeline-a',
    },
  },
};

const pipelineWrapper = shallow(<PipelinePage {...pipelinePageProps} />);
const pipelineRunWrapper = shallow(<PipelineRuns {...pipelineRunProps} />);

describe('Pipeline List', () => {
  it('Renders a list', () => {
    expect(pipelineWrapper.exists()).toBe(true);
    expect(pipelineWrapper.find(ListPage).exists());
  });

  it('List renders Pipeline resources', () => {
    expect(pipelineWrapper.exists()).toBe(true);
    expect(pipelineWrapper.find(ListPage).prop('kind')).toMatch('Pipeline');
  });

  it('List renders Pipeline namespace with all-namespaces', () => {
    expect(pipelineWrapper.find(ListPage).prop('namespace')).toBe('all-namespaces');
  });

  it('List renders Pipeline with canCreate false', () => {
    expect(pipelineWrapper.find(ListPage).prop('canCreate')).toBeFalsy();
  });

  it('List renders Pipeline with default filter', () => {
    expect(pipelineWrapper.find(ListPage).prop('rowFilters')[0].type).toEqual('pipeline-status');
    expect(pipelineWrapper.find(ListPage).prop('rowFilters')[0].items).toHaveLength(3);
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
