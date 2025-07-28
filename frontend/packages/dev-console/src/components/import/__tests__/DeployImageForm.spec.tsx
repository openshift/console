/* eslint-disable global-require, @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports */
import { configure, screen } from '@testing-library/react';
import { formikFormProps } from '@console/shared/src/test-utils/formik-props-utils';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import DeployImageForm from '../DeployImageForm';
import '@testing-library/jest-dom';

configure({ testIdAttribute: 'data-testid' });

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  withTranslation: () => (Component: React.ComponentType) => Component,
}));

jest.mock('../image-search/ImageSearchSection', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function MockImageSearchSection() {
      return React.createElement(
        'div',
        { 'data-testid': 'image-search-section' },
        'Image Search Section',
      );
    },
  };
});

jest.mock('../NamespaceSection', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function MockNamespaceSection() {
      return React.createElement(
        'div',
        { 'data-testid': 'namespace-section' },
        'Namespace Section',
      );
    },
  };
});

jest.mock('../section/IconSection', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function MockIconSection() {
      return React.createElement('div', { 'data-testid': 'icon-section' }, 'Icon Section');
    },
  };
});

jest.mock('../app/AppSection', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function MockAppSection() {
      return React.createElement('div', { 'data-testid': 'app-section' }, 'App Section');
    },
  };
});

jest.mock('../section/deploy-section/DeploySection', () => {
  const React = require('react');
  return {
    __esModule: true,
    DeploySection: function MockDeploySection() {
      return React.createElement('div', { 'data-testid': 'deploy-section' }, 'Deploy Section');
    },
  };
});

jest.mock('../advanced/AdvancedSection', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function MockAdvancedSection() {
      return React.createElement('div', { 'data-testid': 'advanced-section' }, 'Advanced Section');
    },
  };
});

jest.mock('@console/shared/src/components/form-utils', () => {
  const React = require('react');
  return {
    __esModule: true,
    ...jest.requireActual('@console/shared/src/components/form-utils'),
    FormFooter: function MockFormFooter() {
      return React.createElement('div', { 'data-testid': 'form-footer' }, 'Form Footer');
    },
    FlexForm: function MockFlexForm(props) {
      return React.createElement(
        'form',
        {
          'data-testid': 'deploy-image-form',
          onSubmit: props.onSubmit,
          className: props.className,
        },
        props.children,
      );
    },
    FormBody: function MockFormBody(props) {
      return React.createElement('div', { 'data-testid': 'form-body' }, props.children);
    },
  };
});

jest.mock('@console/internal/components/utils', () => ({
  __esModule: true,
  ...jest.requireActual('@console/internal/components/utils'),
  usePreventDataLossLock: jest.fn(),
}));

jest.mock('../../../utils/samples', () => ({
  __esModule: true,
  hasSampleQueryParameter: jest.fn(() => false), // Default to non-sample mode
}));

let deployImageFormProps: React.ComponentProps<typeof DeployImageForm>;

describe('DeployImageForm', () => {
  beforeEach(() => {
    deployImageFormProps = {
      ...formikFormProps,
      projects: {
        loaded: true,
        data: [],
      },
    };
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should render ImageSearchSection, IconSection, AppSection, AdvancedSection and FormFooter', () => {
    renderWithProviders(<DeployImageForm {...deployImageFormProps} />);
    expect(screen.getByTestId('image-search-section')).toBeInTheDocument();
    expect(screen.getByTestId('namespace-section')).toBeInTheDocument();
    expect(screen.getByTestId('icon-section')).toBeInTheDocument();
    expect(screen.getByTestId('app-section')).toBeInTheDocument();
    expect(screen.getByTestId('deploy-section')).toBeInTheDocument();
    expect(screen.getByTestId('advanced-section')).toBeInTheDocument();
    expect(screen.getByTestId('form-footer')).toBeInTheDocument();
  });
});
