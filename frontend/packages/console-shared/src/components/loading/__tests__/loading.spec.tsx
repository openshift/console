import * as React from 'react';
import { configure, render } from '@testing-library/react';
import { LoadError } from '../LoadError';
import { Loading } from '../Loading';
import { LoadingBox } from '../LoadingBox';
import { LoadingInline } from '../LoadingInline';
import '@testing-library/jest-dom';

configure({ testIdAttribute: 'data-test' });
const label = 'foo';
const message = 'bar';

describe('LoadError', () => {
  it('should render info with label and message', () => {
    const { getByText } = render(<LoadError label={label}>{message}</LoadError>);
    getByText(`Error loading ${label}`);
    getByText(message);
  });

  it('should render info with label and without message', () => {
    const { getByText } = render(<LoadError label={label} />);
    getByText(`Error loading ${label}`);
  });

  it('should render with retry button', () => {
    const { getByText } = render(<LoadError label={label} />);
    getByText('Try again');
  });

  it('should render without retry button', () => {
    const { queryByText } = render(<LoadError label={label} canRetry={false} />);
    expect(queryByText('Try again')).toBeNull();
  });
});

describe('Loading', () => {
  it('should render loading indicator', () => {
    const { getByTestId } = render(<Loading />);
    getByTestId('loading-indicator');
  });
});

describe('LoadingInline', () => {
  it('should render inline loading indicator', async () => {
    const { getByTestId } = render(<LoadingInline />);
    const el = await getByTestId('loading-indicator');
    expect(el).toHaveClass('co-m-loader--inline');
  });
});

describe('LoadingBox', () => {
  it('should render loading box', () => {
    const { getByTestId } = render(<LoadingBox />);
    getByTestId('loading-indicator');
  });

  it('should render children', () => {
    const { getByText } = render(<LoadingBox>{message}</LoadingBox>);
    getByText(message);
  });
});
