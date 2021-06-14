import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { FormikProps, FormikValues } from 'formik';
import ResourceLimitSection from '@console/dev-console/src/components/import/advanced/ResourceLimitSection';
import { formikFormProps } from '@console/shared/src/test-utils/formik-props-utils';
import ResourceLimitsModal from '../ResourceLimitsModal';

type ResourceLimitsModalProps = React.ComponentProps<typeof ResourceLimitsModal>;

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

describe('ResourceLimitsModal Form', () => {
  let formProps: ResourceLimitsModalProps;
  let ResourceLimitsModalWrapper: ShallowWrapper<ResourceLimitsModalProps>;

  type Props = FormikProps<FormikValues> & ResourceLimitsModalProps;

  beforeEach(() => {
    formProps = {
      ...formikFormProps,
      resource: {
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
    } as Props;
    ResourceLimitsModalWrapper = shallow(<ResourceLimitsModal {...formProps} />);
  });

  it('should render ResouceLimitSection', () => {
    expect(ResourceLimitsModalWrapper.find(ResourceLimitSection)).toHaveLength(1);
  });

  it('should call handleSubmit on form submit', () => {
    ResourceLimitsModalWrapper.simulate('submit');
    expect(formProps.handleSubmit).toHaveBeenCalledTimes(1);
  });
});
