import { render } from '@testing-library/react';
import * as Router from 'react-router-dom-v5-compat';
import * as ConsoleShared from '@console/shared';
import EventingListPage from '../EventingListPage';
import '@testing-library/jest-dom';

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useParams: jest.fn(),
}));

jest.mock('@console/internal/components/namespace-bar', () => ({
  NamespaceBar: 'NamespaceBar',
}));

jest.mock('@console/shared', () => ({
  MultiTabListPage: jest.fn(() => 'MultiTabListPage'),
  isCatalogTypeEnabled: jest.fn(() => true),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('../brokers-list/BrokerListPage', () => ({
  __esModule: true,
  default: 'BrokerListPage',
}));

jest.mock('../channels-list/ChannelListPage', () => ({
  __esModule: true,
  default: 'ChannelListPage',
}));

jest.mock('../eventsource-list/EventSourceListPage', () => ({
  __esModule: true,
  default: 'EventSourceListPage',
}));

jest.mock('../subscription-list/SubscriptionListPage', () => ({
  __esModule: true,
  default: 'SubscriptionListPage',
}));

jest.mock('../triggers-list/TriggerListPage', () => ({
  __esModule: true,
  default: 'TriggerListPage',
}));

describe('EventingListPage', () => {
  const mockMultiTabListPage = ConsoleShared.MultiTabListPage as jest.Mock;

  beforeEach(() => {
    mockMultiTabListPage.mockClear();
    jest.spyOn(Router, 'useParams').mockReturnValue({
      ns: 'my-project',
    });
  });

  it('should render NamespaceBar and MultiTabListPage', () => {
    const wrapper = render(<EventingListPage />);
    expect(wrapper.getByText('NamespaceBar')).toBeInTheDocument();
    expect(wrapper.getByText('MultiTabListPage')).toBeInTheDocument();
  });

  it('should render MultiTabListPage with all pages and menuActions', () => {
    render(<EventingListPage />);

    expect(mockMultiTabListPage).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'knative-plugin~Eventing',
        pages: expect.arrayContaining([
          expect.objectContaining({
            component: expect.any(String),
            nameKey: expect.any(String),
            pageData: expect.objectContaining({
              namespace: 'my-project',
              canCreate: false,
              showTitle: false,
            }),
          }),
        ]),
        menuActions: expect.objectContaining({
          eventSource: expect.objectContaining({
            label: 'knative-plugin~Event Source',
            onSelection: expect.any(Function),
          }),
          brokers: expect.objectContaining({
            label: 'knative-plugin~Broker',
            onSelection: expect.any(Function),
          }),
          channels: expect.objectContaining({
            label: 'knative-plugin~Channel',
            onSelection: expect.any(Function),
          }),
        }),
        telemetryPrefix: 'Eventing',
      }),
      expect.anything(),
    );
  });

  it('should show correct url for creation for valid namespace', () => {
    render(<EventingListPage />);

    const callArgs = mockMultiTabListPage.mock.calls[0][0];
    expect(Object.keys(callArgs.menuActions ?? {})).toHaveLength(3);
    expect(callArgs.menuActions?.eventSource).toBeDefined();
    expect(
      callArgs.menuActions?.eventSource?.onSelection?.(
        'eventSource',
        { label: 'Event Source' },
        '',
      ),
    ).toEqual('/catalog/ns/my-project?catalogType=EventSource&provider=["Red+Hat"]');
  });

  it('should generate correct URL for event source creation with valid namespace', () => {
    render(<EventingListPage />);

    const callArgs = mockMultiTabListPage.mock.calls[0][0];
    const eventSourceUrl = callArgs.menuActions.eventSource.onSelection(
      'eventSource',
      { label: 'Event Source' },
      undefined,
    );

    expect(eventSourceUrl).toEqual(
      '/catalog/ns/my-project?catalogType=EventSource&provider=["Red+Hat"]',
    );
  });

  it('should generate correct URL for event source creation when namespace is undefined', () => {
    jest.spyOn(Router, 'useParams').mockReturnValue({
      ns: undefined,
    });
    render(<EventingListPage />);

    const callArgs = mockMultiTabListPage.mock.calls[0][0];
    expect(Object.keys(callArgs.menuActions)).toHaveLength(3);
    expect(callArgs.menuActions.eventSource).toBeDefined();
    expect(
      callArgs.menuActions.eventSource.onSelection(
        'eventSource',
        { label: 'Event Source' },
        undefined,
      ),
    ).toEqual('/catalog/ns/default?catalogType=EventSource&provider=["Red+Hat"]');
  });
});
