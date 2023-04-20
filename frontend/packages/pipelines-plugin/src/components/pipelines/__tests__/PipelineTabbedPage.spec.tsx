import * as React from 'react';
import { shallow } from 'enzyme';
import NamespacedPage from '@console/dev-console/src/components/NamespacedPage';
import CreateProjectListPage from '@console/dev-console/src/components/projects/CreateProjectListPage';
import { MultiTabListPage, useFlag, useUserSettings } from '@console/shared';
import PipelineRunsResourceList from '../../pipelineruns/PipelineRunsResourceList';
import RepositoriesList from '../../repository/list-page/RepositoriesList';
import PipelinesList from '../list-page/PipelinesList';
import PipelineTabbedPage, { PageContents } from '../PipelineTabbedPage';

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
  let PipelineTabbedPageProps: React.ComponentProps<typeof PipelineTabbedPage> = {
    history: null,
    location: null,
    match: {
      isExact: true,
      path: `/dev-pipelines/ns/:ns`,
      url: 'dev-pipelines/ns/my-project',
      params: {
        ns: 'my-project',
      },
    },
  };

  beforeAll(() => {
    mockUserSettings.mockReturnValue(['pipelines', jest.fn(), true]);
  });

  it('should render NamespacedPage', () => {
    useFlagMock.mockReturnValue(true);
    const wrapper = shallow(<PipelineTabbedPage {...PipelineTabbedPageProps} />);
    expect(wrapper.find(NamespacedPage).exists()).toBe(true);
  });

  it('should render MultiTabListPage', () => {
    useFlagMock.mockReturnValue(true);
    const wrapper = shallow(<PageContents {...PipelineTabbedPageProps} />);
    expect(wrapper.find(MultiTabListPage).exists()).toBe(true);
    expect(wrapper.find(MultiTabListPage).props().pages[0].component).toEqual(PipelinesList);
    expect(wrapper.find(MultiTabListPage).props().pages[1].component).toEqual(
      PipelineRunsResourceList,
    );
    expect(wrapper.find(MultiTabListPage).props().pages[2].component).toEqual(RepositoriesList);
  });

  it('should render only Pipelines and PipelineRuns tabs', () => {
    useFlagMock.mockReturnValue(false);
    const wrapper = shallow(<PageContents {...PipelineTabbedPageProps} />);
    expect(wrapper.find(MultiTabListPage).props().pages.length).toBe(2);
    expect(wrapper.find(MultiTabListPage).props().pages[0].component).toEqual(PipelinesList);
    expect(wrapper.find(MultiTabListPage).props().pages[1].component).toEqual(
      PipelineRunsResourceList,
    );
  });

  it('should render CreateProjectListPage', () => {
    useFlagMock.mockReturnValue(true);
    PipelineTabbedPageProps = {
      ...PipelineTabbedPageProps,
      match: {
        isExact: true,
        path: `/dev-pipelines/all-namespaces`,
        url: 'dev-pipelines/all-namespaces',
        params: {
          ns: null,
        },
      },
    };
    const wrapper = shallow(<PageContents {...PipelineTabbedPageProps} />);
    expect(wrapper.find(CreateProjectListPage).exists()).toBe(true);
  });
});
