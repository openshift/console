/* eslint-disable global-require, @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports */
import { configure, render, screen } from '@testing-library/react';
import { Resources } from '../../import-types';
import AdvancedRouteOptions from '../AdvancedRouteOptions';
import '@testing-library/jest-dom';

configure({ testIdAttribute: 'data-test' });

jest.mock('@console/internal/module/k8s', () => ({
  ...jest.requireActual('@console/internal/module/k8s'),
  referenceFor: () => 'apps~v1~Deployment',
  modelFor: () => ({ kind: 'Deployment', crd: false }),
}));

jest.mock('@console/git-service/src', () => ({
  GitProvider: {},
}));

jest.mock('@patternfly/react-core', () => ({
  Alert: function MockAlert(props) {
    const React = require('react');
    return React.createElement(
      'div',
      {
        'data-test': 'alert',
        'data-variant': props.variant,
        'data-title': props.title,
        'data-inline': props.isInline,
      },
      props.children,
    );
  },
}));

jest.mock('@console/internal/components/utils', () => ({
  ExpandCollapse: function MockExpandCollapse(props) {
    const React = require('react');
    return React.createElement(
      'div',
      {
        'data-test': 'expand-collapse',
        'data-text-expanded': props.textExpanded,
        'data-text-collapsed': props.textCollapsed,
      },
      props.children,
    );
  },
}));

jest.mock('@console/shared/src/components/formik-fields/SelectorInputField', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function MockSelectorInputField(props) {
      return React.createElement('input', {
        'data-test': 'selector-input-field',
        'data-name': props.name,
        'data-label': props.label,
        'data-help-text': props.helpText,
        'data-placeholder': props.placeholder,
        'data-test-id': props.dataTest,
      });
    },
  };
});

jest.mock('../../section/FormSection', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function MockFormSection(props) {
      return React.createElement(
        'div',
        {
          'data-test': 'form-section',
        },
        props.children,
      );
    },
  };
});

jest.mock('../../serverless/ServerlessRouteSection', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function MockServerlessRouteSection() {
      return React.createElement(
        'div',
        {
          'data-test': 'serverless-route-section',
        },
        'Serverless Route Section',
      );
    },
  };
});

jest.mock('../CreateRoute', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function MockCreateRoute() {
      return React.createElement(
        'div',
        {
          'data-test': 'create-route',
        },
        'Create Route',
      );
    },
  };
});

jest.mock('../SecureRoute', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function MockSecureRoute() {
      return React.createElement(
        'div',
        {
          'data-test': 'secure-route',
        },
        'Secure Route',
      );
    },
  };
});

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  withTranslation: () => (Component: React.ComponentType) => Component,
  Trans: function MockTrans(props) {
    const React = require('react');
    return React.createElement('span', { 'data-testid': 'trans' }, props.children);
  },
}));

describe('AdvancedRoutingOptions:', () => {
  const defaultProps = {
    canCreateRoute: true,
    resources: Resources.OpenShift,
  };

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('Render AdvancedRoutingOptions', () => {
    render(<AdvancedRouteOptions {...defaultProps} />);
    expect(screen.getByTestId('expand-collapse')).toBeInTheDocument();
    expect(screen.getByTestId('form-section')).toBeInTheDocument();
    const expandCollapse = screen.getByTestId('expand-collapse');
    expect(expandCollapse.getAttribute('data-text-expanded')).toBe(
      'devconsole~Hide advanced Routing options',
    );
    expect(expandCollapse.getAttribute('data-text-collapsed')).toBe(
      'devconsole~Show advanced Routing options',
    );
  });

  it('should show serverless route section options', () => {
    const props = {
      ...defaultProps,
      resources: Resources.KnativeService,
    };
    render(<AdvancedRouteOptions {...props} />);
    expect(screen.getByTestId('serverless-route-section')).toBeInTheDocument();
    expect(screen.queryByTestId('create-route')).not.toBeInTheDocument();
    expect(screen.queryByTestId('secure-route')).not.toBeInTheDocument();
    expect(screen.queryByTestId('selector-input-field')).not.toBeInTheDocument();
  });

  it('should show route section options', () => {
    const props = {
      ...defaultProps,
      resources: Resources.OpenShift,
    };
    render(<AdvancedRouteOptions {...props} />);
    expect(screen.getByTestId('create-route')).toBeInTheDocument();
    expect(screen.getByTestId('secure-route')).toBeInTheDocument();
    expect(screen.getByTestId('selector-input-field')).toBeInTheDocument();
    expect(screen.queryByTestId('serverless-route-section')).not.toBeInTheDocument();
  });

  it('should show labels input option', () => {
    render(<AdvancedRouteOptions {...defaultProps} />);

    const selectorInputField = screen.getByTestId('selector-input-field');
    expect(selectorInputField).toBeInTheDocument();
    expect(selectorInputField.getAttribute('data-name')).toBe('route.labels');
    expect(selectorInputField.getAttribute('data-label')).toBe('devconsole~Labels');
    expect(selectorInputField.getAttribute('data-help-text')).toBe(
      'devconsole~Additional labels which are only added to the Route resource.',
    );
    expect(selectorInputField.getAttribute('data-placeholder')).toBe('app.io/type=frontend');
    expect(selectorInputField.getAttribute('data-test-id')).toBe('route-labels');
  });

  it('should not show route section and show alert', () => {
    const props = {
      ...defaultProps,
      canCreateRoute: false,
    };

    render(<AdvancedRouteOptions {...props} />);

    expect(screen.getByTestId('alert')).toBeInTheDocument();
    expect(screen.queryByTestId('create-route')).not.toBeInTheDocument();
    expect(screen.queryByTestId('secure-route')).not.toBeInTheDocument();
    expect(screen.queryByTestId('selector-input-field')).not.toBeInTheDocument();
    expect(screen.queryByTestId('serverless-route-section')).not.toBeInTheDocument();

    const alert = screen.getByTestId('alert');
    expect(alert.getAttribute('data-variant')).toBe('info');
    expect(alert.getAttribute('data-inline')).toBe('true');
    expect(alert.getAttribute('data-title')).toBe(
      'devconsole~Select the checkbox "Create a route" to edit advanced routing options',
    );
  });
});
