/* eslint-disable global-require, @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports */
import { configure, render, screen } from '@testing-library/react';
import { useFormikContext } from 'formik';
import ServerlessRouteSection from '../ServerlessRouteSection';
// eslint-disable-next-line import/order
import { domainMappings } from './serverless-utils.data';
import '@testing-library/jest-dom';

configure({ testIdAttribute: 'data-test' });

const useFormikContextMock = useFormikContext as jest.Mock;
jest.mock('formik', () => {
  const context = {
    setFieldValue: jest.fn(),
    setFieldTouched: jest.fn(),
    validateForm: jest.fn(),
    values: {
      project: {
        name: 'my-app',
      },
      name: 'hello-openshift',
      image: {
        ports: [],
      },
      route: {
        defaultUnknownPort: 8080,
      },
      serverless: {
        scaling: {
          minpods: '',
          maxpods: '',
          concurrencytarget: '',
          concurrencylimit: '',
          autoscale: {
            autoscalewindow: '',
            autoscalewindowUnit: '',
            defaultAutoscalewindowUnit: 's',
          },
          concurrencyutilization: '',
        },
        domainMapping: ['example.domain1.org'],
      },
    },
  };
  return {
    useField: jest.fn(() => [{}, {}]),
    useFormikContext: jest.fn(() => context),
    getFieldId: jest.fn(),
  };
});

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(),
}));

jest.mock('@patternfly/react-core', () => ({
  Alert: function MockAlert(props) {
    const React = require('react');
    return React.createElement(
      'div',
      {
        'data-test': props['data-test'],
        'data-variant': props.variant,
        'data-is-inline': props.isInline,
        'data-title': props.title,
      },
      props.children,
    );
  },
}));

jest.mock('@console/internal/components/utils', () => ({
  LoadingInline: function MockLoadingInline() {
    const React = require('react');
    return React.createElement('div', { 'data-test': 'loading-inline' }, 'Loading...');
  },
}));

jest.mock('@console/shared', () => ({
  MultiTypeaheadField: function MockMultiTypeaheadField(props) {
    const React = require('react');
    return React.createElement(
      'div',
      {
        'data-test': 'multi-typeahead-field',
        'data-test-id': props['data-test-id'],
        'data-name': props.name,
        'data-label': props.label,
        'data-aria-label': props.ariaLabel,
        'data-options': JSON.stringify(props.options),
        'data-placeholder-text': props.placeholderText,
        'data-help-text': props.helpText,
        'data-is-creatable': props.isCreatable,
      },
      `MultiTypeahead: ${props.label}`,
    );
  },
}));

jest.mock('@console/knative-plugin/src', () => ({
  DomainMappingModel: {
    kind: 'DomainMapping',
    apiGroup: 'serving.knative.dev',
    apiVersion: 'v1alpha1',
  },
}));

jest.mock('@console/dynamic-plugin-sdk', () => ({}));

jest.mock('@console/internal/module/k8s', () => ({
  referenceForModel: jest.fn(() => 'serving.knative.dev~v1alpha1~DomainMapping'),
}));

jest.mock('../serverless-utils', () => ({
  getAllOtherDomainMappingInUse: jest.fn(() => []),
  getOtherKsvcFromDomainMapping: jest.fn((dm, name) => {
    if (dm.spec?.ref?.name !== name) {
      return dm.spec?.ref?.name;
    }
    return null;
  }),
  hasOtherKsvcDomainMappings: jest.fn(() => false),
  removeDuplicateDomainMappings: jest.fn((mappings) => mappings),
}));

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      if (key === 'devconsole~Domain mapping') return 'Domain mapping';
      if (key === 'devconsole~Add domain') return 'Add domain';
      if (key === 'devconsole~Enter custom domain to map to the Knative service')
        return 'Enter custom domain to map to the Knative service';
      if (key === 'devconsole~Domain mapping(s) will be updated')
        return 'Domain mapping(s) will be updated';
      if (
        key ===
        'devconsole~Warning: The following domain(s) will be removed from the associated service'
      )
        return 'Warning: The following domain(s) will be removed from the associated service';
      if (key === 'devconsole~{{domainMapping}} from {{knativeService}}') {
        return `${options.domainMapping} from ${options.knativeService}`;
      }
      return key;
    },
  }),
}));

const { useK8sWatchResource } = require('@console/internal/components/utils/k8s-watch-hook');

