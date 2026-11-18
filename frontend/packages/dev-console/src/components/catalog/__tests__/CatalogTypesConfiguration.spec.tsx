import { render, screen } from '@testing-library/react';
import { useResolvedExtensions } from '@console/dynamic-plugin-sdk/src/lib-core';
import { useConsoleOperatorConfig } from '@console/shared/src/components/cluster-configuration/useConsoleOperatorConfig';
import CatalogTypesConfiguration from '../CatalogTypesConfiguration';

jest.mock('@console/dynamic-plugin-sdk/src/lib-core', () => ({
  useResolvedExtensions: jest.fn(),
}));

jest.mock('@console/shared/src/components/cluster-configuration/useConsoleOperatorConfig', () => ({
  useConsoleOperatorConfig: jest.fn(),
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

const mockUseResolvedExtensions = jest.mocked(useResolvedExtensions);
const mockUseConsoleOperatorConfig = jest.mocked(useConsoleOperatorConfig);

const catalogTypeExtension = {
  uid: 'helm-chart-type',
  properties: { type: 'HelmChart', title: 'Helm Charts' },
};

const configWithoutTypes = { spec: { customization: {} } };
const configWithTypes = {
  spec: {
    customization: {
      developerCatalog: { types: { state: 'Disabled' as const, disabled: ['HelmChart'] } },
    },
  },
};

// Reports which DualListSelector pane contains an option. Pane membership
// requires structural traversal (the pane title is a sibling of the option
// list), which Testing Library queries cannot express.
const paneOfOption = (optionText: string): 'enabled' | 'disabled' => {
  let node = screen.getByText(optionText) as HTMLElement;
  // eslint-disable-next-line testing-library/no-node-access -- walking up to the pane container; no Testing Library query reaches an ancestor by content
  while (node.parentElement) {
    // eslint-disable-next-line testing-library/no-node-access -- reading the pane title text during the walk
    node = node.parentElement;
    const text = node.textContent ?? '';
    if (text.includes('Disabled types')) return 'disabled';
    if (text.includes('Enabled types')) return 'enabled';
  }
  throw new Error(`pane not found for ${optionText}`);
};

describe('CatalogTypesConfiguration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseResolvedExtensions.mockReturnValue([[catalogTypeExtension as any], true, undefined]);
  });

  it('renders when the console config has no catalog types configured', () => {
    mockUseConsoleOperatorConfig.mockReturnValue([configWithoutTypes as any, true, undefined]);

    render(<CatalogTypesConfiguration readonly={false} />);

    expect(screen.getByText('Helm Charts')).toBeInTheDocument();
    expect(paneOfOption('Helm Charts')).toBe('enabled');
  });

  it('adopts types when the configuration gains them after mount', () => {
    // Regression test: the console config starts without catalog types and
    // later gains them (for example an admin edits the operator config
    // elsewhere); the unedited local state must adopt the new value.
    mockUseConsoleOperatorConfig.mockReturnValue([configWithoutTypes as any, true, undefined]);
    const { rerender } = render(<CatalogTypesConfiguration readonly={false} />);
    expect(paneOfOption('Helm Charts')).toBe('enabled');

    mockUseConsoleOperatorConfig.mockReturnValue([configWithTypes as any, true, undefined]);
    rerender(<CatalogTypesConfiguration readonly={false} />);

    expect(paneOfOption('Helm Charts')).toBe('disabled');
  });
});
