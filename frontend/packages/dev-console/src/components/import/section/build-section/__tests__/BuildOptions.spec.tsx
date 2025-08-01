/* eslint-disable global-require, @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports */
import { configure, render, screen } from '@testing-library/react';
import * as shipwrightHooks from '@console/dev-console/src/utils/shipwright-build-hook';
import { BuildOption as NamedBuildOption } from '../BuildOptions';
// eslint-disable-next-line import/order
import * as BuildOption from '../BuildOptions';
import '@testing-library/jest-dom';

configure({ testIdAttribute: 'data-test' });

const spySWClusterBuildStrategy = jest.spyOn(shipwrightHooks, 'useClusterBuildStrategy');
const spyShipwrightBuilds = jest.spyOn(shipwrightHooks, 'useShipwrightBuilds');

const mockUseFormikContext = require('formik').useFormikContext;
const { useFlag } = require('@console/shared');

const spyUseFlag = useFlag;
const spyUsePipelineAccessReview = jest.spyOn(BuildOption, 'usePipelineAccessReview');

jest.mock('@console/shared', () => ({
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
      },
      `Dropdown: ${props.label}`,
    );
  },
  SelectInputOption: {},
  useFlag: jest.fn(),
}));

jest.mock('@console/internal/components/utils', () => ({
  LoadingInline: function MockLoadingInline() {
    const React = require('react');
    return React.createElement('div', { 'data-test': 'loading-inline' }, 'Loading...');
  },
  useAccessReview: jest.fn(),
}));

jest.mock('@console/internal/actions/ui', () => ({
  getActiveNamespace: jest.fn(() => 'test-namespace'),
}));

jest.mock('@console/pipelines-plugin/src/const', () => ({
  CLUSTER_PIPELINE_NS: 'openshift-pipelines',
  FLAG_OPENSHIFT_PIPELINE: 'OPENSHIFT_PIPELINE',
}));

jest.mock('@console/pipelines-plugin/src/models', () => ({
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

jest.mock('../../../../../utils/shipwright-build-hook', () => ({
  isPreferredStrategyAvailable: jest.fn(() => true),
  useClusterBuildStrategy: jest.fn(),
  useShipwrightBuilds: jest.fn(),
}));

jest.mock('../../../import-types', () => ({
  BuildOptions: {
    SHIPWRIGHT_BUILD: 'SHIPWRIGHT_BUILD',
    BUILDS: 'BUILDS',
    PIPELINES: 'PIPELINES',
  },
  ReadableBuildOptions: {
    SHIPWRIGHT_BUILD: 'devconsole~Builds for OpenShift (Shipwright)',
    BUILDS: 'devconsole~BuildConfig',
    PIPELINES: 'devconsole~Build using pipelines',
  },
}));

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  Trans: function MockTrans(props) {
    const React = require('react');
    return React.createElement('p', { 'data-test': 'trans' }, props.children);
  },
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
    mockUseFormikContext.mockReturnValue({
      setFieldValue: jest.fn(),
    });

    spyShipwrightBuilds.mockReset();
    spySWClusterBuildStrategy.mockReset();
    spyUsePipelineAccessReview.mockReset();

    const { useAccessReview } = require('@console/internal/components/utils');
    useAccessReview.mockReturnValue(true);

    const { isPreferredStrategyAvailable } = require('../../../../../utils/shipwright-build-hook');
    isPreferredStrategyAvailable.mockReturnValue(true);
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

    expect(screen.getByTestId('single-dropdown-field')).toBeInTheDocument();

    const dropdown = screen.getByTestId('single-dropdown-field');
    const options = JSON.parse(dropdown.getAttribute('data-options'));

    expect(options).toHaveLength(3);
    expect(options).toEqual([
      {
        description:
          'devconsole~Shipwright is an extensible framework for building container images on OpenShift Container Platform cluster.',
        label: 'devconsole~Builds for OpenShift (Shipwright)',
        value: 'SHIPWRIGHT_BUILD',
      },
      {
        description:
          'devconsole~Build configuration describes build definitions used for transforming source code into a runnable container image.',
        label: 'devconsole~BuildConfig',
        value: 'BUILDS',
      },
      {
        description:
          'devconsole~Build using pipeline describes a process for transforming source code into a runnable container image. Pipelines support can be added using Red Hat OpenShift Pipelines Operator.',
        label: 'devconsole~Build using pipelines',
        value: 'PIPELINES',
      },
    ]);
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

    expect(screen.getByTestId('single-dropdown-field')).toBeInTheDocument();

    const dropdown = screen.getByTestId('single-dropdown-field');
    const options = JSON.parse(dropdown.getAttribute('data-options'));

    expect(options).toHaveLength(2);
    expect(options).not.toContainEqual({
      description:
        'devconsole~Build configuration describes build definitions used for transforming source code into a runnable container image.',
      label: 'devconsole~BuildConfig',
      value: 'BUILDS',
    });
    expect(options).toEqual([
      {
        description:
          'devconsole~Shipwright is an extensible framework for building container images on OpenShift Container Platform cluster.',
        label: 'devconsole~Builds for OpenShift (Shipwright)',
        value: 'SHIPWRIGHT_BUILD',
      },
      {
        description:
          'devconsole~Build using pipeline describes a process for transforming source code into a runnable container image. Pipelines support can be added using Red Hat OpenShift Pipelines Operator.',
        label: 'devconsole~Build using pipelines',
        value: 'PIPELINES',
      },
    ]);
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

    expect(screen.getByTestId('single-dropdown-field')).toBeInTheDocument();

    const dropdown = screen.getByTestId('single-dropdown-field');
    const options = JSON.parse(dropdown.getAttribute('data-options'));

    expect(options).toHaveLength(1);
    expect(options).not.toContainEqual({
      description:
        'devconsole~Shipwright is an extensible framework for building container images on OpenShift Container Platform cluster.',
      label: 'devconsole~Builds for OpenShift (Shipwright)',
      value: 'SHIPWRIGHT_BUILD',
    });
    expect(options).toEqual([
      {
        description:
          'devconsole~Build configuration describes build definitions used for transforming source code into a runnable container image.',
        label: 'devconsole~BuildConfig',
        value: 'BUILDS',
      },
    ]);
  });

  it('should show LoadingInline when strategy is not loaded', () => {
    spyUseFlag.mockReturnValue(true);
    spyShipwrightBuilds.mockReturnValue(true);
    spySWClusterBuildStrategy.mockReturnValue([{ s2i: true }, false]); // strategyLoaded = false
    spyUsePipelineAccessReview.mockReturnValue(true);

    render(<NamedBuildOption {...defaultProps} />);

    expect(screen.getByTestId('loading-inline')).toBeInTheDocument();
    expect(screen.queryByTestId('single-dropdown-field')).not.toBeInTheDocument();
  });
});
