import { render, screen } from '@testing-library/react';
import { useExtensions } from '@console/plugin-sdk/src/api/useExtensions';
import { useConsoleOperatorConfig } from '@console/shared/src/components/cluster-configuration/useConsoleOperatorConfig';
import PerspectiveConfiguration from '../PerspectiveConfiguration';

jest.mock('@console/shared/src/components/cluster-configuration/useConsoleOperatorConfig', () => ({
  useConsoleOperatorConfig: jest.fn(),
}));

jest.mock('@console/plugin-sdk/src/api/useExtensions', () => ({
  useExtensions: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/useTelemetry', () => ({
  useTelemetry: jest.fn(() => jest.fn()),
}));

jest.mock('@console/shared/src/hooks/useDebounceCallback', () => ({
  useDebounceCallback: jest.fn((callback) => callback),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockUseConsoleOperatorConfig = jest.mocked(useConsoleOperatorConfig);
const mockUseExtensions = jest.mocked(useExtensions);

const perspectiveExtension = {
  uid: 'dev.perspective',
  properties: { id: 'dev', name: 'Developer' },
};

describe('PerspectiveConfiguration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseExtensions.mockReturnValue([perspectiveExtension as any]);
  });

  it('renders when the console config has no perspectives customization', () => {
    // Regression test: seeding `undefined` configured perspectives during
    // render must converge instead of looping ("Too many re-renders").
    mockUseConsoleOperatorConfig.mockReturnValue([
      { spec: { customization: {} } } as any,
      true,
      undefined,
    ]);

    render(<PerspectiveConfiguration readonly={false} />);

    expect(screen.getByText('Developer')).toBeInTheDocument();
  });

  it('renders the configured visibility for each perspective', () => {
    mockUseConsoleOperatorConfig.mockReturnValue([
      {
        spec: {
          customization: {
            perspectives: [{ id: 'dev', visibility: { state: 'Disabled' } }],
          },
        },
      } as any,
      true,
      undefined,
    ]);

    render(<PerspectiveConfiguration readonly={false} />);

    expect(screen.getByText('Developer')).toBeInTheDocument();
    expect(screen.getByText('Disabled')).toBeInTheDocument();
  });

  it('adopts perspectives when the configuration gains them after mount', () => {
    // Regression test: the console config starts without perspectives and
    // later gains them; the unset local state must adopt the new value.
    mockUseConsoleOperatorConfig.mockReturnValue([
      { spec: { customization: {} } } as any,
      true,
      undefined,
    ]);
    const { rerender } = render(<PerspectiveConfiguration readonly={false} />);

    mockUseConsoleOperatorConfig.mockReturnValue([
      {
        spec: {
          customization: {
            perspectives: [{ id: 'dev', visibility: { state: 'Disabled' } }],
          },
        },
      } as any,
      true,
      undefined,
    ]);
    rerender(<PerspectiveConfiguration readonly={false} />);

    expect(screen.getByText('Developer')).toBeInTheDocument();
    expect(screen.getByText('Disabled')).toBeInTheDocument();
  });
});
