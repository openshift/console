import { screen } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import ClassicInstalledOperatorsPage from '../ClassicInstalledOperatorsPage';

jest.mock('../../clusterserviceversion', () => ({
  ClusterServiceVersionsPage: ({ namespace, showTitle, helpAlert }) => (
    <div data-test="csv-list" data-namespace={namespace} data-show-title={String(showTitle)}>
      {helpAlert}
    </div>
  ),
}));

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useParams: () => ({ ns: 'ns-a' }),
}));

// The page only renders inside the Tech Preview tabbed page, where the alert is active.
jest.mock('@console/shared/src/hooks/useFlag', () => ({
  useFlag: () => true,
}));

describe('ClassicInstalledOperatorsPage', () => {
  it('should render the ClusterServiceVersion list for the selected namespace', () => {
    renderWithProviders(<ClassicInstalledOperatorsPage />);

    expect(screen.getByTestId('csv-list')).toHaveAttribute('data-namespace', 'ns-a');
  });

  it('should pass the migration alert to the list page heading', () => {
    renderWithProviders(<ClassicInstalledOperatorsPage />);

    expect(screen.getByTestId('csv-list')).toContainElement(
      screen.getByTestId('classic-operator-migration-alert'),
    );
  });

  it('should let the tabbed page own the heading', () => {
    renderWithProviders(<ClassicInstalledOperatorsPage />);

    expect(screen.getByTestId('csv-list')).toHaveAttribute('data-show-title', 'false');
  });
});
