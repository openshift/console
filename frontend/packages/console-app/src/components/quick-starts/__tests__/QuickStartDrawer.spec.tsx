import type { QuickStart } from '@patternfly/quickstarts';
import { render, screen } from '@testing-library/react';
import { QuickStartDrawer } from '../QuickStartDrawer';

jest.mock('@patternfly/quickstarts', () => ({
  QuickStartDrawer: jest.fn(
    ({ quickStarts, children }: { quickStarts: QuickStart[]; children?: React.ReactNode }) => [
      quickStarts.map((qs) => qs.spec.displayName).join(', '),
      children,
    ],
  ),
}));

jest.mock('../loader/QuickStartsLoader', () => ({
  QuickStartsLoader: ({ children }: { children: (quickStarts: QuickStart[]) => React.ReactNode }) =>
    children([
      {
        apiVersion: 'console.openshift.io/v1',
        kind: 'QuickStart',
        metadata: { name: 'test-qs-1' },
        spec: {
          displayName: 'Test 1',
          description: 'Test',
          durationMinutes: 5,
          introduction: '',
          tasks: [],
        },
      },
      {
        apiVersion: 'console.openshift.io/v1',
        kind: 'QuickStart',
        metadata: { name: 'test-qs-2' },
        spec: {
          displayName: 'Test 2',
          description: 'Test',
          durationMinutes: 10,
          introduction: '',
          tasks: [],
        },
      },
    ] as QuickStart[]),
}));

describe('QuickStartDrawer', () => {
  it('should render children inside the drawer', () => {
    render(
      <QuickStartDrawer>
        <div>Child Content</div>
      </QuickStartDrawer>,
    );

    expect(screen.getByText('Child Content')).toBeVisible();
  });

  it('should render quick starts loaded from QuickStartsLoader', () => {
    render(
      <QuickStartDrawer>
        <div>Content</div>
      </QuickStartDrawer>,
    );

    expect(screen.getByText(/Test 1/)).toBeVisible();
    expect(screen.getByText(/Test 2/)).toBeVisible();
    expect(screen.getByText('Content')).toBeVisible();
  });

  it('should render without children', () => {
    render(<QuickStartDrawer />);

    expect(screen.getByText(/Test 1/)).toBeVisible();
    expect(screen.getByText(/Test 2/)).toBeVisible();
  });
});
