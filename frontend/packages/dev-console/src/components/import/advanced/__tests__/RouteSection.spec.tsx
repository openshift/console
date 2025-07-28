/* eslint-disable global-require, @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports */
import { configure, screen } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { Resources } from '../../import-types';
import RouteSection from '../RouteSection';
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

jest.mock('../../route/PortInputField', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function MockPortInputField(props) {
      return React.createElement(
        'div',
        {
          'data-test': 'port-input-field',
          'data-default-port': props.defaultPort,
        },
        'Port Input Field',
      );
    },
  };
});

jest.mock('@console/shared', () => ({
  ...jest.requireActual('@console/shared'),
  CheckboxField: function MockCheckboxField(props) {
    const React = require('react');
    return React.createElement('input', {
      'data-test': `checkbox-field-${props.name}`,
      type: 'checkbox',
      name: props.name,
      'aria-label': props.label,
      disabled: props.isDisabled,
    });
  },
}));

jest.mock('../../route/AdvancedRouteOptions', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function MockAdvancedRouteOptions(props) {
      return React.createElement(
        'div',
        {
          'data-test': 'advanced-route-options',
          'data-can-create-route': props.canCreateRoute,
          'data-resources': props.resources,
        },
        'Advanced Route Options',
      );
    },
  };
});

jest.mock('formik', () => ({
  useFormikContext: jest.fn(() => ({
    values: {
      image: { ports: [] },
    },
    setFieldValue: jest.fn(),
    setFieldTouched: jest.fn(),
  })),
}));

describe('RouteSection', () => {
  let props: React.ComponentProps<typeof RouteSection>;

  beforeEach(() => {
    props = {
      route: {
        create: true,
        defaultUnknownPort: 8080,
        disable: false,
        hostname: '',
        path: '',
        secure: false,
        targetPort: '',
        tls: {
          caCertificate: '',
          certificate: '',
          destinationCACertificate: '',
          insecureEdgeTerminationPolicy: null,
          key: '',
          termination: null,
        },
        unknownTargetPort: '',
        labels: {},
      },
      resources: Resources.OpenShift,
    };
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('Render RouteCheckbox', () => {
    renderWithProviders(<RouteSection {...props} />);

    expect(screen.getByTestId('port-input-field')).toBeInTheDocument();
    expect(screen.getByTestId('checkbox-field-route.create')).toBeInTheDocument();
    expect(screen.getByTestId('advanced-route-options')).toBeInTheDocument();
  });

  it('should show the Target port field if the create route checkbox is checked', () => {
    renderWithProviders(<RouteSection {...props} />);

    const portInputField = screen.getByTestId('port-input-field');
    expect(portInputField).toBeInTheDocument();
    expect(portInputField.getAttribute('data-default-port')).toBe('8080');
  });

  it('should also show the Target port field if the create route checkbox is not checked', () => {
    props.route.create = false;
    renderWithProviders(<RouteSection {...props} />);

    const portInputField = screen.getByTestId('port-input-field');
    expect(portInputField).toBeInTheDocument();
    expect(portInputField.getAttribute('data-default-port')).toBe('8080');
  });
});
