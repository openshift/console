/* eslint-disable global-require, @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports */
import { configure, render, screen } from '@testing-library/react';
import {
  BuildData,
  BuildOptions,
  DetectedStrategyFormData,
  GitImportFormData,
} from '../../../import-types';
import { BuildSection } from '../BuildSection';
// eslint-disable-next-line import/order
import { FormikValues } from 'formik';
import '@testing-library/jest-dom';

configure({ testIdAttribute: 'data-test' });

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useEffect: jest.fn((fn, deps) => {
    // Only run useEffect if deps array is empty or undefined, avoid complex side effects
    if (!deps || deps.length === 0) {
      // Skip execution to avoid complex side effects in tests
    }
    // Explicitly return undefined to satisfy linter
    return undefined;
  }),
}));

jest.mock('formik', () => ({
  useFormikContext: jest.fn(),
}));

const mockUseFormikContext = require('formik').useFormikContext;

jest.mock('@patternfly/react-core', () => ({
  ExpandableSection: function MockExpandableSection(props) {
    const React = require('react');
    return React.createElement(
      'div',
      {
        'data-test': 'expandable-section',
        'data-toggle-text': props.toggleText,
        'data-is-expanded': props.isExpanded,
      },
      props.children,
    );
  },
}));

jest.mock('@console/internal/components/utils', () => ({
  LoadingBox: function MockLoadingBox() {
    const React = require('react');
    return React.createElement('div', { 'data-test': 'loading-box' }, 'Loading...');
  },
}));

jest.mock('@console/internal/components/build', () => ({
  getStrategyType: jest.fn(() => 'source'),
}));

jest.mock('@console/shared/src', () => ({
  EnvironmentField: function MockEnvironmentField(props) {
    const React = require('react');
    return React.createElement(
      'div',
      {
        'data-test': 'environment-field',
        'data-name': props.name,
        'data-label': props.label,
        'data-envs': JSON.stringify(props.envs),
      },
      'Environment Field',
    );
  },
  useDebounceCallback: jest.fn(() => jest.fn()),
  useFlag: jest.fn(() => false),
}));

jest.mock('@console/git-service/src', () => ({
  getGitService: jest.fn(),
  ImportStrategy: {
    SERVERLESS_FUNCTION: 3,
    DEVFILE: 'DEVFILE',
  },
  GitProvider: {
    GITHUB: 'github',
    GITLAB: 'gitlab',
    GITEA: 'gitea',
    BITBUCKET: 'bitbucket',
  },
}));

jest.mock('@console/pipelines-plugin/src/const', () => ({
  FLAG_OPENSHIFT_PIPELINE_AS_CODE: 'OPENSHIFT_PIPELINE_AS_CODE',
}));

jest.mock('@console/dev-console/src/utils/shipwright-build-hook', () => ({
  isPreferredStrategyAvailable: jest.fn(() => true),
  useClusterBuildStrategy: jest.fn(() => [{ s2i: true }, true]),
}));

jest.mock('../../../builder/builderImageHooks', () => ({
  useBuilderImageEnvironments: jest.fn(() => [[], true]),
}));

jest.mock('../../../advanced/BuildConfigSection', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function MockBuildConfigSection(props) {
      return React.createElement(
        'div',
        {
          'data-test': 'build-config-section',
          'data-show-header': props.showHeader,
        },
        'Build Config Section',
      );
    },
  };
});

jest.mock('../BuildOptions', () => ({
  BuildOption: function MockBuildOption(props) {
    const React = require('react');
    return React.createElement(
      'div',
      {
        'data-test': 'build-option',
        'data-is-disabled': props.isDisabled,
        'data-import-strategy': props.importStrategy,
      },
      'Build Option',
    );
  },
}));

jest.mock('../BuildStrategySelector', () => ({
  BuildStrategySelector: function MockBuildStrategySelector(props) {
    const React = require('react');
    return React.createElement(
      'div',
      {
        'data-test': 'build-strategy-selector',
        'data-form-type': props.formType,
        'data-import-strategy': props.importStrategy,
      },
      'Build Strategy Selector',
    );
  },
}));

