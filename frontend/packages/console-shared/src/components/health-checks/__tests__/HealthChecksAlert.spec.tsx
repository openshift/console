import { screen } from '@testing-library/react';
import * as rbacModule from '@console/internal/components/utils/rbac';
import { renderWithProviders } from '../../../test-utils/unit-test-utils';
import { sampleDeployments } from '../../../utils/__tests__/test-resource-data';
import HealthChecksAlert from '../HealthChecksAlert';

jest.mock('@console/shared/src/hooks/useUserSettingsCompatibility', () => ({
  useUserSettingsCompatibility: () => [[], jest.fn(), true],
}));

jest.mock('@console/internal/components/utils/rbac', () => {
  const actual = jest.requireActual('@console/internal/components/utils/rbac');
  return {
    ...actual,
    useAccessReview: jest.fn(),
  };
});

const spyUseAccessReview = rbacModule.useAccessReview as jest.Mock;

describe('HealthChecksAlert', () => {
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
