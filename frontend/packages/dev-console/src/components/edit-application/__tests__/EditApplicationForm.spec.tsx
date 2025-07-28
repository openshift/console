/* eslint-disable global-require, @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports */
import { configure, screen } from '@testing-library/react';
import { formikFormProps } from '@console/shared/src/test-utils/formik-props-utils';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { ApplicationFlowType } from '../edit-application-utils';
import EditApplicationForm from '../EditApplicationForm';
import '@testing-library/jest-dom';

configure({ testIdAttribute: 'data-test' });

global.ResizeObserver = class ResizeObserver {
  observe = () => {};

  unobserve = () => {};

  disconnect = () => {};
};

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  Trans: ({ children }) => children,
  withTranslation: () => (Component: React.ComponentType) => Component,
}));

jest.mock('@console/internal/module/k8s', () => ({
  ...jest.requireActual('@console/internal/module/k8s'),
  referenceFor: () => 'apps~v1~Deployment',
  modelFor: () => ({ kind: 'Deployment', crd: false }),
}));

jest.mock('@console/pipelines-plugin/src/components/import/pipeline/PipelineSection', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () =>
      React.createElement('div', { 'data-test': 'pipeline-section' }, 'Pipeline Section'),
  };
});

jest.mock('../../import/advanced/AdvancedSection', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () =>
      React.createElement('div', { 'data-test': 'advanced-section' }, 'Advanced Section'),
  };
});

jest.mock('../../import/app/AppSection', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => React.createElement('div', { 'data-test': 'app-section' }, 'App Section'),
  };
});

jest.mock('../../import/git/GitSection', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => React.createElement('div', { 'data-test': 'git-section' }, 'Git Section'),
  };
});

jest.mock('../../import/builder/BuilderSection', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () =>
      React.createElement('div', { 'data-test': 'builder-section' }, 'Builder Section'),
  };
});

jest.mock('../../import/section/build-section/BuildSection', () => {
  const React = require('react');
  return {
    BuildSection: () =>
      React.createElement('div', { 'data-test': 'build-section' }, 'Build Section'),
  };
});

let editApplicationFormProps: React.ComponentProps<typeof EditApplicationForm>;

describe('EditApplicationForm', () => {
  beforeEach(() => {
    editApplicationFormProps = {
      ...formikFormProps,
      values: {} as any,
      initialValues: {} as any,
      flowType: ApplicationFlowType.Git,
      builderImages: null,
      appResources: {} as any,
    };
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should have access to ApplicationFlowType enum values', () => {
    expect(ApplicationFlowType.Container).toBe('Deploy Image');
    expect(ApplicationFlowType.Git).toBe('Import from Git');
    expect(ApplicationFlowType.Dockerfile).toBe('Import from Dockerfile');
    expect(ApplicationFlowType.JarUpload).toBe('Upload JAR file');
  });

  it('should load EditApplicationForm', () => {
    renderWithProviders(<EditApplicationForm {...editApplicationFormProps} />);

    expect(screen.getByTestId('git-section')).toBeInTheDocument();
    expect(screen.getByTestId('builder-section')).toBeInTheDocument();
    expect(screen.getByTestId('app-section')).toBeInTheDocument();
    expect(screen.getByTestId('advanced-section')).toBeInTheDocument();
  });
});
