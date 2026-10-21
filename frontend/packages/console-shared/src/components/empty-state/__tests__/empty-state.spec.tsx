import { Button } from '@patternfly/react-core';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { AccessDenied, EmptyBox, ConsoleEmptyState } from '..';

const TestIcon = () => 'TestIcon';

describe('EmptyBox', () => {
  it('renders default "Not found" message without label', () => {
    renderWithProviders(<EmptyBox />);
    expect(screen.getByText('Not found')).toBeVisible();
  });

  it('renders message with label when provided', () => {
    renderWithProviders(<EmptyBox label="resources" />);
    expect(screen.getByText('No resources found')).toBeVisible();
  });
});

describe('ConsoleEmptyState', () => {
  it('renders title and children in body', () => {
    renderWithProviders(
      <ConsoleEmptyState title="Empty State Title">Body content</ConsoleEmptyState>,
    );
    expect(screen.getByText('Empty State Title')).toBeVisible();
    expect(screen.getByText('Body content')).toBeVisible();
  });

  it('renders Icon when provided', () => {
    renderWithProviders(<ConsoleEmptyState Icon={TestIcon} title="With Icon" />);
    expect(screen.getByText('TestIcon')).toBeVisible();
  });

  it('renders primary and secondary actions when provided', () => {
    const primaryActions = [<Button key="create">Create Resource</Button>];
    const secondaryActions = [
      <Button key="learn" variant="link">
        Learn more
      </Button>,
    ];
    renderWithProviders(
      <ConsoleEmptyState
        title="Test"
        primaryActions={primaryActions}
        secondaryActions={secondaryActions}
      />,
    );
    expect(screen.getByRole('button', { name: 'Create Resource' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Learn more' })).toBeVisible();
  });

  it('does not render body or footer when not provided', () => {
    renderWithProviders(<ConsoleEmptyState title="No Body" />);
    expect(screen.queryByTestId('console-empty-state-body')).not.toBeInTheDocument();
    expect(screen.queryByTestId('console-empty-state-footer')).not.toBeInTheDocument();
  });
});

describe('AccessDenied', () => {
  it('renders restricted access title and message', () => {
    renderWithProviders(<AccessDenied />);
    expect(screen.getByText('Restricted access')).toBeVisible();
    expect(
      screen.getByText("You don't have access to this section due to cluster policy"),
    ).toBeVisible();
  });

  it('renders error details alert when children provided', () => {
    renderWithProviders(<AccessDenied>Permission denied for resource xyz</AccessDenied>);
    expect(screen.getByText('Error details')).toBeVisible();
    expect(screen.getByText('Permission denied for resource xyz')).toBeVisible();
  });

  it('does not render error alert when no children provided', () => {
    renderWithProviders(<AccessDenied />);
    expect(screen.queryByText('Error details')).not.toBeInTheDocument();
  });

  it('renders restricted sign icon', () => {
    renderWithProviders(<AccessDenied />);
    expect(screen.getByAltText('Restricted access')).toBeVisible();
  });
});
