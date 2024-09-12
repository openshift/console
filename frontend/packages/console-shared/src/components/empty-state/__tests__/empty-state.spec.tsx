import * as React from 'react';
import { configure, render } from '@testing-library/react';
import { AccessDenied, EmptyBox, ConsoleEmptyState } from '..';

configure({ testIdAttribute: 'data-test' });

describe('EmptyBox', () => {
  it('should render without label', () => {
    const { getByText } = render(<EmptyBox />);
    getByText('Not found');
  });

  it('should render with label', () => {
    const { getByText } = render(<EmptyBox label="test-label" />);
    getByText('No test-label found');
  });
});

describe('MsgBox', () => {
  it('should render title', () => {
    const { getByText } = render(<ConsoleEmptyState title="test-title" />);
    getByText('test-title');
  });

  it('should render children', () => {
    const { getByText } = render(<ConsoleEmptyState>test-child</ConsoleEmptyState>);
    getByText('test-child');
  });
});

describe('AccessDenied', () => {
  it('should render message', () => {
    const { getByText } = render(<AccessDenied>test-message</AccessDenied>);
    getByText('test-message');
  });
});
