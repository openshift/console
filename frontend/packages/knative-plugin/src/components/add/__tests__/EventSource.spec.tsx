import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { Formik } from 'formik';
import { EventSource } from '../EventSource';

type EventSourceProps = React.ComponentProps<typeof EventSource>;
describe('EventSourceSpec', () => {
  let wrapper: ShallowWrapper<EventSourceProps>;
  const namespaceName = 'myApp';
  const activeApplicationName = 'appGroup';
  const eventSourceStatusData = null;

  it('should render form with proper initialvalues if contextSource is not passed', () => {
    wrapper = shallow(
      <EventSource
        namespace={namespaceName}
        eventSourceStatus={eventSourceStatusData}
        activeApplication={activeApplicationName}
      />,
    );
    const FormikField = wrapper.find(Formik);
    expect(FormikField.exists()).toBe(true);
    expect(FormikField.get(0).props.initialValues.project.name).toBe('myApp');
    expect(FormikField.get(0).props.initialValues.sink.apiVersion).toEqual('');
    expect(FormikField.get(0).props.initialValues.sink.kind).toEqual('');
    expect(FormikField.get(0).props.initialValues.sink.name).toEqual('');
  });

  it('should render form with proper initialvalues for sink if contextSource is passed', () => {
    const contextSourceData = 'serving.knative.dev~v1~Service/svc-display';
    wrapper = shallow(
      <EventSource
        namespace={namespaceName}
        eventSourceStatus={eventSourceStatusData}
        contextSource={contextSourceData}
        activeApplication={activeApplicationName}
      />,
    );
    const FormikField = wrapper.find(Formik);
    expect(FormikField.exists()).toBe(true);
    expect(FormikField.get(0).props.initialValues.project.name).toBe('myApp');
    expect(FormikField.get(0).props.initialValues.sink.apiVersion).toEqual(
      'serving.knative.dev/v1',
    );
    expect(FormikField.get(0).props.initialValues.sink.kind).toEqual('Service');
    expect(FormikField.get(0).props.initialValues.sink.name).toEqual('svc-display');
  });
});
