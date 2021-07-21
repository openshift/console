import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { NamespaceBar } from '@console/internal/components/namespace';
import { MultiTabListPage } from '@console/shared';
import EventingListPage from '../EventingListPage';

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

let eventingListPageProps: React.ComponentProps<typeof EventingListPage>;
let wrapper: ShallowWrapper;
const i18nNS = 'knative-plugin';

describe('EventingListPage', () => {
  beforeEach(() => {
    eventingListPageProps = {
      match: {
        isExact: true,
        path: '/eventing/ns/:ns',
        url: 'eventing/ns/my-project',
        params: {
          ns: 'my-project',
        },
      },
    };
    wrapper = shallow(<EventingListPage {...eventingListPageProps} />);
  });

  it('should render NamespaceBar and MultiTabListPage', () => {
    expect(wrapper.find(NamespaceBar)).toHaveLength(1);
    expect(wrapper.find(MultiTabListPage)).toHaveLength(1);
  });

  it('should render MultiTabListPage with all pages and menuActions', () => {
    const multiTablistPage = wrapper.find(MultiTabListPage);
    expect(multiTablistPage.props().title).toEqual(`${i18nNS}~Eventing`);
    expect(multiTablistPage.props().pages).toHaveLength(5);
    expect(Object.keys(multiTablistPage.props().menuActions)).toHaveLength(3);
    expect(multiTablistPage.props().menuActions.eventSource).toBeDefined();
  });

  it('should show correct url for creation for valid namespace', () => {
    const multiTablistPage = wrapper.find(MultiTabListPage);
    expect(Object.keys(multiTablistPage.props().menuActions)).toHaveLength(3);
    expect(multiTablistPage.props().menuActions.eventSource).toBeDefined();
    expect(
      multiTablistPage
        .props()
        .menuActions.eventSource.onSelection('eventSource', { label: 'Event Source' }, undefined),
    ).toEqual('/catalog/ns/my-project?catalogType=EventSource&provider=["Red+Hat"]');
  });

  it('should show correct url for creation if namespace is not defined', () => {
    eventingListPageProps = {
      match: {
        isExact: true,
        path: '/eventing/all-namespaces',
        url: 'eventing/all-namespaces',
        params: {
          ns: undefined,
        },
      },
    };
    wrapper = shallow(<EventingListPage {...eventingListPageProps} />);
    const multiTablistPage = wrapper.find(MultiTabListPage);
    expect(Object.keys(multiTablistPage.props().menuActions)).toHaveLength(3);
    expect(multiTablistPage.props().menuActions.eventSource).toBeDefined();
    expect(
      multiTablistPage
        .props()
        .menuActions.eventSource.onSelection('eventSource', { label: 'Event Source' }, undefined),
    ).toEqual('/catalog/ns/default?catalogType=EventSource&provider=["Red+Hat"]');
  });
});
