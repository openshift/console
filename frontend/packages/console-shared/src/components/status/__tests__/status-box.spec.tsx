import { render, screen } from '@testing-library/react';
import { useLocation } from 'react-router';
import {
  IncompleteDataError,
  TimeoutError,
} from '@console/dynamic-plugin-sdk/src/utils/error/http-error';
import { useFavoritesOptions } from '@console/internal/components/useFavoritesOptions';
import { StatusBox } from '..';

jest.mock('react-router', () => ({
  useLocation: jest.fn(),
  useNavigate: jest.fn(),
}));

const useFavoritesOptionsMock = useFavoritesOptions as jest.Mock;
jest.mock('@console/internal/components/useFavoritesOptions', () => ({
  useFavoritesOptions: jest.fn(),
}));
const useLocationMock = useLocation as jest.Mock;

describe('StatusBox', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders 404: Page Not Found when loadError status is 404', () => {
    useLocationMock.mockReturnValue({ pathname: '' });
    useFavoritesOptionsMock.mockReturnValue([[], jest.fn(), true]);
    render(<StatusBox loadError={{ response: { status: 404 } }} />);

    expect(screen.getByText('404: Page Not Found')).toBeVisible();
  });

  it('renders access denied info together with the error message', () => {
    render(<StatusBox loadError={{ message: 'test-message', response: { status: 403 } }} />);

    expect(
      screen.getByText("You don't have access to this section due to cluster policy"),
    ).toBeVisible();
    expect(screen.getByText('test-message')).toBeVisible();
  });

  it('renders a PatternFly alert with children when IncompleteDataError occurs', () => {
    render(
      <StatusBox
        loaded
        data={[{}]}
        loadError={new IncompleteDataError(['Test', 'RedHat', 'Hello World'])}
      >
        my-children
      </StatusBox>,
    );

    expect(
      screen.getByText(
        'Test, RedHat, and Hello World content is not available in the catalog at this time due to loading failures.',
      ),
    ).toBeVisible();
    expect(screen.getByText('my-children')).toBeVisible();
  });

  it('renders stale-data info with children when loaded and TimeoutError occurs', () => {
    render(
      <StatusBox loaded data={[{}]} loadError={new TimeoutError('url', 346)}>
        my-children
      </StatusBox>,
    );

    expect(screen.getByText('Timed out fetching new data. The data below is stale.')).toBeVisible();
    expect(screen.getByText('my-children')).toBeVisible();
  });

  it('renders skeleton when not loaded and there is no error', () => {
    render(<StatusBox loaded={false} />);

    expect(screen.getByTestId('loading-indicator')).toBeVisible();
  });

  it('renders children when loaded and there is no error', () => {
    render(
      <StatusBox loaded data={[{}]}>
        my-children
      </StatusBox>,
    );

    expect(screen.getByText('my-children')).toBeVisible();
  });
});
