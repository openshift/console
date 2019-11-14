import * as React from 'react';
import { shallow } from 'enzyme';
import { ListPage } from '@console/internal/components/factory';
import { PipelinesPage } from '../PipelinesPage';

const pipelinePageProps = {
  namespace: 'my-project',
  perspective: 'dev',
};

const pipelineWrapper = shallow(<PipelinesPage {...pipelinePageProps} />);

describe('Pipeline List', () => {
  it('Renders a list', () => {
    expect(pipelineWrapper.exists()).toBe(true);
    expect(pipelineWrapper.find(ListPage).exists());
  });
});
