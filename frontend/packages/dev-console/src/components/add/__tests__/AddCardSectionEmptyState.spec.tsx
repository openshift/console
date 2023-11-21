import * as React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AddCardSectionEmptyState from '../AddCardSectionEmptyState';

describe('AddCardSectionEmptyState', () => {
  it('should render Empty state for access error if accessError prop is true', () => {
    render(<AddCardSectionEmptyState accessCheckFailed />);
    expect(screen.getByRole('heading', { name: 'Access permissions needed' })).toBeTruthy();
  });

  it('should render Empty state for loading error if accessError prop is not truthy', () => {
    render(<AddCardSectionEmptyState />);
    expect(screen.getByRole('heading', { name: 'Unable to load' })).toBeTruthy();
  });
});
