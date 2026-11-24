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

  // OLMv1 only exists in Technology Preview, so outside it there is nothing to migrate to.
  it('should render nothing outside Technology Preview', () => {
    mockUseFlag.mockReturnValue(false);

    const { container } = renderWithProviders(<ClassicOperatorMigrationAlert />);

    expect(container).toBeEmptyDOMElement();
  });

  it('should render a warning alert', () => {
    renderWithProviders(<ClassicOperatorMigrationAlert />);

    expect(screen.getByRole('heading', { name: /cluster extensions/ })).toBeInTheDocument();
    expect(
      screen.getByText(/Cluster extensions are a Technology Preview feature/),
    ).toBeInTheDocument();
  });

  // The migration warning stays visible while managing Classic Operators.
  it('should not offer a close button', () => {
    renderWithProviders(<ClassicOperatorMigrationAlert />);

    expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument();
  });

  it('should link to the Operators catalog filtered to OLMv1', () => {
    renderWithProviders(<ClassicOperatorMigrationAlert />);

    expect(screen.getByRole('link', { name: /Cluster extensions/ })).toHaveAttribute(
      'href',
      '/catalog/all-namespaces?catalogType=operator&operatorCatalog=%5B%22Cluster%20extensions%22%5D',
    );
  });
});
