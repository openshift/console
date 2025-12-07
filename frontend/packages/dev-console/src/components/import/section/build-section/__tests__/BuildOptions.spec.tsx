import { render, screen } from '@testing-library/react';
import { useFormikContext } from 'formik';
import { useAccessReview } from '@console/internal/components/utils';
import { useFlag } from '@console/shared';
import * as shipwrightBuildHook from '../../../../../utils/shipwright-build-hook';
import { BuildOption as NamedBuildOption, usePipelineAccessReview } from '../BuildOptions';

jest.mock('../../../../../utils/shipwright-build-hook', () => ({
  isPreferredStrategyAvailable: jest.fn(() => true),
  useClusterBuildStrategy: jest.fn(),
  useShipwrightBuilds: jest.fn(),
}));

jest.mock('../BuildOptions', () => {
  const actual = jest.requireActual('../BuildOptions');
  return {
    ...actual,
    usePipelineAccessReview: jest.fn(),
  };
});

const spySWClusterBuildStrategy = shipwrightBuildHook.useClusterBuildStrategy as jest.Mock;
const spyShipwrightBuilds = shipwrightBuildHook.useShipwrightBuilds as jest.Mock;

const spyUseFlag = useFlag as jest.Mock;
const spyUsePipelineAccessReview = usePipelineAccessReview as jest.Mock;

jest.mock('@console/shared', () => ({
  SingleDropdownField: (props) => `SingleDropdownField options=${JSON.stringify(props.options)}`,
  SelectInputOption: {},
  useFlag: jest.fn<boolean, []>(),
}));

jest.mock('@console/internal/components/utils', () => ({
  LoadingInline: () => 'Loading...',
  useAccessReview: jest.fn(),
}));

jest.mock('@console/internal/actions/ui', () => ({
  getActiveNamespace: jest.fn(() => 'test-namespace'),
}));

jest.mock('../../../../../const', () => ({
  CLUSTER_PIPELINE_NS: 'openshift-pipelines',
  FLAG_OPENSHIFT_PIPELINE: 'OPENSHIFT_PIPELINE',
}));

jest.mock('../../../../../models/pipelines', () => ({
  PipelineModel: {
    apiGroup: 'tekton.dev',
    plural: 'pipelines',
  },
}));

jest.mock('@console/git-service/src/types', () => ({
  ImportStrategy: {
    DEVFILE: 'DEVFILE',
  },
}));

jest.mock('../../../../../const', () => ({
  FLAG_OPENSHIFT_BUILDCONFIG: 'OPENSHIFT_BUILDCONFIG',
}));

jest.mock('../../../import-types', () => ({
  BuildOptions: {
    SHIPWRIGHT_BUILD: 'SHIPWRIGHT_BUILD',
    BUILDS: 'BUILDS',
    PIPELINES: 'PIPELINES',
  },
  ReadableBuildOptions: {
    SHIPWRIGHT_BUILD: 'Builds for OpenShift (Shipwright)',
    BUILDS: 'BuildConfig',
    PIPELINES: 'Build using pipelines',
  },
}));

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  Trans: (props) => props.children,
}));

jest.mock('formik', () => ({
  useFormikContext: jest.fn(),
}));

