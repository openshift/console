import * as React from 'react';
import { shallow } from 'enzyme';
import * as Router from 'react-router-dom-v5-compat';
import NamespacedPage from '@console/dev-console/src/components/NamespacedPage';
import CreateProjectListPage from '@console/dev-console/src/components/projects/CreateProjectListPage';
import { MultiTabListPage, useFlag, useUserSettings } from '@console/shared';
import PipelineRunsResourceList from '../../pipelineruns/PipelineRunsResourceList';
import RepositoriesList from '../../repository/list-page/RepositoriesList';
import PipelinesList from '../list-page/PipelinesList';
import PipelineTabbedPage, { PageContents } from '../PipelineTabbedPage';

jest.mock('react-router-dom-v5-compat', () => ({
  ...require.requireActual('react-router-dom-v5-compat'),
  useParams: jest.fn(),
  useLocation: jest.fn(),
  useNavigate: jest.fn(),
}));

jest.mock('@console/shared', () => {
  const originalModule = (jest as any).requireActual('@console/shared');
  return {
    ...originalModule,
    useFlag: jest.fn<boolean>(),
  };
});

jest.mock('@console/shared/src/hooks/useUserSettings', () => ({
  useUserSettings: jest.fn(),
}));

const useFlagMock = useFlag as jest.Mock;

const mockUserSettings = useUserSettings as jest.Mock;

describe('PipelineTabbedPage', () => {
  beforeAll(() => {
    jest.spyOn(Router, 'useParams').mockReturnValue({
      ns: 'my-project',
    });
    jest.spyOn(Router, 'useLocation').mockReturnValue({ pathname: 'dev-pipelines/ns/my-project' });
    mockUserSettings.mockReturnValue(['pipelines', jest.fn(), true]);
  });

  it('should render NamespacedPage', () => {
    useFlagMock.mockReturnValue(true);
    const wrapper = shallow(<PipelineTabbedPage />);
    expect(wrapper.find(NamespacedPage).exists()).toBe(true);
  });

  it('should render MultiTabListPage', () => {
    useFlagMock.mockReturnValue(true);
    const wrapper = shallow(<PageContents />);
    expect(wrapper.find(MultiTabListPage).exists()).toBe(true);
    expect(wrapper.find(MultiTabListPage).props().pages[0].component).toEqual(PipelinesList);
    expect(wrapper.find(MultiTabListPage).props().pages[1].component).toEqual(
      PipelineRunsResourceList,
    );
    expect(wrapper.find(MultiTabListPage).props().pages[2].component).toEqual(RepositoriesList);
  });

  it('should render only Pipelines and PipelineRuns tabs', () => {
    useFlagMock.mockReturnValue(false);
    const wrapper = shallow(<PageContents />);
    expect(wrapper.find(MultiTabListPage).first().props().pages.length).toBe(2);
    expect(wrapper.find(MultiTabListPage).props().pages[0].component).toEqual(PipelinesList);
    expect(wrapper.find(MultiTabListPage).props().pages[1].component).toEqual(
      PipelineRunsResourceList,
    );
  });

  it('should render CreateProjectListPage', () => {
    useFlagMock.mockReturnValue(true);
    jest.spyOn(Router, 'useParams').mockReturnValue({
      ns: null,
    });
    jest.spyOn(Router, 'useLocation').mockReturnValue({ pathname: 'dev-pipelines/all-namespaces' });
    const wrapper = shallow(<PageContents />);
    expect(wrapper.find(CreateProjectListPage).exists()).toBe(true);
  });
});
