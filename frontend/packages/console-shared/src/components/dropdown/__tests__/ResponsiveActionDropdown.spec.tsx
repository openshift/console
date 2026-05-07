import { createContext } from 'react';
import { DropdownItem } from '@patternfly/react-core';
import { render, screen } from '@testing-library/react';
import { ResponsiveActionDropdown } from '../ResponsiveActionDropdown';

// Mock OverflowMenuContext with createContext
jest.mock('@patternfly/react-core/dist/esm/components/OverflowMenu/OverflowMenuContext', () => ({
  OverflowMenuContext: createContext({ isBelowBreakpoint: false }),
}));

describe('ResponsiveActionDropdown', () => {
  const originalInnerWidth = window.innerWidth;

  beforeAll(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  afterAll(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
    jest.restoreAllMocks();
  });

  it('renders with label', () => {
    render(
      <ResponsiveActionDropdown label="Actions" data-test="test-dropdown">
        <DropdownItem>Action 1</DropdownItem>
        <DropdownItem>Action 2</DropdownItem>
      </ResponsiveActionDropdown>,
    );

    expect(screen.getByTestId('test-dropdown')).toBeInTheDocument();
  });

  it('renders in disabled state', () => {
    render(
      <ResponsiveActionDropdown label="Actions" isDisabled data-test="test-dropdown">
        <DropdownItem>Action 1</DropdownItem>
      </ResponsiveActionDropdown>,
    );

    const toggle = screen.getByTestId('test-dropdown');
    expect(toggle).toBeDisabled();
  });

  it('uses default md breakpoint', () => {
    render(
      <ResponsiveActionDropdown label="Actions" data-test="test-dropdown">
        <DropdownItem>Action 1</DropdownItem>
      </ResponsiveActionDropdown>,
    );

    // Component renders successfully with default breakpoint
    expect(screen.getByTestId('test-dropdown')).toBeInTheDocument();
  });

  it('applies custom variant prop', () => {
    render(
      <ResponsiveActionDropdown label="Actions" variant="secondary" data-test="actions-dropdown">
        <DropdownItem>Action 1</DropdownItem>
      </ResponsiveActionDropdown>,
    );

    // MenuToggle should have secondary variant class
    const toggle = screen.getByTestId('actions-dropdown');
    expect(toggle).toHaveClass('pf-m-secondary');
  });

  it('defaults to primary variant', () => {
    render(
      <ResponsiveActionDropdown label="Actions" data-test="actions-dropdown">
        <DropdownItem>Action 1</DropdownItem>
      </ResponsiveActionDropdown>,
    );

    // MenuToggle should have primary variant class
    const toggle = screen.getByTestId('actions-dropdown');
    expect(toggle).toHaveClass('pf-m-primary');
  });
});
