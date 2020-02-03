import * as React from 'react';
import { shallow } from 'enzyme';
import { referenceForModel } from '@console/internal/module/k8s';
import { ErrorPage404 } from '@console/internal/components/error';
import { DetailsPage } from '@console/internal/components/factory';
import { PipelineModel } from '../../../models';
import PipelineDetailsPage from '../PipelineDetailsPage';

const pipelineDetailsProps: React.ComponentProps<typeof PipelineDetailsPage> = {
  match: {
    isExact: true,
    path: `/k8s/ns/:ns/${referenceForModel(PipelineModel)}/:name/`,
    url: 'k8s/ns/tekton-pipelines/tekton.dev~v1alpha1~Pipeline/simple-pipeline',
    params: {
      ns: 'tekton-pipelines',
    },
  },
  kind: 'Pipeline',
};

const expectedTabs: string[] = [`Details`, `YAML`, `Pipeline Runs`, `Parameters`, `Resources`];

describe('Pipeline details page tests', () => {
  const pipelineDetailsWrapper = shallow(<PipelineDetailsPage {...pipelineDetailsProps} />);
  it('should render `DetailsPage` Component with proper page tabs', () => {
    expect(pipelineDetailsWrapper.find(DetailsPage).exists()).toBe(true);
    expect(pipelineDetailsWrapper.find(ErrorPage404).exists()).toBe(false);
    const pages = pipelineDetailsWrapper.find(DetailsPage).prop('pages');
    expectedTabs.forEach((tab, i) => {
      expect(pages[i].name).toBe(tab);
    });
  });

  it('should render `errorPage` Component ', () => {
    pipelineDetailsWrapper.setState({ errorCode: 404 });
    expect(pipelineDetailsWrapper.find(ErrorPage404).exists()).toBe(true);
    expect(pipelineDetailsWrapper.find(DetailsPage).exists()).toBe(false);
  });
});
