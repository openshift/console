import { render, screen } from '@testing-library/react';
import { useFormikContext } from 'formik';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import * as serverlessUtils from '../serverless-utils';
import ServerlessRouteSection from '../ServerlessRouteSection';
import { domainMappings } from './serverless-utils.data';
import '@testing-library/jest-dom';

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
  Alert: (props) => `Alert variant=${props.variant} title="${props.title}"`,
}));

jest.mock('@console/internal/components/utils', () => ({
  LoadingInline: () => 'Loading...',
}));

jest.mock('@console/shared', () => ({
  MultiTypeaheadField: () => 'MultiTypeaheadField',
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

describe('ServerlessRouteSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Should render ServerlessRouteSection', () => {
    (useK8sWatchResource as jest.Mock).mockReturnValueOnce([[], true]);

    render(<ServerlessRouteSection />);

    expect(screen.getByText(/MultiTypeaheadField/)).toBeInTheDocument();
  });

  it('Should render MultiTypeaheadField if domainMappingLoaded is true', () => {
    (useK8sWatchResource as jest.Mock).mockReturnValueOnce([[], true]);

    render(<ServerlessRouteSection />);

    expect(screen.getByText(/MultiTypeaheadField/)).toBeInTheDocument();
  });

  it('Should render MultiTypeaheadField if domainMapping could not load', () => {
    (useK8sWatchResource as jest.Mock).mockReturnValueOnce([null, null, 'err']);

    render(<ServerlessRouteSection />);

    expect(screen.getByText(/MultiTypeaheadField/)).toBeInTheDocument();
  });

  it('Should render MultiTypeaheadField if domainMappingLoaded is true and has data with valid options', () => {
    (useK8sWatchResource as jest.Mock).mockReturnValueOnce([domainMappings, true]);

    render(<ServerlessRouteSection />);

    expect(screen.getByText(/MultiTypeaheadField/)).toBeInTheDocument();
  });

  it('Should render MultiTypeaheadField with the domain mapping options without other ksvc info', () => {
    const connectedDomainMapping = { ...domainMappings[0] };
    connectedDomainMapping.spec.ref.name = 'hello-openshift';
    (useK8sWatchResource as jest.Mock).mockReturnValueOnce([[connectedDomainMapping], true]);

    render(<ServerlessRouteSection />);

    expect(screen.getByText(/MultiTypeaheadField/)).toBeInTheDocument();
  });

  it('Should not contain the warning Alert if the selected domain is not from other knative services', () => {
    const connectedDomainMapping = { ...domainMappings[0] };
    connectedDomainMapping.spec.ref.name = 'hello-openshift';
    (useK8sWatchResource as jest.Mock).mockReturnValueOnce([[connectedDomainMapping], true]);

    render(<ServerlessRouteSection />);

    expect(screen.queryByText(/Alert/)).not.toBeInTheDocument();
  });

  it('Should contain the warning Alert if any of the selected domains is from other knative services', () => {
    (serverlessUtils.hasOtherKsvcDomainMappings as jest.Mock).mockReturnValue(true);

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
    (useK8sWatchResource as jest.Mock).mockReturnValueOnce([domainMappings, true]);

    render(<ServerlessRouteSection />);

    expect(screen.getByText(/Alert/)).toBeInTheDocument();
  });

  it('Should render LoadingInline not MultiTypeaheadField if domainMapping is inflight', () => {
    (useK8sWatchResource as jest.Mock).mockReturnValueOnce([null, false]);

    render(<ServerlessRouteSection />);

    expect(screen.queryByText(/MultiTypeaheadField/)).not.toBeInTheDocument();
    expect(screen.getByText(/Loading/)).toBeInTheDocument();
  });

  it('Should render MultiTypeaheadField with correct props', () => {
    (useK8sWatchResource as jest.Mock).mockReturnValueOnce([[], true]);

    render(<ServerlessRouteSection />);

    expect(screen.getByText(/MultiTypeaheadField/)).toBeInTheDocument();
  });
});
