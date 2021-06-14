import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { Formik } from 'formik';
import { referenceForModel } from '@console/internal/module/k8s';
import { EventSourceContainerModel } from '../../../models';
import { getEventSourceIcon } from '../../../utils/get-knative-icon';
import { EventSource } from '../EventSource';

type EventSourceProps = React.ComponentProps<typeof EventSource>;

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

describe('EventSourceSpec', () => {
  let wrapper: ShallowWrapper<EventSourceProps>;
  const namespaceName = 'myApp';
  const activeApplicationName = 'appGroup';
  const eventSourceStatusData = {
    loaded: true,
    eventSource: {
      uid: EventSourceContainerModel.kind,
      name: EventSourceContainerModel.kind,
      description: '',
      icon: {
        url: getEventSourceIcon(referenceForModel(EventSourceContainerModel)),
        class: null,
      },
      type: 'EventSource',
      provider: 'Red hat',
      cta: { label: 'knative-plugin~Create Event Source', href: '/' },
    },
  };

  it('should render form with proper initialvalues if contextSource is not passed', () => {
    wrapper = shallow(
      <EventSource
        namespace={namespaceName}
        normalizedSource={eventSourceStatusData.eventSource}
        activeApplication={activeApplicationName}
      />,
    );
    const FormikField = wrapper.find(Formik);
    expect(FormikField.exists()).toBe(true);
    expect(FormikField.get(0).props.initialValues.formData.project.name).toBe('myApp');
    expect(FormikField.get(0).props.initialValues.formData.sink.apiVersion).toEqual('');
    expect(FormikField.get(0).props.initialValues.formData.sink.kind).toEqual('');
    expect(FormikField.get(0).props.initialValues.formData.sink.name).toEqual('');
  });

  it('should render form with proper initialvalues for sink if contextSource is passed', () => {
    const contextSourceData = 'serving.knative.dev~v1~Service/svc-display';
    wrapper = shallow(
      <EventSource
        namespace={namespaceName}
        normalizedSource={eventSourceStatusData.eventSource}
        contextSource={contextSourceData}
        activeApplication={activeApplicationName}
      />,
    );
    const FormikField = wrapper.find(Formik);
    expect(FormikField.exists()).toBe(true);
    expect(FormikField.get(0).props.initialValues.formData.project.name).toBe('myApp');
    expect(FormikField.get(0).props.initialValues.formData.sink.apiVersion).toEqual(
      'serving.knative.dev/v1',
    );
    expect(FormikField.get(0).props.initialValues.formData.sink.kind).toEqual('Service');
    expect(FormikField.get(0).props.initialValues.formData.sink.name).toEqual('svc-display');
  });
});
