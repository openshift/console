import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DASH } from '@console/shared/src/constants/ui';
import type { OperatorMigrationPlan } from '../../../utils/operator-migration-api';
import { MigrationPlanDetails } from '../operator-migration-plan';

jest.mock('react-i18next');

describe('Migration plan manager', () => {
  it.each([
    { scenario: 'deployment', clusterObjectDeploymentName: 'deployment', expected: 'deployment' },
    { scenario: 'legacy revision', clusterObjectSetName: 'legacy-1', expected: 'legacy-1' },
    {
      scenario: 'both manager fields',
      clusterObjectDeploymentName: 'deployment',
      clusterObjectSetName: 'legacy-1',
      expected: 'deployment',
    },
    { scenario: 'absent manager fields', expected: DASH },
    {
      scenario: 'empty manager fields',
      clusterObjectDeploymentName: '',
      clusterObjectSetName: '',
      expected: DASH,
    },
  ])(
    'shows the manager or a placeholder with $scenario',
    async ({ scenario, expected, ...manager }) => {
      const user = userEvent.setup();
      const plan: OperatorMigrationPlan = {
        packageName: 'operator',
        version: '1.0.0',
        clusterExtensionName: 'extension',
        clusterCatalog: 'catalog',
        installNamespace: 'operators',
        channel: 'stable',
        resources: [],
        actions: [],
        ...manager,
      };
      render(<MigrationPlanDetails plan={plan} displayName="Operator" />);

      await user.click(screen.getByRole('button', { name: 'Migration plan for Operator' }));

      expect(
        screen.getAllByRole('definition').map((definition) => definition.textContent),
      ).toContain(expected);
    },
  );
});
