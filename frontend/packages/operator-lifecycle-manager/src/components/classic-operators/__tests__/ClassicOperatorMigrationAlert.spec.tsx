import { screen } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { ClassicOperatorMigrationAlert } from '../ClassicOperatorMigrationAlert';

const mockUseFlag = jest.fn();
jest.mock('@console/shared/src/hooks/useFlag', () => ({
  useFlag: (flag: string) => mockUseFlag(flag),
}));

describe('ClassicOperatorMigrationAlert', () => {
  beforeEach(() => {
    mockUseFlag.mockReturnValue(true);
  });

  // Next-Gen only exists in Tech Preview, so outside it there is nothing to migrate to.
  it('should render nothing outside Tech Preview', () => {
    mockUseFlag.mockReturnValue(false);

    const { container } = renderWithProviders(<ClassicOperatorMigrationAlert />);

    expect(container).toBeEmptyDOMElement();
  });

  it('should render a warning alert', () => {
    renderWithProviders(<ClassicOperatorMigrationAlert />);

    expect(screen.getByRole('heading', { name: /Next-Gen Operators/ })).toBeInTheDocument();
  });

  // Not dismissible on purpose: the banner is the whole point of splitting Classic out.
  it('should not offer a close button', () => {
    renderWithProviders(<ClassicOperatorMigrationAlert />);

    expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument();
  });

  it('should link to the Next-Gen Operators catalog type', () => {
    renderWithProviders(<ClassicOperatorMigrationAlert />);

    expect(screen.getByRole('link', { name: /Next-Gen Operators/ })).toHaveAttribute(
      'href',
      '/catalog/all-namespaces?catalogType=operator-olmv1',
    );
  });
});
