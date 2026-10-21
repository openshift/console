import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import type { GettingStartedCardProps } from '../GettingStartedCard';
import { GettingStartedCard } from '../GettingStartedCard';

jest.mock('@console/shared/src/hooks/useTelemetry', () => ({
  useTelemetry: () => jest.fn(),
}));

jest.mock('@console/dynamic-plugin-sdk/src/perspective/useActivePerspective', () => ({
  default: jest.fn(() => ['admin', jest.fn()]),
}));

jest.mock('@patternfly/react-icons', () => ({
  ArrowRightIcon: () => 'ArrowRightIcon',
  ExternalLinkAltIcon: () => 'ExternalLinkAltIcon',
}));

describe('GettingStartedCard', () => {
  const defaultProps: GettingStartedCardProps = {
    id: 'test-card',
    title: 'Test Card',
    description: 'This is a test card.',
    links: [
      { id: 'link-1', title: 'Internal Link', href: '/internal' },
      { id: 'link-2', title: 'External Link', href: 'https://example.com', external: true },
    ],
    moreLink: { id: 'more-link', title: 'More Info', href: '/more' },
  };

  it('renders card title, description, and icon', async () => {
    const TestIcon = () => <div>TestIcon</div>;
    renderWithProviders(<GettingStartedCard {...defaultProps} icon={<TestIcon />} />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Test Card/i, level: 3 })).toBeVisible();
    });
    expect(screen.getByText('This is a test card.')).toBeVisible();
    expect(screen.getByText('TestIcon')).toBeVisible();
  });

  it('renders internal links with arrow icon', async () => {
    renderWithProviders(<GettingStartedCard {...defaultProps} />);
    const internalLink = await screen.findByTestId('item link-1');
    expect(within(internalLink).getByText('Internal Link')).toBeVisible();
    expect(within(internalLink).getByText('ArrowRightIcon')).toBeVisible();
  });

  it('renders external links with external link icon and target blank', async () => {
    renderWithProviders(<GettingStartedCard {...defaultProps} />);
    const externalLink = await screen.findByTestId('item link-2');
    expect(within(externalLink).getByText('External Link')).toBeVisible();
    expect(within(externalLink).getByText('ExternalLinkAltIcon')).toBeVisible();
    expect(externalLink).toHaveAttribute('target', '_blank');
    expect(externalLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders moreLink as internal link or button based on props', async () => {
    renderWithProviders(<GettingStartedCard {...defaultProps} />);
    expect(await screen.findByRole('link', { name: 'More Info' })).toHaveAttribute('href', '/more');
  });

  it('renders moreLink as button when onClick is provided and calls handler', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    const props = { ...defaultProps, moreLink: { id: 'more-link', title: 'More Info', onClick } };
    renderWithProviders(<GettingStartedCard {...props} />);
    await user.click(await screen.findByRole('button', { name: 'More Info' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('calls onClick for internal link when clicked', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    const props = {
      ...defaultProps,
      links: [{ id: 'link-1', title: 'Internal Link', href: '/internal', onClick }],
    };
    renderWithProviders(<GettingStartedCard {...props} />);
    await user.click(await screen.findByTestId('item link-1'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders skeleton for loading links', async () => {
    const props = { ...defaultProps, links: [{ id: 'loading-link', loading: true }] };
    renderWithProviders(<GettingStartedCard {...props} />);
    expect(await screen.findByTestId('getting-started-skeleton')).toBeVisible();
  });

  it('does not render links section when links array is empty', async () => {
    const props = { ...defaultProps, links: [] };
    renderWithProviders(<GettingStartedCard {...props} />);
    await waitFor(() => {
      expect(screen.queryByRole('list')).not.toBeInTheDocument();
    });
  });

  it('does not render moreLink when not provided', async () => {
    const props = { ...defaultProps, moreLink: undefined };
    renderWithProviders(<GettingStartedCard {...props} />);
    await waitFor(() => {
      expect(screen.queryByRole('link', { name: 'More Info' })).not.toBeInTheDocument();
    });
  });

  it('applies custom title color when provided', async () => {
    const props = { ...defaultProps, titleColor: '#ff0000' };
    renderWithProviders(<GettingStartedCard {...props} />);
    expect(await screen.findByRole('heading', { name: 'Test Card' })).toHaveStyle({
      color: '#ff0000',
    });
  });
});
