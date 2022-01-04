import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { FormikProps, FormikValues } from 'formik';
import { formikFormProps } from '@console/shared/src/test-utils/formik-props-utils';
import CreateServiceBindingForm from '../CreateServiceBindingForm';

type CreateServiceBindingFormProps = React.ComponentProps<typeof CreateServiceBindingForm>;

jest.mock(
  '@console/dev-console/src/components/topology/bindable-services/fetch-bindable-services-utils',
  () => ({
    fetchBindableServices: jest.fn(),
  }),
);

describe('CreateServiceBindingForm', () => {
  let CreateServiceBindingFormWrapper: ShallowWrapper<CreateServiceBindingFormProps>;

  type Props = FormikProps<FormikValues> & CreateServiceBindingFormProps;
  const formProps: Props = {
    ...formikFormProps,
    source: {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: {
        name: 'xyz-deployment',
      },
      spec: {
        selector: {
          matchLabels: {
            app: 'hello-openshift',
          },
        },
        replicas: 1,
        template: {
          metadata: {
            labels: {
              app: 'hello-openshift',
            },
          },
          spec: {
            containers: [
              {
                name: 'hello-openshift',
                image: 'openshift/hello-openshift',
                ports: [
                  {
                    containerPort: 8080,
                  },
                ],
              },
            ],
          },
        },
      },
    },
    target: {
      apiVersion: 'rhoas.redhat.com/v1alpha1',
      kind: 'KafkaConnection',
      metadata: {
        labels: {
          'app.kubernetes.io/component': 'external-service',
          'app.kubernetes.io/managed-by': 'rhoas',
        },
        name: 'kc',
        namespace: 'deb',
        resourceVersion: '59277',
        uid: '370cbb34-18b1-4d7f-980c-fa56f6f2cd90',
      },
      status: {},
    },
  };

  it('should not have bindable services dropdown component if the drop target is present', () => {
    CreateServiceBindingFormWrapper = shallow(<CreateServiceBindingForm {...formProps} />);
    expect(CreateServiceBindingFormWrapper.find('BindableServices').exists()).toBe(false);
  });

  it('should have bindable services dropdown component if the drop target is not present', () => {
    formProps.target = null;
    CreateServiceBindingFormWrapper = shallow(<CreateServiceBindingForm {...formProps} />);
    expect(CreateServiceBindingFormWrapper.find('BindableServices').exists()).toBe(true);
  });
});
