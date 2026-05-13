import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import * as Router from 'react-router';
import { useEventSinkStatus } from '../../../hooks/useEventSinkStatus';
import {
  mockKameletSink,
  mockNormalizedKafkaSink,
  mockNormalizedSink,
} from '../__mocks__/Kamelet-data';
import EventSinkPage from '../EventSinkPage';

jest.mock('../../../hooks/useEventSinkStatus', () => ({
  useEventSinkStatus: jest.fn(),
}));

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useParams: jest.fn(),
  useLocation: jest.fn(),
}));

jest.mock('@console/internal/components/utils', () => ({
  LoadingBox: () => 'mock-LoadingBox',
}));

jest.mock('@console/dev-console/src/components/NamespacedPage', () => ({
  __esModule: true,
  default: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  NamespacedPageVariants: {
    light: 'light',
  },
}));

jest.mock('@console/shared/src/components/document-title/DocumentTitle', () => ({
  DocumentTitle: ({ children }: { children?: ReactNode }) => <span>{children}</span>,
}));

jest.mock('@console/shared/src/components/heading/PageHeading', () => ({
  PageHeading: () => <div />,
}));

jest.mock('@console/dev-console/src/const', () => ({
  QUERY_PROPERTIES: {
    APPLICATION: 'application',
    CONTEXT_SOURCE: 'contextSource',
  },
}));

jest.mock('react-i18next');

jest.mock('../EventSink', () => ({
  __esModule: true,
  default: () => 'mock-EventSink',
}));

jest.mock('../EventSinkAlert', () => ({
  __esModule: true,
  default: () => 'mock-EventSinkAlert',
}));

const useEventSinkStatusMock = useEventSinkStatus as jest.Mock;

describe('EventSinkPage', () => {
  beforeEach(() => {
    jest.spyOn(Router, 'useParams').mockReturnValue({
      ns: 'my-app',
    });
    jest.spyOn(Router, 'useLocation').mockReturnValue({
      pathname: '/catalog/ns/my-app/eventsink?sinkKind=KameletBinding&name=log-sink',
      search: '/catalog/ns/my-app/eventsink?sinkKind=KameletBinding&name=log-sink',
      state: null,
      hash: '',
      key: 'default',
      unstable_mask: undefined,
    });
  });

  it('should show loading if resource is not loaded yet', () => {
    useEventSinkStatusMock.mockReturnValue({ isValidSink: false, loaded: false });
    render(<EventSinkPage />);
    expect(screen.getByText('mock-LoadingBox')).toBeVisible();
    expect(screen.queryByText('mock-EventSinkAlert')).not.toBeInTheDocument();
    expect(screen.queryByText('mock-EventSink')).not.toBeInTheDocument();
  });

  it('should render EventSink if resource is loaded and is valid', () => {
    useEventSinkStatusMock.mockReturnValue({
      isValidSink: true,
      loaded: true,
      createSinkAccessLoading: false,
      createSinkAccess: true,
      normalizedSink: mockNormalizedSink,
      kamelet: mockKameletSink,
    });
    render(<EventSinkPage />);
    expect(screen.getByText('mock-EventSink')).toBeVisible();
    expect(screen.queryByText('mock-EventSinkAlert')).not.toBeInTheDocument();
    expect(screen.queryByText('mock-LoadingBox')).not.toBeInTheDocument();
  });

  it('should render EventSinkAlert if resource is loaded but user doesnot have create access', () => {
    useEventSinkStatusMock.mockReturnValue({
      isValidSink: true,
      loaded: true,
      createSinkAccessLoading: false,
      createSinkAccess: false,
      normalizedSink: mockNormalizedSink,
      kamelet: mockKameletSink,
    });
    render(<EventSinkPage />);
    expect(screen.getByText('mock-EventSinkAlert')).toBeVisible();
    expect(screen.queryByText('mock-EventSink')).not.toBeInTheDocument();
    expect(screen.queryByText('mock-LoadingBox')).not.toBeInTheDocument();
  });

  it('should render EventSink if resource is loaded and is valid for kafka sink', () => {
    useEventSinkStatusMock.mockReturnValue({
      isValidSink: true,
      loaded: true,
      createSinkAccessLoading: false,
      createSinkAccess: true,
      normalizedSink: mockNormalizedKafkaSink,
      kamelet: null,
    });
    jest.spyOn(Router, 'useParams').mockReturnValue({
      ns: 'my-app',
    });
    jest.spyOn(Router, 'useLocation').mockReturnValue({
      pathname: '/catalog/ns/my-app/eventsink?sinkKind=KafkaSink',
      search: '/catalog/ns/my-app/eventsink?sinkKind=KafkaSink',
      state: null,
      hash: '',
      key: 'default',
      unstable_mask: undefined,
    });
    render(<EventSinkPage />);
    expect(screen.getByText('mock-EventSink')).toBeVisible();
    expect(screen.queryByText('mock-EventSinkAlert')).not.toBeInTheDocument();
    expect(screen.queryByText('mock-LoadingBox')).not.toBeInTheDocument();
  });
});
