import { screen } from '@testing-library/react';
import * as rbacModule from '@console/internal/components/utils/rbac';
import { renderWithProviders } from '../../../test-utils/unit-test-utils';
import { sampleDeployments } from '../../../utils/__tests__/test-resource-data';
import HealthChecksAlert from '../HealthChecksAlert';

jest.mock('@console/shared/src/hooks/useUserSettingsCompatibility', () => ({
  useUserSettingsCompatibility: () => [[], jest.fn(), true],
}));

describe('HealthChecksAlert', () => {
  const spyUseAccessReview = jest.spyOn(rbacModule, 'useAccessReview');

  afterEach(() => {
    spyUseAccessReview.mockClear();
  });

  it('should show alert when health check probes not present', () => {
    spyUseAccessReview.mockReturnValue(true);
    renderWithProviders(<HealthChecksAlert resource={sampleDeployments.data[1]} />);
    expect(screen.getByText('Health checks')).toBeVisible();
  });

  it('should not show alert when health check probes present', () => {
    spyUseAccessReview.mockReturnValue(true);
    renderWithProviders(<HealthChecksAlert resource={sampleDeployments.data[2]} />);
    expect(screen.queryByText('Health checks')).not.toBeInTheDocument();
  });

  it('should not show alert when user has only view access', () => {
    spyUseAccessReview.mockReturnValue(false);
    renderWithProviders(<HealthChecksAlert resource={sampleDeployments.data[1]} />);
    expect(screen.queryByText('Health checks')).not.toBeInTheDocument();
  });
});
