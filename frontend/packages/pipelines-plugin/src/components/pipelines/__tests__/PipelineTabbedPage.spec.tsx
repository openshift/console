import * as React from 'react';
import { shallow } from 'enzyme';
import NamespacedPage from '@console/dev-console/src/components/NamespacedPage';
import CreateProjectListPage from '@console/dev-console/src/components/projects/CreateProjectListPage';
import { useFlag } from '@console/dynamic-plugin-sdk';
import { MultiTabListPage } from '@console/shared';
import { PipelinesPage } from '../PipelinesPage';
import PipelineTabbedPage, { PageContents } from '../PipelineTabbedPage';

jest.mock('@console/shared', () => {
  const originalModule = (jest as any).requireActual('@console/shared');
  return {
    ...originalModule,
    useFlag: jest.fn<boolean>(),
  };
});

const useFlagMock = useFlag as jest.Mock;

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

  it('should render NamespacedPage', () => {
    useFlagMock.mockReturnValue(true);
    const wrapper = shallow(<PipelineTabbedPage {...PipelineTabbedPageProps} />);
    expect(wrapper.find(NamespacedPage).exists()).toBe(true);
  });

  it('should render PipelinesPage', () => {
    useFlagMock.mockReturnValue(false);
    const wrapper = shallow(<PageContents {...PipelineTabbedPageProps} />);
    expect(wrapper.find(PipelinesPage).exists()).toBe(true);
  });

  it('should render MultiTabListPage', () => {
    useFlagMock.mockReturnValue(true);
    const wrapper = shallow(<PageContents {...PipelineTabbedPageProps} />);
    expect(wrapper.find(MultiTabListPage).exists()).toBe(true);
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
