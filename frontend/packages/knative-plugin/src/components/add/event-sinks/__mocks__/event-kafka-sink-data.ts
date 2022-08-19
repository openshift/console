import { FormikValues } from 'formik';
import { EventSinkFormData } from '../../import-types';

export const kafkaSinkMockFormData: EventSinkFormData = {
  project: {
    name: 'my-app',
    displayName: '',
    description: '',
  },
  application: {
    initial: '',
    name: '',
    selectedKey: '',
    isInContext: false,
  },
  name: 'kafka-sink',
  apiVersion: 'eventing.knative.dev/v1alpha1',
  type: 'KafkaSink',
  data: {
    KafkaSink: {
      bootstrapServers: [],
      topic: '',
      auth: {
        secret: {
          ref: {
            name: '',
          },
        },
      },
    },
  },
};

export const formikMockDataKafkaSink = {
  setFieldValue: jest.fn(),
  setFieldTouched: jest.fn(),
  values: {
    editorType: 'form',
    formData: kafkaSinkMockFormData,
    yamlData: '',
  } as FormikValues,
};