describe('ServerlessRouteSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Should render ServerlessRouteSection', () => {
    useK8sWatchResource.mockReturnValueOnce([[], true]);

    render(<ServerlessRouteSection />);

    expect(screen.getByTestId('multi-typeahead-field')).toBeInTheDocument();
  });

  it('Should render MultiTypeaheadField if domainMappingLoaded is true', () => {
    useK8sWatchResource.mockReturnValueOnce([[], true]);

    render(<ServerlessRouteSection />);

    expect(screen.getByTestId('multi-typeahead-field')).toBeInTheDocument();

    const field = screen.getByTestId('multi-typeahead-field');
    const options = JSON.parse(field.getAttribute('data-options'));
    expect(options).toEqual([]);
  });

  it('Should render MultiTypeaheadField if domainMapping could not load', () => {
    useK8sWatchResource.mockReturnValueOnce([null, null, 'err']);

    render(<ServerlessRouteSection />);

    expect(screen.getByTestId('multi-typeahead-field')).toBeInTheDocument();

    const field = screen.getByTestId('multi-typeahead-field');
    const options = JSON.parse(field.getAttribute('data-options'));
    expect(options).toEqual([]);
  });

  it('Should render MultiTypeaheadField if domainMappingLoaded is true and has data with valid options', () => {
    useK8sWatchResource.mockReturnValueOnce([domainMappings, true]);

    render(<ServerlessRouteSection />);

    expect(screen.getByTestId('multi-typeahead-field')).toBeInTheDocument();

    const field = screen.getByTestId('multi-typeahead-field');
    const options = JSON.parse(field.getAttribute('data-options'));
    expect(options).toEqual([
      { value: 'example.domain1.org (service-one)', disabled: false },
      { value: 'example.domain2.org (service-two)', disabled: false },
    ]);
  });

  it('Should render MultiTypeaheadField with the domain mapping options without other ksvc info', () => {
    const connectedDomainMapping = { ...domainMappings[0] };
    connectedDomainMapping.spec.ref.name = 'hello-openshift';
    useK8sWatchResource.mockReturnValueOnce([[connectedDomainMapping], true]);

    render(<ServerlessRouteSection />);

    const field = screen.getByTestId('multi-typeahead-field');
    const options = JSON.parse(field.getAttribute('data-options'));
    expect(options).toEqual([{ value: 'example.domain1.org', disabled: false }]);
  });

  it('Should not contain the warning Alert if the selected domain is not from other knative services', () => {
    const connectedDomainMapping = { ...domainMappings[0] };
    connectedDomainMapping.spec.ref.name = 'hello-openshift';
    useK8sWatchResource.mockReturnValueOnce([[connectedDomainMapping], true]);

    render(<ServerlessRouteSection />);

    expect(screen.queryByTestId('domain-mapping-warning')).not.toBeInTheDocument();
  });

  it('Should contain the warning Alert if any of the selected domains is from other knative services', () => {
    const { hasOtherKsvcDomainMappings } = require('../serverless-utils');
    hasOtherKsvcDomainMappings.mockReturnValue(true);

    useFormikContextMock.mockReturnValue({
      setFieldValue: jest.fn(),
      setFieldTouched: jest.fn(),
      validateForm: jest.fn(),
      values: {
        project: {
          name: 'my-app',
        },
        name: 'hello-openshift',
        image: {
          ports: [],
        },
        route: {
          defaultUnknownPort: 8080,
        },
        serverless: {
          scaling: {
            minpods: '',
            maxpods: '',
            concurrencytarget: '',
            concurrencylimit: '',
            autoscale: {
              autoscalewindow: '',
              autoscalewindowUnit: '',
              defaultAutoscalewindowUnit: 's',
            },
            concurrencyutilization: '',
          },
          domainMapping: ['example.domain1.org  (service-one)'],
        },
      },
    });
    useK8sWatchResource.mockReturnValueOnce([domainMappings, true]);

    render(<ServerlessRouteSection />);

    expect(screen.getByTestId('domain-mapping-warning')).toBeInTheDocument();
    expect(screen.getByTestId('domain-mapping-warning')).toHaveAttribute('data-variant', 'warning');
    expect(screen.getByTestId('domain-mapping-warning')).toHaveAttribute(
      'data-title',
      'Domain mapping(s) will be updated',
    );
  });

  it('Should render LoadingInline not MultiTypeaheadField if domainMapping is inflight', () => {
    useK8sWatchResource.mockReturnValueOnce([null, false]);

    render(<ServerlessRouteSection />);

    expect(screen.queryByTestId('multi-typeahead-field')).not.toBeInTheDocument();
    expect(screen.getByTestId('loading-inline')).toBeInTheDocument();
  });

  it('Should render MultiTypeaheadField with correct props', () => {
    useK8sWatchResource.mockReturnValueOnce([[], true]);

    render(<ServerlessRouteSection />);

    const field = screen.getByTestId('multi-typeahead-field');

    expect(field).toHaveAttribute('data-test-id', 'domain-mapping-field');
    expect(field).toHaveAttribute('data-name', 'serverless.domainMapping');
    expect(field).toHaveAttribute('data-label', 'Domain mapping');
    expect(field).toHaveAttribute('data-aria-label', 'Domain mapping');
    expect(field).toHaveAttribute('data-placeholder-text', 'Add domain');
    expect(field).toHaveAttribute(
      'data-help-text',
      'Enter custom domain to map to the Knative service',
    );
    expect(field).toHaveAttribute('data-is-creatable', 'true');
  });
});
