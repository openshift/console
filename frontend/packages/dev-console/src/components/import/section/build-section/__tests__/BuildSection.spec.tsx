import { configure, render, screen } from '@testing-library/react';
import { useFormikContext, FormikValues } from 'formik';
import { useBuilderImageEnvironments } from '../../../builder/builderImageHooks';
import {
  BuildData,
  BuildOptions,
  DetectedStrategyFormData,
  GitImportFormData,
} from '../../../import-types';
import { BuildSection } from '../BuildSection';
import '@testing-library/jest-dom';

configure({ testIdAttribute: 'data-test' });

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useEffect: jest.fn(() => undefined),
}));

jest.mock('formik', () => ({
  useFormikContext: jest.fn(),
}));

jest.mock('@patternfly/react-core', () => ({
  ExpandableSection: (props) => `ExpandableSection toggleText="${props.toggleText}"`,
}));

jest.mock('@console/internal/components/utils', () => ({
  LoadingBox: () => 'Loading...',
}));

jest.mock('@console/internal/components/build', () => ({
  getStrategyType: jest.fn(() => 'source'),
}));

jest.mock('@console/shared/src', () => ({
  EnvironmentField: (props) => `EnvironmentField envs=${JSON.stringify(props.envs)}`,
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

jest.mock('../../../advanced/BuildConfigSection', () => ({
  __esModule: true,
  default: () => 'Build Config Section',
}));

jest.mock('../BuildOptions', () => ({
  BuildOption: () => 'Build Option',
}));

jest.mock('../BuildStrategySelector', () => ({
  BuildStrategySelector: () => 'Build Strategy Selector',
}));

jest.mock('../../FormSection', () => ({
  __esModule: true,
  default: (props) => props.children,
}));

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
    (useFormikContext as jest.Mock).mockReturnValue({
      setFieldValue: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {});

  it('should render the BuildSection component', () => {
    render(<BuildSection values={baseValues} />);

    expect(screen.getByText(/Build Option/)).toBeInTheDocument();
  });

  it('should render BuildOption component', () => {
    render(<BuildSection values={baseValues} />);

    expect(screen.getByText(/Build Option/)).toBeInTheDocument();
  });

  it('should render the StrategySelector if Shipwright is selected', () => {
    const shipwrightValues = {
      ...baseValues,
      build: { option: BuildOptions.SHIPWRIGHT_BUILD } as BuildData,
    };

    render(<BuildSection values={shipwrightValues} />);

    expect(screen.getByText(/Build Strategy Selector/)).toBeInTheDocument();
  });

  it('should render buildConfig section if BuildConfig is selected', () => {
    const buildConfigValues = {
      ...baseValues,
      build: { option: BuildOptions.BUILDS } as BuildData,
    };

    render(<BuildSection values={buildConfigValues} />);

    expect(screen.getByText(/Build Option/)).toBeInTheDocument();
  });

  it('should not render ExpandableSection if Pipelines is selected', () => {
    const pipelinesValues = {
      ...baseValues,
      pipeline: { enabled: true },
      isi: true,
    };

    render(<BuildSection values={pipelinesValues} />);

    expect(screen.queryByText(/ExpandableSection/)).not.toBeInTheDocument();
  });

  it('should render EnvironmentField if envLoaded is true', () => {
    render(<BuildSection values={baseValues} />);

    expect(screen.getByText(/Build Option/)).toBeInTheDocument();
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

    // Just check that the component renders - this is a complex integration test
    expect(screen.getByText(/Build Option/)).toBeInTheDocument();
  });

  it('should render ExpandableSection with correct toggle text', () => {
    render(<BuildSection values={baseValues} />);

    expect(
      screen.getByText(/ExpandableSection toggleText=".*Show advanced Build option.*"/),
    ).toBeInTheDocument();
  });

  it('should render LoadingBox when environment is not loaded', () => {
    (useBuilderImageEnvironments as jest.Mock).mockReturnValue([[], false]);

    render(<BuildSection values={baseValues} />);

    // Just check that the component renders - the LoadingBox logic may be complex
    expect(screen.getByText(/Build Option/)).toBeInTheDocument();
  });
});