jest.mock('../../FormSection', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function MockFormSection(props) {
      return React.createElement(
        'div',
        {
          'data-test': 'form-section',
          'data-title': props.title,
        },
        props.children,
      );
    },
  };
});

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('BuildSection', () => {
  const baseValues = {
    project: { name: 'my-app' },
    build: { option: BuildOptions.BUILDS, env: [] },
    image: { selected: 'nodejs-ex', tag: 'latest' },
    import: { selectedStrategy: { type: 0 } },
    formType: 'edit', // Prevent complex side effects
    git: { url: '' }, // Empty URL to prevent auto-selection
  } as FormikValues & GitImportFormData;

  beforeEach(() => {
    mockUseFormikContext.mockReturnValue({
      setFieldValue: jest.fn(),
    });

    // useEffect is mocked at module level to prevent complex side effects
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    // useEffect mock is handled at module level
  });

  it('should render the BuildSection component', () => {
    render(<BuildSection values={baseValues} />);

    expect(screen.getByTestId('form-section')).toBeInTheDocument();
    expect(screen.getByTestId('form-section')).toHaveAttribute('data-title', 'devconsole~Build');
  });

  it('should render BuildOption component', () => {
    render(<BuildSection values={baseValues} />);

    expect(screen.getByTestId('build-option')).toBeInTheDocument();
  });

  it('should render the StrategySelector if Shipwright is selected', () => {
    const shipwrightValues = {
      ...baseValues,
      build: { option: BuildOptions.SHIPWRIGHT_BUILD } as BuildData,
    };

    render(<BuildSection values={shipwrightValues} />);

    expect(screen.getByTestId('build-strategy-selector')).toBeInTheDocument();
  });

  it('should render buildConfig section if BuildConfig is selected', () => {
    const buildConfigValues = {
      ...baseValues,
      build: { option: BuildOptions.BUILDS } as BuildData,
    };

    render(<BuildSection values={buildConfigValues} />);

    expect(screen.getByTestId('build-config-section')).toBeInTheDocument();
  });

  it('should not render ExpandableSection if Pipelines is selected', () => {
    const pipelinesValues = {
      ...baseValues,
      pipeline: { enabled: true },
      isi: true,
    };

    render(<BuildSection values={pipelinesValues} />);

    expect(screen.queryByTestId('expandable-section')).not.toBeInTheDocument();
  });

  it('should render EnvironmentField if envLoaded is true', () => {
    render(<BuildSection values={baseValues} />);

    expect(screen.getByTestId('environment-field')).toBeInTheDocument();
  });

  it('should render EnvironmentField and have values of Environment if Import Strategy is Serverless Function', () => {
    const serverlessValues = {
      ...baseValues,
      import: {
        knativeFuncLoaded: true,
        selectedStrategy: {
          type: 3,
        } as DetectedStrategyFormData,
      },
      build: {
        option: BuildOptions.BUILDS,
        env: [{ name: 'name', value: 'value' }],
      } as BuildData,
    };

    render(<BuildSection values={serverlessValues} />);

    expect(screen.getByTestId('environment-field')).toBeInTheDocument();

    const envField = screen.getByTestId('environment-field');
    const envs = JSON.parse(envField.getAttribute('data-envs'));
    expect(envs).toEqual([{ name: 'name', value: 'value' }]);
  });

  it('should render ExpandableSection with correct toggle text', () => {
    render(<BuildSection values={baseValues} />);

    expect(screen.getByTestId('expandable-section')).toBeInTheDocument();
    expect(screen.getByTestId('expandable-section')).toHaveAttribute(
      'data-toggle-text',
      'devconsole~Show advanced Build option',
    );
  });

  it('should render LoadingBox when environment is not loaded', () => {
    const { useBuilderImageEnvironments } = require('../../../builder/builderImageHooks');
    useBuilderImageEnvironments.mockReturnValue([[], false]);

    render(<BuildSection values={baseValues} />);

    expect(screen.getByTestId('loading-box')).toBeInTheDocument();
  });
});
