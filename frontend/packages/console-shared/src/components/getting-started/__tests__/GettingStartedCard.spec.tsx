import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { GettingStartedCard, GettingStartedCardProps } from '../GettingStartedCard';

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

  it('renders title and description', async () => {
    renderWithProviders(<GettingStartedCard {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Test Card')).toBeVisible();
      expect(screen.getByText('This is a test card.')).toBeVisible();
    });
  });

  it('renders all links', async () => {
    renderWithProviders(<GettingStartedCard {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByTestId('item link-1')).toBeVisible();
      expect(screen.getByTestId('item link-2')).toBeVisible();
      expect(screen.getByTestId('item more-link')).toBeVisible();
    });
  });

  it('calls onClick for internal link', async () => {
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

    fireEvent.click(screen.getByTestId('item link-1'));

    await waitFor(() => {
      expect(onClick).toHaveBeenCalled();
    });
  });

  it('calls onClick for moreLink', async () => {
    const onClick = jest.fn();
    const props = {
      ...defaultProps,
      moreLink: {
        id: 'more-link',
        title: 'More Info',
        href: '/more',
        onClick,
      },
    };
    renderWithProviders(<GettingStartedCard {...props} />);

    fireEvent.click(screen.getByTestId('item more-link'));

    await waitFor(() => {
      expect(onClick).toHaveBeenCalled();
    });
  });

  it('renders skeleton for loading links', async () => {
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
    await waitFor(() => {
      expect(screen.getByTestId('getting-started-skeleton')).toBeInTheDocument();
    });
  });
});
