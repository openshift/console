import { render, screen } from '@testing-library/react';
import * as useAccessReviewModule from '@console/dynamic-plugin-sdk/src/app/components/utils/rbac';
import { QuickStartEmptyState } from '../QuickStartEmptyState';

jest.mock('@console/dynamic-plugin-sdk/src/app/components/utils/rbac', () => ({
  useAccessReview: jest.fn(),
}));

jest.mock('@console/dynamic-plugin-sdk/src/utils/k8s', () => ({
  getReferenceForModel: jest.fn(() => 'console.openshift.io~v1~QuickStart'),
}));

jest.mock('@console/internal/components/utils/documentation', () => ({
  documentationURLs: {
    creatingQuickStartsTutorials: 'https://docs.example.com/quickstarts',
  },
  getDocumentationURL: jest.fn((url) => url),
}));

jest.mock('@console/shared/src/components/links/ExternalLinkButton', () => ({
  ExternalLinkButton: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

jest.mock('@console/shared/src/components/links/LinkTo', () => ({
  LinkTo: (to: string) => ({ children }: { children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

const mockUseAccessReview = useAccessReviewModule.useAccessReview as jest.Mock;

describe('QuickStartEmptyState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display empty state title', () => {
    mockUseAccessReview.mockReturnValue([true, false]);

    render(<QuickStartEmptyState />);

    expect(screen.getByText(/No.*found/)).toBeVisible();
  });

  it('should show loading skeleton when access review is loading', () => {
    mockUseAccessReview.mockReturnValue([false, true]);

    render(<QuickStartEmptyState />);

    // When loading, the empty state body shows a skeleton instead of text
    expect(screen.queryByText(/Configure quick starts/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Ask a cluster administrator/)).not.toBeInTheDocument();
  });

  it('should show admin message when user can create quick starts', () => {
    mockUseAccessReview.mockReturnValue([true, false]);

    render(<QuickStartEmptyState />);

    expect(
      screen.getByText(/Configure quick starts to help users get started with the cluster/),
    ).toBeVisible();
  });

  it('should show non-admin message when user cannot create quick starts', () => {
    mockUseAccessReview.mockReturnValue([false, false]);

    render(<QuickStartEmptyState />);

    expect(screen.getByText(/Ask a cluster administrator to configure quick starts/)).toBeVisible();
  });

  it('should show configure link when user can create quick starts', () => {
    mockUseAccessReview.mockReturnValue([true, false]);

    render(<QuickStartEmptyState />);

    expect(screen.getByText('Configure quick starts')).toBeVisible();
  });

  it('should not show configure link when user cannot create quick starts', () => {
    mockUseAccessReview.mockReturnValue([false, false]);

    render(<QuickStartEmptyState />);

    expect(screen.queryByText('Configure quick starts')).not.toBeInTheDocument();
  });

  it('should show learn more link when user can create quick starts', () => {
    mockUseAccessReview.mockReturnValue([true, false]);

    render(<QuickStartEmptyState />);

    expect(screen.getByText('Learn more about quick starts')).toBeVisible();
  });
});
