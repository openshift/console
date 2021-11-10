import * as React from 'react';
import { shallow } from 'enzyme';
import { useFormikContext } from 'formik';
import { LoadingInline } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { SelectInputField } from '@console/shared';
import ServerlessRouteSection from '../ServerlessRouteSection';
import { domainMappings } from './serverless-utils.data';

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

describe(' ServerlessRouteSection', () => {
  it('Should render ServerlessRouteSection', () => {
    (useK8sWatchResource as jest.Mock).mockReturnValueOnce([[], true]);
    const component = shallow(<ServerlessRouteSection />);
    expect(component.isEmptyRender()).toBe(false);
  });

  it('Should render SelectInputField if domainMappingLoaded is true', () => {
    (useK8sWatchResource as jest.Mock).mockReturnValueOnce([[], true]);
    const component = shallow(<ServerlessRouteSection />);
    expect(component.find(SelectInputField).exists()).toBe(true);
    expect(component.find(SelectInputField).props().options).toEqual([]);
  });

  it('Should render SelectInputField if domainMapping could not load', () => {
    (useK8sWatchResource as jest.Mock).mockReturnValueOnce([null, null, 'err']);
    const component = shallow(<ServerlessRouteSection />);
    expect(component.find(SelectInputField).exists()).toBe(true);
    expect(component.find(SelectInputField).props().options).toEqual([]);
  });

  it('Should render SelectInputField if domainMappingLoaded is true and has data with valid options', () => {
    (useK8sWatchResource as jest.Mock).mockReturnValueOnce([domainMappings, true]);
    const component = shallow(<ServerlessRouteSection />);
    expect(component.find(SelectInputField).exists()).toBe(true);
    expect(component.find(SelectInputField).props().options).toEqual([
      { value: 'example.domain1.org (service-one)', disabled: false },
      { value: 'example.domain2.org (service-two)', disabled: false },
    ]);
  });

  it('Should render SelectInputField with the domain mapping options without other ksvc info', () => {
    const connectedDomainMapping = { ...domainMappings[0] };
    connectedDomainMapping.spec.ref.name = 'hello-openshift';
    (useK8sWatchResource as jest.Mock).mockReturnValueOnce([[connectedDomainMapping], true]);
    const component = shallow(<ServerlessRouteSection />);
    expect(component.find(SelectInputField).props().options).toEqual([
      { value: 'example.domain1.org', disabled: false },
    ]);
  });

  it('Should not contain the warning Alert if the selected domain is not from other knative services', () => {
    const connectedDomainMapping = { ...domainMappings[0] };
    connectedDomainMapping.spec.ref.name = 'hello-openshift';
    (useK8sWatchResource as jest.Mock).mockReturnValueOnce([[connectedDomainMapping], true]);
    const component = shallow(<ServerlessRouteSection />);
    expect(component.find('[data-test="domain-mapping-warning"]').exists()).toBe(false);
  });

  it('Should contain the warning Alert if any of the selected domains is from other knative services', () => {
    useFormikContextMock.mockReturnValue({
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
    const component = shallow(<ServerlessRouteSection />);
    expect(component.find('[data-test="domain-mapping-warning"]').exists()).toBe(true);
  });

  it('Should render LoadingInline not SelectInputField if domainMapping is inflight', () => {
    (useK8sWatchResource as jest.Mock).mockReturnValueOnce([null, false]);
    const component = shallow(<ServerlessRouteSection />);
    expect(component.find(SelectInputField).exists()).toBe(false);
    expect(component.find(LoadingInline).exists()).toBe(true);
  });
});
