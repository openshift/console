import { screen, fireEvent } from '@testing-library/react';
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
    expect(screen.getByText('Test Card')).toBeInTheDocument();
    expect(screen.getByText('This is a test card.')).toBeInTheDocument();
  });

  it('renders all links', () => {
    renderWithProviders(<GettingStartedCard {...defaultProps} />);
    expect(screen.getByTestId('item link-1')).toBeInTheDocument();
    expect(screen.getByTestId('item link-2')).toBeInTheDocument();
    expect(screen.getByTestId('item more-link')).toBeInTheDocument();
  });

  it('calls onClick for internal link', () => {
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
    expect(onClick).toHaveBeenCalled();
  });

  it('calls onClick for moreLink', () => {
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
    expect(onClick).toHaveBeenCalled();
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
});
