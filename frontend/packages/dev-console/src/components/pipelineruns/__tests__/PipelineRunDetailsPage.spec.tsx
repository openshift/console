import * as React from 'react';
import { shallow } from 'enzyme';
import { referenceForModel } from '@console/internal/module/k8s';
import { PipelineRunModel } from '../../../models';
import PipelineRunDetailsPage from '../PipelineRunDetailsPage';

const pipelineRunDetailsProps: React.ComponentProps<typeof PipelineRunDetailsPage> = {
  match: {
    isExact: true,
    path: `/k8s/ns/:ns/${referenceForModel(PipelineRunModel)}/:name/`,
    url: 'k8s/ns/tekton-pipelines/tekton.dev~v1alpha1~PipelineRun/simple-pipeline-6wjqqw',
    params: {
      ns: 'tekton-pipelines',
    },
  },
  kind: 'PipelineRun',
};

const expectedTabs: string[] = [`Details`, `YAML`, `Logs`];

describe('PipelineRun details page tests', () => {
  it('should render `DetailsPage` Component with proper page tabs', () => {
    const pipelineRunDetailsWrapper = shallow(
      <PipelineRunDetailsPage {...pipelineRunDetailsProps} />,
    );
    const pages = pipelineRunDetailsWrapper.find('DetailsPage').prop('pages');
    expect(pipelineRunDetailsWrapper.find('DetailsPage').exists()).toBe(true);
    expectedTabs.forEach((tab, i) => {
      expect(pages[i].name).toBe(tab);
    });
  });
});
