import { render, screen } from '@testing-library/react';
import * as flagsModule from '@console/dynamic-plugin-sdk/src/utils/flags';
import * as rbacModule from '@console/internal/components/utils/rbac';
import * as useIsMobileModule from '@console/shared/src/hooks/useIsMobile';
import ExportApplication from '../ExportApplication';

describe('ExportApplication', () => {
  const spyUseAccessReview = jest.spyOn(rbacModule, 'useAccessReview');
  const spyUseFlag = jest.spyOn(flagsModule, 'useFlag');
  const spyUseIsMobile = jest.spyOn(useIsMobileModule, 'useIsMobile');

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should render export app button when feature flag is present, user has access, and not on mobile', () => {
    spyUseFlag.mockReturnValue(true);
    spyUseAccessReview.mockReturnValue(true);
    spyUseIsMobile.mockReturnValue(false);

    render(<ExportApplication namespace="my-app" isDisabled={false} />);
    const button = screen.getByRole('button', { name: /export application/i });
    expect(button).toBeInTheDocument();
    expect(button).toBeEnabled();
  });

  it('should not render button when user lacks access', () => {
    spyUseFlag.mockReturnValue(true);
    spyUseAccessReview.mockReturnValue(false);
    spyUseIsMobile.mockReturnValue(false);

    render(<ExportApplication namespace="my-app" isDisabled={false} />);
    expect(screen.queryByRole('button', { name: /export application/i })).not.toBeInTheDocument();
  });

  it('should not render button when on mobile', () => {
    spyUseFlag.mockReturnValue(true);
    spyUseAccessReview.mockReturnValue(true);
    spyUseIsMobile.mockReturnValue(true);

    render(<ExportApplication namespace="my-app" isDisabled={false} />);
    expect(screen.queryByRole('button', { name: /export application/i })).not.toBeInTheDocument();
  });
});