describe('BuildOptions', () => {
  const defaultProps = {
    isDisabled: false,
    importStrategy: 0,
  };

  beforeEach(() => {
    (useFormikContext as jest.Mock).mockReturnValue({
      setFieldValue: jest.fn(),
    });

    spyShipwrightBuilds.mockReset();
    spySWClusterBuildStrategy.mockReset();
    spyUsePipelineAccessReview.mockReset();

    (useAccessReview as jest.Mock).mockReturnValue(true);
    (shipwrightBuildHook.isPreferredStrategyAvailable as jest.Mock).mockReturnValue(true);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should show all if Shipwright, BuildConfig & Pipelines are installed)', () => {
    spyUseFlag.mockImplementation((arg) => {
      if (arg === 'OPENSHIFT_BUILDCONFIG') {
        return true;
      }
      if (arg === 'OPENSHIFT_PIPELINE') {
        return true;
      }
      return true;
    });
    spyShipwrightBuilds.mockReturnValue(true);
    spySWClusterBuildStrategy.mockReturnValue([{ s2i: true }, true]);
    spyUsePipelineAccessReview.mockReturnValue(true);

    render(<NamedBuildOption {...defaultProps} />);

    expect(screen.getByText(/SingleDropdownField/)).toBeInTheDocument();

    const dropdownText = screen.getByText(/SingleDropdownField options=/);
    const optionsMatch = dropdownText.textContent.match(/options=(.+)/);
    const options = JSON.parse(optionsMatch[1]);

    expect(options).toHaveLength(3);

    // Check for Shipwright option
    expect(
      options.some(
        (option) =>
          option.value === 'SHIPWRIGHT_BUILD' &&
          option.label === 'Builds for OpenShift (Shipwright)' &&
          option.description.includes('Shipwright is an extensible framework'),
      ),
    ).toBe(true);

    // Check for BuildConfig option
    expect(
      options.some(
        (option) =>
          option.value === 'BUILDS' &&
          option.label === 'BuildConfig' &&
          option.description.includes('Build configuration describes build definitions'),
      ),
    ).toBe(true);

    // Check for Pipelines option
    expect(
      options.some(
        (option) =>
          option.value === 'PIPELINES' &&
          option.label === 'Build using pipelines' &&
          option.description.includes('Build using pipeline describes a process'),
      ),
    ).toBe(true);
  });

  it('should not show BuildConfig if it is not installed (SW & Pipelines Installed)', () => {
    spyUseFlag.mockImplementation((arg) => {
      if (arg === 'OPENSHIFT_BUILDCONFIG') {
        return false;
      }
      return true;
    });
    spyShipwrightBuilds.mockReturnValue(true);
    spySWClusterBuildStrategy.mockReturnValue([{ s2i: true }, true]);
    spyUsePipelineAccessReview.mockReturnValue(true);

    render(<NamedBuildOption {...defaultProps} />);

    expect(screen.getByText(/SingleDropdownField/)).toBeInTheDocument();

    const dropdownText = screen.getByText(/SingleDropdownField options=/);
    const optionsMatch = dropdownText.textContent.match(/options=(.+)/);
    const options = JSON.parse(optionsMatch[1]);

    expect(options).toHaveLength(2);

    // Should NOT have BuildConfig
    expect(options.some((option) => option.value === 'BUILDS')).toBe(false);

    // Should have Shipwright and Pipelines
    expect(options.some((option) => option.value === 'SHIPWRIGHT_BUILD')).toBe(true);
    expect(options.some((option) => option.value === 'PIPELINES')).toBe(true);
  });

  it('should not show Shipwright if it is not installed (BuildConfig Installed, Pipelines Not Installed)', () => {
    spyUseFlag.mockImplementation((arg) => {
      if (arg === 'OPENSHIFT_BUILDCONFIG') {
        return true;
      }
      if (arg === 'OPENSHIFT_PIPELINE') {
        return false;
      }
      return true;
    });
    spyShipwrightBuilds.mockReturnValue(false);
    spySWClusterBuildStrategy.mockReturnValue([{ s2i: false }, true]);
    spyUsePipelineAccessReview.mockReturnValue(false);

    render(<NamedBuildOption {...defaultProps} />);

    expect(screen.getByText(/SingleDropdownField/)).toBeInTheDocument();

    const dropdownText = screen.getByText(/SingleDropdownField options=/);
    const optionsMatch = dropdownText.textContent.match(/options=(.+)/);
    const options = JSON.parse(optionsMatch[1]);

    expect(options).toHaveLength(1);

    // Should NOT have Shipwright
    expect(options.some((option) => option.value === 'SHIPWRIGHT_BUILD')).toBe(false);

    // Should only have BuildConfig
    expect(options.some((option) => option.value === 'BUILDS')).toBe(true);
  });

  it('should show LoadingInline when strategy is not loaded', () => {
    spyUseFlag.mockReturnValue(true);
    spyShipwrightBuilds.mockReturnValue(true);
    spySWClusterBuildStrategy.mockReturnValue([{ s2i: true }, false]); // strategyLoaded = false
    spyUsePipelineAccessReview.mockReturnValue(true);

    render(<NamedBuildOption {...defaultProps} />);

    expect(screen.getByText(/Loading\.\.\./)).toBeInTheDocument();
    expect(screen.queryByText(/SingleDropdownField/)).not.toBeInTheDocument();
  });
});
