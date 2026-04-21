import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import type { GettingStartedCardProps } from '../GettingStartedCard';
import { GettingStartedCard } from '../GettingStartedCard';

describe('GettingStartedCard', () => {
  const defaultProps: GettingStartedCardProps = {
    id: 'test-card',
    title: 'Test Card',
    description: 'This is a test card.',
    links: [
      {
        id: 'link-1',
        title: 'Internal Link',
        href: '/internal',
      },
      {
        id: 'link-2',
        title: 'External Link',
        href: 'https://example.com',
        external: true,
      },
    ],
    moreLink: {
      id: 'more-link',
      title: 'More Info',
      href: '/more',
    },
  };

  it('renders title and description', () => {
    renderWithProviders(<GettingStartedCard {...defaultProps} />);
    expect(screen.getByRole('heading', { name: 'Test Card', level: 3 })).toBeVisible();
    expect(screen.getByText('This is a test card.')).toBeVisible();
  });

  it('renders the icon when provided', () => {
    renderWithProviders(
      <GettingStartedCard {...defaultProps} icon={<span data-test="card-icon">Card icon</span>} />,
    );
    expect(screen.getByText('Card icon')).toBeVisible();
  });

  it('applies custom title color when provided', () => {
    renderWithProviders(<GettingStartedCard {...defaultProps} titleColor="#ff0000" />);
    expect(screen.getByRole('heading', { name: 'Test Card', level: 3 })).toHaveStyle({
      color: '#ff0000',
    });
  });

  it('renders all links', () => {
    renderWithProviders(<GettingStartedCard {...defaultProps} />);
    expect(screen.getByRole('link', { name: /Internal Link/i })).toBeVisible();
    expect(screen.getByRole('link', { name: /External Link/i })).toBeVisible();
    expect(screen.getByRole('link', { name: /More Info/i })).toBeVisible();
  });

  it('renders internal links for in-app navigation', () => {
    renderWithProviders(<GettingStartedCard {...defaultProps} />);
    const internalLink = screen.getByRole('link', { name: /Internal Link/i });
    expect(internalLink).toHaveAttribute('href', '/internal');
    expect(within(internalLink).getByText('Internal Link')).toBeVisible();
  });

  it('renders external links with target and rel for safe external navigation', () => {
    renderWithProviders(<GettingStartedCard {...defaultProps} />);
    const externalLink = screen.getByRole('link', { name: /External Link/i });
    expect(externalLink).toHaveAttribute('target', '_blank');
    expect(externalLink).toHaveAttribute('rel', 'noopener noreferrer');
    expect(within(externalLink).getByText('External Link')).toBeVisible();
  });

  it('renders moreLink as an internal link when href is provided without onClick', () => {
    renderWithProviders(<GettingStartedCard {...defaultProps} />);
    const moreLink = screen.getByRole('link', { name: 'More Info' });
    expect(moreLink).toHaveAttribute('href', '/more');
  });

  it('calls onClick for internal link', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    const props = {
      ...defaultProps,
      links: [
        {
          id: 'link-1',
          title: 'Internal Link',
          href: '/internal',
          onClick,
        },
      ],
    };
    renderWithProviders(<GettingStartedCard {...props} />);
    await user.click(screen.getByRole('link', { name: /Internal Link/i }));
    expect(onClick).toHaveBeenCalled();
  });

  it('renders moreLink as a button when onClick is provided and invokes the handler', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    const props = {
      ...defaultProps,
      moreLink: {
        id: 'more-link',
        title: 'More Info',
        onClick,
      },
    };
    renderWithProviders(<GettingStartedCard {...props} />);
    await user.click(screen.getByRole('button', { name: 'More Info' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders skeleton for loading links', () => {
    const props = {
      ...defaultProps,
      links: [
        {
          id: 'loading-link',
          loading: true,
        },
      ],
    };
    renderWithProviders(<GettingStartedCard {...props} />);
    expect(screen.getByTestId('getting-started-skeleton')).toBeInTheDocument();
  });

  it('does not render the links list when links array is empty', () => {
    renderWithProviders(<GettingStartedCard {...defaultProps} links={[]} />);
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('does not render moreLink when not provided', () => {
    const props = { ...defaultProps, moreLink: undefined };
    renderWithProviders(<GettingStartedCard {...props} />);
    expect(screen.queryByRole('link', { name: /More Info/i })).not.toBeInTheDocument();
  });
});
