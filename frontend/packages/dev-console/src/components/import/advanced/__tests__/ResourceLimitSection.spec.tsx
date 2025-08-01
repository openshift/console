/* eslint-disable global-require, @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports */
import { configure, screen } from '@testing-library/react';
import { formikFormProps } from '@console/shared/src/test-utils/formik-props-utils';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import ResourceLimitSection from '../ResourceLimitSection';
import '@testing-library/jest-dom';

configure({ testIdAttribute: 'data-test' });

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  Trans: function MockTrans(props) {
    const React = require('react');
    return React.createElement('span', { 'data-testid': 'trans' }, props.children);
  },
  withTranslation: () => (Component: React.ComponentType) => Component,
}));

jest.mock('@console/internal/module/k8s', () => ({
  ...jest.requireActual('@console/internal/module/k8s'),
  referenceFor: () => 'apps~v1~Deployment',
  modelFor: () => ({ kind: 'Deployment', crd: false }),
}));

jest.mock('../../section/FormSection', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function MockFormSection(props) {
      return React.createElement(
        'div',
        {
          'data-test': 'form-section',
          'data-title': props.title,
          'data-subtitle': props.subTitle,
        },
        [
          props.title && React.createElement('h3', { key: 'title' }, props.title),
          props.subTitle && React.createElement('p', { key: 'subtitle' }, props.subTitle),
          props.children,
        ],
      );
    },
  };
});

jest.mock('@console/shared', () => ({
  ...jest.requireActual('@console/shared'),
  ResourceLimitField: function MockResourceLimitField(props) {
    const React = require('react');
    return React.createElement(
      'div',
      {
        'data-test': `resource-limit-field-${props.name}`,
      },
      `ResourceLimitField: ${props.label}`,
    );
  },
}));

jest.mock('@console/shared/src/components/heading/TertiaryHeading', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function MockTertiaryHeading(props) {
      return React.createElement(
        'h4',
        {
          'data-test': 'tertiary-heading',
        },
        props.children,
      );
    },
  };
});

jest.mock('@console/internal/components/utils', () => ({
  ...jest.requireActual('@console/internal/components/utils'),
  ResourceIcon: function MockResourceIcon(props) {
    const React = require('react');
    return React.createElement(
      'span',
      {
        'data-test': 'resource-icon',
      },
      `Icon:${props.kind}`,
    );
  },
}));

jest.mock('formik', () => ({
  useFormikContext: jest.fn(),
}));

let resourceLimitSectionProps: React.ComponentProps<typeof ResourceLimitSection>;

describe('ResourceLimitSection', () => {
  const { useFormikContext } = require('formik');

  beforeEach(() => {
    resourceLimitSectionProps = {
      ...formikFormProps,
      hideTitle: true,
    };
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should render helptext for resource limit section', () => {
    useFormikContext.mockReturnValue({
      values: {
        limits: {
          cpu: {
            request: '',
            requestUnit: '',
            defaultRequestUnit: '',
            limit: '',
            limitUnit: '',
            defaultLimitUnit: '',
          },
          memory: {
            request: '',
            requestUnit: 'Mi',
            defaultRequestUnit: 'Mi',
            limit: '',
            limitUnit: 'Mi',
            defaultLimitUnit: 'Mi',
          },
        },
        container: 'nodejs-container',
      },
    });

    renderWithProviders(<ResourceLimitSection {...resourceLimitSectionProps} />);

    const formSection = screen.getByTestId('form-section');
    expect(formSection.getAttribute('data-subtitle')).toBe(
      'devconsole~Resource limits control how much CPU and memory a container will consume on a node.',
    );
  });

  it('should not render Title for resource limit section', () => {
    useFormikContext.mockReturnValue({
      values: {
        limits: {
          cpu: {
            request: '',
            requestUnit: '',
            defaultRequestUnit: '',
            limit: '',
            limitUnit: '',
            defaultLimitUnit: '',
          },
          memory: {
            request: '',
            requestUnit: 'Mi',
            defaultRequestUnit: 'Mi',
            limit: '',
            limitUnit: 'Mi',
            defaultLimitUnit: 'Mi',
          },
        },
        container: 'nodejs-container',
      },
    });

    renderWithProviders(<ResourceLimitSection {...resourceLimitSectionProps} />);

    const formSection = screen.getByTestId('form-section');
    expect(formSection.getAttribute('data-title')).toBe('false');
  });

  it('should render container name for resource limit section', () => {
    useFormikContext.mockReturnValue({
      values: {
        limits: {
          cpu: {
            request: '',
            requestUnit: '',
            defaultRequestUnit: '',
            limit: '',
            limitUnit: '',
            defaultLimitUnit: '',
          },
          memory: {
            request: '',
            requestUnit: 'Mi',
            defaultRequestUnit: 'Mi',
            limit: '',
            limitUnit: 'Mi',
            defaultLimitUnit: 'Mi',
          },
        },
        container: 'nodejs-container',
      },
    });

    renderWithProviders(<ResourceLimitSection {...resourceLimitSectionProps} />);

    const containerHeading = document.querySelector(
      '[data-testid="ResourceLimitSection-container-heading"]',
    );
    expect(containerHeading).toBeInTheDocument();
    expect(containerHeading).toHaveTextContent('nodejs-container');
  });

  it('should not render container for resource limit section', () => {
    useFormikContext.mockReturnValue({
      values: {
        limits: {
          cpu: {
            request: '',
            requestUnit: '',
            defaultRequestUnit: '',
            limit: '',
            limitUnit: '',
            defaultLimitUnit: '',
          },
          memory: {
            request: '',
            requestUnit: 'Mi',
            defaultRequestUnit: 'Mi',
            limit: '',
            limitUnit: 'Mi',
            defaultLimitUnit: 'Mi',
          },
        },
        container: undefined,
      },
    });

    renderWithProviders(<ResourceLimitSection {...resourceLimitSectionProps} />);

    expect(
      document.querySelector('[data-testid="ResourceLimitSection-container-heading"]'),
    ).not.toBeInTheDocument();
  });
});
