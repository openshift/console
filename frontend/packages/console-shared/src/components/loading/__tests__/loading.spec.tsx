import { screen, render } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { LoadError } from '../LoadError';
import { Loading } from '../Loading';
import { LoadingBox } from '../LoadingBox';
import { LoadingInline } from '../LoadingInline';

const label = 'foo';
const message = 'bar';

describe('LoadError', () => {
  it('renders info with label and message', () => {
    renderWithProviders(<LoadError label={label}>{message}</LoadError>);

    expect(screen.getByText(`Error loading ${label}`)).toBeVisible();
    expect(screen.getByText(message)).toBeVisible();
  });

  it('renders info with label and without message', () => {
    renderWithProviders(<LoadError label={label} />);

    expect(screen.getByText(`Error loading ${label}`)).toBeVisible();
  });

  it('renders with retry button', () => {
    renderWithProviders(<LoadError label={label} />);

    expect(screen.getByRole('button', { name: 'Try again' })).toBeVisible();
  });

  it('renders without retry button', () => {
    renderWithProviders(<LoadError label={label} canRetry={false} />);

    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  });
});

describe('Loading', () => {
  it('renders loading indicator', () => {
    render(<Loading />);

    expect(screen.getByTestId('loading-indicator')).toBeVisible();
  });
});

describe('LoadingInline', () => {
  it('renders inline loading indicator', () => {
    render(<LoadingInline />);

    const el = screen.getByTestId('loading-indicator');
    expect(el).toBeVisible();
    expect(el).toHaveClass('co-m-loader--inline');
  });
});

describe('LoadingBox', () => {
  it('renders loading box', () => {
    render(<LoadingBox />);

    expect(screen.getByTestId('loading-indicator')).toBeVisible();
  });

  it('renders children', () => {
    render(<LoadingBox>{message}</LoadingBox>);

    expect(screen.getByText(message)).toBeVisible();
  });

  it('does not render blame info when query param disabled', () => {
    render(<LoadingBox blame={label} />);

    expect(screen.queryByText(label)).not.toBeInTheDocument();
  });
});
