import * as React from 'react';
import { shallow } from 'enzyme';
import { LoadingInline } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { SelectInputField } from '@console/shared';
import PortInputField from '../../route/PortInputField';
import ServerlessRouteSection from '../ServerlessRouteSection';

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
        domainMapping: [],
      },
    },
  };
  return {
    useField: jest.fn(() => [{}, {}]),
    useFormikContext: jest.fn(() => context),
    getFieldId: jest.fn(),
  };
});

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(),
}));

const domainMappingMock: K8sResourceKind[] = [
  {
    apiVersion: 'serving.knative.dev/v1alpha1',
    kind: 'DomainMapping',
    metadata: {
      name: 'example.org',
      namespace: 'my-app',
    },
    spec: {
      ref: {
        name: 'svc1',
        kind: 'Service',
        apiVersion: 'serving.knative.dev/v1',
      },
    },
  },
];

describe(' ServerlessRouteSection', () => {
  it('Should render ServerlessRouteSection', () => {
    (useK8sWatchResource as jest.Mock).mockReturnValueOnce([[], true]);
    const component = shallow(<ServerlessRouteSection />);
    expect(component.isEmptyRender()).toBe(false);
  });

  it('Should render PortInputField', () => {
    (useK8sWatchResource as jest.Mock).mockReturnValueOnce([[], true]);
    const component = shallow(<ServerlessRouteSection />);
    expect(component.find(PortInputField).exists()).toBe(true);
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
    (useK8sWatchResource as jest.Mock).mockReturnValueOnce([domainMappingMock, true]);
    const component = shallow(<ServerlessRouteSection />);
    expect(component.find(SelectInputField).exists()).toBe(true);
    expect(component.find(SelectInputField).props().options).toEqual([
      { value: 'example.org', disabled: false },
    ]);
  });

  it('Should render LoadingInline not SelectInputField if domainMapping is inflight', () => {
    (useK8sWatchResource as jest.Mock).mockReturnValueOnce([null, false]);
    const component = shallow(<ServerlessRouteSection />);
    expect(component.find(SelectInputField).exists()).toBe(false);
    expect(component.find(LoadingInline).exists()).toBe(true);
  });
});
