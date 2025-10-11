import { screen } from '@testing-library/react';
import { AccessDenied, EmptyBox, ConsoleEmptyState } from '..';
import { renderWithProviders } from '../../../test-utils/unit-test-utils';

describe('EmptyBox', () => {
  it('should render without label', () => {
    renderWithProviders(<EmptyBox />);
    expect(screen.getByText('Not found')).toBeVisible();
  });

  it('should render with label', () => {
    renderWithProviders(<EmptyBox label="test-label" />);
    expect(screen.getByText('No test-label found')).toBeVisible();
  });
});

describe('MsgBox', () => {
  it('should render title', () => {
    renderWithProviders(<ConsoleEmptyState title="test-title" />);
    expect(screen.getByText('test-title')).toBeVisible();
  });

  it('should render children', () => {
    renderWithProviders(<ConsoleEmptyState>test-child</ConsoleEmptyState>);
    expect(screen.getByText('test-child')).toBeVisible();
  });
});

describe('AccessDenied', () => {
  it('should render message', () => {
    renderWithProviders(<AccessDenied>test-message</AccessDenied>);
    expect(screen.getByText('test-message')).toBeVisible();
  });
});
