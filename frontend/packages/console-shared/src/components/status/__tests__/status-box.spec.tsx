import { configure, render } from '@testing-library/react';
import { useLocation } from 'react-router';
import {
  IncompleteDataError,
  TimeoutError,
} from '@console/dynamic-plugin-sdk/src/utils/error/http-error';
import { useFavoritesOptions } from '@console/internal/components/useFavoritesOptions';
import { StatusBox } from '..';

configure({ testIdAttribute: 'data-test' });

jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}));

jest.mock('react-router', () => ({
  useLocation: jest.fn(),
}));
const useFavoritesOptionsMock = useFavoritesOptions as jest.Mock;
jest.mock('@console/internal/components/useFavoritesOptions', () => ({
  useFavoritesOptions: jest.fn(),
}));
const useLocationMock = useLocation as jest.Mock;

describe('StatusBox', () => {
  it('should render 404: Page Not Found if the loadError status is 404', () => {
    useLocationMock.mockReturnValue({ pathname: '' });
    useFavoritesOptionsMock.mockReturnValue([[], jest.fn(), true]);
    const { getByText } = render(<StatusBox loadError={{ response: { status: 404 } }} />);
    getByText('404: Page Not Found');
  });

  it('should render access denied info together with the error message', () => {
    const { getByText } = render(
      <StatusBox loadError={{ message: 'test-message', response: { status: 403 } }} />,
    );

    getByText("You don't have access to this section due to cluster policy");
    getByText('test-message');
  });

  it('should render a patternfly alert together with its children when an IncompleteDataError occured', () => {
    const { getByText } = render(
      <StatusBox
        loaded
        data={[{}]}
        loadError={new IncompleteDataError(['Test', 'RedHat', 'Hello World'])}
      >
        my-children
      </StatusBox>,
    );

    getByText(
      'Test, RedHat, and Hello World content is not available in the catalog at this time due to loading failures.',
    );
    getByText('my-children');
  });

  it('should render an info together with its children when loaded and a TimeOutError ocurred', () => {
    const { getByText } = render(
      <StatusBox loaded data={[{}]} loadError={new TimeoutError('url', 346)}>
        my-children
      </StatusBox>,
    );

    getByText('Timed out fetching new data. The data below is stale.');
    getByText('my-children');
  });

  it("should render skeleton when not loaded and there's no error", () => {
    const { getByTestId } = render(<StatusBox loaded={false} />);
    getByTestId('loading-indicator');
  });

  it("should render its children when loaded and there's no error", () => {
    const { getByText } = render(
      <StatusBox loaded data={[{}]}>
        my-children
      </StatusBox>,
    );

    getByText('my-children');
  });
});
