import { render, screen } from '@testing-library/react';
import * as flagsModule from '@console/dynamic-plugin-sdk/src/utils/flags';
import * as rbacModule from '@console/internal/components/utils/rbac';
import * as useIsMobileModule from '@console/shared/src/hooks/useIsMobile';
import ExportApplication from '../ExportApplication';

jest.mock('@console/dynamic-plugin-sdk/src/utils/flags', () => {
  const actual = jest.requireActual('@console/dynamic-plugin-sdk/src/utils/flags');
  return {
    ...actual,
    useFlag: jest.fn(),
  };
});

jest.mock('@console/internal/components/utils/rbac', () => {
  const actual = jest.requireActual('@console/internal/components/utils/rbac');
  return {
    ...actual,
    useAccessReview: jest.fn(),
  };
});

jest.mock('@console/shared/src/hooks/useIsMobile', () => {
  const actual = jest.requireActual('@console/shared/src/hooks/useIsMobile');
  return {
    ...actual,
    useIsMobile: jest.fn(),
  };
});

const useFlagMock = flagsModule.useFlag as jest.Mock;
const useAccessReviewMock = rbacModule.useAccessReview as jest.Mock;
const useIsMobileMock = useIsMobileModule.useIsMobile as jest.Mock;

describe('ExportApplication', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should render export app button when feature flag is present, user has access, and not on mobile', () => {
    useFlagMock.mockReturnValue(true);
    useAccessReviewMock.mockReturnValue(true);
    useIsMobileMock.mockReturnValue(false);

    render(<ExportApplication namespace="my-app" isDisabled={false} />);
    const button = screen.getByRole('button', { name: /export application/i });
    expect(button).toBeInTheDocument();
    expect(button).toBeEnabled();
  });

  it('should not render button when user lacks access', () => {
    useFlagMock.mockReturnValue(true);
    useAccessReviewMock.mockReturnValue(false);
    useIsMobileMock.mockReturnValue(false);

    render(<ExportApplication namespace="my-app" isDisabled={false} />);
    expect(screen.queryByRole('button', { name: /export application/i })).not.toBeInTheDocument();
  });

  it('should not render button when on mobile', () => {
    useFlagMock.mockReturnValue(true);
    useAccessReviewMock.mockReturnValue(true);
    useIsMobileMock.mockReturnValue(true);

    render(<ExportApplication namespace="my-app" isDisabled={false} />);
    expect(screen.queryByRole('button', { name: /export application/i })).not.toBeInTheDocument();
  });
});
