import { screen } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { operatorHubDetailsProps, itemWithLongDescription } from '../../../../mocks';
import { OperatorHubItemDetails } from '../operator-hub-item-details';

jest.mock('@console/shared/src/components/markdown/MarkdownView', () => ({
  MarkdownView: jest.fn(() => '[MARKDOWN_VIEW]'),
}));

describe('OperatorHubItemDetails', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should display long description when provided', () => {
    const { rerender } = renderWithProviders(
      <OperatorHubItemDetails updateChannel={''} updateVersion={''} {...operatorHubDetailsProps} />,
    );

    // Initially, user sees no long description
    expect(screen.queryByText('[MARKDOWN_VIEW]')).not.toBeInTheDocument();

    // Rerender with item that has longDescription
    rerender(
      <OperatorHubItemDetails
        updateChannel={''}
        updateVersion={''}
        {...operatorHubDetailsProps}
        item={itemWithLongDescription}
      />,
    );

    // User should now see the detailed description
    expect(screen.getByText('[MARKDOWN_VIEW]')).toBeVisible();
  });
});
