import * as React from 'react';
import { shallow } from 'enzyme';
import { FormikValues, useFormikContext } from 'formik';
import AppSection from '@console/dev-console/src/components/import/app/AppSection';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { DynamicFormField } from '@console/shared';
import { mockKameletSink } from '../../__mocks__/Kamelet-data';
import { formikMockDataKafkaSink } from '../__mocks__/event-kafka-sink-data';
import EventSinkSection from '../EventSinkSection';
import KafkaSinkSection from '../KafkaSinkSection';
import SourceSection from '../SourceSection';

jest.mock('formik', () => ({
  useFormikContext: jest.fn(() => ({
    setFieldValue: jest.fn(),
    setFieldTouched: jest.fn(),
    values: {
      editorType: 'form',
      formData: {
        project: {
          name: 'my-app',
          displayName: '',
          description: '',
        },
        application: {
          initial: '',
          name: '',
          selectedKey: '',
        },
        name: 'sinkName',
        apiVersion: 'camel.apache.org/v1alpha1',
        sourceType: 'resource',
        source: {
          apiVersion: '',
          kind: '',
          name: '',
          key: '',
          uri: '',
        },
        type: 'KameletBinding',
        data: {
          KameletBinding: {
            sink: {
              ref: {
                apiVersion: 'camel.apache.org/v1alpha1',
                kind: 'Kamelet',
                name: 'kamelet-name',
              },
              properties: {},
            },
          },
        },
      },
      yamlData: '',
    } as FormikValues,
  })),
}));

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(),
}));

const mockFormikContext = useFormikContext as jest.Mock;

describe('EventSinkSection', () => {
  const namespace = 'myapp';

  it('should render SinkSection, AppSection, DynamicFormField for kamelet of type source', () => {
    (useK8sWatchResource as jest.Mock).mockReturnValueOnce([[], true]);
    const eventSourceSection = shallow(
      <EventSinkSection namespace={namespace} kameletSink={mockKameletSink} />,
    );
    expect(eventSourceSection.find(SourceSection).exists()).toBe(true);
    expect(eventSourceSection.find(AppSection).exists()).toBe(true);
    expect(eventSourceSection.find(DynamicFormField).exists()).toBe(true);
  });

  it('should render AppSection, and KafkaSinkSection if sink is kafkaSink', () => {
    (useK8sWatchResource as jest.Mock).mockReturnValueOnce([[], true]);
    mockFormikContext.mockReturnValue(formikMockDataKafkaSink);
    const eventSourceSection = shallow(<EventSinkSection namespace={namespace} />);
    expect(eventSourceSection.find(KafkaSinkSection).exists()).toBe(true);
    expect(eventSourceSection.find(AppSection).exists()).toBe(true);
  });

  it('should not render SourceSection, and DynamicFormField if sink is kafkaSink', () => {
    (useK8sWatchResource as jest.Mock).mockReturnValueOnce([[], true]);
    mockFormikContext.mockReturnValue(formikMockDataKafkaSink);
    const eventSourceSection = shallow(<EventSinkSection namespace={namespace} />);
    expect(eventSourceSection.find(SourceSection).exists()).toBe(false);
    expect(eventSourceSection.find(DynamicFormField).exists()).toBe(false);
  });
});
