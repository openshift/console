import { render } from '@testing-library/react';
import * as Router from 'react-router-dom-v5-compat';
import { useEventSinkStatus } from '../../../hooks/useEventSinkStatus';
import {
  mockKameletSink,
  mockNormalizedKafkaSink,
  mockNormalizedSink,
} from '../__mocks__/Kamelet-data';
import EventSinkPage from '../EventSinkPage';
import '@testing-library/jest-dom';

jest.mock('../../../hooks/useEventSinkStatus', () => ({
  useEventSinkStatus: jest.fn(),
}));

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useParams: jest.fn(),
  useLocation: jest.fn(),
}));

jest.mock('@console/internal/components/utils', () => ({
  LoadingBox: 'LoadingBox',
}));

jest.mock('@console/dev-console/src/components/NamespacedPage', () => ({
  __esModule: true,
  default: 'NamespacedPage',
  NamespacedPageVariants: {
    light: 'light',
  },
}));

jest.mock('@console/shared/src/components/document-title/DocumentTitle', () => ({
  DocumentTitle: 'DocumentTitle',
}));

jest.mock('@console/shared/src/components/heading/PageHeading', () => ({
  PageHeading: 'PageHeading',
}));

jest.mock('@console/dev-console/src/const', () => ({
  QUERY_PROPERTIES: {
    APPLICATION: 'application',
    CONTEXT_SOURCE: 'contextSource',
  },
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('../EventSink', () => ({
  __esModule: true,
  default: 'EventSink',
}));

jest.mock('../EventSinkAlert', () => ({
  __esModule: true,
  default: 'EventSinkAlert',
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
      hash: null,
    });
  });

  it('should show loading if resource is not loaded yet', () => {
    useEventSinkStatusMock.mockReturnValue({ isValidSink: false, loaded: false });
    const { container } = render(<EventSinkPage />);
    expect(container.querySelector('LoadingBox')).toBeInTheDocument();
    expect(container.querySelector('EventSinkAlert')).not.toBeInTheDocument();
    expect(container.querySelector('EventSink')).not.toBeInTheDocument();
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
    const { container } = render(<EventSinkPage />);
    expect(container.querySelector('EventSink')).toBeInTheDocument();
    expect(container.querySelector('EventSinkAlert')).not.toBeInTheDocument();
    expect(container.querySelector('LoadingBox')).not.toBeInTheDocument();
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
    const { container } = render(<EventSinkPage />);
    expect(container.querySelector('EventSinkAlert')).toBeInTheDocument();
    expect(container.querySelector('EventSink')).not.toBeInTheDocument();
    expect(container.querySelector('LoadingBox')).not.toBeInTheDocument();
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
      hash: null,
    });
    const { container } = render(<EventSinkPage />);
    expect(container.querySelector('EventSink')).toBeInTheDocument();
    expect(container.querySelector('EventSinkAlert')).not.toBeInTheDocument();
    expect(container.querySelector('LoadingBox')).not.toBeInTheDocument();
  });
});
