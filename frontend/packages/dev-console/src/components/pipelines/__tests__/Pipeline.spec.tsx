import * as React from 'react';
import { shallow } from 'enzyme';
import { ListPage } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import { PipelineModel } from '../../../models';
import { PipelinesPage } from '../PipelinesPage';

const pipelinePageProps = {
  history: null,
  location: null,
  match: {
    isExact: true,
    path: `/k8s/ns/:ns/${referenceForModel(PipelineModel)}`,
    url: 'k8s/ns/my-project/tekton.dev~v1alpha1~Pipeline',
    params: {
      ns: 'my-project',
    },
  },
};

const pipelineWrapper = shallow(<PipelinesPage {...pipelinePageProps} />);

describe('Pipeline List', () => {
  it('Renders a list', () => {
    expect(pipelineWrapper.exists()).toBe(true);
    expect(pipelineWrapper.find(ListPage).exists());
  });
});
