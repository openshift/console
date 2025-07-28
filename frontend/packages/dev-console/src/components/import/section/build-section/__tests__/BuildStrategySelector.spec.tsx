/* eslint-disable global-require, @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports */
import { configure, render, screen } from '@testing-library/react';
import * as shipwrightHooks from '@console/dev-console/src/utils/shipwright-build-hook';
// eslint-disable-next-line import/order
import { BuildStrategySelector } from '../BuildStrategySelector';
import '@testing-library/jest-dom';

configure({ testIdAttribute: 'data-test' });

const spySWClusterBuildStrategy = jest.spyOn(shipwrightHooks, 'useClusterBuildStrategy');

jest.mock('formik', () => ({
  useFormikContext: jest.fn(),
}));

const mockUseFormikContext = require('formik').useFormikContext;

jest.mock('@console/shared/src', () => ({
  SingleDropdownField: function MockSingleDropdownField(props) {
    const React = require('react');
    return React.createElement(
      'div',
      {
        'data-test': 'single-dropdown-field',
        'data-name': props.name,
        'data-label': props.label,
        'data-options': JSON.stringify(props.options),
        'data-is-disabled': props.isDisabled,
        'data-toggle-on-selection': props.toggleOnSelection,
        'data-aria-label': props.ariaLabel,
        'data-placeholder-text': props.placeholderText,
        'data-help-text': props.helpText,
      },
      `Dropdown: ${props.label}`,
    );
  },
  SelectInputOption: {},
}));

jest.mock('@console/internal/components/utils', () => ({
  LoadingInline: function MockLoadingInline() {
    const React = require('react');
    return React.createElement('div', { 'data-test': 'loading-inline' }, 'Loading...');
  },
}));

jest.mock('@console/git-service/src', () => ({
  ImportStrategy: {
    DOCKERFILE: 1,
    S2I: 0,
  },
}));

jest.mock('@console/shipwright-plugin/src/types', () => ({
  ClusterBuildStrategy: {
    BUILDAH: 'buildah',
    S2I: 'source-to-image',
  },
  ReadableClusterBuildStrategies: {
    buildah: 'Buildah',
    'source-to-image': 'Source-to-Image',
  },
}));

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key: string) => {
      if (key === 'devconsole~Cluster Build Strategy') return 'Cluster Build Strategy';
      if (key === 'devconsole~Select Cluster Build Strategy')
        return 'Select Cluster Build Strategy';
      if (key === 'Buildah') return 'Buildah';
      if (key === 'Source-to-Image') return 'Source-to-Image';
      return key;
    },
  }),
}));

describe('BuildStrategySelector', () => {
  beforeEach(() => {
    mockUseFormikContext.mockReturnValue({
      setFieldValue: jest.fn(),
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should not render SingleDropdownField if clusterBuildStrategy is not loaded', () => {
    spySWClusterBuildStrategy.mockReturnValue([{}, false]);

    render(<BuildStrategySelector formType="create" importStrategy={0} />);

    expect(screen.queryByTestId('single-dropdown-field')).not.toBeInTheDocument();
    expect(screen.getByTestId('loading-inline')).toBeInTheDocument();
  });

  it('should list source-to-image if BuildImage Import Strategy is selected, s2i clusterBuildStrategy is found', () => {
    spySWClusterBuildStrategy.mockReturnValue([{ s2i: true }, true]);

    render(<BuildStrategySelector formType="create" importStrategy={0} />);

    expect(screen.getByTestId('single-dropdown-field')).toBeInTheDocument();

    const dropdown = screen.getByTestId('single-dropdown-field');
    const options = JSON.parse(dropdown.getAttribute('data-options'));

    expect(options).toHaveLength(1);
    expect(options).toEqual([{ label: 'Source-to-Image', value: 'source-to-image' }]);
  });

  it('should list buildah if Dockerfile Import Strategy is selected, buildah clusterBuildStrategy is found', () => {
    spySWClusterBuildStrategy.mockReturnValue([{ buildah: true }, true]);

    render(<BuildStrategySelector formType="create" importStrategy={1} />);

    expect(screen.getByTestId('single-dropdown-field')).toBeInTheDocument();

    const dropdown = screen.getByTestId('single-dropdown-field');
    const options = JSON.parse(dropdown.getAttribute('data-options'));

    expect(options).toHaveLength(1);
    expect(options).toEqual([{ label: 'Buildah', value: 'buildah' }]);
  });

  it('should not list buildah if buildah clusterBuildStrategy is not found', () => {
    spySWClusterBuildStrategy.mockReturnValue([{ buildah: false }, true]);

    render(<BuildStrategySelector formType="create" importStrategy={1} />);

    expect(screen.getByTestId('single-dropdown-field')).toBeInTheDocument();

    const dropdown = screen.getByTestId('single-dropdown-field');
    const options = JSON.parse(dropdown.getAttribute('data-options'));

    expect(options).toHaveLength(0);
    expect(options).toEqual([]);
  });

  it('should not list s2i if s2i clusterBuildStrategy is not found', () => {
    spySWClusterBuildStrategy.mockReturnValue([{ s2i: false }, true]);

    render(<BuildStrategySelector formType="create" importStrategy={0} />);

    expect(screen.getByTestId('single-dropdown-field')).toBeInTheDocument();

    const dropdown = screen.getByTestId('single-dropdown-field');
    const options = JSON.parse(dropdown.getAttribute('data-options'));

    expect(options).toHaveLength(0);
    expect(options).toEqual([]);
  });

  it('should render dropdown with correct props when loaded', () => {
    spySWClusterBuildStrategy.mockReturnValue([{ s2i: true }, true]);

    render(<BuildStrategySelector formType="create" importStrategy={0} />);

    const dropdown = screen.getByTestId('single-dropdown-field');

    expect(dropdown).toHaveAttribute('data-name', 'build.clusterBuildStrategy');
    expect(dropdown).toHaveAttribute('data-label', 'Cluster Build Strategy');
    expect(dropdown).toHaveAttribute('data-is-disabled', 'false');
    expect(dropdown).toHaveAttribute('data-toggle-on-selection', 'true');
    expect(dropdown).toHaveAttribute('data-aria-label', 'Cluster Build Strategy');
    expect(dropdown).toHaveAttribute('data-placeholder-text', 'Select Cluster Build Strategy');
  });

  it('should disable dropdown when formType is edit', () => {
    spySWClusterBuildStrategy.mockReturnValue([{ s2i: true }, true]);

    render(<BuildStrategySelector formType="edit" importStrategy={0} />);

    const dropdown = screen.getByTestId('single-dropdown-field');
    expect(dropdown).toHaveAttribute('data-is-disabled', 'true');
  });
});
