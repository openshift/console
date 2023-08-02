import * as React from 'react';
import { shallow } from 'enzyme';
import * as Router from 'react-router-dom-v5-compat';
import CreateProjectListPage from '@console/dev-console/src/components/projects/CreateProjectListPage';
import { PipelinesPage } from '../PipelinesPage';
import PipelinesResourceList from '../PipelinesResourceList';

jest.mock('react-router-dom-v5-compat', () => ({
  ...require.requireActual('react-router-dom-v5-compat'),
  useParams: jest.fn(),
  useLocation: jest.fn(),
}));

describe('Pipeline List', () => {
  it('Should render a PipelineResourcelist', () => {
    jest.spyOn(Router, 'useParams').mockReturnValue({
      ns: 'my-project',
    });
    const pipelineWrapperNS = shallow(<PipelinesPage />);
    expect(pipelineWrapperNS.find(PipelinesResourceList).exists()).toBe(true);
  });

  it('Should render ProjecListPage when no namespace is selected', () => {
    jest.spyOn(Router, 'useParams').mockReturnValue({
      ns: undefined,
    });
    const pipelineWrapperWNS = shallow(<PipelinesPage />);
    expect(pipelineWrapperWNS.find(CreateProjectListPage).exists()).toBe(true);
  });
});
